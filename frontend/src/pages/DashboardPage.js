import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  FaMicrophoneAlt,
  FaCalendarAlt,
  FaVolumeUp,
  FaChartLine,
  FaBullhorn,
  FaChevronRight,
  FaArrowLeft,
  FaSpinner,
  FaClock
} from 'react-icons/fa';
import './DashboardPage.css';

export default function DashboardPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalInterviews = history.length;
  const avgConfidence = totalInterviews > 0
    ? Math.round(history.reduce((sum, item) => sum + item.confidenceScore, 0) / totalInterviews)
    : 0;
  const avgFillerWords = totalInterviews > 0
    ? Math.round(history.reduce((sum, item) => sum + item.fillerWordCount, 0) / totalInterviews)
    : 0;
  const avgWPM = totalInterviews > 0
    ? Math.round(history.reduce((sum, item) => sum + item.speechPaceWordsPerMin, 0) / totalInterviews)
    : 0;

  // Process data for charts
  const trendData = [...history]
    .reverse()
    .map((item, index) => ({
      name: `Int ${index + 1}`,
      confidence: Math.round(item.confidenceScore),
      wpm: Math.round(item.speechPaceWordsPerMin),
      fillers: item.fillerWordCount
    }));

  // Aggregate filler words distribution
  const fillerWordDistributionMap = {};
  history.forEach(item => {
    if (item.fillerWords) {
      item.fillerWords.forEach(wordObjStr => {
        try {
          const parsed = typeof wordObjStr === 'string' ? JSON.parse(wordObjStr) : wordObjStr;
          if (parsed && parsed.word) {
            const word = parsed.word.toLowerCase();
            fillerWordDistributionMap[word] = (fillerWordDistributionMap[word] || 0) + (parsed.count || 1);
          }
        } catch {
          const word = wordObjStr.toLowerCase();
          fillerWordDistributionMap[word] = (fillerWordDistributionMap[word] || 0) + 1;
        }
      });
    }
  });

  const fillerChartData = Object.keys(fillerWordDistributionMap).map(word => ({
    name: word,
    count: fillerWordDistributionMap[word]
  })).sort((a, b) => b.count - a.count).slice(0, 8);

  const getPaceRating = (wpm) => {
    if (wpm === 0) return 'N/A';
    if (wpm >= 110 && wpm <= 150) return 'Optimal (110-150 WPM)';
    if (wpm < 110) return 'Slow';
    return 'Fast';
  };

  const getConfidenceRating = (score) => {
    if (score >= 90) return { label: 'Excellent', class: 'rating-excellent' };
    if (score >= 70) return { label: 'Good', class: 'rating-good' };
    return { label: 'Needs Improvement', class: 'rating-needs-improvement' };
  };

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <FaSpinner className="dashboard-spinner" />
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  if (selectedResult) {
    const rating = getConfidenceRating(selectedResult.confidenceScore);
    return (
      <div className="detail-container">
        <button className="back-btn" onClick={() => setSelectedResult(null)}>
          <FaArrowLeft /> Back to Dashboard
        </button>

        <div className="detail-grid">
          <div className="detail-card main-stats-card">
            <div className="detail-card-header">
              <h2>Analysis Report</h2>
              <span className="file-tag" title={selectedResult.audioFileName}>
                {selectedResult.audioFileName}
              </span>
            </div>

            <div className="performance-score-ring">
              <div className="score-ring-inner">
                <div className="score-value">{Math.round(selectedResult.confidenceScore)}%</div>
                <div className="score-label">Confidence</div>
              </div>
            </div>

            <div className="quick-metrics">
              <div className="metric-item">
                <span className="metric-label">Filler Words</span>
                <span className="metric-val">{selectedResult.fillerWordCount}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Speech Pace</span>
                <span className="metric-val">{Math.round(selectedResult.speechPaceWordsPerMin)} WPM</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Assessment</span>
                <span className="metric-val">{getPaceRating(selectedResult.speechPaceWordsPerMin)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Overall Rating</span>
                <span className={`metric-val rating-badge ${rating.class}`}>{rating.label}</span>
              </div>
            </div>

            {selectedResult.fillerWords && selectedResult.fillerWords.length > 0 && (
              <div className="detail-fillers-section">
                <h3>Detected Filler Words</h3>
                <div className="filler-pills">
                  {selectedResult.fillerWords.map((wordObj, i) => {
                    let disp = '';
                    try {
                      const parsed = typeof wordObj === 'string' ? JSON.parse(wordObj) : wordObj;
                      disp = `${parsed.word} (×${parsed.count})`;
                    } catch {
                      disp = wordObj;
                    }
                    return <span key={i} className="filler-pill">{disp}</span>;
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="detail-card transcript-card">
            <h2>Transcription</h2>
            <div className="transcript-text">
              {selectedResult.transcription || "No transcription available."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Performance Dashboard</h1>
        <p>Track your communication progress over time</p>
      </header>

      {error && <div className="dashboard-error">{error}</div>}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue-glow">
          <div className="stat-icon-wrapper blue">
            <FaMicrophoneAlt />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Interviews</span>
            <span className="stat-val">{totalInterviews}</span>
          </div>
        </div>

        <div className="stat-card purple-glow">
          <div className="stat-icon-wrapper purple">
            <FaChartLine />
          </div>
          <div className="stat-info">
            <span className="stat-label">Avg. Confidence</span>
            <span className="stat-val">{avgConfidence}%</span>
          </div>
        </div>

        <div className="stat-card pink-glow">
          <div className="stat-icon-wrapper pink">
            <FaBullhorn />
          </div>
          <div className="stat-info">
            <span className="stat-label">Avg. Filler Words</span>
            <span className="stat-val">{avgFillerWords}</span>
          </div>
        </div>

        <div className="stat-card green-glow">
          <div className="stat-icon-wrapper green">
            <FaVolumeUp />
          </div>
          <div className="stat-info">
            <span className="stat-label">Avg. Speech Pace</span>
            <span className="stat-val">{avgWPM} WPM</span>
          </div>
        </div>
      </div>

      {totalInterviews === 0 ? (
        <div className="empty-dashboard">
          <div className="empty-icon-wrapper">
            <FaMicrophoneAlt />
          </div>
          <h3>No Interview Data Yet</h3>
          <p>Go to the Upload page to submit your first interview audio file.</p>
        </div>
      ) : (
        <>
          {/* Charts Section */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Confidence Score Trend</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis stroke="#94a3b8" dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f0e1c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#f1f5f9' }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Area type="monotone" dataKey="confidence" name="Confidence (%)" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorConfidence)" activeDot={{ r: 8 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h3>Top Filler Words Used</h3>
              <div className="chart-wrapper">
                {fillerChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={fillerChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis stroke="#94a3b8" dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#94a3b8" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f0e1c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#f1f5f9' }} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Bar dataKey="count" name="Count" fill="#a855f7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-chart">No filler word details available yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* History List */}
          <div className="history-section">
            <div className="history-header">
              <h2>Interview History</h2>
              <button className="refresh-btn" onClick={fetchHistory}>Refresh</button>
            </div>

            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Audio File</th>
                    <th>Date</th>
                    <th>Filler Words</th>
                    <th>Speech Pace</th>
                    <th>Confidence</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    const rating = getConfidenceRating(item.confidenceScore);
                    const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });

                    return (
                      <tr key={item.id} className="history-row" onClick={() => setSelectedResult(item)}>
                        <td className="audio-cell">
                          <FaVolumeUp className="audio-icon" />
                          <span className="audio-name" title={item.audioFileName}>
                            {item.audioFileName}
                          </span>
                        </td>
                        <td>
                          <div className="date-cell">
                            <FaCalendarAlt className="date-icon" />
                            {formattedDate}
                          </div>
                        </td>
                        <td>{item.fillerWordCount}</td>
                        <td>
                          <div className="pace-cell">
                            <FaClock className="pace-icon" style={{ marginRight: '4px', fontSize: '12px', color: '#94a3b8' }} />
                            {Math.round(item.speechPaceWordsPerMin)} WPM
                          </div>
                        </td>
                        <td>
                          <span className={`confidence-badge ${rating.class}`}>
                            {Math.round(item.confidenceScore)}%
                          </span>
                        </td>
                        <td>
                          <button className="view-details-btn" onClick={(e) => {
                            e.stopPropagation();
                            setSelectedResult(item);
                          }}>
                            Details <FaChevronRight />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
