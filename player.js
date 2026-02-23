// Video player script with controls
document.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('videoPlayer');
    const playBtn = document.getElementById('playBtn');
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const speedBtn = document.getElementById('speedBtn');
    const speedMenu = document.getElementById('speedMenu');
    const speedOptions = document.querySelectorAll('.speed-option');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const currentTimeDisplay = document.getElementById('currentTime');
    const durationDisplay = document.getElementById('duration');
    const videoTitle = document.getElementById('videoTitle');
    const menuBtn = document.getElementById('menuBtn');
    const menuPopup = document.getElementById('menuPopup');
    const menuCloseBtn = document.getElementById('menuCloseBtn');
    const overlay = document.getElementById('overlay');
    const closePlayerBtn = document.getElementById('closePlayerBtn');
    const loadingState = document.getElementById('loadingState');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Ensure server is running when player loads
    try {
        await chrome.runtime.sendMessage({
            action: 'ensureServer'
        });
    } catch (error) {
        console.warn('Could not ensure server:', error);
    }

    let currentSpeed = 1;
    let playlist = null;  // Array of video names
    let currentIndex = 0; // Current video index in playlist

    // Check for playlist mode
    function initPlaylist() {
        const params = new URLSearchParams(window.location.search);
        const playlistJson = params.get('playlist');
        const indexParam = params.get('index');
        
        if (playlistJson) {
            try {
                playlist = JSON.parse(decodeURIComponent(playlistJson));
                currentIndex = parseInt(indexParam) || 0;
                console.log('Playlist mode: ' + playlist.length + ' videos, starting at index ' + currentIndex);
                
                // Show next/previous buttons
                if (playlist.length > 1) {
                    if (currentIndex > 0) prevBtn.style.display = 'flex';
                    if (currentIndex < playlist.length - 1) nextBtn.style.display = 'flex';
                }
                
                // Add playlist button handlers
                prevBtn.addEventListener('click', () => {
                    if (currentIndex > 0) {
                        currentIndex--;
                        loadVideo();
                        video.play();
                    }
                });
                
                nextBtn.addEventListener('click', () => {
                    if (currentIndex < playlist.length - 1) {
                        currentIndex++;
                        loadVideo();
                        video.play();
                    }
                });
            } catch (e) {
                console.error('Error parsing playlist:', e);
            }
        }
    }

    // Load video from server or specific video name
    function loadVideo() {
        let videoName;
        
        if (playlist) {
            // Playlist mode
            videoName = playlist[currentIndex];
        } else {
            // Single video mode
            const params = new URLSearchParams(window.location.search);
            videoName = params.get('video');
        }
        
        if (videoName) {
            video.src = 'http://localhost:9234/video?name=' + encodeURIComponent(videoName);
        } else {
            video.src = 'http://localhost:9234/video';
        }
        
        video.style.display = 'block';
        loadingState.style.display = 'none';
    }

    // Initialize playlist
    initPlaylist();
    
    // Load video when page is ready
    loadVideo();

    // Play/Pause via button
    playBtn.addEventListener('click', () => {
        if (video.paused) {
            video.play();
            playBtn.textContent = '⏸';
        } else {
            video.pause();
            playBtn.textContent = '▶';
        }
    });

    // Prevent native fullscreen player - toggle play/pause on video click instead
    video.addEventListener('click', (e) => {
        e.preventDefault();
        if (video.paused) {
            video.play();
            playBtn.textContent = '⏸';
        } else {
            video.pause();
            playBtn.textContent = '▶';
        }
    }, true);

    // Prevent context menu on video
    video.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // Prevent double-click fullscreen (native browser behavior)
    video.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fullscreenBtn.click();
    });

    // Volume control
    volumeSlider.addEventListener('input', (e) => {
        video.volume = e.target.value / 100;
        updateVolumeIcon();
    });

    volumeBtn.addEventListener('click', () => {
        if (video.muted) {
            video.muted = false;
            volumeSlider.value = video.volume * 100;
        } else {
            video.muted = true;
        }
        updateVolumeIcon();
    });

    function updateVolumeIcon() {
        if (video.muted || video.volume === 0) {
            volumeBtn.textContent = '🔇';
        } else if (video.volume < 0.5) {
            volumeBtn.textContent = '🔉';
        } else {
            volumeBtn.textContent = '🔊';
        }
    }

    // Speed control
    speedBtn.addEventListener('click', () => {
        speedMenu.classList.toggle('show');
    });

    speedOptions.forEach(option => {
        option.addEventListener('click', () => {
            const speed = parseFloat(option.dataset.speed);
            video.playbackRate = speed;
            currentSpeed = speed;
            
            // Update active indicator
            speedOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            // Update speed button text
            speedBtn.textContent = speed + 'x';
            speedMenu.classList.remove('show');
        });
    });

    // Progress bar
    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        video.currentTime = percent * video.duration;
    });

    video.addEventListener('timeupdate', () => {
        if (video.duration) {
            const percent = (video.currentTime / video.duration) * 100;
            progressFill.style.width = percent + '%';
            currentTimeDisplay.textContent = formatTime(video.currentTime);
        }
    });

    video.addEventListener('loadedmetadata', () => {
        durationDisplay.textContent = formatTime(video.duration);
        
        // Get video title based on mode
        let title;
        if (playlist) {
            // Playlist mode
            title = playlist[currentIndex].replace(/\.[^/.]+$/, '');
        } else {
            // Single video mode
            const params = new URLSearchParams(window.location.search);
            const videoName = params.get('video');
            
            if (videoName) {
                title = decodeURIComponent(videoName).replace(/\.[^/.]+$/, '');
            } else {
                const urlParts = video.src.split('/');
                const filename = urlParts[urlParts.length - 1];
                title = decodeURIComponent(filename).split('?')[0].replace(/\.[^/.]+$/, '');
            }
        }
        
        // Add playlist indicator if in playlist mode
        if (playlist && playlist.length > 1) {
            videoTitle.textContent = title + ' (' + (currentIndex + 1) + '/' + playlist.length + ')';
        } else {
            videoTitle.textContent = title || 'Video Player';
        }
        
        // Auto-play
        video.play();
        playBtn.textContent = '⏸';
    });

    video.addEventListener('play', () => {
        playBtn.textContent = '⏸';
    });

    video.addEventListener('pause', () => {
        playBtn.textContent = '▶';
    });

    video.addEventListener('ended', () => {
        // Auto-advance to next video in playlist mode
        if (playlist && currentIndex < playlist.length - 1) {
            currentIndex++;
            loadVideo();
            // Update button visibility
            if (currentIndex > 0) prevBtn.style.display = 'flex';
            if (currentIndex < playlist.length - 1) nextBtn.style.display = 'flex';
            video.play();
        }
    });

    // Fullscreen
    fullscreenBtn.addEventListener('click', () => {
        const playerContainer = document.querySelector('.player-container');
        if (!document.fullscreenElement) {
            playerContainer.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // Menu
    menuBtn.addEventListener('click', () => {
        menuPopup.classList.add('show');
        overlay.classList.add('show');
    });

    menuCloseBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);

    function closeMenu() {
        menuPopup.classList.remove('show');
        overlay.classList.remove('show');
    }

    closePlayerBtn.addEventListener('click', () => {
        window.close();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            playBtn.click();
        } else if (e.code === 'KeyF') {
            e.preventDefault();
            fullscreenBtn.click();
        } else if (e.code === 'KeyM') {
            e.preventDefault();
            volumeBtn.click();
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            video.currentTime = Math.min(video.currentTime + 5, video.duration);
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            video.currentTime = Math.max(video.currentTime - 5, 0);
        } else if (e.code === 'KeyN' && playlist && currentIndex < playlist.length - 1) {
            // Next video in playlist
            e.preventDefault();
            nextBtn.click();
        } else if (e.code === 'KeyP' && playlist && currentIndex > 0) {
            // Previous video in playlist
            e.preventDefault();
            prevBtn.click();
        }
    });

    // Format time display
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    // Error handling
    video.addEventListener('error', (e) => {
        loadingState.style.display = 'block';
        loadingState.innerHTML = '<div style="color: #ff6b6b;">Error loading video. Make sure the server is running.</div>';
        console.error('Video error:', e);
    });
});
