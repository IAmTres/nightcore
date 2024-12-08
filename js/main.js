import { auth, tokens } from './supabase.js'
import { showLoginModal } from './auth.js'

// Initialize the music generator
async function initializeMusicGenerator() {
    const uploadZone = document.getElementById('upload-zone')
    const generateButton = document.getElementById('generate-button')

    if (uploadZone) {
        uploadZone.addEventListener('click', async () => {
            const { data: { session } } = await auth.getSession()
            if (!session) {
                showLoginModal()
                return
            }
            // Handle file upload when user is logged in
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'audio/*'
            input.onchange = handleFileUpload
            input.click()
        })
    }

    if (generateButton) {
        generateButton.addEventListener('click', async () => {
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
            generateNightcore()
        })
    }
}

// Handle file upload
async function handleFileUpload(event) {
    const file = event.target.files[0]
    if (!file) return

    try {
        // Upload file logic here
        console.log('File selected:', file.name)
    } catch (error) {
        console.error('Error uploading file:', error)
        alert('Error uploading file. Please try again.')
    }
}

// Generate Nightcore version
async function generateNightcore() {
    try {
        // Nightcore generation logic here
        console.log('Generating Nightcore version...')
    } catch (error) {
        console.error('Error generating Nightcore:', error)
        alert('Error generating Nightcore version. Please try again.')
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeMusicGenerator()
})
