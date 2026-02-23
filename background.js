// Background service worker for handling downloads and messaging

// Track if any extension windows are currently open
let activeExtensionWindows = new Set();

// Ensure server is running on extension load
chrome.runtime.onInstalled.addListener(() => {
    ensureServerRunning();
});

// Also check when extension becomes active
chrome.runtime.onStartup.addListener(() => {
    ensureServerRunning();
});

// Handle when browser is closing - clean up server
chrome.windows.onRemoved.addListener((windowId) => {
    activeExtensionWindows.delete(windowId);
    
    // If no more active extension windows, kill the server
    if (activeExtensionWindows.size === 0) {
        killServer();
    }
});

// Periodic health check - restart server if it dies
setInterval(() => {
    checkServerHealth();
}, 30000); // Check every 30 seconds

async function checkServerHealth() {
    try {
        const response = await fetch('http://localhost:9234/health', {
            method: 'GET',
            timeout: 2000
        });
        
        if (!response.ok) {
            console.warn('Server health check failed, attempting restart');
            await restartServer();
        }
    } catch (error) {
        // Server is not responding
        if (activeExtensionWindows.size > 0) {
            console.warn('Server is down, attempting to restart');
            await restartServer();
        }
    }
}

async function ensureServerRunning() {
    try {
        // First try to connect to existing server
        const response = await fetch('http://localhost:9234/health', {
            method: 'GET',
            timeout: 3000
        });
        
        if (response.ok) {
            console.log('Server is already running');
            return { success: true, message: 'Server already running' };
        }
    } catch (error) {
        // Server not running, try to start it via native messaging
        console.log('Server not running, attempting to start...');
        try {
            const result = await new Promise((resolve, reject) => {
                chrome.runtime.sendNativeMessage(
                    'com.ezc.youtube',
                    { action: 'startServer' },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    }
                );
            });
            
            if (result.status === 'success') {
                console.log('Server started successfully');
                // Give server time to start
                await new Promise(resolve => setTimeout(resolve, 1000));
                return { success: true, message: result.message };
            } else {
                console.warn('Failed to start server:', result.message);
                return { success: false, message: result.message };
            }
        } catch (nativeError) {
            console.warn('Native messaging not available, server must be started manually');
            return { success: false, message: 'Native messaging not configured' };
        }
    }
}

async function killServer() {
    try {
        console.log('Attempting to kill server...');
        await new Promise((resolve, reject) => {
            chrome.runtime.sendNativeMessage(
                'com.ezc.youtube',
                { action: 'killServer' },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('Could not kill server:', chrome.runtime.lastError.message);
                    } else {
                        console.log('Kill server response:', response);
                    }
                    resolve();
                }
            );
        });
    } catch (e) {
        console.warn('Error killing server:', e.message);
    }
}

async function restartServer() {
    try {
        console.log('Attempting to restart server...');
        // Kill existing server if running
        await killServer();
        
        // Wait before restarting
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Start fresh server
        return await ensureServerRunning();
    } catch (error) {
        console.error('Server restart failed:', error);
        return { success: false, message: error.message };
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startDownload') {
        // Track that a download window is active
        if (sender.url?.includes('download.html')) {
            activeExtensionWindows.add(sender.frameId);
        }
        
        // Ensure server is running before download
        ensureServerRunning().then(() => {
            handleDownload(request.url, request.quality, request.audioOnly).then(result => {
                sendResponse(result);
            }).catch(error => {
                sendResponse({ success: false, message: error.message });
            });
        });
        return true; // Keep the message channel open for async response
    } else if (request.action === 'viewDownloads') {
        // Ensure server is running for downloads view
        ensureServerRunning().then(() => {
            sendResponse({ success: true, message: 'Server ready' });
        }).catch(error => {
            sendResponse({ success: false, message: error.message });
        });
        return true;
    } else if (request.action === 'startAudioConversion') {
        // Convert video to audio on the server
        ensureServerRunning().then(() => {
            handleAudioConversion(request.videoName, request.outputName).then(result => {
                sendResponse(result);
            }).catch(error => {
                sendResponse({ success: false, message: error.message });
            });
        });
        return true;
    } else if (request.action === 'ensureServer') {
        ensureServerRunning().then(result => {
            sendResponse(result);
        }).catch(error => {
            sendResponse({ success: false, message: error.message });
        });
        return true;
    } else if (request.action === 'restartServer') {
        restartServer().then(result => {
            sendResponse(result);
        }).catch(error => {
            sendResponse({ success: false, message: error.message });
        });
        return true;
    }
});

async function handleDownload(videoUrl, quality, audioOnly = false) {
    try {
        // Validate server is running
        const healthCheck = await fetch('http://localhost:9234/health', {
            method: 'GET'
        }).catch(() => null);

        if (!healthCheck) {
            return {
                success: false,
                message: 'Server not running on localhost:9234. Please start the server.'
            };
        }

        // Open progress page
        const progressPageUrl = chrome.runtime.getURL('download.html');
        const progressWindow = await chrome.windows.create({
            url: progressPageUrl,
            type: 'popup',
            width: 500,
            height: 300,
            focused: true
        });

        // Start the download on the server
        const downloadResponse = await fetch('http://localhost:9234/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: videoUrl,
                quality: quality,
                audioOnly: audioOnly
            })
        });

        if (!downloadResponse.ok) {
            const error = await downloadResponse.text();
            return {
                success: false,
                message: 'Server error: ' + error
            };
        }

        const downloadData = await downloadResponse.json();

        // Notify progress page about the download
        chrome.runtime.sendMessage({
            action: 'downloadStarted',
            videoUrl: videoUrl,
            quality: quality,
            audioOnly: audioOnly,
            downloadId: downloadData.id || 'default'
        }).catch(() => {
            // Progress page might not be loaded yet
        });

        return {
            success: true,
            message: 'Download started'
        };
    } catch (error) {
        console.error('Download error:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

async function handleAudioConversion(videoName, outputName) {
    try {
        // Validate server is running
        const healthCheck = await fetch('http://localhost:9234/health', {
            method: 'GET'
        }).catch(() => null);

        if (!healthCheck) {
            return {
                success: false,
                message: 'Server not running on localhost:9234. Please start the server.'
            };
        }

        // Convert video to audio on the server
        const conversionResponse = await fetch('http://localhost:9234/convert-audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoName: videoName,
                outputName: outputName
            })
        });

        if (!conversionResponse.ok) {
            const error = await conversionResponse.text();
            return {
                success: false,
                message: 'Server error: ' + error
            };
        }

        const conversionData = await conversionResponse.json();

        if (conversionData.success) {
            return {
                success: true,
                message: 'Audio conversion completed'
            };
        } else {
            return {
                success: false,
                message: conversionData.error || 'Unknown error'
            };
        }
    } catch (error) {
        console.error('Audio conversion error:', error);
        return {
            success: false,
            message: error.message
        };
    }
}
