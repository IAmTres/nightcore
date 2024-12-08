import { auth } from './supabase.js'

// Show/hide modal functions
export function showLoginModal() {
    const modal = document.getElementById('login-modal')
    if (modal) {
        modal.style.display = 'flex'
        hideSignupModal()
    }
}

export function showSignupModal() {
    const modal = document.getElementById('signup-modal')
    if (modal) {
        modal.style.display = 'flex'
        hideLoginModal()
    }
}

export function hideLoginModal() {
    const modal = document.getElementById('login-modal')
    if (modal) {
        modal.style.display = 'none'
    }
}

export function hideSignupModal() {
    const modal = document.getElementById('signup-modal')
    if (modal) {
        modal.style.display = 'none'
    }
}

// Initialize auth UI
export function initializeAuth() {
    // Setup modal triggers
    document.getElementById('login-button')?.addEventListener('click', showLoginModal)
    document.getElementById('signup-button')?.addEventListener('click', showSignupModal)

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        const loginModal = document.getElementById('login-modal')
        const signupModal = document.getElementById('signup-modal')
        if (e.target === loginModal) {
            hideLoginModal()
        }
        if (e.target === signupModal) {
            hideSignupModal()
        }
    })

    // Handle login form submission
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = document.getElementById('login-email').value
        const password = document.getElementById('login-password').value

        try {
            const { data, error } = await auth.signIn(email, password)
            if (error) throw error
            hideLoginModal()
            window.location.href = '/profile.html'
        } catch (error) {
            alert('Error logging in: ' + error.message)
        }
    })

    // Handle signup form submission
    document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = document.getElementById('signup-email').value
        const password = document.getElementById('signup-password').value

        try {
            const { data, error } = await auth.signUp(email, password)
            if (error) throw error
            alert('Check your email to confirm your account!')
            hideSignupModal()
        } catch (error) {
            alert('Error signing up: ' + error.message)
        }
    })

    // Handle logout
    document.getElementById('logout-button')?.addEventListener('click', async () => {
        try {
            await auth.signOut()
            window.location.href = '/'
        } catch (error) {
            alert('Error logging out: ' + error.message)
        }
    })

    // Make modal functions available globally
    window.showLoginModal = showLoginModal
    window.showSignupModal = showSignupModal
    window.hideLoginModal = hideLoginModal
    window.hideSignupModal = hideSignupModal
}

// Initialize auth UI on page load
document.addEventListener('DOMContentLoaded', initializeAuth)
