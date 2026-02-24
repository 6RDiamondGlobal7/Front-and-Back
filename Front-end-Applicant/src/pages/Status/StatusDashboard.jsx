import React from 'react';
import { useNavigate } from 'react-router-dom';
import './StatusDashboard.css';
import logoImage from '../../assets/logo.png'; 

/* --- ICONS --- */
const IconHome = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> );

/* NEW: Green circle with a transparent outer glow ring */
const IconCheckGlow = () => (
  <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
    {/* Outer Glow Ring (Opacity 0.2) */}
    <circle cx="27" cy="27" r="27" fill="#22c55e" fillOpacity="0.2"/>
    {/* Inner Solid Circle */}
    <circle cx="27" cy="27" r="21" fill="#22c55e"/>
    {/* White Checkmark */}
    <path d="M19 27L24.5 32.5L35 22" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Solid Check Circle for the Timeline Icons
const IconCheckCircleFilled = () => ( <svg width="48" height="48" viewBox="0 0 24 24" fill="#00C853" stroke="none"><circle cx="12" cy="12" r="10" /><path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg> );
const IconCheckSmall = () => ( <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> );
const IconCalendar = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> );
const IconMapPin = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> );
const IconUser = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> );

const StatusDashboard = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/apply');
  };

  return (
    <div className="sd-page-container">
      
      {/* --- BACK BUTTON --- */}
      <button className="sd-back-btn" onClick={handleBack}>
        <IconHome /> Back to Home
      </button>

      {/* --- HEADER CARD --- */}
      <div className="sd-header-card">
        <div className="sd-header-logo-section">
          <img src={logoImage} alt="6R Diamond" className="sd-logo" />
        </div>
        <div className="sd-header-content-section">
          <h1 className="sd-title">Application Status</h1>
          <p className="sd-subtitle">Track your recruitment progress</p>
          <div className="sd-details-grid">
            <div className="sd-detail-item">
              <span className="sd-label"><IconUser /> Applicant Number</span>
              <span className="sd-value">APP-2026-001234</span>
            </div>
            <div className="sd-detail-item">
              <span className="sd-label">Name</span>
              <span className="sd-value">Juan Dela Cruz</span>
            </div>
            <div className="sd-detail-item">
              <span className="sd-label">Role</span>
              <span className="sd-value-role">Corporate Secretary/Division Manager for Brokerage</span>
            </div>
            <div className="sd-detail-item">
              <span className="sd-label">Applied</span>
              <span className="sd-value">January 20, 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- RECRUITMENT PROGRESS SECTION --- */}
      <div className="sd-progress-card">
        <h2 className="sd-section-title">Recruitment Progress</h2>

        <div className="sd-timeline">
          {/* Continuous Line */}
          <div className="sd-timeline-line"></div>

          {/* STEP 1: Application Form */}
          <div className="sd-timeline-item">
            <div className="sd-timeline-icon"><IconCheckGlow /></div>
            <div className="sd-timeline-content">
              <div className="sd-step-info">
                <h3>Online Application Form</h3>
                <span className="sd-badge success"><IconCheckSmall /> Approved</span>
              </div>
              
              <div className="sd-content-box">
                <div className="sd-date-list">
                  <span> <b> Submitted:</b> January 20, 2026</span>
                  <span> <b>Reviewed:</b> January 22, 2026</span>
                </div>
                <div className="sd-nested-box">
                  <strong>Feedback:</strong>
                  <p>Your application has been reviewed and approved. You will be contacted for the next step.</p>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: Interview */}
          <div className="sd-timeline-item">
            <div className="sd-timeline-icon"><IconCheckGlow /></div>
            <div className="sd-timeline-content">
              <div className="sd-step-info">
                <h3>Interview</h3>
                <span className="sd-badge success"><IconCheckSmall /> Completed</span>
              </div>

              <div className="sd-content-box">
                <div className="sd-alert blue">
                  <IconCalendar /> Your interview has been scheduled by our HR team
                </div>
                
                <div className="sd-grid-row">
                  <div className="sd-grid-col">
                    <div className="sd-icon-label"><IconCalendar /> Date & Time</div>
                    <div className="sd-text-main">January 28, 2026</div>
                    <div className="sd-text-sub">10:00 AM - 11:00 AM</div>
                  </div>
                  <div className="sd-grid-col">
                    <div className="sd-icon-label"><IconMapPin /> Location</div>
                    <div className="sd-text-main">6R DIAMOND Office, Manila</div>
                  </div>
                </div>
                
                <div className="sd-grid-row">
                   <div className="sd-grid-col full">
                    <div className="sd-icon-label"><IconUser /> Interviewer</div>
                    <div className="sd-text-main">Ms. Maria Santos - HR Manager</div>
                  </div>
                </div>

                <div className="sd-nested-box">
                  <strong>Instructions:</strong>
                  <p>Please bring a valid ID and arrive 15 minutes early.</p>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: Status */}
          <div className="sd-timeline-item">
            <div className="sd-timeline-icon"><IconCheckGlow /></div>
            <div className="sd-timeline-content">
              <div className="sd-step-info">
                <h3>Status</h3>
                <span className="sd-badge success"><IconCheckSmall /> Hired</span>
              </div>

              <div className="sd-content-box">
                <div className="sd-alert green">
                  <IconCheckSmall /> Congratulations! You have been selected for the position.
                </div>

                <div className="sd-grid-row">
                  <div className="sd-grid-col">
                    <div className="sd-icon-label"><IconCalendar /> Decision Date</div>
                    <div className="sd-text-main">January 30, 2026</div>
                  </div>
                  <div className="sd-grid-col">
                    <div className="sd-icon-label"><IconCalendar /> Expected Start Date</div>
                    <div className="sd-text-main">February 10, 2026</div>
                  </div>
                </div>

                <div className="sd-nested-box">
                  <strong>Message:</strong>
                  <p>Congratulations! We are pleased to offer you the position. Our HR team will contact you within 3 business days with your employment contract and onboarding details.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- FOOTER CARD --- */}
      <div className="sd-footer">
        <h3>Need Assistance?</h3>
        <p>If you have any questions about your application status, feel free to contact us</p>
        
        <div className="sd-footer-contacts">
          <span><strong>Email:</strong> careers@6rdiamond.com</span>
          <span className="sd-footer-divider">|</span>
          <span><strong>Phone:</strong> +63 2 8123 4567</span>
        </div>
      </div>

    </div>
  );
};

export default StatusDashboard;