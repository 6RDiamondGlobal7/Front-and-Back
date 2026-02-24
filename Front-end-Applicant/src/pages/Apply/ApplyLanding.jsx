import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ApplyLanding.css';
import logoImage from '../../assets/logo.png';

/* --- ICONS --- */
const IconArrowRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17 4 12" />
  </svg>
);

const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconDiamond = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 13L2 9Z" />
    <path d="M11 3 8 9l4 13 4-13-3-6" />
    <path d="M2 9h20" />
  </svg>
);

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const IconClose = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

/* --- Privacy Modal (UPDATED CONTENT) --- */
const PrivacyModal = ({ isOpen, onClose, onProceed }) => {
  const [isChecked, setIsChecked] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="al-modal-overlay">
      <div className="al-modal-content">
        <div className="al-modal-header">
          <h2>Data Privacy Notice</h2>
          <p>6R Diamond International Cargo Logistics Inc.</p>
        </div>

        <div className="al-modal-body">
          <p style={{ lineHeight: '1.6', color: '#475569', marginBottom: '24px', textAlign: 'justify' }}>
            We are committed to protecting your privacy and personal data. This notice explains how we 
            collect, use, and safeguard your information when you apply for positions at 6R Diamond
            International Cargo Logistics Inc.
          </p>

          <div className="al-modal-section" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '16px', color: '#1A242F' }}>Information We Collect:</h3>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6', color: '#475569' }}>
              <li>Personal identification (name, contact details, address)</li>
              <li>Professional information (resume, work history, references)</li>
              <li>Educational background and qualifications</li>
              <li>Other information relevant to your application</li>
            </ul>
          </div>

          <div className="al-modal-section" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '16px', color: '#1A242F' }}>How We Use Your Information:</h3>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6', color: '#475569' }}>
              <li>Process and evaluate your job application</li>
              <li>Communicate with you regarding recruitment</li>
              <li>Verify your credentials and conduct background checks</li>
              <li>Comply with legal and regulatory requirements</li>
            </ul>
          </div>

          <p style={{ marginTop: '24px', fontStyle: 'italic', fontSize: '15px', color: '#64748b', lineHeight: '1.5', textAlign: 'justify'}}>
            Your personal data will be stored securely and will only be accessed by authorized personnel. We will retain your information for the duration of the recruitment process and as required by law.
          </p>

          <div
            className={`al-checkbox-container ${isChecked ? 'checked' : ''}`}
            onClick={() => setIsChecked(!isChecked)}
            style={{ marginTop: '30px' }}
          >
            <div className="al-checkbox-box">
              {isChecked && <IconCheck />}
            </div>
            <label style={{ cursor: 'pointer', fontSize: '15px', lineHeight: '1.4', textAlign: 'justify' }}>
              I have read and understood the Data Privacy Notice and consent to the collection and processing of my personal information for recruitment purposes.
            </label>
          </div>
        </div>

        <div className="al-modal-footer">
          <button onClick={onClose} className="al-btn-cancel">Cancel</button>
          <button disabled={!isChecked} onClick={onProceed} className="al-btn-proceed">Proceed to Open Roles</button>
        </div>
      </div>
    </div>
  );
};

/* --- Status Modal (Keep as is...) --- */
const StatusModal = ({ isOpen, onClose }) => {
  const [appNumber, setAppNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};
    if (!appNumber.trim()) newErrors.appNumber = 'Please enter your Applicant Number';
    if (!password.trim()) newErrors.password = 'Please enter your Password';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    if (validateForm()) {
      if (appNumber.trim() && password.trim()) {
        onClose();
        navigate('/status/dashboard');
      }
    }
  };

  return (
    <div className="al-modal-overlay">
      <div className="al-modal-content al-status-modal">
        <button className="al-modal-close-btn" onClick={onClose}>
          <IconClose />
        </button>
        <div className="al-status-header">
          <h2>Check Application Status</h2>
          <p className="al-status-subtitle">Enter your applicant number and password to view your application status</p>
        </div>
        <div className="al-modal-body">
          <div className="al-input-group">
            <label className="al-input-label"><IconUser /> Applicant Number</label>
            <input
              type="text"
              value={appNumber}
              onChange={(e) => {
                setAppNumber(e.target.value);
                if (errors.appNumber) setErrors(prev => ({ ...prev, appNumber: '' }));
              }}
              placeholder="Enter your Applicant Number"
              className={`al-text-input ${errors.appNumber ? 'error' : ''}`}
            />
            {errors.appNumber && <div className="al-error-message"><IconAlert /> {errors.appNumber}</div>}
          </div>

          <div className="al-input-group">
            <label className="al-input-label"><IconLock /> Password</label>
            <div className="al-password-wrapper">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                placeholder="Enter your Password"
                className={`al-text-input ${errors.password ? 'error' : ''}`}
              />
              <button type="button" className="al-password-toggle" onClick={() => setShowPass(!showPass)}>
                {showPass ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
            {errors.password && <div className="al-error-message"><IconAlert /> {errors.password}</div>}
          </div>

          <div className="al-status-info-box">
            Your applicant number and password was sent to your email after submitting your application
          </div>

          <button disabled={!appNumber.trim() || !password.trim()} className="al-btn-login-gold" onClick={handleLogin}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

/* --- Main Application Component --- */
const ApplyLanding = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const navigate = useNavigate();

  const handleHome = () => {
    navigate('/');
  };

  const handleProceed = () => {
    setShowPrivacy(false);
    navigate('/apply/branch');
  };

  return (
    <div className="al-page-container">

      <button className="al-home-btn" onClick={handleHome}>
        <IconHome /> Home
      </button>

      <div className="al-grid-layout">

        {/* LEFT COLUMN: Main Card */}
        <div className="al-main-card">
          <h1 className="al-title">Apply Now</h1>
          <p className="al-subtitle">
            Join our team of professional logistics experts and make a difference in connecting the world through innovative supply chain solutions.
          </p>

          <div className="al-options-container">
            <div className="al-option-box gray">
              <h3 className="al-box-title">Ready to start your journey?</h3>
              <p className="al-box-desc">Fill up the application form to register and become part of our growing team.</p>
              <button className="al-btn-yellow" onClick={() => setShowPrivacy(true)}>
                <span style={{ marginRight: '20px' }}>Open Roles</span>
                <IconArrowRight />
              </button>
            </div>

            <div className="al-divider">
              <div className="al-line"></div>
              <span>OR</span>
              <div className="al-line"></div>
            </div>

            <div className="al-option-box blue">
              <h3 className="al-box-title">Already applied?</h3>
              <p className="al-box-desc">Track your application status and stay updated on your recruitment progress.</p>
              <button className="al-btn-blue" onClick={() => setShowStatus(true)}>
                <div className="al-circle-icon"><IconCheck /></div>
                <span>Check Status</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Branding with Image Logo */}
        <div className="al-branding-col">
          <div className="al-glass-logo">
            {/* THE ACTUAL LOGO IMAGE */}
            <img src={logoImage} alt="6R Diamond International Cargo Logistics, Inc." className="al-logo-image" />
          </div>
          <div className="al-branding-text">
            <h3>Build Your Career With Us</h3>
            <p>Join a dynamic team dedicated to excellence in international logistics and freight forwarding services.</p>
          </div>
        </div>
      </div>

      <PrivacyModal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        onProceed={handleProceed}
      />

      <StatusModal
        isOpen={showStatus}
        onClose={() => setShowStatus(false)}
      />
    </div>
  );
};

export default ApplyLanding;