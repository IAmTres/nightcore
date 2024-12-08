// Handle user authentication state
let isLoggedIn = false;
let currentUser = null;

// API base URL
const API_BASE_URL = 'http://localhost:3003';

// Check if user is already logged in on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        isLoggedIn = true;
        updateUIForLoggedInUser();
        fetchUserProfile();
    }
    
    // Setup navigation menu
    setupNavigationMenu();
    
    // Setup forms if they exist
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
});

// Handle signup form submission
async function handleSignup(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const termsCheckbox = document.getElementById('terms');
    const errorMessageDiv = document.getElementById('error-message');
    
    // Clear previous error messages
    errorMessageDiv.textContent = '';
    errorMessageDiv.classList.add('hidden');
    
    // Validate inputs
    if (!nameInput.value || !emailInput.value || !passwordInput.value || !confirmPasswordInput.value) {
        showError('All fields are required');
        return;
    }
    
    if (passwordInput.value.length < 8) {
        showError('Password must be at least 8 characters long');
        return;
    }
    
    if (passwordInput.value !== confirmPasswordInput.value) {
        showError('Passwords do not match');
        return;
    }
    
    if (!termsCheckbox.checked) {
        showError('Please agree to the Terms of Service and Privacy Policy');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: nameInput.value,
                email: emailInput.value,
                password: passwordInput.value
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create account');
        }
        
        // Store the token
        localStorage.setItem('token', data.token);
        
        // Update UI
        isLoggedIn = true;
        currentUser = data.user;
        
        // Redirect to profile page
        window.location.href = '/profile.html';
        
    } catch (error) {
        showError(error.message);
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessageDiv = document.getElementById('error-message');
    
    // Clear previous error messages
    errorMessageDiv.textContent = '';
    errorMessageDiv.classList.add('hidden');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: emailInput.value,
                password: passwordInput.value
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Invalid email or password');
        }
        
        // Store the token
        localStorage.setItem('token', data.token);
        
        // Update UI
        isLoggedIn = true;
        currentUser = data.user;
        
        // Redirect to profile page
        window.location.href = '/profile.html';
        
    } catch (error) {
        showError(error.message);
    }
}

// Fetch user profile
async function fetchUserProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        
        const data = await response.json();
        currentUser = data;
        
        // Update UI with user data if needed
        updateUIForLoggedInUser();
        
    } catch (error) {
        console.error('Error fetching user profile:', error);
        handleLogout();
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('token');
    isLoggedIn = false;
    currentUser = null;
    updateUIForLoggedInUser();
    window.location.href = '/login.html';
}

// Update UI based on authentication state
function updateUIForLoggedInUser() {
    const loginLink = document.getElementById('login-link');
    const signupLink = document.getElementById('signup-link');
    const logoutButton = document.getElementById('logout-button');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    if (isLoggedIn) {
        if (loginLink) loginLink.classList.add('hidden');
        if (signupLink) signupLink.classList.add('hidden');
        if (logoutButton) {
            logoutButton.classList.remove('hidden');
            logoutButton.addEventListener('click', handleLogout);
        }
    } else {
        if (loginLink) loginLink.classList.remove('hidden');
        if (signupLink) signupLink.classList.remove('hidden');
        if (logoutButton) logoutButton.classList.add('hidden');
    }
}

// Setup navigation menu
function setupNavigationMenu() {
    const menuButton = document.getElementById('profile-menu-button');
    const menu = document.getElementById('profile-menu');
    
    if (menuButton && menu) {
        menuButton.addEventListener('click', () => {
            menu.classList.toggle('hidden');
            const icon = menuButton.querySelector('.fa-chevron-down');
            icon.style.transform = menu.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuButton.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.add('hidden');
                const icon = menuButton.querySelector('.fa-chevron-down');
                icon.style.transform = 'rotate(0deg)';
            }
        });
    }
}

// Show error message
function showError(message) {
    const errorMessageDiv = document.getElementById('error-message');
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.remove('hidden');
}
