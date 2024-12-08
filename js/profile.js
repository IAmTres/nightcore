import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { auth, profiles, songs, tokens, awards } from './supabase.js';

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
const authFirebase = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let currentUser = null;
let userData = null;

// Initialize profile page
async function initializeProfile() {
    const user = await auth.getUser()
    if (!user) {
        window.location.href = '/login.html'
        return
    }

    // Load all profile data in parallel
    const [profile, userSongs, userAwards, tokenBalance] = await Promise.all([
        profiles.getProfile(user.id),
        songs.getUserSongs(user.id),
        awards.getUserAwards(user.id),
        tokens.getTokenBalance(user.id)
    ])

    // Update profile information
    document.getElementById('profile-name').textContent = profile.username || user.email
    document.getElementById('profile-bio').textContent = profile.bio || 'No bio yet'
    document.getElementById('profile-avatar').src = profile.avatar_url || '/images/default-avatar.png'
    document.getElementById('token-balance').textContent = tokenBalance
    document.getElementById('member-since').textContent = new Date(profile.created_at).toLocaleDateString()

    // Update songs section
    const songsContainer = document.getElementById('songs-container')
    songsContainer.innerHTML = userSongs.map(song => `
        <div class="song-card">
            <h3>${song.title}</h3>
            <p>${song.likes_count} likes</p>
            <div class="song-actions">
                <button onclick="downloadSong('${song.id}')">Download</button>
                <button onclick="shareSong('${song.id}')">Share</button>
            </div>
        </div>
    `).join('')

    // Update awards section
    const awardsContainer = document.getElementById('awards-container')
    awardsContainer.innerHTML = userAwards.map(award => `
        <div class="award-card">
            <img src="${award.awards.icon}" alt="${award.awards.name}">
            <h4>${award.awards.name}</h4>
            <p>${award.awards.description}</p>
        </div>
    `).join('')

    // Setup tab navigation
    setupTabs()
}

// Handle profile picture upload
document.getElementById('avatar-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
        const user = await auth.getUser()
        const avatarUrl = await profiles.uploadAvatar(user.id, file)
        document.getElementById('profile-avatar').src = avatarUrl
    } catch (error) {
        alert('Error uploading avatar: ' + error.message)
    }
})

// Handle profile updates
document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const user = await auth.getUser()
    
    try {
        await profiles.updateProfile(user.id, {
            username: document.getElementById('username-input').value,
            bio: document.getElementById('bio-input').value
        })
        alert('Profile updated successfully!')
    } catch (error) {
        alert('Error updating profile: ' + error.message)
    }
})

// Setup tabs
function setupTabs() {
    const tabs = document.querySelectorAll('[data-tab-target]')
    const tabContents = document.querySelectorAll('[data-tab-content]')

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = document.querySelector(tab.dataset.tabTarget)
            tabContents.forEach(content => content.classList.remove('active'))
            tabs.forEach(t => t.classList.remove('active'))
            tab.classList.add('active')
            target.classList.add('active')
        })
    })
}

// Update token balance display
async function updateTokenBalance(userId) {
    const tokenBalance = await tokens.getTokenBalance(userId)
    document.getElementById('token-balance').textContent = tokenBalance
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await auth.getSession()
    if (session?.user) {
        // Check for token refresh
        try {
            await tokens.checkAndRefreshTokens()
        } catch (error) {
            console.error('Error checking tokens:', error)
        }
        
        // Update token balance display
        updateTokenBalance(session.user.id)
        
        // Initialize profile page
        initializeProfile()
    }
})
