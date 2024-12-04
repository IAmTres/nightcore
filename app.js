document.addEventListener('DOMContentLoaded', () => {
    let audioContext = null;
    let audioSource = null;
    let audioBuffer = null;
    let startTime = 0;
    let isPlaying = false;
    let progressInterval;

    const uploadZone = document.getElementById('upload-zone');
    const audioInput = document.getElementById('audio-input');
    const playBtn = document.getElementById('play-btn');
    const downloadBtn = document.getElementById('download-btn');
    const progressBar = document.getElementById('progress-bar');
    const currentTime = document.getElementById('current-time');
    const totalTime = document.getElementById('total-time');

    // Clean up function
    function cleanup() {
        if (audioSource) {
            audioSource.stop();
            audioSource.disconnect();
            audioSource = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        isPlaying = false;
        audioBuffer = null;
    }

    // Handle file upload
    async function handleFile(file) {
        if (!file || !file.type.startsWith('audio/')) {
            alert('Please upload an audio file');
            return;
        }
        
        cleanup();

        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();
            
            try {
                audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                document.getElementById('audio-player').classList.remove('hidden');
                downloadBtn.classList.remove('hidden');
                totalTime.textContent = formatTime(audioBuffer.duration);
                progressBar.style.width = '0%';
                currentTime.textContent = '0:00';
                
                // Store original audio data
                window.originalAudioBuffer = audioBuffer;
            } catch (error) {
                console.error('Error decoding audio:', error);
                alert('Error decoding audio file. Please try a different file.');
                cleanup();
            }
        } catch (error) {
            console.error('Error setting up audio:', error);
            alert('Error setting up audio. Please try again.');
            cleanup();
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function updateTimer() {
        if (!audioContext || !isPlaying) return;
        
        const currentTimeValue = audioContext.currentTime - startTime;
        const duration = audioBuffer.duration;
        
        // Update timer display
        currentTime.textContent = formatTime(currentTimeValue);
        totalTime.textContent = formatTime(duration);
        
        // Update progress bar
        const progress = (currentTimeValue / duration) * 100;
        progressBar.style.width = `${progress}%`;
        
        // Continue updating if still playing
        if (isPlaying) {
            requestAnimationFrame(updateTimer);
        }
    }

    function playAudio() {
        if (!audioBuffer) return;

        if (isPlaying) {
            // Stop playback
            if (audioSource) {
                audioSource.stop();
                audioSource.disconnect();
                audioSource = null;
            }
            isPlaying = false;
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            // Start playback
            audioSource = audioContext.createBufferSource();
            audioSource.buffer = audioBuffer;
            audioSource.playbackRate.value = 1.3; // Nightcore speed
            audioSource.connect(audioContext.destination);
            
            startTime = audioContext.currentTime;
            audioSource.start();
            isPlaying = true;
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            
            // Start timer updates
            requestAnimationFrame(updateTimer);
            
            // Handle song end
            audioSource.onended = () => {
                isPlaying = false;
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                progressBar.style.width = '0%';
                currentTime.textContent = '0:00';
            };
        }
    }

    // Download functionality
    async function downloadNightcoreVersion() {
        if (!audioBuffer) {
            alert('Please upload an audio file first');
            return;
        }

        try {
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';

            // Calculate the new length for 1.3x speed
            const speedRatio = 1.3;
            const newLength = Math.ceil(audioBuffer.length / speedRatio);
            
            // Create an offline context
            const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
                audioBuffer.numberOfChannels,
                newLength,
                audioBuffer.sampleRate
            );

            // Create source node
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = speedRatio;

            // Create gain node to prevent clipping
            const gainNode = offlineCtx.createGain();
            gainNode.gain.value = 0.9;

            // Connect nodes
            source.connect(gainNode);
            gainNode.connect(offlineCtx.destination);

            // Start the source and render
            source.start(0);
            const renderedBuffer = await offlineCtx.startRendering();

            // Convert to WAV
            const wav = new Blob([
                createWaveFileData(renderedBuffer)
            ], {
                type: 'audio/wav'
            });

            // Create download link
            const url = window.URL.createObjectURL(wav);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'nightcore-version.wav';

            // Trigger download
            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Error creating nightcore version:', error);
            alert('Error processing audio. Please try again.');
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<i class="fas fa-download mr-2"></i>Download Nightcore Version';
        }
    }

    // Helper function to create WAV file data
    function createWaveFileData(audioBuffer) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length;
        const sampleRate = audioBuffer.sampleRate;
        const bitsPerSample = 16;
        const byteRate = sampleRate * numberOfChannels * bitsPerSample / 8;
        const blockAlign = numberOfChannels * bitsPerSample / 8;
        const wavDataByteLength = length * numberOfChannels * 2; // 2 bytes per sample
        const headerByteLength = 44;
        const totalLength = headerByteLength + wavDataByteLength;
        const waveFileData = new Uint8Array(totalLength);
        const view = new DataView(waveFileData.buffer);

        // RIFF chunk descriptor
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + wavDataByteLength, true);
        writeString(view, 8, 'WAVE');

        // fmt sub-chunk
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);

        // data sub-chunk
        writeString(view, 36, 'data');
        view.setUint32(40, wavDataByteLength, true);

        // write PCM samples
        const channelData = [];
        const samples = new Float32Array(length);

        // Get audio data from each channel
        for (let channel = 0; channel < numberOfChannels; channel++) {
            channelData[channel] = audioBuffer.getChannelData(channel);
        }

        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                let sample = Math.max(-1, Math.min(1, channelData[channel][i]));
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset, sample, true);
                offset += 2;
            }
        }

        return waveFileData;
    }

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    // Event Listeners
    uploadZone.onclick = () => audioInput.click();
    uploadZone.ondragover = (e) => {
        e.preventDefault();
        uploadZone.classList.add('border-purple-500');
    };
    uploadZone.ondragleave = () => uploadZone.classList.remove('border-purple-500');
    uploadZone.ondrop = (e) => {
        e.preventDefault();
        uploadZone.classList.remove('border-purple-500');
        handleFile(e.dataTransfer.files[0]);
    };
    audioInput.onchange = () => handleFile(audioInput.files[0]);
    playBtn.onclick = playAudio;
    downloadBtn.onclick = downloadNightcoreVersion;

    window.addEventListener('beforeunload', cleanup);

    // Playlist functionality
    const trackCards = document.querySelectorAll('.track-card');
    let currentlyPlaying = null;

    trackCards.forEach(card => {
        const playButton = card.querySelector('.play-button');
        
        card.addEventListener('click', async (e) => {
            // Prevent default behavior
            e.preventDefault();

            // If clicking the same card that's playing, do nothing
            if (currentlyPlaying === card) return;

            // Update visual state
            if (currentlyPlaying) {
                currentlyPlaying.classList.remove('playing');
                currentlyPlaying.querySelector('.play-button i').classList.remove('fa-pause');
                currentlyPlaying.querySelector('.play-button i').classList.add('fa-play');
            }

            card.classList.add('playing');
            playButton.querySelector('i').classList.remove('fa-play');
            playButton.querySelector('i').classList.add('fa-pause');
            
            currentlyPlaying = card;

            // Show the audio player section if hidden
            const audioPlayer = document.getElementById('audio-player');
            audioPlayer.classList.remove('hidden');

            // Simulate loading the track (you'll need to implement actual audio loading)
            const trackTitle = card.querySelector('h3').textContent;
            const artistName = card.querySelector('p').textContent;
            
            // Update the audio player UI
            document.querySelector('#audio-player').scrollIntoView({ behavior: 'smooth' });
        });

        // Add hover effect for play button
        playButton.addEventListener('mouseenter', () => {
            playButton.querySelector('i').classList.add('fa-bounce');
        });

        playButton.addEventListener('mouseleave', () => {
            playButton.querySelector('i').classList.remove('fa-bounce');
        });
    });
});
