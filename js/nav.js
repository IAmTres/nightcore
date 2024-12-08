import { auth } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    const profileDropdown = document.getElementById('profile-dropdown');
    const profileMenu = document.getElementById('profile-menu');
    const profileButton = document.getElementById('profile-menu-button');
    const loginLink = document.getElementById('login-link');
    const signupLink = document.getElementById('signup-link');
    const logoutButton = document.getElementById('logout-button');
    const profileAvatar = document.querySelector('#profile-menu-button img');
    const dropdownArrow = profileButton.querySelector('.fa-chevron-down');

    // Toggle dropdown
    if (profileButton) {
        profileButton.addEventListener('click', () => {
            profileMenu.classList.toggle('hidden');
            const isHidden = profileMenu.classList.contains('hidden');
            dropdownArrow.style.transform = isHidden ? 'rotate(0)' : 'rotate(180deg)';
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (profileDropdown && !profileDropdown.contains(e.target)) {
            profileMenu.classList.add('hidden');
            dropdownArrow.style.transform = 'rotate(0)';
        }
    });

    // Replace the Firebase auth state observer with Supabase
    auth.onAuthStateChange((user) => {
        if (user) {
            // User is signed in
            document.querySelectorAll('.auth-show').forEach(el => el.style.display = 'block')
            document.querySelectorAll('.auth-hide').forEach(el => el.style.display = 'none')
            
            // Update profile picture and name if available
            const profilePic = document.getElementById('profile-pic')
            const profileName = document.getElementById('profile-name')
            if (profilePic) profilePic.src = user.user_metadata.avatar_url || '/images/default-avatar.png'
            if (profileName) profileName.textContent = user.user_metadata.username || user.email
            
            // Update avatar if user has a photo
            if (profileAvatar && user.user_metadata.avatar_url) {
                profileAvatar.src = user.user_metadata.avatar_url;
            }
            
            // Update profile button text
            const profileText = document.querySelector('#profile-menu-button span');
            if (profileText) {
                profileText.textContent = user.user_metadata.username || user.email.split('@')[0];
            }
        } else {
            // User is signed out
            document.querySelectorAll('.auth-show').forEach(el => el.style.display = 'none')
            document.querySelectorAll('.auth-hide').forEach(el => el.style.display = 'block')
            
            // Reset avatar
            if (profileAvatar) {
                profileAvatar.src = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=nightcore';
            }
            
            // Reset profile button text
            const profileText = document.querySelector('#profile-menu-button span');
            if (profileText) {
                profileText.textContent = 'Profile';
            }
        }
    });

    // Update login form handler
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = document.getElementById('login-email').value
        const password = document.getElementById('login-password').value
        
        try {
            await auth.signIn(email, password)
            window.location.href = '/profile.html'
        } catch (error) {
            alert('Error logging in: ' + error.message)
        }
    })

    // Update signup form handler
    document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = document.getElementById('signup-email').value
        const password = document.getElementById('signup-password').value
        
        try {
            await auth.signUp(email, password)
            alert('Check your email to confirm your account!')
        } catch (error) {
            alert('Error signing up: ' + error.message)
        }
    })

    // Update logout handler
    document.getElementById('logout-button')?.addEventListener('click', async () => {
        try {
            await auth.signOut()
            window.location.href = '/'
        } catch (error) {
            alert('Error logging out: ' + error.message)
        }
    })
});
