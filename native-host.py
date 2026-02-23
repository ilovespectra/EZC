#!/usr/bin/env python3
"""
Native messaging host for EZC YouTube Extension
Allows the extension to start/stop the Python server
"""

import json
import sys
import os
import subprocess
import time
from pathlib import Path

def send_message(message):
    """Send message back to extension"""
    sys.stdout.buffer.write(json.dumps(message).encode('utf-8'))
    sys.stdout.buffer.flush()

def start_server():
    """Start the EZC server if not already running"""
    try:
        # Check if server is already running
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 9234))
        sock.close()
        
        if result == 0:
            # Server already running
            return {
                'status': 'success',
                'message': 'Server is already running',
                'already_running': True
            }
        
        # Start the server
        script_dir = Path(__file__).parent
        server_script = script_dir / 'server.py'
        
        if not server_script.exists():
            return {
                'status': 'error',
                'message': f'server.py not found at {server_script}'
            }
        
        # Start server in background
        process = subprocess.Popen(
            ['python3', str(server_script)],
            cwd=str(script_dir),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True  # Detach process on macOS/Linux
        )
        
        # Wait for server to start
        time.sleep(2)
        
        # Verify server is running
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 9234))
        sock.close()
        
        if result == 0:
            return {
                'status': 'success',
                'message': 'Server started successfully',
                'pid': process.pid,
                'already_running': False
            }
        else:
            return {
                'status': 'error',
                'message': 'Server failed to start'
            }
    
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Error starting server: {str(e)}'
        }

def kill_server():
    """Kill the EZC server process"""
    try:
        import socket
        
        # Check if server is running
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 9234))
        sock.close()
        
        if result != 0:
            # Server not running
            return {
                'status': 'success',
                'message': 'Server is not running',
                'killed': False
            }
        
        # Try to kill using subprocess
        script_dir = Path(__file__).parent
        kill_script = script_dir / 'kill-server.py'
        
        if kill_script.exists():
            try:
                subprocess.run(
                    ['python3', str(kill_script)],
                    timeout=5,
                    capture_output=True
                )
                time.sleep(1)  # Wait for process to fully terminate
                
                # Verify server is dead
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                result = sock.connect_ex(('localhost', 9234))
                sock.close()
                
                if result != 0:
                    return {
                        'status': 'success',
                        'message': 'Server killed successfully',
                        'killed': True
                    }
                else:
                    return {
                        'status': 'error',
                        'message': 'Server still running after kill attempt',
                        'killed': False
                    }
            except subprocess.TimeoutExpired:
                return {
                    'status': 'error',
                    'message': 'Kill script timeout',
                    'killed': False
                }
        else:
            return {
                'status': 'error',
                'message': 'kill-server.py not found',
                'killed': False
            }
    
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Error killing server: {str(e)}',
            'killed': False
        }

def main():
    """Main message loop"""
    while True:
        try:
            # Read message from extension
            message_length = sys.stdin.buffer.read(4)
            if len(message_length) == 0:
                break
            
            length = int.from_bytes(message_length, 'little')
            message = sys.stdin.buffer.read(length).decode('utf-8')
            request = json.loads(message)
            
            # Handle different actions
            if request.get('action') == 'startServer':
                response = start_server()
                send_message(response)
            elif request.get('action') == 'killServer':
                response = kill_server()
                send_message(response)
            elif request.get('action') == 'checkServer':
                import socket
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                result = sock.connect_ex(('localhost', 9234))
                sock.close()
                send_message({
                    'status': 'success',
                    'running': result == 0
                })
            else:
                send_message({
                    'status': 'error',
                    'message': 'Unknown action'
                })
        
        except Exception as e:
            send_message({
                'status': 'error',
                'message': f'Error: {str(e)}'
            })

if __name__ == '__main__':
    main()
