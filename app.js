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
        if (!file || !file.type.startsWith('audio/')) return;
        
        cleanup();

        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    audioBuffer = await audioContext.decodeAudioData(e.target.result);
                    document.getElementById('audio-player').classList.remove('hidden');
                    downloadBtn.classList.remove('hidden');
                    totalTime.textContent = formatTime(audioBuffer.duration);
                } catch (error) {
                    console.error('Error decoding audio:', error);
                    cleanup();
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error setting up audio:', error);
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
