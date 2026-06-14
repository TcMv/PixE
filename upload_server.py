#!/usr/bin/env python3
"""Simple upload server for Pix.E — drag, drop, done."""
import http.server
import os
import shutil
import json
import cgi
import urllib.parse

UPLOAD_DIR = "/Users/tarancroxton/pixe-studio/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

PORT = 8765

class UploadHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/upload':
            self.path = '/upload.html'
        return super().do_GET()

    def do_POST(self):
        if self.path == '/upload':
            ctype, pdict = cgi.parse_header(self.headers.get('Content-Type', ''))
            if 'multipart/form-data' not in ctype:
                self.send_error(400, 'Expected multipart/form-data')
                return

            pdict['boundary'] = bytes(pdict['boundary'], 'utf-8')
            pdict['CONTENT-LENGTH'] = int(self.headers.get('Content-Length', 0))
            form = cgi.FieldStorage(fp=self.rfile, headers=self.headers,
                                    environ={'REQUEST_METHOD': 'POST'})

            file_item = form['file']
            if file_item.filename:
                filename = os.path.basename(file_item.filename)
                dest = os.path.join(UPLOAD_DIR, filename)
                with open(dest, 'wb') as f:
                    shutil.copyfileobj(file_item.file, f)
                size = os.path.getsize(dest)
                print(f"\n📥 RECEIVED: {filename} ({size / 1024 / 1024:.1f} MB) → {dest}")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'filename': filename,
                    'path': dest,
                    'size': size
                }).encode())
            else:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No file provided'}).encode())
        else:
            self.send_error(404)

    def log_message(self, format, *args):
        if '/upload' in str(args):
            print(f"[UPLOAD] {args}", flush=True)
        else:
            print(f"[REQUEST] {args}", flush=True)

if __name__ == '__main__':
    os.chdir("/Users/tarancroxton/pixe-studio/website")
    server = http.server.HTTPServer(('0.0.0.0', PORT), UploadHandler)
    print(f"\n  ✦ Pix.E Upload Server ✦")
    print(f"  ─────────────────────────")
    print(f"  Local:   http://localhost:{PORT}")
    print(f"  Network: http://192.168.0.128:{PORT}")
    print(f"  Save to: {UPLOAD_DIR}")
    print(f"  ─────────────────────────")
    print(f"  Drop your audio files and I'll grab them\n")
    server.serve_forever()
