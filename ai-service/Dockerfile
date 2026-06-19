FROM python:3.11-slim

# Install system dependencies (ffmpeg is required by Whisper)
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir "setuptools<70" wheel
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir --no-build-isolation -r requirements.txt

# Pre-download Whisper base model during build
RUN python -c "import whisper; whisper.load_model('base')"

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]