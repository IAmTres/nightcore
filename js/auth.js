// Import Supabase authentication
import { auth } from './supabase.js'

// Show/hide modal functions
export function showLoginModal() {
    const modal = document.getElementById('login-modal')
    if (modal) {
        modal.style.display = 'flex'
    }
}

export function showSignupModal() {
    const modal = document.getElementById('signup-modal')
    if (modal) {
        modal.style.display = 'flex'
    }
}

export function hideModals() {
    const modals = document.querySelectorAll('#login-modal, #signup-modal')
    modals.forEach(modal => {
        modal.style.display = 'none'
    })
}

// Initialize auth UI
export function initializeAuth() {
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        const modals = document.querySelectorAll('#login-modal, #signup-modal')
        modals.forEach(modal => {
            if (e.target === modal) {
                hideModals()
            }
        })
    })

    // Handle login form submission
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = document.getElementById('login-email').value
        const password = document.getElementById('login-password').value

        try {
            const { data, error } = await auth.signIn(email, password)
            if (error) throw error
            hideModals()
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
            hideModals()
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

    // Listen for auth state changes
    auth.onAuthStateChange((user) => {
        const authShow = document.querySelectorAll('.auth-show')
        const authHide = document.querySelectorAll('.auth-hide')
        
        if (user) {
            authShow.forEach(el => el.style.display = 'block')
            authHide.forEach(el => el.style.display = 'none')
        } else {
            authShow.forEach(el => el.style.display = 'none')
            authHide.forEach(el => el.style.display = 'block')
        }
    })
}

// Initialize auth UI on page load
document.addEventListener('DOMContentLoaded', initializeAuth)
