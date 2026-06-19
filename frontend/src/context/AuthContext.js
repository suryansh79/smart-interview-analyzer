import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = 'http://localhost:8080';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!token;

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    if (username) {
      localStorage.setItem('username', username);
    } else {
      localStorage.removeItem('username');
    }
  }, [username]);

  const login = async (usernameInput, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        username: usernameInput,
        password,
      });
      setToken(res.data.token);
      setUsername(res.data.username);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (usernameInput, email, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, {
        username: usernameInput,
        email,
        password,
      });
      setToken(res.data.token);
      setUsername(res.data.username);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
  };

  const authFetch = axios.create({
    baseURL: API_BASE,
  });

  authFetch.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  authFetch.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );

  return (
    <AuthContext.Provider value={{
      token, username, isAuthenticated, loading,
      login, register, logout, authFetch
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
