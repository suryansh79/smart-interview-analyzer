import React, { useState, useEffect, useCallback } from 'react';
import { FaCloudUploadAlt, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './UploadPage.css';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null); // PENDING, PROCESSING, DONE, FAILED
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const { authFetch } = useAuth();

  const pollStatus = useCallback(async (id) => {
    try {
      const res = await authFetch.get(`/api/status/${id}`);
      const data = res.data;
      setStatus(data.status);

      if (data.status === 'DONE') {
        setResult(data.result);
        setJobId(null);
      } else if (data.status === 'FAILED') {
        setError(data.errorMessage || 'Analysis failed');
        setJobId(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check status');
      setJobId(null);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!jobId) return;
    const interval = setInterval(() => pollStatus(jobId), 2000);
    return () => clearInterval(interval);
  }, [jobId, pollStatus]);

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an audio file');
      return;
    }

    setError('');
    setResult(null);
    setStatus(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await authFetch.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJobId(res.data.jobId);
      setStatus('PENDING');
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed. Please try again.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const isProcessing = status === 'PENDING' || status === 'PROCESSING';

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--accent-green)';
    if (score >= 70) return 'var(--accent-blue)';
    if (score >= 50) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  return (
    <div className="upload-container">
      <div className="upload-hero">
        <h1 className="upload-title">Analyze Your Interview</h1>
        <p className="upload-subtitle">
          Upload an audio recording and get AI-powered transcription,
          filler word detection, and confidence scoring
        </p>
      </div>

      <div className="upload-card">
        <div
          className={`drop-zone ${file ? 'has-file' : ''}`}
          id="drop-zone"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input
            type="file"
            id="file-input"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <FaCloudUploadAlt className="drop-icon" />
          {file ? (
            <div className="file-info">
              <p className="file-name">{file.name}</p>
              <p className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="drop-text">
              <p className="drop-main">Drop your audio file here</p>
              <p className="drop-sub">or click to browse • WAV, MP3, M4A, OGG, FLAC</p>
            </div>
          )}
        </div>

        <button
          onClick={handleUpload}
          className="upload-btn"
          id="upload-btn"
          disabled={uploading || isProcessing || !file}
        >
          {uploading ? (
            <><FaSpinner className="spin-icon" /> Uploading...</>
          ) : isProcessing ? (
            <><FaSpinner className="spin-icon" /> {status === 'PENDING' ? 'Queued...' : 'Analyzing...'}</>
          ) : (
            <><FaCloudUploadAlt /> Analyze Audio</>
          )}
        </button>

        {isProcessing && (
          <div className="progress-section">
            <div className="progress-bar">
              <div className={`progress-fill ${status === 'PROCESSING' ? 'processing' : 'pending'}`}></div>
            </div>
            <p className="progress-text">
              {status === 'PENDING' ? '⏳ Queued for processing...' : '🔬 AI is analyzing your interview...'}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="error-card" id="upload-error">
          <FaTimesCircle className="error-icon" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="results-section">
          <div className="result-header">
            <FaCheckCircle className="result-success-icon" />
            <h2>Analysis Complete</h2>
          </div>

          <div className="stats-grid">
            <div className="stat-card score-card">
              <div className="stat-value" style={{ color: getScoreColor(result.confidence_score) }}>
                {result.confidence_score}%
              </div>
              <div className="stat-label">Confidence Score</div>
              <div className="stat-badge" style={{ background: getScoreColor(result.confidence_score) }}>
                {result.communication}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{result.speech_pace_wpm || '—'}</div>
              <div className="stat-label">Words per Minute</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{result.filler_word_count}</div>
              <div className="stat-label">Filler Words</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{result.pause_count || 0}</div>
              <div className="stat-label">Long Pauses</div>
            </div>
          </div>

          {result.filler_words && result.filler_words.length > 0 && (
            <div className="detail-card">
              <h3>Filler Word Breakdown</h3>
              <div className="filler-tags">
                {result.filler_words.map((f, i) => (
                  <span key={i} className="filler-tag">
                    "{f.word}" <strong>×{f.count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="detail-card">
            <h3>Full Transcription</h3>
            <p className="transcript-text">{result.transcript}</p>
          </div>
        </div>
      )}
    </div>
  );
}
