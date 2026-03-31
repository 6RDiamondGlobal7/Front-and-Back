import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './StatusDashboard.css';
import logoImage from '../../assets/logo.png';
import { getApiBaseUrl } from '../../config/api';

const IconHome = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>);
const IconCheckSmall = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>);
const IconCalendar = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>);
const IconXSmall = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const IconMapPin = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>);
const IconUser = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
const IconClipboard = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1" /><path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" /></svg>);

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

const formatDateOnly = (value) => {
  if (!value) return 'To be announced';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'To be announced';
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

const formatTimeRange = (value) => {
  if (!value) return 'To be announced';
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return 'To be announced';
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
};

const hasScheduleDetails = (schedule) => Boolean(
  schedule?.date || schedule?.time || schedule?.room || schedule?.location || schedule?.reminders
);

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

const StageBubble = ({ className }) => {
  const tone = className || 'pending';
  const isApproved = tone === 'success';
  const isPending = tone === 'pending';
  const isRejected = tone === 'rejected';
  const innerColor = isApproved ? '#22c55e' : isPending ? '#f59e0b' : isRejected ? '#ef4444' : '#94a3b8';
  const outerColor = isApproved ? '#22c55e' : isPending ? '#f59e0b' : isRejected ? '#ef4444' : '#94a3b8';
  const outerOpacity = isApproved ? '0.2' : isPending ? '0.22' : isRejected ? '0.2' : '0.18';

  return (
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
      <circle cx="27" cy="27" r="27" fill={outerColor} fillOpacity={outerOpacity} />
      <circle cx="27" cy="27" r="21" fill={innerColor} />
      {isApproved && (
        <path d="M19 27L24.5 32.5L35 22" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {isPending && (
        <path d="M19 27H35" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {(isRejected || tone === 'cancelled') && (
        <>
          <path d="M20 20L34 34" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M34 20L20 34" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
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

  const schedule = applicant?.interviewSchedule || null;
  const hasInterviewDetails = hasScheduleDetails(schedule);
  const stageBadges = useMemo(() => {
    // Scenario mapping:
    // 1) Applied -> all Pending
    // 2) Interview -> Stage 1 Approved, Stage 2 Pending, Stage 3 Pending
    // 3) Hired -> all Approved
    // 4) Rejected before interview -> Stage 1 Rejected, others Cancelled
    // 5) Rejected after interview approval -> Stage 1 Approved, Stage 2 Rejected, Stage 3 Cancelled
    if (currentStatus === 'Hired') {
      return {
        application: { label: 'Approved', className: 'success' },
        interview: { label: 'Approved', className: 'success' },
        final: { label: 'Approved', className: 'success' }
      };
    }

    if (currentStatus === 'Interview') {
      return {
        application: { label: 'Approved', className: 'success' },
        interview: { label: 'Pending', className: 'pending' },
        final: { label: 'Pending', className: 'pending' }
      };
    }

    if (currentStatus === 'Rejected') {
      if (hasInterviewDetails) {
        return {
          application: { label: 'Approved', className: 'success' },
          interview: { label: 'Rejected', className: 'rejected' },
          final: { label: 'Cancelled', className: 'cancelled' }
        };
      }

      return {
        application: { label: 'Rejected', className: 'rejected' },
        interview: { label: 'Cancelled', className: 'cancelled' },
        final: { label: 'Cancelled', className: 'cancelled' }
      };
    }

    return {
      application: { label: 'Pending', className: 'pending' },
      interview: { label: 'Pending', className: 'pending' },
      final: { label: 'Pending', className: 'pending' }
    };
  }, [currentStatus, hasInterviewDetails]);

  const renderBadgeIcon = (badge) => {
    if (badge.className === 'success') return <IconCheckSmall />;
    if (badge.className === 'rejected' || badge.className === 'cancelled') return <IconXSmall />;
    return <IconCalendar />;
  };

  const interviewScheduled = hasInterviewDetails;
  const interviewDate = interviewScheduled ? formatDateOnly(schedule?.date) : 'To be announced';
  const interviewTime = interviewScheduled ? (schedule?.time || 'To be announced') : 'To be announced';
  const interviewLocation = interviewScheduled
    ? `${schedule?.location || `${applicant?.branch || 'Branch'} Office`}${schedule?.room ? ` - Room ${schedule.room}` : ''}`
    : 'Pending assignment';
  const interviewer = interviewScheduled ? 'Assigned HR Officer' : 'Pending assignment';
  const interviewInstruction = interviewScheduled
    ? (schedule?.reminders || 'Arrive 10 minutes early and bring one valid ID.')
    : 'Keep your line open. Our HR team will contact you once a schedule is available.';

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
                <div className="sd-timeline-icon"><StageBubble className={stageBadges.application.className} /></div>
                <div className="sd-timeline-content">
                  <div className="sd-step-info">
                    <h3>Online Application Form</h3>
                    <span className={`sd-badge ${stageBadges.application.className}`}>{renderBadgeIcon(stageBadges.application)} {stageBadges.application.label}</span>
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
                <div className="sd-timeline-icon"><StageBubble className={stageBadges.interview.className} /></div>
                <div className="sd-timeline-content">
                  <div className="sd-step-info">
                    <h3>Interview</h3>
                    <span className={`sd-badge ${stageBadges.interview.className}`}>
                      {renderBadgeIcon(stageBadges.interview)}
                      {stageBadges.interview.label}
                    </span>
                  </div>
                  <div className="sd-content-box">
                    <div className="sd-alert blue">
                      <IconCalendar /> {interviewScheduled
                        ? 'Your interview has been scheduled by HR.'
                        : 'Your application is still under review for interview scheduling.'}
                    </div>
                    <div className="sd-interview-panel">
                      <div className="sd-interview-banner">
                        <IconCalendar />
                        <span>{interviewScheduled ? 'Interview details are now available' : 'Interview schedule is being prepared'}</span>
                      </div>
                      <div className="sd-interview-grid">
                        <div className="sd-interview-item">
                          <div className="sd-icon-label"><IconCalendar /> Date</div>
                          <div className="sd-text-main">{interviewDate}</div>
                          <div className="sd-text-sub">{interviewTime}</div>
                        </div>
                        <div className="sd-interview-item">
                          <div className="sd-icon-label"><IconMapPin /> Location</div>
                          <div className="sd-text-main">{interviewLocation}</div>
                        </div>
                        <div className="sd-interview-item sd-interview-item-wide">
                          <div className="sd-icon-label"><IconUser /> Interviewer</div>
                          <div className="sd-text-main">{interviewer}</div>
                        </div>
                      </div>
                      <div className="sd-interview-note">
                        <strong><IconClipboard /> Instructions</strong>
                        <p>{interviewInstruction}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sd-timeline-item">
                <div className="sd-timeline-icon"><StageBubble className={stageBadges.final.className} /></div>
                <div className="sd-timeline-content">
                  <div className="sd-step-info">
                    <h3>Status</h3>
                    <span className={`sd-badge ${stageBadges.final.className}`}>
                      {renderBadgeIcon(stageBadges.final)}
                      {stageBadges.final.label}
                    </span>
                  </div>

                  <div className="sd-content-box">
                    <div className={`sd-alert ${currentStatus === 'Hired' ? 'green' : 'blue'}`}>
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
