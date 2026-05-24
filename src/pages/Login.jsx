import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../config/api';
import './Login.css';
import logoImg from '../assets/logo.png';

const REMEMBER_ID_STORAGE_KEY = 'hr_saved_employee_id';

const Login = ({ onLogin }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmployeeId, setForgotEmployeeId] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem(REMEMBER_ID_STORAGE_KEY);
    if (savedId) {
      setEmployeeId(savedId);
      setRememberMe(true);
    }
  }, []);

  const openForgotModal = () => {
    setShowForgotModal(true);
    setForgotEmployeeId(employeeId);
    setForgotEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setForgotMessage('');
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotError('');
    setForgotMessage('');
  };

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
      const response = await fetch(getApiBaseUrl() + '/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ID_STORAGE_KEY, employeeId.trim());
        } else {
          localStorage.removeItem(REMEMBER_ID_STORAGE_KEY);
        }
        onLogin({ rememberMe, user: data.user });
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error("Network Error:", err);
      setError('Unable to connect to server. Ensure Backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');

    if (!forgotEmployeeId.trim() || !forgotEmail.trim()) {
      setForgotError('Enter your Employee ID and registered email.');
      setForgotLoading(false);
      return;
    }

    try {
      const response = await fetch(getApiBaseUrl() + '/api/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: forgotEmployeeId, email: forgotEmail })
      });

      const data = await response.json();
      if (!response.ok) {
        setForgotError(data.error || 'Unable to send verification code.');
      } else {
        setForgotMessage(data.message || 'Verification code sent to your email.');
      }
    } catch (err) {
      console.error('Forgot password request failed:', err);
      setForgotError('Unable to connect to server.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotConfirm = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');

    if (!forgotEmployeeId.trim() || !verificationCode.trim() || !newPassword) {
      setForgotError('Fill in Employee ID/Username, code, and new password.');
      setForgotLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Password confirmation does not match.');
      setForgotLoading(false);
      return;
    }

    try {
      const response = await fetch(getApiBaseUrl() + '/api/forgot-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: forgotEmployeeId, code: verificationCode, newPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        setForgotError(data.error || 'Unable to reset password.');
      } else {
        setForgotMessage(data.message || 'Password updated successfully.');
        setPassword('');
      }
    } catch (err) {
      console.error('Forgot password confirmation failed:', err);
      setForgotError('Unable to connect to server.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="logo-card">
          <img src={logoImg} alt="6R Diamond Logo" className="login-logo" />
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
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember Me</span>
          </label>
          <button type="button" className="forgot-link" onClick={openForgotModal}>Forgot Password?</button>
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

      {showForgotModal && (
        <div className="forgot-overlay" onClick={closeForgotModal}>
          <div className="forgot-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forgot-header">
              <h3>Reset Password</h3>
              <button type="button" className="forgot-close" onClick={closeForgotModal} aria-label="Close">x</button>
            </div>

            <form onSubmit={handleForgotRequest} className="forgot-form">
              <label>Employee ID</label>
              <input
                type="text"
                value={forgotEmployeeId}
                onChange={(e) => setForgotEmployeeId(e.target.value)}
                placeholder="Enter Employee ID"
              />

              <label>Registered Email</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your registered email"
              />

              <button type="submit" className="forgot-btn" disabled={forgotLoading}>
                {forgotLoading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>

            <form onSubmit={handleForgotConfirm} className="forgot-form forgot-confirm">
              <label>Verification Code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
              />

              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />

              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />

              <button type="submit" className="forgot-btn" disabled={forgotLoading}>
                {forgotLoading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>

            {forgotError && <p className="forgot-error">{forgotError}</p>}
            {forgotMessage && <p className="forgot-success">{forgotMessage}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
