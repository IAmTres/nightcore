import { supabase } from './supabase.js';
import { showLoginModal, showNotification } from './auth.js';

let selectedFile = null;
let isProcessing = false;

// Initialize the music generator
async function initializeMusicGenerator() {
    const uploadZone = document.getElementById('upload-zone');
    const audioInput = document.getElementById('audio-input');
    const generateButton = document.getElementById('generate-button');
    const audioPlayer = document.getElementById('audio-player');

    if (uploadZone && audioInput) {
        // Handle click to upload
        uploadZone.addEventListener('click', () => {
            audioInput.click();
        });

        // Handle file selection
        audioInput.addEventListener('change', handleFileUpload);

        // Handle drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.classList.add('border-purple-500');
        });

        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.classList.remove('border-purple-500');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.classList.remove('border-purple-500');

            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('audio/')) {
                handleFileSelection(file);
            } else {
                showNotification('Please upload an audio file (MP3 or WAV)', 'error');
            }
        });
    }

    if (generateButton) {
        generateButton.addEventListener('click', async () => {
            const session = await supabase.auth.getSession();
            if (!session.data.session) {
                showLoginModal();
                showNotification('Please log in to generate Nightcore versions', 'error');
                return;
            }

            if (!selectedFile) {
                showNotification('Please upload an audio file first', 'error');
                return;
            }

            if (isProcessing) {
                showNotification('Already processing a file', 'error');
                return;
            }

            try {
                await generateNightcore();
            } catch (error) {
                console.error('Error generating nightcore:', error);
                showNotification('Error generating nightcore version', 'error');
            }
        });
    }
}

// Handle file upload from input
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
        handleFileSelection(file);
    } else {
        showNotification('Please upload an audio file (MP3 or WAV)', 'error');
    }
}

// Handle file selection (both upload and drop)
function handleFileSelection(file) {
    // Check file type
    if (!file.type.startsWith('audio/')) {
        showNotification('Please upload an audio file (MP3 or WAV)', 'error');
        return;
    }

    // Check file size (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    if (file.size > maxSize) {
        showNotification('File size must be less than 20MB', 'error');
        return;
    }

    selectedFile = file;
    const uploadZone = document.getElementById('upload-zone');
    const generateButton = document.getElementById('generate-button');
    const audioPlayer = document.getElementById('audio-player');

    if (uploadZone) {
        // Update upload zone UI
        uploadZone.innerHTML = `
            <div class="text-center">
                <i class="fas fa-music text-purple-400 text-2xl mb-2"></i>
                <div class="text-purple-400 mb-2 font-semibold">${file.name}</div>
                <div class="text-sm text-gray-400">${(file.size / (1024 * 1024)).toFixed(2)} MB</div>
            </div>
        `;
        uploadZone.classList.add('border-purple-500');
    }

    if (generateButton) {
        generateButton.disabled = false;
        generateButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    // Preview the uploaded audio
    if (audioPlayer) {
        const url = URL.createObjectURL(file);
        audioPlayer.src = url;
        audioPlayer.classList.remove('hidden');
    }
}

// Generate Nightcore version
async function generateNightcore() {
    if (!selectedFile || isProcessing) return;

    isProcessing = true;
    const generateButton = document.getElementById('generate-button');
    const progressBar = document.getElementById('progress-bar');
    const originalButtonText = generateButton.textContent;
    
    generateButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
    generateButton.disabled = true;

    try {
        // Check token balance
        const session = await supabase.auth.getSession();
        const userId = session.data.session.user.id;
        
        const { data: tokenData, error: tokenError } = await supabase
            .from('user_tokens')
            .select('balance')
            .eq('user_id', userId)
            .single();

        if (tokenError) throw tokenError;
        if (!tokenData || tokenData.balance < 1) {
            throw new Error('Insufficient tokens. Please purchase more tokens to continue.');
        }

        // Create AudioContext
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await selectedFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Create offline context for processing
        const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );

        // Create source and connect to offline context
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = 1.25; // Speed up by 25%

        // Add some effects
        const highShelf = offlineContext.createBiquadFilter();
        highShelf.type = 'highshelf';
        highShelf.frequency.value = 4000;
        highShelf.gain.value = 6;

        // Connect the nodes
        source.connect(highShelf);
        highShelf.connect(offlineContext.destination);
        source.start();

        // Render audio
        const renderedBuffer = await offlineContext.startRendering();

        // Convert to WAV and create download
        const wavBlob = await audioBufferToWav(renderedBuffer);
        const url = URL.createObjectURL(wavBlob);
        
        // Update audio player
        const audioPlayer = document.getElementById('audio-player');
        if (audioPlayer) {
            audioPlayer.src = url;
            audioPlayer.classList.remove('hidden');
        }

        // Create download button
        const downloadButton = document.createElement('a');
        downloadButton.href = url;
        downloadButton.download = 'nightcore_' + selectedFile.name.replace(/\.[^/.]+$/, '.wav');
        downloadButton.click();

        // Deduct token
        const { error: updateError } = await supabase.rpc('deduct_token', { user_id: userId });
        if (updateError) throw updateError;

        showNotification('Nightcore version generated successfully!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message || 'Error generating nightcore version', 'error');
    } finally {
        isProcessing = false;
        if (generateButton) {
            generateButton.innerHTML = originalButtonText;
            generateButton.disabled = false;
        }
    }
}

// Convert AudioBuffer to WAV format
function audioBufferToWav(buffer) {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    let result = new Float32Array(buffer.length * numberOfChannels);
    let offset = 0;
    for (let channel = 0; channel < numberOfChannels; channel++) {
        let channelData = buffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
            result[offset++] = channelData[i];
        }
    }

    const dataSize = result.length * (bitDepth / 8);
    const buffer_ = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer_);

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * (bitDepth / 8), true);
    view.setUint16(32, numberOfChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    const volume = 0.8;
    let index = 44;
    for (let i = 0; i < result.length; i++) {
        const sample = Math.max(-1, Math.min(1, result[i])) * volume;
        view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        index += 2;
    }

    return new Blob([buffer_], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeMusicGenerator();
});
