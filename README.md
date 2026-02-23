# EZC YouTube Extension - Installation & Usage Guide

A simple, fast Chrome extension to download YouTube videos in your preferred quality and watch them ad-free.

## Quick Start (5 minutes)

1. **Install Prerequisites:**
   ```bash
   brew install yt-dlp  # or: pip install yt-dlp
   ```

2. **Start the Server:**
   ```bash
   cd /Users/tanny/EZC
   python3 server.py
   ```

3. **Load the Extension:**
   - Open Chrome → `chrome://extensions/`
   - Toggle "Developer mode" (top-right)
   - Click "Load unpacked" → Select `/Users/tanny/EZC`
   - Done! The EZC icon appears in your toolbar

4. **Download Your First Video:**
   - Go to any YouTube video
   - Click the EZC icon
   - Choose quality (Best, 1080p, 720p, 480p, 360p)
   - Click "Download"
   - Watch in the built-in player!

## Project Structure

```
/Users/tanny/EZC/
├── manifest.json              # Extension configuration
├── popup.html & popup.js       # Popup UI for quality selection
├── background.js               # Service worker for download coordination
├── content-script.js           # YouTube page integration
├── download.html & download.js # Progress tracking page
├── player.html & player.js     # Video player with controls
├── server.py                   # Python backend server (yt-dlp)
├── icons/
│   └── EZC.png                # Extension icon
└── downloads/                  # Where videos are saved
```

## Installation & Setup

### 1. Get the Extension Files

Choose one of these methods:

#### Option A: Clone from Repository (Recommended)

If you have Git installed:

```bash
git clone https://github.com/yourusername/EZC.git
cd EZC
```

Then navigate to the folder where you cloned it for the next steps.

**Don't have Git?** Install it:
- **macOS**: `brew install git`
- **Windows**: Download from [git-scm.com](https://git-scm.com/download/win)
- **Linux**: `sudo apt-get install git` (Ubuntu/Debian) or `sudo yum install git` (Fedora)

#### Option B: Download as ZIP Package

1. Go to the repository on GitHub
2. Click the green **"Code"** button (top-right)
3. Click **"Download ZIP"**
4. Extract the ZIP file to your desired location
5. Rename the folder to `EZC` (optional, but recommended)

You now have all the extension files. Note the full path to this folder - you'll need it in Step 3.

### 2. Prerequisites

Ensure you have the following installed:

**Google Chrome or Chromium Browser**
- Download from [google.com/chrome](https://google.com/chrome)
- Any recent version (2020+) works fine

**Python 3** (version 3.6 or higher)
- Check if installed:
  ```bash
  python3 --version
  ```
- If not installed:
  - **macOS**: `brew install python3` or download from [python.org](https://www.python.org/)
  - **Windows**: Download from [python.org](https://www.python.org/) (check "Add Python to PATH" during install)
  - **Linux**: `sudo apt-get install python3` (Ubuntu/Debian)

**yt-dlp** (video downloader tool)
```bash
# macOS (using Homebrew)
brew install yt-dlp

# Or using pip (any OS)
pip install yt-dlp

# Or using conda
conda install yt-dlp
```

Verify installation:
```bash
yt-dlp --version
```

### 3. Enable Developer Mode in Chrome

Before loading the extension, you need to enable Developer Mode in Chrome:

1. **Open Chrome Extensions Page**
   - Click the three-dot menu (⋮) in Chrome's top-right corner
   - Click **"More tools"** → **"Extensions"**
   - OR type this in the address bar: `chrome://extensions/`

2. **Enable Developer Mode**
   - Look in the **top-right corner** of the extensions page
   - Toggle the **"Developer mode"** switch (it should turn blue)
   - Once enabled, three new buttons appear: "Load unpacked", "Pack extension", and "Update"

3. **Confirm It's Enabled**
   - The toggle should be blue (enabled)
   - You should see the new buttons

**Note**: Developer Mode only affects this extensions page. It doesn't affect your browser's normal security.

### 4. Load the Extension in Chrome

Now that Developer Mode is enabled, you can load the EZC extension:

1. **Click "Load unpacked"** button (appears after enabling Developer Mode)

2. **Select the Extension Folder**
   - A file browser dialog opens
   - Navigate to where you cloned/extracted the EZC folder
   - Select the folder (the one containing `manifest.json`)
   - Click **"Open"** or **"Select Folder"**

3. **Wait for Loading**
   - Chrome reads the extension files
   - Validates the configuration
   - Takes 2-5 seconds

4. **Confirm Installation**
   - You should see the **EZC extension card** appear on the extensions page
   - It shows the extension name, version, and description
   - A red/orange **EZC icon** appears in your Chrome toolbar (top-right, near your profile icon)
   - Status should say "Enabled"

**Troubleshooting Extension Loading:**
- **Error about manifest.json**: Make sure you selected the correct folder (the one with `manifest.json` file)
- **Permission denied**: Try selecting a different folder location (some system folders don't allow this)
- **Icon doesn't appear**: Refresh the extensions page (F5 or Cmd+R)
- **See red error badge**: Click "Errors" to view what went wrong, then fix and reload

### 5. Start the Backend Server

The Python server handles all the downloading. It must be running when you use the extension:

1. **Open a Terminal**
   - **macOS**: Cmd+Space → type "Terminal" → Enter
   - **Windows**: Win+R → type "cmd" → Enter (or use PowerShell)
   - **Linux**: Ctrl+Alt+T (most distros)

2. **Navigate to the Extension Folder**
   ```bash
   cd /path/to/EZC
   # For example: cd ~/Downloads/EZC
   # Or: cd /Users/tanny/EZC
   ```

3. **Start the Server**
   ```bash
   python3 server.py
   ```

4. **Wait for Server to Start**
   - You should see the message:
   ```
   EZC Server running on http://localhost:9234
   ```
   - The server is now ready to accept downloads
   - **Keep this terminal window open** - the server must stay running while you use the extension

5. **Server Endpoints** (for reference):
   - `GET /health` - Health check endpoint
   - `POST /download` - Start a download (body: `{url, quality}`)
   - `GET /progress` - Get real-time download progress
   - `GET /video` - Stream the completed video file

**Keep the Server Running:**
- Don't close the terminal window
- If you do close it, downloads will fail until you restart the server
- The server uses minimal system resources (< 50 MB memory, minimal CPU)

## How to Use

### Step 1: Navigate to a YouTube Video

1. Open your Chrome browser
2. Go to YouTube: `https://www.youtube.com`
3. Search for or navigate to any video you want to download
4. Play the video (or just open the video page)

**Note:** The extension only works on YouTube video pages. You'll see a message if you try to use it on other pages.

### Step 2: Open the EZC Extension Popup

Click the **EZC icon** in your Chrome toolbar (top-right area, next to your profile icon).

The popup window appears showing:
- **Current Video URL**: The YouTube link of the video you're watching
- **Quality Dropdown**: Select your preferred quality
- **Download Button**: Click to start downloading

If you see "Not a YouTube video URL", you're not on a YouTube video page. Check the URL in your browser.

### Step 3: Select Video Quality

Click the quality dropdown to see these options:

| Quality | Best For | Typical File Size (1-hour video) |
|---------|----------|----------------------------------|
| **Best** | Maximum quality available | 2-4 GB |
| **1080p** | High quality, larger files | 2-3 GB |
| **720p** | Balanced quality/size | 800 MB - 1.5 GB |
| **480p** | Moderate quality, smaller files | 300-600 MB |
| **360p** | Low bandwidth, quick downloads | 100-300 MB |

**How it works:** If the exact quality isn't available, yt-dlp automatically selects the next best option. For example, if a 1080p video doesn't exist, it will download 720p instead.

### Step 4: Click Download

Once you've selected your preferred quality:
1. Click the blue "Download" button
2. A new window opens showing **download progress**
3. The extension starts fetching the video from YouTube

**What happens:**
- The progress window shows real-time download status
- A progress bar indicates completion percentage
- Status messages update as the download progresses
- The window automatically closes when download completes and the player opens

### Step 5: Watch Your Video

Once the download reaches **100%**, the built-in video player automatically opens:

1. **Video loads** in the player window
2. **Playback starts** (or click Play to start manually)
3. **Enjoy ad-free content** - no ads, no interruptions!

### Understanding Download Progress

The progress window shows:
- **Percentage**: Visual progress bar (0-100%)
- **Status Message**: Current activity (Connecting, Downloading, Merging, etc.)
- **Real-time Updates**: Refreshes every second

Example progression:
```
0%   → Connecting to server...
15%  → Downloading video stream...
45%  → Downloading audio stream...
85%  → Merging streams...
100% → Download complete!
       (Player opens automatically)
```

**Important**: Progress never goes backward. If downloads are slow, just wait - they'll continue progressing smoothly.

## Video Player Controls

The built-in video player provides comprehensive controls for comfortable viewing:

### Playback Controls

**Play / Pause**
- Click the **Play/Pause button** in the player toolbar
- Press **Spacebar** for quick toggle
- Keyboard: **P** to pause/play

**Volume Control**
- Click the **speaker icon** to toggle mute
- Drag the **volume slider** to adjust level (0-100%)
- Keyboard: **↑** to increase volume, **↓** to decrease
- Keyboard: **M** to mute/unmute

### Speed Control

Change playback speed for different viewing needs:
- **0.25x**: Very slow, useful for detailed study
- **0.5x**: Slow, for careful learning
- **0.75x**: Slightly slower than normal
- **1x**: Default normal speed
- **1.25x**: Moderately faster
- **1.5x**: Significantly faster, good for reviews
- **2x**: Double speed, fast skimming

**How to use:** Click the speed dropdown (shows current speed like "1x") or use arrow keys to cycle through speeds.

### Navigation and Seeking

**Seek by Clicking**
- Click any point on the **progress bar** to jump to that time
- Dragging the **progress slider** lets you preview while seeking

**Seek with Keyboard**
- Press **→ (Right Arrow)** to skip forward 5 seconds
- Press **← (Left Arrow)** to skip backward 5 seconds
- Press **J** to jump back 10 seconds
- Press **L** to jump forward 10 seconds

**Time Display**
- Hover over the progress bar to see timestamps
- Current time and total duration always visible

### Display and Fullscreen

**Fullscreen Mode**
- Click the **fullscreen button** in bottom-right corner
- Press **F** to toggle fullscreen
- Press **T** to toggle theater mode (wider viewing area)
- Press **Escape** to exit fullscreen

**Resolution / Quality**
- Player automatically streams at downloaded quality
- No need to adjust - uses the quality you selected

### Keyboard Shortcuts Reference

| Key | Action |
|-----|--------|
| **Space** | Play/Pause |
| **F** | Fullscreen on/off |
| **T** | Theater mode on/off |
| **M** | Mute/Unmute |
| **↑** | Volume up |
| **↓** | Volume down |
| **→** | Skip forward 5s |
| **←** | Skip back 5s |
| **P** | Pause/Play |
| **J** | Skip back 10s |
| **L** | Skip forward 10s |
| **Escape** | Exit fullscreen/theater |
| **,** | Frame by frame (when paused) |
| **.** | Frame forward (when paused) |

### Menu and Settings

Click the **hamburger menu** (≡ icon) to:
- View player information
- See current quality/format
- Close the player window

## Common Usage Scenarios

### Scenario 1: Download a Music Video

1. Find your favorite music video on YouTube
2. Click EZC icon → Select "Best" quality (for audio quality)
3. Wait for download to complete
4. Play in the built-in player
5. Use keyboard shortcut **M** to mute if watching with other content
6. Use **2x** speed for quick browsing, **0.5x** for detailed study

### Scenario 2: Watch a Long Documentary or Series

1. Go to the video on YouTube
2. Select "720p" quality (balances quality and file size)
3. Start download (usually completes in 5-15 minutes for 1-hour content)
4. Once playing, use **1.5x** or **2x** speed to watch faster
5. Use **← / →** arrow keys to skip backward/forward quickly
6. Go fullscreen (**F**) for immersive watching
7. Use **T** for theater mode to see more content

### Scenario 3: Save Video with Limited Storage

1. Click EZC icon on the YouTube page
2. Check your remaining storage needs
3. Select "360p" or "480p" (much smaller file sizes)
4. Download completes very quickly
5. Video still plays smoothly even at lower quality
6. Great for watching on laptops or phones with limited storage
7. Lower quality = faster downloads and uploads if sharing

### Scenario 4: Learning / Tutorial Video

1. Download tutorial in "1080p" or "Best" for clear visibility
2. Start playback
3. Use **0.5x** or **0.75x** speed to follow instructions carefully
4. Pause frequently with **Space** to practice alongside
5. Use **←** (back 5s) or **J** (back 10s) to rewatch complex parts
6. Use **,** and **.** keys for frame-by-frame viewing of tricky moments

### Scenario 5: Quick Review / Summary

1. Download video in any quality
2. Play at **1.5x** or **2x** speed for faster review
3. Use **→** to skip forward through less important sections
4. Use **M** to mute sections you don't need to hear (ads, intros)
5. Takes 1/4 to 1/3 the normal watching time

### Scenario 6: Detailed Analysis

1. Download in "Best" or "1080p" for maximum clarity
2. Play at **0.5x** or **0.75x** normal speed
3. Take screenshots by pausing and using browser tools
4. Use frame-by-frame (**,** and **.** keys) to examine details
5. Use seeking to revisit specific moments
6. Pause frequently to analyze content

## Testing Checklist

### Before Full Testing

1. **Server is running:**
   ```bash
   curl http://localhost:9234/health
   # Should return: {"status": "ok"}
   ```

2. **Extension is loaded in Chrome**
   - Check `chrome://extensions/`
   - Ensure EZC extension is enabled

### End-to-End Test with Real YouTube Video

**Test Case: Download and Play a YouTube Video**

1. **Visit a YouTube Video**
   - Open Chrome
   - Go to: https://www.youtube.com/watch?v=dQw4w9WgXcQ (or any YouTube video)
   
2. **Click Extension Icon**
   - Click the EZC icon in the toolbar
   - Verify the popup shows the YouTube URL
   - Verify quality dropdown has options: Best, 1080p, 720p, 480p, 360p

3. **Download with Quality Selection**
   - Select "720p" quality
   - Click "Download"
   - A progress window should open
   - Progress bar should start moving
   - Status should change from "Connecting..." to downloading

4. **Verify Download Progress**
   - Progress percentage should increase monotonically (never decrease)
   - Progress messages should update
   - Should reach 100% completion
   - Auto-open player when complete

5. **Verify Video Playback**
   - Player opens automatically
   - Video title displays
   - Video streams and plays
   - No errors in console
   - Audio works
   - Video is ad-free

6. **Test Player Controls**
   - Play/Pause works
   - Volume slider works
   - Speed adjustment works (try 0.5x, 1x, 2x)
   - Seek bar works
   - Fullscreen works
   - Menu opens/closes

### Quality Tests

**Test Different Qualities:**

1. Try downloading same video in multiple qualities:
   - Best (should be highest available)
   - 1080p (should be 1080p or best below)
   - 720p (should be 720p or best below)
   - 480p
   - 360p

2. Verify downloaded file size matches quality:
   - Best quality → largest file
   - Lower quality → smaller file

3. Check the actual video quality in player:
   - Best/1080p should look crisp
   - 360p should be noticeably lower quality

### Progress Tracking Tests

1. **Monotonic Progress:**
   - Progress percentage should never go backward
   - Should smoothly increase to 100%
   - Even if jumps happen, should reach 100%

2. **Message Updates:**
   - Should show "Connecting to server..."
   - Should show download progress messages
   - Should show "Download complete!" when done

3. **Auto-Play:**
   - Player should open automatically after 100%
   - Progress window should close
   - Video should start playing

### Error Handling Tests

1. **Server Down:**
   - Kill the server: `lsof -i :9234 -t | xargs kill -9`
   - Try to download
   - Should show error: "Server not running on localhost:9234"

2. **Invalid URL:**
   - Click extension on non-YouTube page
   - Download button should be disabled
   - Should show "Not a YouTube video URL"

3. **Network Error:**
   - Try download with bad internet
   - Should show appropriate error message

## Frequently Asked Questions (FAQ)

### General Questions

**Q: Is it legal to download YouTube videos?**
A: That depends on the video and your local laws. Many videos are copyrighted and downloading them may violate terms of service or copyright laws. Always check the video's licensing before downloading. Use responsibly.

**Q: Why do I need a Python server running?**
A: The server handles the actual downloading using yt-dlp, which needs Python. Chrome extensions have security restrictions and cannot run Python directly, so the extension communicates with your local server to do the heavy lifting.

**Q: Will this work on other video sites?**
A: Currently, EZC only works on YouTube. yt-dlp supports hundreds of sites, but the extension is specifically coded for YouTube URL detection. You could modify the code to support other sites.

**Q: Do I need to keep the server running?**
A: Yes, the Python server must be running for any downloads to work. If you close the terminal or kill the process, downloads will fail. It's lightweight and uses minimal resources.

### Download Questions

**Q: How long does it take to download a video?**
A: Depends on:
- Video length (longer videos take proportionally longer)
- Quality selected (higher quality = longer download)
- Video's bitrate on YouTube
- Your internet speed
Typical: 5-15 minutes for a 1-hour 720p video on decent internet.

**Q: How much storage does each video take?**
A: Varies by length and quality:
- **360p, 1-hour video**: ~100-200 MB
- **720p, 1-hour video**: ~800 MB - 1.5 GB
- **1080p, 1-hour video**: ~2-3 GB
- **Best quality**: Often 3-4 GB per hour

Use lower qualities for limited storage. Older laptops often benefit from 480p or 720p.

**Q: What if the exact quality isn't available?**
A: yt-dlp automatically falls back to the best available option:
- Request 1080p → If unavailable, tries 720p → then 480p → etc.
- Request "Best" → Always gets highest available

This ensures downloads work for all videos, regardless of available qualities.

**Q: Can I download multiple videos at once?**
A: Not currently - the extension processes one download at a time. Downloads are queued, so you can start multiple downloads, but they'll happen sequentially.

**Q: Where are my downloaded videos stored?**
A: All videos go to: `/Users/tanny/EZC/downloads/`

View them:
```bash
ls -lah /Users/tanny/EZC/downloads/
```

**Q: Can I move downloaded videos?**
A: Yes! Once downloaded, they're regular MP4 files. You can:
- Move them to any folder
- Rename them
- Copy them to external drives
- Upload them to cloud storage
- They're no longer tied to the extension

### Playback and Player Questions

**Q: The player won't open. What's wrong?**
A: Try these steps:
1. Ensure the video finished downloading (100%)
2. Check the file exists: `ls -lah /Users/tanny/EZC/downloads/`
3. Verify file size > 0 MB (not empty)
4. Check browser console (F12) for error messages
5. Restart your browser

**Q: Can I adjust video quality after downloading?**
A: No, quality is set at download time. To get a different quality:
1. Delete the existing file from `downloads/` folder
2. Download again with a different quality selection

**Q: Does the player work offline?**
A: Yes! Once downloaded, you can:
- Disconnect from the internet
- Work offline indefinitely
- Play the video anytime without needing YouTube access
- No streaming needed

**Q: Can I use keyboard shortcuts in theater/fullscreen mode?**
A: Yes! All keyboard shortcuts work in any mode:
- Spacebar for play/pause
- F for fullscreen
- M for mute
- Arrow keys for seeking
- etc.

See the keyboard shortcuts table in the Video Player Controls section.

**Q: Why is audio and video downloaded separately?**
A: yt-dlp downloads the best audio and video streams separately, then merges them. This usually results in better quality than downloading them together, because:
- Video and audio bitrates can be optimized independently  
- Results in smaller file sizes for same quality
- More reliable for unusual video formats

You won't notice the difference - it just works!

### Server and Backend Questions

**Q: What is yt-dlp?**
A: It's a free, open-source tool that downloads videos from YouTube and hundreds of other sites. It extracts the actual video URLs that YouTube serves and downloads them directly. No fancy hacks required.

**Q: Can I use different video download tools?**
A: Possibly, but you'd need to modify `server.py` to use a different tool. yt-dlp is reliable and well-maintained, so we recommend it.

**Q: What if the server crashes?**
A: Simply restart it:
```bash
python3 server.py
```
Any in-progress downloads will fail and need to be restarted. Future downloads will work fine.

**Q: Is Python 2 supported?**
A: No, the server requires Python 3.6+. Check your version: `python3 --version`

**Q: Can I run the server on a different port?**
A: Yes, but you'd need to:
1. Edit `server.py` and change port 9234 to your desired port
2. Update all `localhost:9234` references in the JavaScript files
3. Restart the server

The default 9234 is recommended unless you have a port conflict.

### Troubleshooting Questions

**Q: I see "Server not running on localhost:9234" error.**
A: This means:
- The Python server isn't running, OR
- It crashed
- Wrong port number

Fix: Start the server with `python3 server.py` in a terminal.

**Q: Downloads keep failing for certain videos.**
A: YouTube sometimes uses special formats that yt-dlp doesn't support. Try:
1. Update yt-dlp: `pip install --upgrade yt-dlp`
2. Try a different video to see if it's video-specific
3. Check the server log at `/tmp/ezc_server.log`

**Q: Can I clear downloadhistory / clear the downloads folder?**
A: Yes, safely delete files from `/Users/tanny/EZC/downloads/`. The extension won't break:
```bash
rm -rf /Users/tanny/EZC/downloads/*
```

**Q: Why does the progress bar sometimes jump?**
A: The server sends progress updates periodically (not every single byte). Jumps are normal and expected. As long as it's moving forward toward 100%, the download is progressing fine.

## Troubleshooting

### Server Won't Start (Port 9234 In Use)

```bash
# Kill existing process on port 9234
lsof -i :9234 -t | xargs kill -9

# Then start server
python3 server.py
```

### Extension Not Loading

1. Go to `chrome://extensions/`
2. Check for errors next to EZC extension
3. Click "Errors" to see detailed error messages
4. Common issues:
   - `manifest.json` syntax error
   - Missing icon file
   - Permission issues

### Video Not Playing

1. Check if video file exists: `ls -la /Users/tanny/EZC/downloads/`
2. Check server logs for errors
3. Open browser console (F12) and check for errors
4. Verify video format is supported (MP4 is recommended)

### Progress Bar Stuck

1. Check server is running: `curl http://localhost:9234/health`
2. Check if download is actually happening: `ls -la /Users/tanny/EZC/downloads/`
3. Check server logs for yt-dlp errors
4. Some videos may take longer - wait 2-3 minutes

### Video Downloaded But Player Shows Error

1. Check file exists and is valid:
   ```bash
   ls -la /Users/tanny/EZC/downloads/
   file /Users/tanny/EZC/downloads/*.mp4
   ```

2. Check file size > 0 bytes

3. Try playing with VLC: `open -a VLC /Users/tanny/EZC/downloads/*.mp4`

## Advanced Usage Tips & Best Practices

### Optimizing for Your Internet

**Slow Internet?**
- Download lower qualities (360p-480p)
- Downloads complete faster
- Still watch-able, just lower resolution
- Takes 1/5th the data vs 1080p

**Fast Internet?**
- Download "Best" or "1080p" for maximum quality
- Takes 10-15 minutes for typical videos
- Future-proofs your video collection

**Mobile Hotspot?**
- Use 360p or 480p exclusively
- Very fast downloads (2-3 minutes for 1-hour video)
- Saves your data plan
- Still suitable for phones/tablets

### Storage Management

**Check Available Storage:**
```bash
df -h /Users/tanny/EZC/
```

**Estimate Before Downloading:**
- 360p: ~20 MB/min of video = ~1.2 GB/hour
- 480p: ~35 MB/min of video = ~2.1 GB/hour
- 720p: ~80 MB/min of video = ~4.8 GB/hour
- 1080p: ~150 MB/min of video = ~9 GB/hour

**Clean Up Old Videos:**
```bash
# See all downloads
ls -lh /Users/tanny/EZC/downloads/

# Delete specific video
rm /Users/tanny/EZC/downloads/filename.mp4

# Delete all downloads (careful!)
rm -rf /Users/tanny/EZC/downloads/*
```

### Batch Downloading

While the extension downloads one video at a time, you can:

1. Click EZC on multiple YouTube tabs
2. Start downloads on each tab
3. They'll queue and process sequentially
4. Each finishes automatically with the player

Useful for:
- Downloading a series of videos
- Collecting materials for offline learning
- Building a personal video library

### Player Customization Tips

**For Extended Watching:**
- Use **T** for theater mode (wider viewing area)
- Use **F** for fullscreen on second monitor
- Speed up long videos with **1.5x-2x** speed
- Mute **M** during non-essential parts
- Use **→** to skip ahead through slow sections

**For Detailed Study:**
- Download in "Best" quality
- Pause **Space** frequently to take notes
- Use **,** and **.** for frame-by-frame analysis
- Slow to **0.5x** or **0.75x** for complex material
- Use **←** to rewatch difficult parts

**For Music/Audio Focus:**
- Minimize the player window
- Continue with other work
- Audio continues playing
- Use keyboard **M** to mute video sounds
- Use **Volume** slider for audio level

### Quality Selection Strategy

**Quick Reference Guide:**

| Need | Quality | Time | Size |
|------|---------|------|------|
| Ultra fast download | 360p | 2-3 min | ~1GB/hr |
| Quick access | 480p | 3-5 min | ~2GB/hr |
| Balanced | 720p | 5-10 min | ~5GB/hr |
| Best quality | 1080p | 10-15 min | ~9GB/hr |
| Absolute best | Best | 10-20 min | 10GB+/hr |

**Recommendations by Use Case:**
- **Music/Entertainment**: 720p (good quality/size balance)
- **Tutorial/Learning**: 1080p (can see small details)
- **Casual Watching**: 480p (good enough, smaller files)
- **Mobile**: 360p or 480p (preserves battery, fast)
- **Archival**: Best (preserve quality for future)

### Keyboard Efficiency

Master these shortcuts for fast playback:

**Quick Navigation:**
- **Space**: Pause/Play
- **→/←**: Skip ±5s quickly
- **J/L**: Skip ±10s for faster scrubbing
- **,/.**: Frame-by-frame for screenshots

**Quick Controls:**
- **M**: Mute
- **F**: Fullscreen
- **T**: Theater mode
- **0-9**: Jump to 0%-90% of video

**Pro Tip:** Pause the video, use **,** and **.** to scan through, press **Space** to quick-check a moment, then continue searching.

### Performance Tips

**Memory Management:**
- The player uses minimal memory (under 200 MB typically)
- Safe to have other apps open
- Close other browser tabs if experiencing lag

**Disk Speed:**
- Use a fast disk/SSD for downloads (faster than USB drives)
- Network speed matters more than disk speed for downloads

**CPU Usage:**
- Video playback uses minimal CPU
- You can do other work while watching
- Affects battery life minimally

### Network Optimization

**Download Speed:**
```bash
# Check actual download speed while downloading
# In another terminal:
watch -n 1 ls -lh /Users/tanny/EZC/downloads/
```

**If Download Is Very Slow:**
1. Check internet connection: `ping 8.8.8.8`
2. Try smaller quality first to test server
3. Check server logs: `tail -f /tmp/ezc_server.log`
4. Restart server if needed

## Quality Implementation Details

The extension uses yt-dlp format strings to handle quality selection:

- **Best**: `bestvideo+bestaudio/best`
- **1080p**: `bestvideo[height<=1080]+bestaudio/best[height<=1080]/best`
- **720p**: `bestvideo[height<=720]+bestaudio/best[height<=720]/best`
- **480p**: `bestvideo[height<=480]+bestaudio/best[height<=480]/best`
- **360p**: `bestvideo[height<=360]+bestaudio/best[height<=360]/best`

yt-dlp will select the best combination matching the height constraint, falling back to lower quality if exact match not available.

## File Locations

- **Extension files**: `/Users/tanny/EZC/`
- **Downloaded videos**: `/Users/tanny/EZC/downloads/`
- **Server logs**: `/tmp/ezc_server.log`
- **Chrome extensions folder**: `~/.config/google-chrome/` (Linux) or `~/Library/Application Support/Google/Chrome/` (macOS)

## Key Features Implemented

✅ YouTube URL detection in popup
✅ Quality selector (Best, 1080p, 720p, 480p, 360p)
✅ Real-time progress tracking (0-100%)
✅ Monotonic progress (never goes backward)
✅ Automatic video player opening
✅ Full-featured video player with:
  - Play/Pause control
  - Volume slider
  - Speed adjustment (0.25x to 2x)
  - Progress seeking
  - Fullscreen support
  - Keyboard shortcuts
✅ Python backend with yt-dlp integration
✅ HTTP server with progress endpoint
✅ Video streaming support
✅ Error handling and status messages
✅ Ad-free playback (downloads, not streaming)
✅ YouTube red (#FF0000) color scheme

## Complete Workflow: From Setup to Watching

This section walks through the entire process from initial setup to watching your first video.

### The First-Time Setup (Do Once)

**Step 1: Install Dependencies (2 minutes)**
```bash
# Ensure Python 3 is installed
python3 --version  # Should be 3.6 or higher

# Install yt-dlp
brew install yt-dlp
# OR: pip install yt-dlp

# Verify installation
yt-dlp --version
```

**Step 2: Start the Server (1 minute)**
```bash
cd /Users/tanny/EZC
python3 server.py
```

You should see:
```
EZC Server running on http://localhost:9234
```

**Leave this terminal running in the background.** The server must stay active.

**Step 3: Load Extension in Chrome (2 minutes)**
1. Open Chrome
2. Type `chrome://extensions/` in address bar
3. Toggle "Developer mode" (top-right switch)
4. Click "Load unpacked"
5. Navigate to `/Users/tanny/EZC` folder
6. Select the folder and click "Open"
7. You'll see the EZC extension appears with a red icon

**Done!** Your setup is complete. You never need to repeat this unless something breaks.

### The Normal Download Workflow (Repeatable)

**Every Time You Want to Download:**

1. **Go to YouTube**
   - Open your browser
   - Navigate to any YouTube video URL
   - Watch it or just have the page open

2. **Click the EZC Icon**
   - Look in Chrome toolbar (top-right)
   - Click the red EZC icon
   - Popup appears showing the YouTube URL

3. **Choose Quality**
   - Click the dropdown menu
   - Pick your preferred quality:
     - "Best" for maximum quality
     - "1080p" / "720p" / "480p" / "360p" for specific quality
   - Or use defaults

4. **Click Download**
   - Click the blue "Download" button
   - A progress window opens in a new window
   - Downloads start immediately

5. **Wait for Completion**
   - Watch the progress bar move 0% → 100%
   - Status messages show what's happening
   - Don't close the progress window (it auto-closes)
   - Takes 5-20 minutes depending on video length and quality

6. **Watch in Player**
   - Player automatically opens at 100%
   - Video starts playing (may autoplay or wait for click)
   - Use keyboard shortcuts and controls to watch
   - Enjoy ad-free content!

7. **Video is Saved**
   - Once downloaded, your video is saved to `/Users/tanny/EZC/downloads/`
   - You can delete it anytime to free up space
   - You can move it anywhere (it's a regular MP4 file)
   - You can watch it anytime offline

### Multi-Video Workflow (Downloading Multiple Videos)

**Scenario: I want to download 3 videos for offline watching**

1. **Open Each Video in Separate Tabs**
   - Go to YouTube
   - Open first video → new tab
   - Open second video → another new tab
   - Open third video → another new tab

2. **Start Downloads Sequentially**
   - Click EZC on tab 1 → Select quality → Download
   - Click EZC on tab 2 → Select quality → Download
   - Click EZC on tab 3 → Select quality → Download

3. **They Queue Automatically**
   - Download windows appear (may show progress or processing)
   - They process one at a time in order
   - Don't worry about the waiting - it's normal

4. **Watch Completed Videos**
   - As each finishes, its player opens automatically
   - Watch that video
   - Close when done
   - Next video's player opens

5. **All Videos Saved**
   - Check folder: `ls /Users/tanny/EZC/downloads/`
   - All three videos are there
   - Can watch anytime, anytime

### Troubleshooting a Download

**If Something Goes Wrong:**

1. **Download Never Starts**
   - Is the server running? Check terminal where you ran `python3 server.py`
   - Is server still showing the message? If error shown, restart it
   - Click EZC again and retry download

2. **Progress Stuck at 0% for 2+ Minutes**
   - Give it 1-2 more minutes (slow internet is normal)
   - Check internet connection: open YouTube, load a video
   - If YouTube doesn't load, your internet is down
   - If YouTube works, try a different video (some may be problematic)

3. **Progress Reaches 100% But Player Doesn't Open**
   - Give it 30 seconds (player might be loading)
   - Close the progress window manually
   - Download folder should have the video: `ls /Users/tanny/EZC/downloads/`
   - Open player.html manually: `open /Users/tanny/EZC/player.html`
   - Browse to your downloaded video in the file picker

4. **Player Opens But Shows Black Screen**
   - Give it 10 seconds to load
   - Check browser console (F12 → Console tab)
   - Make sure the downloaded file isn't corrupted:
     ```bash
     file /Users/tanny/EZC/downloads/*.mp4
     ```
   - Should say "ISO Media" or "video"

5. **Extension Icon Doesn't Respond**
   - Check Chrome extensions page: `chrome://extensions/`
   - Is EZC shown as loaded and enabled?
   - If not, reload it: Go to extensions page, click "Reload" (↻ icon)
   - If still broken, remove and re-add the extension

### Performance Tips for Multiple Downloads

**If you're downloading many videos:**

1. **Stagger Downloads** - Don't start 10 at once
   - Start 2-3 downloads
   - Wait for first to complete
   - Start the next batch
   - This prevents overwhelming the server

2. **Close Old Players** - Clean up finished players
   - Close player window after watching
   - Frees up memory
   - Next download will use less resources

3. **Restart Server Periodically** - If running many hours
   - Every 10-20 downloads, restart the server
   - Prevents memory leaks
   - `Ctrl+C` in server terminal, then `python3 server.py`

## Getting the Most Out of EZC

### Using EZC for Different Purposes

**For Personal Entertainment Library**
- Download everything you enjoy in "Best" quality
- Organize in a separate folder: `mv /Users/tanny/EZC/downloads/* ~/MyVideos/`
- Watch anytime, anywhere without internet

**For Learning / Educational Content**
- Download in "1080p" for clarity
- Use keyboard shortcuts to pause and review
- Speed up with 1.5x-2x for efficiency
- Rewind frequently with **←** key

**For Travel and Commutes**
- Download in "480p" to save space
- Move to phone/tablet before traveling
- Watch on plane, train, bus without WiFi
- Pause/resume from any device

**For Content Analysis / Streaming**
- Download in "Best" quality
- Use fullscreen with external monitor
- Use 0.5x-0.75x speed for detailed review
- Take screenshots by pausing with **Space**

**For Archival / Collection**
- Download music videos in "Best" quality
- Preserve quality for future viewing
- Store in cloud backup
- Access indefinitely from any device

### Keyboard Power User Tips

**Get Faster at Playback:**
- Learn the shortcuts (see Keyboard Shortcuts section)
- Use keyboard for everything (not just mouse)
- Become muscle-memory proficient
- Much faster than clicking buttons

**Example Power Playback:**
```
Space     →  Play/Pause quickly
→ → →     →  Skip through intro credits (3 times = 15s forward)
M         →  Mute audio ads
← ←       →  Rewind to rewatch important parts (2 times = 10s back)
Space     →  Pause to process what you learned
F         →  Go fullscreen for immersive watching
```

### Organizing Your Video Library

**For One-Time Watching:**
- Play in EZC player
- Don't worry about organization
- Delete after watching

**For Keeping Videos:**
```bash
# Create organized folders
mkdir -p ~/Videos/YouTube/Music
mkdir -p ~/Videos/YouTube/Tutorials  
mkdir -p ~/Videos/YouTube/Documentaries

# Move and organize
mv /Users/tanny/EZC/downloads/*.mp4 ~/Videos/YouTube/Music/
```

**Backup Important Videos:**
```bash
# Copy to external drive before deleting locally
cp /Users/tanny/EZC/downloads/* /Volumes/ExternalDrive/

# Or upload to cloud storage
# (Use Finder to drag files to Google Drive, Dropbox, etc.)
```

## Next Steps (Optional Enhancements)

- Add playlist download support
- Add subtitle download option
- Add download history/management
- Add batch download queue
- Add custom output directory selection
- Add Chrome notification for completion
- Add undo/retry on download failure
