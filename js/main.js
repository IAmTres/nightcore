import { auth, tokens } from './supabase.js'
import { showLoginModal, showNotification } from './auth.js'

let selectedFile = null
let isProcessing = false
let audioContext = null

// Initialize the music generator
async function initializeMusicGenerator() {
    const uploadZone = document.getElementById('upload-zone')
    const audioInput = document.getElementById('audio-input')
    const generateButton = document.getElementById('generate-button')
    const audioPlayer = document.getElementById('audio-player')

    if (uploadZone && audioInput) {
        // Handle click to upload
        uploadZone.addEventListener('click', async () => {
            const { data: { session } } = await auth.getSession()
            if (!session) {
                showLoginModal()
                return
            }
            audioInput.click()
        })

        // Handle file selection
        audioInput.addEventListener('change', handleFileUpload)

        // Handle drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault()
            e.stopPropagation()
            uploadZone.classList.add('border-purple-500')
        })

        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault()
            e.stopPropagation()
            uploadZone.classList.remove('border-purple-500')
        })

        uploadZone.addEventListener('drop', async (e) => {
            e.preventDefault()
            e.stopPropagation()
            uploadZone.classList.remove('border-purple-500')

            const { data: { session } } = await auth.getSession()
            if (!session) {
                showLoginModal()
                return
            }

            const file = e.dataTransfer.files[0]
            if (file && file.type.startsWith('audio/')) {
                handleFileSelection(file)
            } else {
                showNotification('Please upload an audio file (MP3 or WAV)', 'error')
            }
        })
    }

    if (generateButton) {
        generateButton.addEventListener('click', async () => {
            if (isProcessing) return
            
            if (!selectedFile) {
                showNotification('Please upload an audio file first', 'error')
                return
            }

            const { data: { session } } = await auth.getSession()
            if (!session) {
                showLoginModal()
                return
            }

            // Check if user has enough tokens
            const { data: tokenBalance } = await tokens.getTokenBalance(session.user.id)
            if (tokenBalance < 1) {
                showNotification('You need tokens to generate a Nightcore version. Please visit your profile to get more tokens.', 'error')
                return
            }

            isProcessing = true
            generateButton.disabled = true
            generateButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...'
            
            try {
                await generateNightcore()
                await tokens.useToken(session.user.id)
                showNotification('Nightcore version generated successfully!', 'success')
            } catch (error) {
                console.error('Error:', error)
                showNotification('Failed to generate Nightcore version. Please try again.', 'error')
            } finally {
                isProcessing = false
                generateButton.disabled = false
                generateButton.innerHTML = '<i class="fas fa-magic mr-2"></i>Generate Nightcore Version'
            }
        })
    }
}

// Handle file upload from input
async function handleFileUpload(event) {
    const file = event.target.files[0]
    if (file) {
        handleFileSelection(file)
    }
}

// Handle file selection (both upload and drop)
async function handleFileSelection(file) {
    if (!file.type.startsWith('audio/')) {
        showNotification('Please upload an audio file (MP3 or WAV)', 'error')
        return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showNotification('File size must be less than 10MB', 'error')
        return
    }

    selectedFile = file
    
    // Show file name in upload zone
    const uploadZone = document.getElementById('upload-zone')
    if (uploadZone) {
        uploadZone.innerHTML = `
            <i class="fas fa-music text-4xl mb-4 text-purple-500"></i>
            <p class="text-lg mb-2">${file.name}</p>
            <p class="text-sm text-gray-500">Click to change file</p>
        `
    }

    // Enable generate button
    const generateButton = document.getElementById('generate-button')
    if (generateButton) {
        generateButton.classList.remove('opacity-50', 'cursor-not-allowed')
        generateButton.disabled = false
    }
}

// Generate Nightcore version
async function generateNightcore() {
    if (!selectedFile) return

    try {
        // Create or reuse audio context
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)()
        }
        
        // Read file
        const arrayBuffer = await selectedFile.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        // Create offline context for processing
        const offlineContext = new OfflineAudioContext(
            2,
            audioBuffer.length,
            audioBuffer.sampleRate
        )

        // Create source and nodes
        const source = offlineContext.createBufferSource()
        source.buffer = audioBuffer
        source.playbackRate.value = 1.3 // Nightcore speed

        const compressor = offlineContext.createDynamicsCompressor()
        compressor.threshold.value = -20
        compressor.knee.value = 40
        compressor.ratio.value = 12
        compressor.attack.value = 0
        compressor.release.value = 0.25

        const gainNode = offlineContext.createGain()
        gainNode.gain.value = 1.2 // Slight volume boost

        // Connect nodes
        source.connect(compressor)
        compressor.connect(gainNode)
        gainNode.connect(offlineContext.destination)

        // Start rendering
        source.start(0)
        const renderedBuffer = await offlineContext.startRendering()

        // Create blob and URL
        const wav = audioBufferToWav(renderedBuffer)
        const blob = new Blob([wav], { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)

        // Update audio player
        const audioPlayer = document.getElementById('audio-player')
        if (audioPlayer) {
            audioPlayer.src = url
            audioPlayer.classList.remove('hidden')
        }

    } catch (error) {
        console.error('Error generating Nightcore:', error)
        throw error
    }
}

// Convert AudioBuffer to WAV format
function audioBufferToWav(buffer) {
    const numberOfChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const format = 1 // PCM
    const bitDepth = 16

    const bytesPerSample = bitDepth / 8
    const blockAlign = numberOfChannels * bytesPerSample

    const bufferLength = buffer.length
    const byteRate = sampleRate * blockAlign
    const dataSize = bufferLength * blockAlign

    const headerSize = 44
    const wav = new ArrayBuffer(headerSize + dataSize)
    const view = new DataView(wav)

    // Write WAV header
    writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + dataSize, true)
    writeString(view, 8, 'WAVE')
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, format, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    writeString(view, 36, 'data')
    view.setUint32(40, dataSize, true)

    // Write audio data
    const offset = 44
    const channels = []
    for (let i = 0; i < numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i))
    }

    let pos = 0
    while (pos < bufferLength) {
        for (let i = 0; i < numberOfChannels; i++) {
            const sample = Math.max(-1, Math.min(1, channels[i][pos]))
            const int = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
            view.setInt16(offset + (pos * blockAlign) + (i * bytesPerSample), int, true)
        }
        pos++
    }

    return wav
}

// Helper function to write strings to DataView
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeMusicGenerator()
})
