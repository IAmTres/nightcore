document.addEventListener('DOMContentLoaded', () => {
    const profileButton = document.getElementById('profile-menu-button');
    const profileMenu = document.getElementById('profile-menu');
    const dropdownArrow = profileButton.querySelector('.fa-chevron-down');
    const loginLink = document.getElementById('login-link');
    const signupLink = document.getElementById('signup-link');
    const logoutButton = document.getElementById('logout-button');

    // Toggle dropdown
    function toggleDropdown() {
        const isHidden = profileMenu.classList.contains('hidden');
        profileMenu.classList.toggle('hidden');
        dropdownArrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0)';
    }

    // Close dropdown when clicking outside
    function closeDropdown(e) {
        if (!profileButton.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.add('hidden');
            dropdownArrow.style.transform = 'rotate(0)';
        }
    }

    // Check authentication status
    function updateAuthUI() {
        const token = localStorage.getItem('token');
        if (token) {
            loginLink.classList.add('hidden');
            signupLink.classList.add('hidden');
            logoutButton.classList.remove('hidden');
        } else {
            loginLink.classList.remove('hidden');
            signupLink.classList.remove('hidden');
            logoutButton.classList.add('hidden');
        }
    }

    // Handle logout
    function handleLogout() {
        localStorage.removeItem('token');
        updateAuthUI();
        window.location.href = '/';
    }

    // Event listeners
    profileButton.addEventListener('click', toggleDropdown);
    document.addEventListener('click', closeDropdown);
    logoutButton.addEventListener('click', handleLogout);

    // Initialize UI
    updateAuthUI();
});
