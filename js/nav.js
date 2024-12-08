import { auth } from './supabase.js'

// Initialize auth state
async function initializeAuthState() {
    try {
        const { data: { session } } = await auth.getSession()
        updateUIForAuthState(session?.user)

        // Listen for auth changes
        auth.onAuthStateChange((event, session) => {
            updateUIForAuthState(session?.user)
            // Check for token refresh on auth state change
            if (session?.user) {
                tokens.checkAndRefreshTokens().catch(console.error)
            }
        })
    } catch (error) {
        console.error('Error initializing auth state:', error)
    }
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
        // Always refresh the page to update UI and token state
        window.location.reload()
    } catch (error) {
        console.error('Error logging out:', error)
    }
}

// Handle navigation without page reload
function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a, .logo-link')  
    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault()
            const href = link.getAttribute('href')
            
            // Use history API to update URL without reload
            window.history.pushState({}, '', href)
            
            // Load the new page content
            try {
                const response = await fetch(href)
                const html = await response.text()
                const parser = new DOMParser()
                const newDoc = parser.parseFromString(html, 'text/html')
                
                // Update main content
                const currentMain = document.querySelector('main')
                const newMain = newDoc.querySelector('main')
                if (currentMain && newMain) {
                    currentMain.innerHTML = newMain.innerHTML
                }
                
                // Update title
                document.title = newDoc.title
                
                // Reinitialize any necessary scripts
                if (href === '/') {
                    // Load home page specific scripts
                    const script = document.createElement('script')
                    script.type = 'module'
                    script.src = 'js/app.js'
                    document.body.appendChild(script)
                }
            } catch (error) {
                console.error('Error navigating:', error)
            }
        })
    })
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        window.location.reload()
    })
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeAuthState()
    setupProfileDropdown()
    setupNavigation()

    // Setup logout button
    const logoutButton = document.getElementById('logout-button')
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout)
    }
})
