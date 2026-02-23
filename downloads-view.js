// Downloads management page script
let allVideos = [];
let deleteTarget = null;

document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const playAllBtn = document.getElementById('playAllBtn');
    const emptyDownloadBtn = document.getElementById('emptyDownloadBtn');
    const videosContainer = document.getElementById('videosContainer');
    const backBtn = document.getElementById('backBtn');
    const deleteModal = document.getElementById('deleteModal');
    const cancelDeleteBtn = document.querySelector('.modal-actions .btn-secondary');
    const confirmDeleteBtn = document.querySelector('.modal-actions .btn-delete');

    if (refreshBtn) refreshBtn.addEventListener('click', loadVideos);
    if (downloadBtn) downloadBtn.addEventListener('click', openNewDownload);
    if (playAllBtn) playAllBtn.addEventListener('click', playAll);
    if (emptyDownloadBtn) emptyDownloadBtn.addEventListener('click', openNewDownload);
    if (backBtn) backBtn.addEventListener('click', () => window.history.back());

    // Modal button listeners
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);

    // Use event delegation for dynamically created elements
    videosContainer.addEventListener('click', (e) => {
        const videoCard = e.target.closest('.video-card');
        if (!videoCard) return;
        
        const videoName = videoCard.getAttribute('data-video-name');
        
        // Handle play clicks - clicking thumbnail or play icon plays the video
        if (e.target.classList.contains('play-icon') ||
            e.target.closest('.video-thumbnail')) {
            console.log('Playing video:', videoName);
            playVideo(videoName);
        } 
        // Handle audio download button
        else if (e.target.classList.contains('btn-audio')) {
            console.log('Downloading audio:', videoName);
            downloadAudio(videoName);
        }
        // Handle delete button
        else if (e.target.classList.contains('btn-delete')) {
            console.log('Deleting video:', videoName);
            openDeleteModal(videoName);
        }
    });

    // Load videos on page load
    loadVideos();

    // Auto-refresh every 10 seconds
    setInterval(loadVideos, 10000);
    
    // Health check every 15 seconds
    setInterval(healthCheck, 15000);

    // Drag and drop reordering
    let draggedCard = null;
    let draggedIndex = null;

    videosContainer.addEventListener('dragstart', (e) => {
        const videoCard = e.target.closest('.video-card');
        if (!videoCard) return;
        
        draggedCard = videoCard;
        draggedIndex = parseInt(videoCard.getAttribute('data-index'));
        videoCard.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', videoCard.innerHTML);
        console.log('Dragging video at index:', draggedIndex);
    });

    videosContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const videoCard = e.target.closest('.video-card');
        if (videoCard && videoCard !== draggedCard) {
            videoCard.classList.add('drag-over');
        }
    });

    videosContainer.addEventListener('dragleave', (e) => {
        const videoCard = e.target.closest('.video-card');
        if (videoCard) {
            videoCard.classList.remove('drag-over', 'drag-over-left', 'drag-over-right');
        }
    });

    videosContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const videoCard = e.target.closest('.video-card');
        if (!videoCard || videoCard === draggedCard) return;
        
        const targetIndex = parseInt(videoCard.getAttribute('data-index'));
        console.log('Dropped on index:', targetIndex);
        
        // Reorder videos array
        const draggedVideo = allVideos[draggedIndex];
        allVideos.splice(draggedIndex, 1);
        
        // Adjust target index if needed
        const newIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex;
        allVideos.splice(newIndex, 0, draggedVideo);
        
        console.log('New order:', allVideos.map(v => v.name));
        
        // Re-render with animation
        renderVideosWithAnimation();
    });

    videosContainer.addEventListener('dragend', (e) => {
        // Clean up
        const cards = document.querySelectorAll('.video-card');
        cards.forEach(card => {
            card.classList.remove('dragging', 'drag-over', 'drag-over-left', 'drag-over-right');
        });
        draggedCard = null;
        draggedIndex = null;
    });

    function renderVideosWithAnimation() {
        const container = document.getElementById('videosContainer');
        const oldCards = Array.from(container.querySelectorAll('.video-card'));
        
        // Render new HTML
        container.innerHTML = allVideos.map((video, index) => `
            <div class="video-card" data-video-name="${video.name}" data-index="${index}" draggable="true">
                <div class="video-thumbnail">
                    <div class="play-icon">▶</div>
                </div>
                <div class="video-info">
                    <div class="video-title" title="${video.name}">${video.name.replace(/\.[^/.]+$/, '')}</div>
                    <div class="video-details">
                        <div class="video-size">${formatBytes(video.size)}</div>
                    </div>
                    <div class="video-actions">
                        <button class="btn-audio" type="button" title="Download audio as MP3">🎵 Audio</button>
                        <button class="btn-delete" type="button" title="Delete video">🗑 Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add animation class to new cards
        const newCards = container.querySelectorAll('.video-card');
        newCards.forEach(card => {
            card.style.animation = 'fadeInScale 0.4s ease';
        });
    }
});

async function healthCheck() {
    try {
        const response = await fetch('http://localhost:9234/health', {
            method: 'GET',
            timeout: 5000
        });
        
        if (!response.ok) {
            throw new Error('Health check failed: ' + response.status);
        }
    } catch (error) {
        console.warn('Health check failed:', error.message);
        console.log('Attempting server restart...');
        
        // Request restart from background script
        chrome.runtime.sendMessage(
            { action: 'restartServer' },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to trigger restart:', chrome.runtime.lastError);
                } else if (response && response.success) {
                    console.log('Server restarted successfully');
                    // Try to reload videos after restart
                    setTimeout(loadVideos, 2000);
                } else {
                    console.error('Server restart failed:', response?.message);
                }
            }
        );
    }
}

function loadVideos() {
    const loadingState = document.getElementById('loadingState');
    const videosContainer = document.getElementById('videosContainer');
    const emptyState = document.getElementById('emptyState');
    const stats = document.getElementById('stats');

    loadingState.style.display = 'block';
    videosContainer.style.display = 'none';
    emptyState.style.display = 'none';
    stats.style.display = 'none';

    // First ensure server is running
    chrome.runtime.sendMessage(
        { action: 'ensureServer' },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error('Extension communication error:', chrome.runtime.lastError);
            }
            
            // Try to fetch videos
            fetch('http://localhost:9234/list')
                .then(response => response.json())
                .then(data => {
                    // Filter to show only video files, not audio files
                    allVideos = (data.videos || []).filter(v => {
                        const ext = v.name.toLowerCase().split('.').pop();
                        return ['mp4', 'mkv', 'webm'].includes(ext);
                    });

                    loadingState.style.display = 'none';

                    if (allVideos.length === 0) {
                        emptyState.style.display = 'block';
                    } else {
                        // Display stats
                        const totalSize = allVideos.reduce((sum, v) => sum + v.size, 0);
                        document.getElementById('videoCount').textContent = allVideos.length;
                        document.getElementById('totalSize').textContent = formatBytes(totalSize);
                        stats.style.display = 'grid';

                        // Display videos
                        videosContainer.innerHTML = allVideos.map((video, index) => `
                            <div class="video-card" data-video-name="${video.name}" data-index="${index}" draggable="true">
                                <div class="video-thumbnail">
                                    <div class="play-icon">▶</div>
                                </div>
                                <div class="video-info">
                                    <div class="video-title" title="${video.name}">${video.name.replace(/\.[^/.]+$/, '')}</div>
                                    <div class="video-details">
                                        <div class="video-size">${formatBytes(video.size)}</div>
                                    </div>
                                    <div class="video-actions">
                                        <button class="btn-audio" type="button" title="Download audio as MP3">🎵 Audio</button>
                                        <button class="btn-delete" type="button" title="Delete video">🗑 Delete</button>
                                    </div>
                                </div>
                            </div>
                        `).join('');
                        videosContainer.style.display = 'grid';
                    }
                })
                .catch(error => {
                    console.error('Error loading videos:', error);
                    loadingState.style.display = 'none';
                    const errorMsg = document.getElementById('errorMsg');
                    errorMsg.textContent = 'Server starting... Please wait a moment and refresh.';
                    errorMsg.style.display = 'block';
                });
        }
    );
}

function playVideo(videoName) {
    console.log('playVideo called with:', videoName);
    
    if (!videoName) {
        console.error('No video name provided');
        alert('Error: No video selected');
        return;
    }

    try {
        // Construct the player URL with video parameter
        const playerUrl = 'player.html?video=' + encodeURIComponent(videoName);
        console.log('Opening player URL:', playerUrl);
        
        // Use chrome.tabs.create to open in a new tab
        chrome.tabs.create({ url: chrome.runtime.getURL(playerUrl) }, (tab) => {
            if (chrome.runtime.lastError) {
                console.error('Error creating tab:', chrome.runtime.lastError);
                alert('Error: Could not open player');
            } else {
                console.log('Player opened in tab:', tab.id);
            }
        });
    } catch (error) {
        console.error('Error in playVideo:', error);
        alert('Error: ' + error.message);
    }
}

function downloadAudio(videoName) {
    if (!videoName) {
        alert('Error: No video selected');
        return;
    }
    
    console.log('Starting audio conversion:', videoName);
    
    // Suggest filename without extension + .mp3
    const suggestedName = videoName.replace(/\.[^/.]+$/, '') + '.mp3';
    
    // Start conversion immediately in background
    chrome.runtime.sendMessage({
        action: 'startAudioConversion',
        videoName: videoName,
        outputName: suggestedName
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Message error:', chrome.runtime.lastError);
        }
        console.log('Audio conversion requested:', suggestedName);
    });
    
    // Immediately show browser's native save dialog
    // The file will be downloaded after server processes the conversion
    const link = document.createElement('a');
    link.href = 'http://localhost:9234/video?name=' + encodeURIComponent(suggestedName);
    link.download = suggestedName;
    link.click();
    
    console.log('Download dialog shown for:', suggestedName);
}

function openNewDownload() {
    // Open popup for new download
    const popupUrl = chrome.runtime.getURL('popup.html');
    chrome.tabs.create({ url: popupUrl });
}

function playAll() {
    if (allVideos.length === 0) {
        alert('No videos to play');
        return;
    }

    try {
        // Encode video list as JSON
        const playlistJson = JSON.stringify(allVideos.map(v => v.name));
        const playerUrl = 'player.html?playlist=' + encodeURIComponent(playlistJson) + '&index=0';
        console.log('Opening playlist player with', allVideos.length, 'videos');
        
        chrome.tabs.create({ url: chrome.runtime.getURL(playerUrl) }, (tab) => {
            if (chrome.runtime.lastError) {
                console.error('Error creating tab:', chrome.runtime.lastError);
                alert('Error: Could not open player');
            } else {
                console.log('Playlist player opened in tab:', tab.id);
            }
        });
    } catch (error) {
        console.error('Error in playAll:', error);
        alert('Error: ' + error.message);
    }
}

function openDeleteModal(videoName) {
    deleteTarget = videoName;
    document.getElementById('deleteVideoName').textContent = 'Are you sure you want to delete "' + videoName + '"? This cannot be undone.';
    document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
    deleteTarget = null;
    document.getElementById('deleteModal').classList.remove('show');
}

function confirmDelete() {
    if (!deleteTarget) return;

    const videoName = deleteTarget;
    closeDeleteModal();

    console.log('Deleting video:', videoName);

    // Delete file from server
    fetch('http://localhost:9234/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: videoName })
    })
        .then(response => {
            if (!response.ok) throw new Error('Delete failed');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log('Video deleted successfully');
                loadVideos(); // Refresh list
            } else {
                console.error('Delete failed:', data.error);
                alert('Failed to delete video: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Delete error:', error);
            alert('Error deleting video: ' + error.message);
        });
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('deleteModal');
    if (e.target === modal) {
        closeDeleteModal();
    }
});
