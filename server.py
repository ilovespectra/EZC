#!/usr/bin/env python3
"""
EZC YouTube Downloader Backend Server
Downloads YouTube videos using yt-dlp and provides progress tracking
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import subprocess
import threading
import os
import sys
import time
import re
import signal
from pathlib import Path

# Configuration
SERVER_PORT = 9234
DOWNLOADS_DIR = Path(__file__).parent / 'downloads'

# Track download progress
download_state = {
    'status': 'idle',  # idle, downloading, complete, error
    'percent': 0,
    'message': '',
    'current_file': None,
    'total_size': 0,
    'downloaded_size': 0,
    'error': None
}
download_lock = threading.Lock()

# Server shutdown flag
server_shutdown = threading.Event()


class DownloadHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass
    
    def do_GET(self):
        """Handle GET requests"""
        try:
            path = self.path
            
            if path == '/health':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok'}).encode())
                return
            
            elif path == '/list':
                self.list_videos()
                return
            
            elif path == '/progress':
                with download_lock:
                    state = download_state.copy()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(state).encode())
                return
            
            elif path.startswith('/video'):
                # Stream the downloaded video file
                self.stream_video()
                return
            
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Not found'}).encode())
        except BrokenPipeError:
            print('[ERROR] Broken pipe error in GET handler', flush=True)
        except Exception as e:
            print(f'[ERROR] Unexpected error in GET handler: {e}', flush=True)
            try:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Internal server error'}).encode())
            except:
                pass

    def do_POST(self):
        """Handle POST requests"""
        try:
            if self.path == '/download':
                self.handle_download()
            elif self.path == '/delete':
                self.handle_delete()
            elif self.path == '/convert-audio':
                self.handle_convert_audio()
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Not found'}).encode())
        except BrokenPipeError:
            print('[ERROR] Broken pipe error in POST handler', flush=True)
        except Exception as e:
            print(f'[ERROR] Unexpected error in POST handler: {e}', flush=True)
            try:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Internal server error'}).encode())
            except:
                pass

    def handle_download(self):
        """Handle video download request"""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        try:
            data = json.loads(body.decode('utf-8'))
            url = data.get('url')
            quality = data.get('quality', 'best')
            audio_only = data.get('audioOnly', False)
            
            if not url:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Missing URL'}).encode())
                return
            
            # Start download in background thread
            thread = threading.Thread(
                target=download_video,
                args=(url, quality, audio_only)
            )
            thread.daemon = True
            thread.start()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': 'Download started',
                'id': 'default'
            }).encode())
            
        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Invalid JSON'}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def handle_delete(self):
        """Delete a downloaded video"""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        try:
            data = json.loads(body.decode('utf-8'))
            filename = data.get('filename')
            
            if not filename:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Missing filename'}).encode())
                return
            
            # Validate filename (prevent directory traversal)
            if '/' in filename or '\\' in filename or filename.startswith('.'):
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Invalid filename'}).encode())
                return
            
            file_path = DOWNLOADS_DIR / filename
            if file_path.exists() and file_path.parent == DOWNLOADS_DIR:
                os.remove(file_path)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode())
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'File not found'}).encode())
        
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def handle_convert_audio(self):
        """Convert video to audio (MP3)"""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        try:
            data = json.loads(body.decode('utf-8'))
            video_name = data.get('videoName')
            output_name = data.get('outputName')
            
            if not video_name or not output_name:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Missing videoName or outputName'}).encode())
                return
            
            # Validate filenames (prevent directory traversal)
            for filename in [video_name, output_name]:
                if '/' in filename or '\\' in filename or filename.startswith('.'):
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Invalid filename'}).encode())
                    return
            
            # Ensure output ends with .mp3
            if not output_name.endswith('.mp3'):
                output_name = output_name + '.mp3'
            
            # Check if input video file exists
            input_path = DOWNLOADS_DIR / video_name
            if not input_path.exists() or input_path.parent != DOWNLOADS_DIR:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Video file not found'}).encode())
                return
            
            # Set output path
            output_path = DOWNLOADS_DIR / output_name
            
            # Check if ffmpeg is available
            which_result = subprocess.run(
                ['which', 'ffmpeg'],
                capture_output=True,
                text=True
            )
            
            if which_result.returncode != 0:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'ffmpeg is not installed. Please install ffmpeg to convert audio.'}).encode())
                return
            
            # Convert video to audio using ffmpeg
            cmd = [
                'ffmpeg',
                '-i', str(input_path),
                '-q:a', '5',  # Quality (0-9, lower is better)
                '-y',  # Overwrite output file without asking
                str(output_path)
            ]
            
            print(f'[AUDIO] Converting {video_name} to {output_name}', flush=True)
            print(f'[AUDIO] Running: {" ".join(cmd)}', flush=True)
            
            # Run ffmpeg
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                print(f'[AUDIO] ffmpeg error: {result.stderr}', flush=True)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Audio conversion failed: ' + result.stderr[:200]}).encode())
                return
            
            print(f'[AUDIO] Conversion successful: {output_path}', flush=True)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': 'Audio converted successfully',
                'outputName': output_name
            }).encode())
        
        except Exception as e:
            print(f'[AUDIO] Exception: {e}', flush=True)
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def stream_video(self):
        """Stream the downloaded video file"""
        try:
            # Parse query string for video name
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            
            video_file = None
            
            # If specific video requested
            if 'name' in query_params:
                requested_name = query_params['name'][0]
                # Validate filename (prevent directory traversal)
                if '/' not in requested_name and '\\' not in requested_name and not requested_name.startswith('.'):
                    candidate = DOWNLOADS_DIR / requested_name
                    if candidate.exists() and candidate.parent == DOWNLOADS_DIR:
                        video_file = candidate
            
            # Otherwise find the most recent file
            if not video_file:
                video_files = list(DOWNLOADS_DIR.glob('*.mp4')) + list(DOWNLOADS_DIR.glob('*.mkv'))
                if video_files:
                    video_file = max(video_files, key=os.path.getctime)
            
            if not video_file:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No video file found'}).encode())
                return
            
            # Get file size
            file_size = os.path.getsize(video_file)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'video/mp4' if str(video_file).endswith('.mp4') else 'video/x-matroska')
            self.send_header('Content-Length', str(file_size))
            self.send_header('Content-Disposition', 'inline')
            self.send_header('Accept-Ranges', 'bytes')
            self.end_headers()
            
            # Stream the file in chunks
            with open(video_file, 'rb') as f:
                chunk_size = 8192
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
        
        except Exception as e:
            print(f'Error streaming video: {e}')
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def list_videos(self):
        """List all downloaded videos and audio files"""
        try:
            videos = []
            # Include both video and audio file extensions
            for ext in ['*.mp4', '*.mkv', '*.webm', '*.mp3', '*.m4a', '*.wav']:
                for video_path in DOWNLOADS_DIR.glob(ext):
                    videos.append({
                        'name': video_path.name,
                        'size': os.path.getsize(video_path),
                        'modified': os.path.getmtime(video_path)
                    })
            
            # Sort by modification time (newest first)
            videos.sort(key=lambda x: x['modified'], reverse=True)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'videos': videos}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def log_message(self, format, *args):
        """Suppress default HTTP logging"""
        return


def download_video(url, quality, audio_only=False):
    """Download video or audio using yt-dlp"""
    global download_state
    
    mode = 'audio' if audio_only else 'video'
    print(f'\n[DOWNLOAD] Starting {mode} download: url={url}, quality={quality}', flush=True)
    
    # Ensure downloads directory exists
    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    
    try:
        with download_lock:
            download_state['status'] = 'downloading'
            download_state['percent'] = 0
            download_state['message'] = f'Starting {mode} download...'
            download_state['error'] = None
        
        print(f'[DOWNLOAD] Downloads directory: {DOWNLOADS_DIR}', flush=True)
        
        if audio_only:
            # Audio-only format: best quality audio as MP3
            format_str = 'bestaudio'
            output_ext = '.mp3'
            output_template = str(DOWNLOADS_DIR / '%(title)s') + output_ext
        else:
            # Map quality to yt-dlp format string for video
            format_map = {
                'best': 'bestvideo+bestaudio/best',
                '1080': 'bestvideo[height<=1080]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best',
                '720': 'bestvideo[height<=720]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best[height<=720]/best',
                '480': 'bestvideo[height<=480]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio/best[height<=480]/best',
                '360': 'bestvideo[height<=360]+bestaudio[ext=m4a]/bestvideo[height<=360]+bestaudio/best[height<=360]/best',
            }
            
            format_str = format_map.get(quality, 'best')
            output_template = str(DOWNLOADS_DIR / '%(title)s.%(ext)s')
        
        print(f'[DOWNLOAD] Using format: {format_str}', flush=True)
        
        # yt-dlp command
        cmd = [
            'yt-dlp',
            '-f', format_str,
            '-o', output_template,
            '--progress',
            '--no-quiet',
        ]
        
        # Add format-specific options
        if audio_only:
            cmd.extend([
                '-x',  # Extract audio
                '--audio-format', 'mp3',  # Convert to MP3
                '--audio-quality', '192',  # 192 kbps quality
            ])
        else:
            cmd.extend([
                '--merge-output-format', 'mp4',
            ])
        
        cmd.append(url)
        print(f'[DOWNLOAD] Running command: {" ".join(cmd)}', flush=True)
        
        # Run yt-dlp
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        print(f'[DOWNLOAD] Process started with PID: {process.pid}', flush=True)
        
        # Track progress
        last_progress_update = 0
        while True:
            line = process.stdout.readline()
            if not line and process.poll() is not None:
                break
            
            if line:
                line = line.strip()
                print(f'[DOWNLOAD] yt-dlp: {line}', flush=True)
                
                # Update progress state
                current_time = time.time()
                if current_time - last_progress_update > 0.5:  # Update at most every 0.5 seconds
                    with download_lock:
                        # Always update message
                        download_state['message'] = line[:100]
                        
                        # Try to extract percentage from any line containing %
                        if '%' in line:
                            try:
                                match = re.search(r'(\d+(?:\.\d+)?)\%', line)
                                if match:
                                    percent = float(match.group(1))
                                    download_state['percent'] = min(int(percent), 99)
                                    print(f'[DOWNLOAD] Extracted percent: {percent}%', flush=True)
                            except Exception as e:
                                print(f'[DOWNLOAD] Regex parse error: {e}', flush=True)
                    last_progress_update = current_time
        
        # Check for errors
        returncode = process.poll()
        print(f'[DOWNLOAD] Process finished with return code: {returncode}', flush=True)
        
        if returncode != 0:
            stderr = process.stderr.read()
            error_msg = stderr if stderr else 'Unknown error'
            print(f'[DOWNLOAD] yt-dlp error: {error_msg}', flush=True)
            with download_lock:
                download_state['status'] = 'error'
                download_state['message'] = f'Download failed: {error_msg[:100]}'
                download_state['error'] = error_msg
                download_state['percent'] = 0
            return
        
        # Download completed
        with download_lock:
            download_state['status'] = 'complete'
            download_state['percent'] = 100
            download_state['message'] = 'Download complete! Opening player...'
            download_state['error'] = None
        
        print(f'[DOWNLOAD] Download completed successfully', flush=True)
    
    except Exception as e:
        print(f'[DOWNLOAD] Download exception: {e}', flush=True)
        import traceback
        traceback.print_exc()
        with download_lock:
            download_state['status'] = 'error'
            download_state['message'] = f'Error: {str(e)[:100]}'
            download_state['error'] = str(e)
            download_state['percent'] = 0


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    print('[INFO] Shutdown signal received', flush=True)
    server_shutdown.set()
    sys.exit(0)

def run_server():
    """Run the HTTP server"""
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    server_address = ('localhost', SERVER_PORT)
    httpd = HTTPServer(server_address, DownloadHandler)
    
    print(f'EZC Server running on http://localhost:{SERVER_PORT}', flush=True)
    print(f'Downloads directory: {DOWNLOADS_DIR}', flush=True)
    print('[INFO] Server started successfully', flush=True)
    
    try:
        httpd.serve_forever()
    except BrokenPipeError:
        print('[ERROR] Broken pipe error, attempting recovery', flush=True)
    except Exception as e:
        print(f'[ERROR] Server error: {e}', flush=True)
        import traceback
        traceback.print_exc()
    finally:
        try:
            httpd.server_close()
            print('[INFO] Server shut down cleanly', flush=True)
        except:
            pass
        sys.exit(0)


if __name__ == '__main__':
    # Ensure downloads directory exists
    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    
    run_server()
