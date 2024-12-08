import { supabase } from './supabase.js';

// Show/hide modal functions
export function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

export function showSignupModal() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

export function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
    }
}

export function hideSignupModal() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
    }
}

// Show notification
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
        type === 'error' ? 'bg-red-500' : 'bg-green-500'
    }`;
    notification.style.animation = 'slideIn 0.3s ease-out forwards';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Update auth UI
function updateAuthUI(isAuthenticated) {
    const authHideElements = document.querySelectorAll('#loginBtn, #signupBtn');
    const authShowElements = document.querySelectorAll('#profileBtn, #logoutBtn');
    
    if (isAuthenticated) {
        authHideElements.forEach(el => el.classList.add('hidden'));
        authShowElements.forEach(el => el.classList.remove('hidden'));
    } else {
        authHideElements.forEach(el => el.classList.remove('hidden'));
        authShowElements.forEach(el => el.classList.add('hidden'));
    }
}

// Initialize auth UI
export function initializeAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // Setup modal triggers
    loginBtn?.addEventListener('click', showLoginModal);
    signupBtn?.addEventListener('click', showSignupModal);

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideLoginModal();
                hideSignupModal();
            }
        });
    });

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            hideLoginModal();
            showNotification('Successfully logged in!', 'success');
            updateAuthUI(true);
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        try {
            const { data: { user }, error } = await supabase.auth.signUp({
                email,
                password
            });

            if (error) throw error;

            hideSignupModal();
            showNotification('Successfully signed up! Please check your email for verification.', 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    logoutBtn?.addEventListener('click', async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            showNotification('Successfully logged out!', 'success');
            updateAuthUI(false);
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
        updateAuthUI(!!session);
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
        updateAuthUI(!!session);
    });
}

document.addEventListener('DOMContentLoaded', initializeAuth);
