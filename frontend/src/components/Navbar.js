import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaMicrophoneAlt, FaChartLine, FaCloudUploadAlt, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { username, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <FaMicrophoneAlt className="brand-icon" />
          <span className="brand-text">Interview Analyzer</span>
        </Link>

        <div className="navbar-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            id="nav-upload"
          >
            <FaCloudUploadAlt />
            <span>Upload</span>
          </Link>
          <Link
            to="/dashboard"
            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            id="nav-dashboard"
          >
            <FaChartLine />
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="navbar-user">
          <span className="user-greeting">Hi, <strong>{username}</strong></span>
          <button onClick={logout} className="logout-btn" id="logout-btn">
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
