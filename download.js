// Download progress tracking script
document.addEventListener('DOMContentLoaded', async () => {
    const progressFill = document.getElementById('progressFill');
    const percentDisplay = document.getElementById('percentDisplay');
    const statusMessage2 = document.getElementById('statusMessage2');
    const spinner = document.getElementById('spinner');
    const closeBtn = document.getElementById('closeBtn');
    const playBtn = document.getElementById('playBtn');
    const statusSection = document.getElementById('statusSection');

    // Ensure server is running
    try {
        await chrome.runtime.sendMessage({
            action: 'ensureServer'
        });
    } catch (error) {
        console.warn('Could not ensure server:', error);
    }

    let lastPercent = 0;
    let pollCount = 0;
    const maxPollAttempts = 300; // 5 minutes of polling (300 * 1000ms)

    // Close button handler
    closeBtn.addEventListener('click', () => {
        window.close();
    });

    // Play button handler
    playBtn.addEventListener('click', () => {
        const playerUrl = chrome.runtime.getURL('player.html');
        chrome.tabs.create({ url: playerUrl });
    });

    // Poll progress from server
    function pollProgress() {
        fetch('http://localhost:9234/progress')
            .then(response => response.json())
            .then(data => {
                pollCount++;

                const status = data.status;
                const percent = Math.min(Math.max(data.percent, lastPercent), 100); // Monotonic progress
                const message = data.message || '';

                // Prevent progress from going backward
                if (percent < lastPercent && percent !== 0) {
                    // Keep last percent but update message
                    lastPercent = Math.min(lastPercent + 1, 100);
                } else {
                    lastPercent = percent;
                }

                // Update UI
                progressFill.style.width = percent + '%';
                percentDisplay.textContent = percent + '%';

                if (message) {
                    statusMessage2.textContent = message.length > 50 ? message.substring(0, 50) + '...' : message;
                }

                // Handle different statuses
                if (status === 'complete') {
                    // Download complete
                    spinner.style.display = 'none';
                    progressFill.style.width = '100%';
                    percentDisplay.textContent = '100%';
                    statusMessage2.textContent = 'Download complete!';
                    
                    playBtn.classList.add('show');

                    // Auto-open player after 1 second
                    setTimeout(() => {
                        const playerUrl = chrome.runtime.getURL('player.html');
                        chrome.tabs.create({ url: playerUrl });
                        setTimeout(() => {
                            window.close();
                        }, 500);
                    }, 1000);
                } else if (status === 'error') {
                    // Download error
                    spinner.style.display = 'none';
                    showStatus(data.message || 'Download failed', 'error');
                    closeBtn.textContent = 'Close';
                } else if (status === 'downloading') {
                    // Still downloading
                    if (pollCount < maxPollAttempts) {
                        setTimeout(pollProgress, 500);
                    } else {
                        showStatus('Download timeout', 'error');
                    }
                } else {
                    // Waiting or idle
                    if (pollCount < maxPollAttempts) {
                        setTimeout(pollProgress, 500);
                    }
                }
            })
            .catch(error => {
                console.error('Progress poll error:', error);
                statusMessage2.textContent = 'Server connection error...';
                
                if (pollCount < maxPollAttempts) {
                    setTimeout(pollProgress, 1000);
                } else {
                    showStatus('Cannot connect to server', 'error');
                }
            });
    }

    function showStatus(message, type) {
        const statusMsg = document.getElementById('statusMessage');
        statusMsg.textContent = message;
        statusSection.className = `status-section show status-${type}`;
        spinner.style.display = 'none';
    }

    // Start polling
    pollProgress();
});
