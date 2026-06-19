import os
import re
import whisper
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load Whisper model on startup
print("Loading Whisper model...")
model = whisper.load_model("base")
print("Whisper model loaded successfully.")

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".flac", ".webm", ".mp4"}
FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "literally", "right", "so"]


def get_file_extension(filename):
    return os.path.splitext(filename)[1].lower() if filename else ""


def count_filler_words(text):
    """Count individual filler word occurrences and return details."""
    text_lower = text.lower()
    filler_details = []
    total_count = 0

    for word in FILLER_WORDS:
        # Use word boundary matching for single words, substring for phrases
        if " " in word:
            count = text_lower.count(word)
        else:
            # Match whole words only
            pattern = r'\b' + re.escape(word) + r'\b'
            count = len(re.findall(pattern, text_lower))
        if count > 0:
            filler_details.append({"word": word, "count": count})
            total_count += count

    return total_count, filler_details


def analyze_pauses(segments):
    """Detect pauses between segments (gaps > 0.5s)."""
    pauses = []
    for i in range(1, len(segments)):
        gap = segments[i]["start"] - segments[i - 1]["end"]
        if gap > 0.5:
            pauses.append(gap)

    if not pauses:
        return 0, 0.0

    return len(pauses), sum(pauses) / len(pauses)


def calculate_confidence_score(filler_rate, pause_penalty):
    """Calculate confidence score: 100 - (fillerRate * 2) - (pausePenalty * 1.5), clamped 0-100."""
    score = 100 - (filler_rate * 2) - (pause_penalty * 1.5)
    return round(max(0, min(100, score)), 2)


@app.route("/")
def home():
    return "AI Service Running"


@app.route("/transcribe", methods=["POST"])
def transcribe_audio():
    # Validate file presence
    if "file" not in request.files:
        return jsonify({
            "error": "No file uploaded",
            "code": "NO_FILE"
        }), 400

    file = request.files["file"]

    if not file.filename:
        return jsonify({
            "error": "Empty filename",
            "code": "EMPTY_FILENAME"
        }), 400

    # Validate file extension
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({
            "error": f"Unsupported audio format: {ext}. Supported: {', '.join(ALLOWED_EXTENSIONS)}",
            "code": "UNSUPPORTED_FORMAT"
        }), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        # Transcribe with Whisper
        result = model.transcribe(file_path, verbose=False)

        text = result.get("text", "").strip()
        segments = result.get("segments", [])

        # Handle empty transcription
        if not text:
            return jsonify({
                "error": "No speech detected in audio file",
                "code": "EMPTY_AUDIO"
            }), 400

        # Calculate audio duration from segments
        if segments:
            audio_duration = segments[-1]["end"]
        else:
            audio_duration = 0

        duration_minutes = audio_duration / 60.0 if audio_duration > 0 else 1

        # Word count and speech pace
        words = text.split()
        word_count = len(words)
        speech_pace_wpm = round(word_count / duration_minutes, 2) if duration_minutes > 0 else 0

        # Filler word analysis
        filler_count, filler_details = count_filler_words(text)
        filler_rate = filler_count / duration_minutes if duration_minutes > 0 else 0

        # Pause analysis
        pause_count, avg_pause_duration = analyze_pauses(segments)
        pause_penalty = (avg_pause_duration * pause_count) / duration_minutes if duration_minutes > 0 else 0

        # Confidence score
        confidence_score = calculate_confidence_score(filler_rate, pause_penalty)

        # Communication rating
        if confidence_score >= 90:
            communication = "Excellent"
        elif confidence_score >= 70:
            communication = "Good"
        elif confidence_score >= 50:
            communication = "Average"
        else:
            communication = "Needs Improvement"

        # Build response
        response = {
            "transcript": text,
            "filler_word_count": filler_count,
            "filler_words": filler_details,
            "confidence_score": confidence_score,
            "speech_pace_wpm": speech_pace_wpm,
            "audio_duration_seconds": round(audio_duration, 2),
            "word_count": word_count,
            "pause_count": pause_count,
            "avg_pause_duration": round(avg_pause_duration, 2),
            "filler_rate_per_min": round(filler_rate, 2),
            "communication": communication
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({
            "error": f"Transcription failed: {str(e)}",
            "code": "TRANSCRIPTION_ERROR"
        }), 500

    finally:
        # Clean up uploaded file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)