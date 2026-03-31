import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './StatusDashboard.css';
import logoImage from '../../assets/logo.png';
import { getApiBaseUrl } from '../../config/api';

const IconHome = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>);
const IconCheckGlow = () => (
  <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
    <circle cx="27" cy="27" r="27" fill="#22c55e" fillOpacity="0.2" />
    <circle cx="27" cy="27" r="21" fill="#22c55e" />
    <path d="M19 27L24.5 32.5L35 22" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconCheckSmall = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>);
const IconCalendar = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>);
const IconMapPin = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>);
const IconUser = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);

const normalizeStatus = (value) => {
  const clean = String(value || '').trim().toLowerCase();
  if (clean === 'hired') return 'Hired';
  if (clean === 'rejected') return 'Rejected';
  if (clean === 'interview') return 'Interview';
  return 'Applied';
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const formatRole = (value) => {
  if (!value) return 'N/A';
  const roles = {
    'corp-sec': 'Corporate Secretary',
    'licensed-broker': 'Licensed Customs Broker',
    'office-manager': 'Office Manager',
    'messenger': 'Messenger / Logistics',
    'secretary': 'Secretary to the Office Manager',
    'brokerage-specialist': 'Brokerage Specialist',
    'import-export-head': 'Import and Export Head',
    'admin-staff': 'Administration Staff',
    'doc-head': 'Documentations Head'
  };
  return roles[value] || value;
};

const StatusDashboard = () => {
  const API_BASE_URL = getApiBaseUrl();
  const navigate = useNavigate();
  const location = useLocation();
  const [auth, setAuth] = useState(() => {
    const fromState = location.state;
    if (fromState?.applicantNo && fromState?.password) return fromState;
    try {
      const stored = sessionStorage.getItem('applicantStatusAuth');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applicant, setApplicant] = useState(null);

  const handleBack = () => {
    navigate('/apply');
  };

  const fetchStatus = useCallback(async () => {
    if (!auth?.applicantNo || !auth?.password) {
      setError('Please login first to view your status.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/applicant-status`, {
        applicantNo: auth.applicantNo,
        password: auth.password
      });
      setApplicant(response.data?.applicant || null);
      setError('');
    } catch (err) {
      const statusCode = err?.response?.status;
      const apiError = err?.response?.data?.error;
      let message = apiError || 'Unable to fetch status right now.';

      if (!err?.response) {
        message = `Cannot connect to server (${API_BASE_URL}).`;
      } else if (statusCode === 404) {
        message = 'Status API not found on server. Restart/update Back-end.';
      }

      setError(message);
      if (statusCode === 401) {
        sessionStorage.removeItem('applicantStatusAuth');
        setAuth(null);
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, auth]);

  useEffect(() => {
    if (!auth?.applicantNo || !auth?.password) {
      navigate('/apply');
      return;
    }

    setLoading(true);
    fetchStatus();
    const intervalId = setInterval(fetchStatus, 15000);
    return () => clearInterval(intervalId);
  }, [auth, fetchStatus, navigate]);

  const currentStatus = normalizeStatus(applicant?.status);

  const applicationBadge = useMemo(() => ({ label: 'Approved', className: 'success' }), []);
  const interviewBadge = useMemo(() => {
    if (currentStatus === 'Interview' || currentStatus === 'Hired' || currentStatus === 'Rejected') {
      return { label: 'Completed', className: 'success' };
    }
    return { label: 'Pending', className: 'pending' };
  }, [currentStatus]);
  const finalBadge = useMemo(() => {
    if (currentStatus === 'Hired') return { label: 'Hired', className: 'success' };
    if (currentStatus === 'Rejected') return { label: 'Rejected', className: 'rejected' };
    return { label: 'Pending', className: 'pending' };
  }, [currentStatus]);

  return (
    <div className="sd-page-container">
      <button className="sd-back-btn" onClick={handleBack}>
        <IconHome /> Back to Home
      </button>

      <div className="sd-header-card">
        <div className="sd-header-logo-section">
          <img src={logoImage} alt="6R Diamond" className="sd-logo" />
        </div>
        <div className="sd-header-content-section">
          <h1 className="sd-title">Application Status</h1>
          <p className="sd-subtitle">Track your recruitment progress (auto-refresh every 15 seconds)</p>

          {loading ? (
            <div className="sd-loading">Loading status...</div>
          ) : error ? (
            <div className="sd-error">{error}</div>
          ) : (
            <div className="sd-details-grid">
              <div className="sd-detail-item">
                <span className="sd-label"><IconUser /> Applicant Number</span>
                <span className="sd-value">{applicant?.id || 'N/A'}</span>
              </div>
              <div className="sd-detail-item">
                <span className="sd-label">Name</span>
                <span className="sd-value">{applicant?.name || 'N/A'}</span>
              </div>
              <div className="sd-detail-item">
                <span className="sd-label">Role</span>
                <span className="sd-value-role">{formatRole(applicant?.position)}</span>
              </div>
              <div className="sd-detail-item">
                <span className="sd-label">Applied</span>
                <span className="sd-value">{formatDateTime(applicant?.appliedAt)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!loading && !error && (
        <>
          <div className="sd-progress-card">
            <h2 className="sd-section-title">Recruitment Progress</h2>

            <div className="sd-timeline">
              <div className="sd-timeline-line"></div>

              <div className="sd-timeline-item">
                <div className="sd-timeline-icon"><IconCheckGlow /></div>
                <div className="sd-timeline-content">
                  <div className="sd-step-info">
                    <h3>Online Application Form</h3>
                    <span className={`sd-badge ${applicationBadge.className}`}><IconCheckSmall /> {applicationBadge.label}</span>
                  </div>
                  <div className="sd-content-box">
                    <div className="sd-date-list">
                      <span><b>Submitted:</b> {formatDateTime(applicant?.appliedAt)}</span>
                      <span><b>Last Checked:</b> {formatDateTime(applicant?.checkedAt)}</span>
                    </div>
                    <div className="sd-nested-box">
                      <strong>Feedback:</strong>
                      <p>Your application has been received successfully by HR.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sd-timeline-item">
                <div className="sd-timeline-icon"><IconCheckGlow /></div>
                <div className="sd-timeline-content">
                  <div className="sd-step-info">
                    <h3>Interview</h3>
                    <span className={`sd-badge ${interviewBadge.className}`}>
                      {interviewBadge.className === 'success' ? <IconCheckSmall /> : <IconCalendar />}
                      {interviewBadge.label}
                    </span>
                  </div>
                  <div className="sd-content-box">
                    <div className="sd-alert blue">
                      <IconCalendar /> {interviewBadge.className === 'success'
                        ? 'Your application reached interview stage.'
                        : 'Your application is still under review for interview scheduling.'}
                    </div>
                    <div className="sd-grid-row">
                      <div className="sd-grid-col">
                        <div className="sd-icon-label"><IconMapPin /> Branch</div>
                        <div className="sd-text-main">{applicant?.branch || 'N/A'}</div>
                      </div>
                      <div className="sd-grid-col">
                        <div className="sd-icon-label"><IconUser /> Current Status</div>
                        <div className="sd-text-main">{currentStatus}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sd-timeline-item">
                <div className="sd-timeline-icon"><IconCheckGlow /></div>
                <div className="sd-timeline-content">
                  <div className="sd-step-info">
                    <h3>Status</h3>
                    <span className={`sd-badge ${finalBadge.className}`}>
                      {finalBadge.className === 'success' ? <IconCheckSmall /> : <IconCalendar />}
                      {finalBadge.label}
                    </span>
                  </div>

                  <div className="sd-content-box">
                    <div className={`sd-alert ${finalBadge.className === 'success' ? 'green' : 'blue'}`}>
                      <IconCheckSmall /> {currentStatus === 'Hired'
                        ? 'Congratulations! You have been selected for the position.'
                        : currentStatus === 'Rejected'
                          ? 'Your application was not selected for this role.'
                          : 'Final decision is still pending from HR.'}
                    </div>

                    <div className="sd-grid-row">
                      <div className="sd-grid-col">
                        <div className="sd-icon-label"><IconCalendar /> Decision Date</div>
                        <div className="sd-text-main">{formatDateTime(applicant?.checkedAt)}</div>
                      </div>
                      <div className="sd-grid-col">
                        <div className="sd-icon-label"><IconUser /> Live Status</div>
                        <div className="sd-text-main">{currentStatus}</div>
                      </div>
                    </div>

                    <div className="sd-nested-box">
                      <strong>Message:</strong>
                      <p>{currentStatus === 'Hired'
                        ? 'Our HR team will contact you with onboarding details.'
                        : currentStatus === 'Rejected'
                          ? 'Thank you for your interest. We encourage you to apply again in the future.'
                          : 'Please keep checking this page for real-time updates from HR.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sd-footer">
            <h3>Need Assistance?</h3>
            <p>If you have any questions about your application status, feel free to contact us</p>
            <div className="sd-footer-contacts">
              <span><strong>Email:</strong> careers@6rdiamond.com</span>
              <span className="sd-footer-divider">|</span>
              <span><strong>Phone:</strong> +63 2 8123 4567</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatusDashboard;
