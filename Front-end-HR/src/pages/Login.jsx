import React, { useState } from 'react';
import { getApiBaseUrl } from '../config/api'; // <-- IDAGDAG MO ITO
import './Login.css';

const Login = ({ onLogin }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic Validation
    if (employeeId.trim() === '' || password.trim() === '') {
      setError('Please enter both Employee ID and Password');
      setIsLoading(false);
      return;
    }

 try {
      // Call the Backend API
      const response = await fetch(getApiBaseUrl() + '/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success
        console.log("Login successful:", data.user);
        onLogin(); // Triggers the state change in App.jsx to show the dashboard
      } else {
        // Show error from backend (e.g., "Invalid Employee ID")
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error("Network Error:", err);
      setError('Unable to connect to server. Ensure Backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="logo-card">
          <img src="src/assets/logo.png" alt="6R Diamond Logo" className="login-logo" />
        </div>
        <div className="portal-label">HR Management Portal</div>
      </div>

      <form className="login-card" onSubmit={handleSubmit}>
        <h2>HR Portal Login</h2>
        
        <div className="input-group">
          <label>Employee ID</label>
          <div className="input-wrapper">
            <span className="icon-prefix">#</span>
            <input 
              type="text" 
              placeholder="Enter your Employee ID" 
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
          </div>
        </div>

        <div className="input-group">
          <label>Password</label>
          <div className="input-wrapper">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  /* Visible Eye Icon */
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  /* Hidden/Slashed Eye Icon */
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
          </div>
        </div>

        <div className="login-options">
          <label className="checkbox-container">
            <input type="checkbox" /> 
            <span>Remember Me</span>
          </label>
          <a href="#" className="forgot-link">Forgot Password?</a>
        </div>

        {error && (
          <div className="error-notif">
            <svg className="error-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="login-btn" disabled={isLoading}>
          {isLoading ? "Authenticating..." : "Login"}
        </button>

        <div className="auth-warning">
          <div className="warning-icon-wrapper">
             <div className="warning-circle">!</div>
          </div>
          <div className="warning-content">
            <strong>Authorized Personnel Only</strong>
            <p>This system is for HR personnel use only. Unauthorized access is prohibited and monitored.</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;
