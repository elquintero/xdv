import os
import re
import tempfile
from pathlib import Path
from urllib.parse import urlparse

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
CORS(app, origins=os.getenv("ALLOWED_ORIGINS", "*").split(","))

MAX_FILE_MB = int(os.getenv("MAX_FILE_MB", "250"))
ALLOWED_HOSTS = {"x.com", "www.x.com", "twitter.com", "www.twitter.com"}

def validate_x_url(value):
    if not isinstance(value, str) or len(value) > 2048:
        return False
    try:
        parsed = urlparse(value)
        return (
            parsed.scheme == "https"
            and parsed.hostname in ALLOWED_HOSTS
            and re.match(r"^/[^/]+/status/\d+(?:/video/\d+)?/?$", parsed.path) is not None
        )
    except Exception:
        return False

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/download")
def download():
    data = request.get_json(silent=True) or {}
    url = data.get("url")
    if not validate_x_url(url):
        return jsonify(error="El enlace no es una publicación válida de X."), 400

    temp_dir = tempfile.mkdtemp(prefix="xvideo_")
    output_template = str(Path(temp_dir) / "video.%(ext)s")
    options = {
        "outtmpl": output_template,
        "format": "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best",
        "merge_output_format": "mp4",
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "max_filesize": MAX_FILE_MB * 1024 * 1024,
        "socket_timeout": 25,
    }

    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            ydl.download([url])

        candidates = [p for p in Path(temp_dir).glob("video.*") if p.is_file()]
        if not candidates:
            raise RuntimeError("No se encontró un archivo de vídeo descargado.")

        video_path = candidates[0]
        if video_path.stat().st_size > MAX_FILE_MB * 1024 * 1024:
            raise RuntimeError("El vídeo supera el límite permitido.")

        return send_file(
            video_path,
            mimetype="video/mp4",
            as_attachment=True,
            download_name="video-x.mp4",
            max_age=0,
        )
    except Exception as exc:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
        return jsonify(error=f"No se pudo procesar el vídeo: {str(exc)[:300]}"), 502

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")))
