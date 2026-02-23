#!/usr/bin/env python3
"""
Kill server script for EZC YouTube Downloader
Safely terminates the running server process
"""

import subprocess
import sys
import os
import signal
import time

def kill_server():
    """Kill the EZC server process"""
    try:
        # Try to find and kill python processes running server.py
        script_dir = os.path.dirname(os.path.abspath(__file__))
        server_script = os.path.join(script_dir, 'server.py')
        
        # Use lsof to find processes listening on port 9234
        try:
            result = subprocess.run(
                ['lsof', '-ti:9234'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.stdout.strip():
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    if pid:
                        try:
                            os.kill(int(pid), signal.SIGTERM)
                            print(f"Killed process {pid}")
                            time.sleep(0.5)
                            # If still running, force kill
                            try:
                                os.kill(int(pid), signal.SIGKILL)
                                print(f"Force killed process {pid}")
                            except ProcessLookupError:
                                pass
                        except Exception as e:
                            print(f"Error killing process {pid}: {e}")
                return True
        except subprocess.TimeoutExpired:
            print("Timeout while checking processes")
        except FileNotFoundError:
            # lsof not available, fall back to pkill
            print("lsof not available, using pkill")
            subprocess.run(['pkill', '-f', 'python3.*server.py'], timeout=5)
            return True
        
        return False
    
    except Exception as e:
        print(f"Error killing server: {e}")
        return False

if __name__ == '__main__':
    success = kill_server()
    sys.exit(0 if success else 1)
