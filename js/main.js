import { auth, tokens } from './supabase.js'
import { showLoginModal } from './auth.js'

let selectedFile = null

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
                alert('Please upload an audio file (MP3 or WAV)')
            }
        })
    }

    if (generateButton) {
        generateButton.addEventListener('click', async () => {
            if (!selectedFile) {
                alert('Please upload an audio file first')
                return
            }

            const { data: { session } } = await auth.getSession()
            if (!session) {
                showLoginModal()
                return
            }

            // Check if user has enough tokens
            const tokenBalance = await tokens.getTokenBalance(session.user.id)
            if (tokenBalance < 1) {
                alert('You need at least 1 token to generate a Nightcore version. Please visit your profile to get more tokens.')
                return
            }

            generateButton.disabled = true
            generateButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...'
            
            try {
                await generateNightcore()
            } finally {
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
        alert('Please upload an audio file (MP3 or WAV)')
        return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB')
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

        // Create source
        const source = audioContext.createBufferSource()
        source.buffer = audioBuffer
        
        // Create gain node for volume
        const gainNode = audioContext.createGain()
        gainNode.gain.value = 1.0 // Adjust volume as needed
        
        // Connect nodes
        source.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Set playback rate for Nightcore effect
        source.playbackRate.value = 1.3 // Adjust rate as needed
        
        // Start playback
        source.start(0)
        
        // Show audio player
        const audioPlayer = document.getElementById('audio-player')
        if (audioPlayer) {
            audioPlayer.classList.remove('hidden')
        }

    } catch (error) {
        console.error('Error generating Nightcore:', error)
        alert('Error generating Nightcore version. Please try again.')
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeMusicGenerator()
})
