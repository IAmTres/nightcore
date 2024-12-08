import { auth } from './supabase.js'

// Initialize auth state
async function initializeAuthState() {
    const { data: { session } } = await auth.getSession()
    updateUIForAuthState(session?.user)

    // Listen for auth changes
    auth.onAuthStateChange((event, session) => {
        updateUIForAuthState(session?.user)
    })
}

// Update UI based on auth state
function updateUIForAuthState(user) {
    const loginLink = document.querySelector('.auth-hide')
    const userMenu = document.querySelector('.auth-show')
    const profilePic = document.getElementById('profile-pic')
    const profileName = document.getElementById('profile-name')
    const profileDropdown = document.getElementById('profile-dropdown')

    if (user) {
        // User is signed in
        if (loginLink) loginLink.style.display = 'none'
        if (userMenu) userMenu.style.display = 'block'
        
        // Update profile info
        if (profilePic) {
            profilePic.src = user.user_metadata.avatar_url || '/images/default-avatar.png'
        }
        if (profileName) {
            profileName.textContent = user.user_metadata.username || user.email
        }
    } else {
        // User is signed out
        if (loginLink) loginLink.style.display = 'block'
        if (userMenu) userMenu.style.display = 'none'
        if (profileDropdown) profileDropdown.classList.add('hidden')
    }
}

// Handle profile dropdown toggle
function setupProfileDropdown() {
    const profileButton = document.getElementById('profile-button')
    const profileDropdown = document.getElementById('profile-dropdown')

    if (profileButton && profileDropdown) {
        profileButton.addEventListener('click', (e) => {
            e.stopPropagation()
            profileDropdown.classList.toggle('hidden')
        })

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.add('hidden')
            }
        })
    }
}

// Handle logout
async function handleLogout() {
    try {
        await auth.signOut()
        window.location.href = '/'
    } catch (error) {
        console.error('Error logging out:', error)
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeAuthState()
    setupProfileDropdown()

    // Setup logout button
    const logoutButton = document.getElementById('logout-button')
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout)
    }
})
