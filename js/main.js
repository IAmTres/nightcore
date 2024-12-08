import { auth, tokens } from './supabase.js'
import { showLoginModal, showNotification } from './auth.js'

let selectedFile = null
let isProcessing = false

// Initialize the music generator
async function initializeMusicGenerator() {
    const uploadZone = document.getElementById('upload-zone')
    const audioInput = document.getElementById('audio-input')
    const generateButton = document.getElementById('generate-button')
    const audioPlayer = document.getElementById('audio-player')

    if (uploadZone && audioInput) {
        // Handle click to upload
        uploadZone.addEventListener('click', () => {
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

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault()
            e.stopPropagation()
            uploadZone.classList.remove('border-purple-500')

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

            try {
                isProcessing = true
                generateButton.disabled = true
                generateButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...'

                // Check token balance
                const { data: { balance } } = await tokens.getTokenBalance(session.user.id)
                if (balance < 1) {
                    showNotification('You need tokens to generate a Nightcore version. Please visit your profile to get more tokens.', 'error')
                    return
                }

                // Generate nightcore version
                await generateNightcore()
                
                // Use token
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
        // Create audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        
        // Read file
        const arrayBuffer = await selectedFile.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        // Create offline context for processing
        const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            Math.ceil(audioBuffer.length * 1.3),
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

        // Create blob URL
        const blob = new Blob([await audioBufferToWav(renderedBuffer)], { type: 'audio/wav' })
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
async function audioBufferToWav(buffer) {
    const numberOfChannels = buffer.numberOfChannels
    const length = buffer.length
    const sampleRate = buffer.sampleRate
    const bitsPerSample = 16
    const bytesPerSample = bitsPerSample / 8
    const blockAlign = numberOfChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = length * blockAlign

    const arrayBuffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(arrayBuffer)

    // Write WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i))
        }
    }

    writeString(0, 'RIFF')                                    // RIFF identifier
    view.setUint32(4, 36 + dataSize, true)                   // File length
    writeString(8, 'WAVE')                                    // WAVE identifier
    writeString(12, 'fmt ')                                   // Format chunk identifier
    view.setUint32(16, 16, true)                             // Format chunk length
    view.setUint16(20, 1, true)                              // Sample format (1 = PCM)
    view.setUint16(22, numberOfChannels, true)               // Number of channels
    view.setUint32(24, sampleRate, true)                     // Sample rate
    view.setUint32(28, byteRate, true)                       // Byte rate
    view.setUint16(32, blockAlign, true)                     // Block align
    view.setUint16(34, bitsPerSample, true)                  // Bits per sample
    writeString(36, 'data')                                   // Data chunk identifier
    view.setUint32(40, dataSize, true)                       // Data chunk length

    // Write audio data
    const channels = []
    for (let i = 0; i < numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i))
    }

    let offset = 44
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, channels[channel][i]))
            const int = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
            view.setInt16(offset, int, true)
            offset += 2
        }
    }

    return arrayBuffer
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeMusicGenerator()
})
