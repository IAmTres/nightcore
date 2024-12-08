import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

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
const storage = getStorage(app);

let currentUser = null;
let userData = null;

// Initialize profile
async function initializeProfile() {
    try {
        // Wait for Firebase Auth to initialize and get user
        const user = await new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                resolve(user);
            });
        });
        
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
                tokens: 5,
                isPremium: false,
                joinDate: new Date().toISOString(),
                createdTracks: [],
                bio: '',
                awards: []
            };
            await setDoc(userDoc, userData);
            console.log('New user data created:', userData);
        }
        
        updateProfileInfo();
        setupEventListeners();
        setupTabNavigation();
        loadUserSongs();
    } catch (error) {
        console.error('Error initializing profile:', error);
        showError('Error loading profile. Please try refreshing the page.');
    }
}

// Update profile information
function updateProfileInfo() {
    if (!currentUser) return;

    // Update profile picture
    const profilePics = document.querySelectorAll('img[alt="Profile Picture"]');
    profilePics.forEach(pic => {
        if (currentUser.photoURL) {
            pic.src = currentUser.photoURL;
        }
    });

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

    // Update profile form
    const displayNameInput = document.getElementById('display-name');
    const bioInput = document.getElementById('bio');
    if (displayNameInput) displayNameInput.value = userData.name;
    if (bioInput) bioInput.value = userData.bio || '';

    // Update stats
    const memberSince = document.getElementById('member-since');
    const totalSongs = document.getElementById('total-songs');
    const awards = document.getElementById('awards');

    if (memberSince) {
        const date = new Date(userData.joinDate);
        memberSince.textContent = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    }

    if (totalSongs) {
        totalSongs.textContent = `${userData.createdTracks?.length || 0} songs`;
    }

    if (awards) {
        awards.innerHTML = '';
        (userData.awards || []).forEach(award => {
            const awardIcon = document.createElement('i');
            awardIcon.className = `fas fa-${award.icon} text-yellow-400 text-xl`;
            awardIcon.title = award.name;
            awards.appendChild(awardIcon);
        });
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

    // Handle profile image upload
    const avatarUpload = document.getElementById('avatar-upload');
    const changeAvatarBtn = document.getElementById('change-avatar-btn');

    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', () => {
            avatarUpload.click();
        });
    }

    if (avatarUpload) {
        avatarUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const storageRef = ref(storage, `avatars/${currentUser.uid}`);
                await uploadBytes(storageRef, file);
                const photoURL = await getDownloadURL(storageRef);
                
                await updateProfile(currentUser, { photoURL });
                updateProfileInfo();
            } catch (error) {
                console.error('Error uploading avatar:', error);
                showError('Failed to upload profile picture. Please try again.');
            }
        });
    }

    // Handle profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const displayName = document.getElementById('display-name').value;
            const bio = document.getElementById('bio').value;

            try {
                await updateProfile(currentUser, { displayName });
                
                const userDoc = doc(db, 'users', currentUser.uid);
                userData.name = displayName;
                userData.bio = bio;
                await setDoc(userDoc, userData);

                updateProfileInfo();
                showSuccess('Profile updated successfully!');
            } catch (error) {
                console.error('Error updating profile:', error);
                showError('Failed to update profile. Please try again.');
            }
        });
    }
}

// Setup tab navigation
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            
            // Update button states
            tabButtons.forEach(btn => {
                btn.classList.remove('text-purple-400', 'border-purple-500');
                btn.classList.add('text-purple-300');
            });
            button.classList.add('text-purple-400', 'border-purple-500');
            button.classList.remove('text-purple-300');

            // Update content visibility
            tabContents.forEach(content => {
                content.classList.add('hidden');
                if (content.id === `${tab}-tab`) {
                    content.classList.remove('hidden');
                }
            });
        });
    });
}

// Load user's songs
async function loadUserSongs() {
    if (!currentUser) return;

    try {
        const songsGrid = document.getElementById('songs-grid');
        const songCount = document.getElementById('songCount');
        
        if (!songsGrid) return;

        // Get user's songs from Firestore
        const songsQuery = query(
            collection(db, 'songs'),
            where('userId', '==', currentUser.uid)
        );
        const songsSnapshot = await getDocs(songsQuery);
        const songs = [];

        songsSnapshot.forEach(doc => {
            songs.push({ id: doc.id, ...doc.data() });
        });

        // Update song count
        if (songCount) {
            songCount.textContent = songs.length;
        }

        // Clear existing songs
        songsGrid.innerHTML = '';

        // Add songs to grid
        songs.forEach(song => {
            const songCard = document.createElement('div');
            songCard.className = 'p-6 rounded-xl bg-purple-900 bg-opacity-50';
            songCard.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="font-bold text-lg">${song.title}</h3>
                        <p class="text-purple-300 text-sm">Created ${new Date(song.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span class="flex items-center text-purple-300">
                        <i class="fas fa-heart mr-1"></i>${song.likes || 0}
                    </span>
                </div>
                <div class="flex space-x-2">
                    <button class="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors flex-1">
                        <i class="fas fa-download mr-2"></i>Download
                    </button>
                    <button class="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors flex-1">
                        <i class="fas fa-share mr-2"></i>Share
                    </button>
                    <button class="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors flex-1">
                        <i class="fas fa-plus mr-2"></i>Add to Playlist
                    </button>
                </div>
            `;
            songsGrid.appendChild(songCard);
        });

        // Show empty state if no songs
        if (songs.length === 0) {
            songsGrid.innerHTML = `
                <div class="col-span-2 text-center py-12">
                    <i class="fas fa-music text-4xl text-purple-400 mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">No Songs Yet</h3>
                    <p class="text-purple-300">Start creating your first Nightcore track!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading songs:', error);
        showError('Failed to load songs. Please try refreshing the page.');
    }
}

// Show error message
function showError(message) {
    const main = document.querySelector('main');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 bg-opacity-20 text-red-300 p-4 rounded-lg';
    errorDiv.textContent = message;
    main.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Show success message
function showSuccess(message) {
    const main = document.querySelector('main');
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 bg-opacity-20 text-green-300 p-4 rounded-lg';
    successDiv.textContent = message;
    main.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 5000);
}

// Initialize profile when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeProfile);
