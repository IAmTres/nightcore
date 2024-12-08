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

// Update auth UI
function updateAuthUI() {
    const user = auth.user();
    const authSection = document.querySelector('.auth-section');
    
    if (user) {
        authSection.innerHTML = `
            <div class="flex items-center space-x-4">
                <span class="text-purple-300">${user.email}</span>
                <a href="/profile" class="text-purple-400 hover:text-purple-300">
                    <i class="fas fa-user-circle text-xl"></i>
                </a>
                <button id="logout-btn" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                    Logout
                </button>
            </div>
        `;

        // Add logout functionality
        document.getElementById('logout-btn').addEventListener('click', async () => {
            try {
                await auth.signOut();
                updateAuthUI();
                showNotification('Successfully logged out!', 'success');
            } catch (error) {
                console.error('Error logging out:', error.message);
                showNotification(error.message, 'error');
            }
        });
    } else {
        authSection.innerHTML = `
            <div class="space-x-4">
                <button onclick="showLoginModal()" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                    Login
                </button>
                <button onclick="showSignupModal()" class="px-4 py-2 border border-purple-600 hover:bg-purple-900/50 rounded-lg transition-colors">
                    Sign Up
                </button>
            </div>
        `;
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

    const loginForm = document.getElementById('login-form')
    const signupForm = document.getElementById('signup-form')

    // Handle form submission
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const { user, error } = await auth.signIn({
                email,
                password,
            });

            if (error) throw error;

            // Just close the modal and update UI
            hideLoginModal();
            updateAuthUI();
            showNotification('Successfully logged in!', 'success');
        } catch (error) {
            console.error('Error logging in:', error.message);
            showNotification(error.message, 'error');
        }
    });

    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        try {
            const { user, error } = await auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            // Just close the modal and update UI
            hideSignupModal();
            updateAuthUI();
            showNotification('Successfully signed up! Welcome to Nightcore Generator!', 'success');
        } catch (error) {
            console.error('Error signing up:', error.message);
            showNotification(error.message, 'error');
        }
    });

    // Make modal functions available globally
    window.showLoginModal = showLoginModal
    window.showSignupModal = showSignupModal
    window.hideLoginModal = hideLoginModal
    window.hideSignupModal = hideSignupModal
}

// Initialize auth UI on page load
document.addEventListener('DOMContentLoaded', initializeAuth)
