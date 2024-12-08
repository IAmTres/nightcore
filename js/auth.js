// Import Firebase
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA0XxerAceG3sMC8jY5k7pPO-JcWDe7aSc",
    authDomain: "nightcore-b7f48.firebaseapp.com",
    projectId: "nightcore-b7f48",
    storageBucket: "nightcore-b7f48.firebasestorage.app",
    messagingSenderId: "767432017886",
    appId: "1:767432017886:web:0c175103891aca7ea5bf4f",
    measurementId: "G-B71BL9ZX1E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Handle user authentication state
let currentUser = null;

// Check authentication state on page load
document.addEventListener('DOMContentLoaded', () => {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        updateUIForLoggedInUser();
    });
    
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
        // Create user with Firebase
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            emailInput.value,
            passwordInput.value
        );
        
        // User is automatically signed in after creation
        const user = userCredential.user;
        
        // Update display name
        await updateProfile(user, {
            displayName: nameInput.value
        });
        
        // Redirect to profile page
        window.location.href = '/profile.html';
        
    } catch (error) {
        console.error('Signup error:', error);
        switch (error.code) {
            case 'auth/email-already-in-use':
                showError('This email is already registered');
                break;
            case 'auth/invalid-email':
                showError('Invalid email address');
                break;
            case 'auth/operation-not-allowed':
                showError('Email/password accounts are not enabled');
                break;
            case 'auth/weak-password':
                showError('Password is too weak');
                break;
            default:
                showError('Failed to create account: ' + error.message);
        }
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
        // Sign in with Firebase
        await signInWithEmailAndPassword(
            auth,
            emailInput.value,
            passwordInput.value
        );
        
        // Redirect to profile page
        window.location.href = '/profile.html';
        
    } catch (error) {
        console.error('Login error:', error);
        switch (error.code) {
            case 'auth/invalid-email':
                showError('Invalid email address');
                break;
            case 'auth/user-disabled':
                showError('This account has been disabled');
                break;
            case 'auth/user-not-found':
                showError('No account found with this email');
                break;
            case 'auth/wrong-password':
                showError('Invalid password');
                break;
            default:
                showError('Failed to log in: ' + error.message);
        }
    }
}

// Handle logout
async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout error:', error);
        showError('Failed to log out');
    }
}

// Update UI based on authentication state
function updateUIForLoggedInUser() {
    const loginLink = document.getElementById('login-link');
    const signupLink = document.getElementById('signup-link');
    const logoutButton = document.getElementById('logout-button');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    if (currentUser) {
        if (loginLink) loginLink.classList.add('hidden');
        if (signupLink) signupLink.classList.add('hidden');
        if (logoutButton) {
            logoutButton.classList.remove('hidden');
            logoutButton.addEventListener('click', handleLogout);
        }
        if (profileDropdown) {
            profileDropdown.classList.remove('hidden');
            const userNameElement = profileDropdown.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = currentUser.displayName || currentUser.email;
            }
        }
    } else {
        if (loginLink) loginLink.classList.remove('hidden');
        if (signupLink) signupLink.classList.remove('hidden');
        if (logoutButton) logoutButton.classList.add('hidden');
        if (profileDropdown) profileDropdown.classList.add('hidden');
    }
}

// Setup navigation menu
function setupNavigationMenu() {
    const profileButton = document.getElementById('profile-button');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    if (profileButton && profileDropdown) {
        profileButton.addEventListener('click', () => {
            profileDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.add('hidden');
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
