// Popup script for handling user interactions
document.addEventListener('DOMContentLoaded', async () => {
    const urlDisplay = document.getElementById('urlDisplay');
    const downloadBtn = document.getElementById('downloadBtn');
    const viewDownloadsBtn = document.getElementById('viewDownloadsBtn');
    const qualitySelect = document.getElementById('quality');
    const statusSection = document.getElementById('statusSection');
    const statusMessage = document.getElementById('statusMessage');

    // View downloads button
    viewDownloadsBtn.addEventListener('click', () => {
        const downloadsUrl = chrome.runtime.getURL('downloads-view.html');
        chrome.tabs.create({ url: downloadsUrl });
    });

    // Get current tab URL
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab.url;

        // Check if it's a YouTube URL
        if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
            urlDisplay.textContent = url;
            urlDisplay.classList.remove('empty');
        } else {
            urlDisplay.textContent = 'Not a YouTube video URL';
            downloadBtn.disabled = true;
        }

        // Handle download button click
        downloadBtn.addEventListener('click', async () => {
            if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
                showStatus('Please navigate to a YouTube video', 'error');
                return;
            }

            const quality = qualitySelect.value;
            downloadBtn.disabled = true;
            downloadBtn.textContent = '⏳ Downloading...';

            try {
                // Send message to background script to start download
                const response = await chrome.runtime.sendMessage({
                    action: 'startDownload',
                    url: url,
                    quality: quality,
                    audioOnly: false
                });

                if (response && response.success) {
                    showStatus('Opening progress page...', 'info');
                    // The background script will open the progress page
                } else {
                    showStatus(response?.message || 'Failed to start download', 'error');
                    downloadBtn.disabled = false;
                    downloadBtn.textContent = '⬇️ Download';
                }
            } catch (error) {
                console.error('Download error:', error);
                showStatus('Error: ' + error.message, 'error');
                downloadBtn.disabled = false;
                downloadBtn.textContent = '⬇️ Download';
            }
        });
    } catch (error) {
        console.error('Popup error:', error);
        showStatus('Error: ' + error.message, 'error');
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusSection.className = `status-section show status-${type}`;
    }
});
