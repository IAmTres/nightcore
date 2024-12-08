import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
const db = getFirestore(app);

let currentUser = null;
let userData = null;

// Wait for Firebase Auth to initialize
function waitForAuth() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe(); // Unsubscribe once we get the auth state
            resolve(user);
        });
    });
}

async function initializeProfile() {
    try {
        // Wait for Firebase Auth to initialize and get user
        const user = await waitForAuth();
        
        if (!user) {
            console.log('No user found, redirecting to login');
            window.location.href = '/login.html';
            return;
        }

        currentUser = user;
        console.log('User authenticated:', user.email);

        // Get or create user data in Firestore
        const userDoc = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDoc);
        
        if (userSnap.exists()) {
            userData = userSnap.data();
            console.log('User data loaded:', userData);
        } else {
            // Initialize user data if it doesn't exist
            userData = {
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                tokens: 5, // Starting tokens
                isPremium: false,
                joinDate: new Date().toISOString(),
                createdTracks: []
            };
            await setDoc(userDoc, userData);
            console.log('New user data created:', userData);
        }
        
        updateProfileInfo();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing profile:', error);
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-500 bg-opacity-20 text-red-300 p-4 rounded-lg mb-6';
        errorDiv.textContent = 'Error loading profile. Please try refreshing the page.';
        document.querySelector('main').prepend(errorDiv);
    }
}

// Update profile information
function updateProfileInfo() {
    if (!currentUser) return;

    // Update profile picture if available
    const profilePic = document.querySelector('img[alt="Profile Picture"]');
    if (profilePic && currentUser.photoURL) {
        profilePic.src = currentUser.photoURL;
    }

    // Update username
    const profileName = document.querySelector('h1');
    if (profileName) {
        profileName.textContent = userData.name;
    }

    // Update join date
    const joinDate = document.querySelector('p.text-purple-300');
    if (joinDate) {
        const date = new Date(userData.joinDate);
        const options = { year: 'numeric', month: 'long' };
        joinDate.textContent = `Joined ${date.toLocaleDateString(undefined, options)}`;
    }

    // Update token balance
    const tokenBalance = document.getElementById('tokenBalance');
    if (tokenBalance) {
        tokenBalance.textContent = userData.tokens || '0';
    }

    // Update plan status
    const planStatus = document.getElementById('planStatus');
    if (planStatus) {
        if (userData.isPremium) {
            planStatus.textContent = 'Premium';
            planStatus.classList.add('bg-purple-500');
            planStatus.classList.remove('bg-gray-700');
        } else {
            planStatus.textContent = 'Free';
        }
    }

    // Calculate next reset date
    const nextReset = document.getElementById('nextReset');
    if (nextReset) {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const days = Math.ceil((nextWeek - today) / (1000 * 60 * 60 * 24));
        nextReset.textContent = `${days} days`;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Handle token purchase
    const purchaseButtons = document.querySelectorAll('.purchase-token-btn');
    purchaseButtons.forEach(button => {
        button.addEventListener('click', async () => {
            if (!currentUser) return;

            const amount = parseInt(button.dataset.amount);
            const price = button.dataset.price;
            
            try {
                // Update tokens in Firestore
                const userDoc = doc(db, 'users', currentUser.uid);
                userData.tokens = (userData.tokens || 0) + amount;
                await setDoc(userDoc, userData);
                
                updateProfileInfo();
                alert(`Successfully purchased ${amount} tokens!`);
            } catch (error) {
                console.error('Purchase error:', error);
                alert('Failed to process purchase. Please try again.');
            }
        });
    });

    // Handle premium upgrade
    const upgradeButton = document.getElementById('upgrade-btn');
    if (upgradeButton) {
        upgradeButton.addEventListener('click', async () => {
            if (!currentUser) return;

            try {
                // Update premium status in Firestore
                const userDoc = doc(db, 'users', currentUser.uid);
                userData.isPremium = true;
                await setDoc(userDoc, userData);
                
                updateProfileInfo();
                alert('Successfully upgraded to Premium!');
            } catch (error) {
                console.error('Upgrade error:', error);
                alert('Failed to process upgrade. Please try again.');
            }
        });
    }
}

// Initialize profile when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeProfile);
