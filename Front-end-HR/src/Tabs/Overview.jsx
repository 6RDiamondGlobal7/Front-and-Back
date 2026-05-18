import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Hourglass,
  LayoutDashboard,
  UserRoundCheck,
  Users
} from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import './Overview.css';

const Overview = () => {
  const [applicants, setApplicants] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState({ totalScheduled: 0, schedule: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSegmentKey, setActiveSegmentKey] = useState(null);
  const [chartPage, setChartPage] = useState(0);
  const API_BASE_URL = getApiBaseUrl();

  useEffect(() => {
    const fetchApplicants = async () => {
      setLoading(true);
      setError('');

      try {
        const [applicantsResponse, interviewsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/applicants`),
          axios.get(`${API_BASE_URL}/api/interviews/upcoming`)
        ]);
        setApplicants(Array.isArray(applicantsResponse.data) ? applicantsResponse.data : []);
        const schedulePayload = interviewsResponse.data || { totalScheduled: 0, schedule: [] };
        setUpcomingInterviews({
          totalScheduled: Number(schedulePayload.totalScheduled || 0),
          schedule: Array.isArray(schedulePayload.schedule) ? schedulePayload.schedule : []
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Unable to load dashboard data.');
        setApplicants([]);
        setUpcomingInterviews({ totalScheduled: 0, schedule: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [API_BASE_URL]);

  const getStatusKey = (status) => {
    const clean = String(status || '').trim().toLowerCase();
    if (clean === 'applied' || clean === 'pending' || clean === 'in process') return 'applied';
    if (clean === 'interview') return 'interview';
    if (clean === 'hired') return 'hired';
    if (clean === 'rejected') return 'rejected';
    return 'applied';
  };

  const stats = useMemo(() => {
    const statusCounts = applicants.reduce((acc, applicant) => {
      const key = getStatusKey(applicant.status);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, { applied: 0, interview: 0, hired: 0, rejected: 0 });

    return {
      total: applicants.length,
      applied: statusCounts.applied,
      interview: statusCounts.interview,
      hired: statusCounts.hired,
      rejected: statusCounts.rejected
    };
  }, [applicants]);

  const todayApplications = useMemo(() => {
    const now = new Date();

    const isToday = (value) => {
      if (!value) return false;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      );
    };

    return applicants.filter((applicant) => (
      isToday(applicant.appliedAt) ||
      isToday(applicant.application_date) ||
      isToday(applicant.created_at) ||
      isToday(applicant.createdAt)
    ));
  }, [applicants]);

  const recentApplications = useMemo(() => {
    return [...todayApplications]
      .sort((a, b) => {
        const aTime = new Date(a.appliedAt || a.application_date || a.created_at || a.createdAt || 0).getTime();
        const bTime = new Date(b.appliedAt || b.application_date || b.created_at || b.createdAt || 0).getTime();
        if (aTime !== bTime) return bTime - aTime;

        const aNum = Number(String(a.id || '').replace(/\D/g, '')) || 0;
        const bNum = Number(String(b.id || '').replace(/\D/g, '')) || 0;
        return bNum - aNum;
      })
      .slice(0, 3);
  }, [todayApplications]);

  const branchDistribution = useMemo(() => {
    const normalizeBranch = (value) => {
      const cleaned = String(value || '').trim().toLowerCase();
      if (cleaned === 'manila') return 'Manila';
      if (cleaned === 'cebu') return 'Cebu';
      if (cleaned === 'davao') return 'Davao';
      return '';
    };

    const counts = { Manila: 0, Cebu: 0, Davao: 0 };
    applicants.forEach((applicant) => {
      const branch = normalizeBranch(applicant.branch);
      if (branch && counts[branch] !== undefined) {
        counts[branch] += 1;
      }
    });

    const total = counts.Manila + counts.Cebu + counts.Davao;
    const percentage = (value) => (total > 0 ? ((value / total) * 100).toFixed(1) : '0.0');

    return [
      { key: 'manila', label: 'Manila', value: counts.Manila, pct: percentage(counts.Manila), className: 'blue' },
      { key: 'cebu', label: 'Cebu', value: counts.Cebu, pct: percentage(counts.Cebu), className: 'purple' },
      { key: 'davao', label: 'Davao', value: counts.Davao, pct: percentage(counts.Davao), className: 'green' }
    ];
  }, [applicants]);

  const leadingBranch = useMemo(() => (
    [...branchDistribution].sort((a, b) => b.value - a.value)[0] || null
  ), [branchDistribution]);

  const maxBranchValue = useMemo(() => (
    Math.max(...branchDistribution.map((item) => item.value), 1)
  ), [branchDistribution]);

  const branchAxisTicks = useMemo(() => (
    Array.from({ length: 5 }, (_, index) => {
      const value = Math.round((maxBranchValue / 4) * (4 - index));
      return { key: `tick-${index}`, value };
    })
  ), [maxBranchValue]);

  const chartData = useMemo(() => {
    const total = stats.applied + stats.interview + stats.hired + stats.rejected;
    const percentage = (value) => (total > 0 ? ((value / total) * 100).toFixed(1) : '0.0');

    return [
      { key: 'applied', label: 'Applied', className: 'blue', value: stats.applied, pct: percentage(stats.applied) },
      { key: 'interview', label: 'Interview', className: 'purple', value: stats.interview, pct: percentage(stats.interview) },
      { key: 'hired', label: 'Hired', className: 'green', value: stats.hired, pct: percentage(stats.hired) },
      { key: 'rejected', label: 'Rejected', className: 'red', value: stats.rejected, pct: percentage(stats.rejected) }
    ];
  }, [stats]);

  const pieSegments = useMemo(() => {
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return [];

    const colorMap = {
      blue: '#5a8fe6',
      purple: '#9a66f2',
      green: '#2ac181',
      red: '#f06f6f'
    };

    let startAngle = -90;
    return chartData
      .filter((item) => item.value > 0)
      .map((item) => {
        const sweep = (item.value / total) * 360;
        const endAngle = startAngle + sweep;
        const segment = {
          ...item,
          startAngle,
          endAngle,
          midAngle: startAngle + sweep / 2,
          isLarge: sweep > 180,
          color: colorMap[item.className]
        };
        startAngle = endAngle;
        return segment;
      });
  }, [chartData]);

  useEffect(() => {
    if (!pieSegments.length) setActiveSegmentKey(null);
  }, [pieSegments]);

  const polarToCartesian = (cx, cy, radius, angleDeg) => {
    const rad = (Math.PI / 180) * angleDeg;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad)
    };
  };

  const buildArcPath = (cx, cy, radius, startAngle, endAngle, isLarge) => {
    const start = polarToCartesian(cx, cy, radius, startAngle);
    const end = polarToCartesian(cx, cy, radius, endAngle);
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${isLarge ? 1 : 0} 1 ${end.x} ${end.y} Z`;
  };

  const activeSegment = pieSegments.find((segment) => segment.key === activeSegmentKey) || null;
  const isDonutMode = Boolean(activeSegment);

  const formatInterviewDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="overview-content hr-page">
      <div className="hr-page-heading">
        <div className="hr-page-icon">
          <LayoutDashboard size={22} />
        </div>
        <div>
          <h2>Dashboard Overview</h2>
        </div>
      </div>

      <div className="hr-use-only-section">
        <div className="hr-use-only-label">For 6R Diamond HR Use Only</div>
      </div>

      <div className="overview-stats-grid">
        <div className="overview-stat-card accent-blue">
          <div>
            <p>Total Applicants</p>
            <h3>{loading ? '-' : stats.total}</h3>
          </div>
          <div className="overview-stat-icon blue-soft">
            <Users size={20} />
          </div>
        </div>

        <div className="overview-stat-card accent-orange">
          <div>
            <p>Pending Approval</p>
            <h3>{loading ? '-' : stats.applied}</h3>
          </div>
          <div className="overview-stat-icon orange-soft">
            <Hourglass size={20} />
          </div>
        </div>

        <div className="overview-stat-card accent-purple">
          <div>
            <p>For Interview</p>
            <h3>{loading ? '-' : stats.interview}</h3>
          </div>
          <div className="overview-stat-icon purple-soft">
            <CalendarDays size={20} />
          </div>
        </div>

        <div className="overview-stat-card accent-green">
          <div>
            <p>Hired Applicants</p>
            <h3>{loading ? '-' : stats.hired}</h3>
          </div>
          <div className="overview-stat-icon green-soft">
            <UserRoundCheck size={20} />
          </div>
        </div>
      </div>

      <div className="overview-main-grid">
        <section className="overview-panel">
          <div className="overview-panel-header">
            <h4>{chartPage === 0 ? 'Applicant Status Distribution' : 'Applicant Branch Distribution'}</h4>
          </div>

          {error ? (
            <div className="overview-empty-state">{error}</div>
          ) : (
            <div className="overview-chart-shell">
              {chartPage === 0 ? (
                <>
                  <div className="overview-chart-visual">
                    <svg viewBox="0 0 420 420" className="pie-svg" role="img" aria-label="Applicant status distribution pie chart">
                      <circle cx="210" cy="210" r="138" fill="#edf4ff" />
                      {pieSegments.map((segment) => {
                        const isActive = segment.key === activeSegmentKey;
                        const outerRadius = isDonutMode ? (isActive ? 144 : 138) : 138;
                        const labelAnchor = polarToCartesian(210, 210, 164, segment.midAngle);
                        const lineStart = polarToCartesian(210, 210, 118, segment.midAngle);
                        const lineEnd = polarToCartesian(210, 210, 150, segment.midAngle);

                        return (
                          <g key={segment.key} className={`pie-segment-group ${isActive ? 'active' : ''}`}>
                            <path
                              className="pie-segment-shadow"
                              d={buildArcPath(210, 210, isDonutMode && isActive ? 148 : outerRadius, segment.startAngle, segment.endAngle, segment.isLarge)}
                              fill={segment.color}
                              opacity={isDonutMode && isActive ? 0.22 : 0}
                            />
                            <path
                              className="pie-segment"
                              d={buildArcPath(210, 210, outerRadius, segment.startAngle, segment.endAngle, segment.isLarge)}
                              fill={segment.color}
                              stroke="#ffffff"
                              strokeWidth="3"
                            />
                            <path
                              d={`M ${lineStart.x} ${lineStart.y} L ${lineEnd.x} ${lineEnd.y}`}
                              className="pie-label-line"
                            />
                            <text
                              x={labelAnchor.x}
                              y={labelAnchor.y - 4}
                              textAnchor="middle"
                              className={`pie-label-title ${isActive ? 'active' : ''}`}
                            >
                              {segment.label}
                            </text>
                            <text
                              x={labelAnchor.x}
                              y={labelAnchor.y + 14}
                              textAnchor="middle"
                              className={`pie-label-value ${isActive ? 'active' : ''}`}
                            >
                              {segment.pct}%
                            </text>
                          </g>
                        );
                      })}
                      {isDonutMode && (
                        <>
                          <circle cx="210" cy="210" r="84" fill="#ffffff" stroke="#d9e7f7" strokeWidth="2" />
                          <text x="210" y="188" textAnchor="middle" className="pie-center-kicker">
                            {activeSegment ? activeSegment.label : 'Applicants'}
                          </text>
                          <text x="210" y="222" textAnchor="middle" className="pie-center-value">
                            {loading ? '-' : activeSegment ? activeSegment.value : stats.total}
                          </text>
                          <text x="210" y="246" textAnchor="middle" className="pie-center-subtext">
                            <tspan x="210" dy="0">{activeSegment ? `${activeSegment.pct}%` : 'Current'}</tspan>
                            <tspan x="210" dy="14">{activeSegment ? 'of pipeline' : 'pipeline'}</tspan>
                          </text>
                        </>
                      )}
                    </svg>
                  </div>

                  <div className="overview-chart-labels">
                    {chartData.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`chart-pill ${item.className} ${activeSegmentKey === item.key ? 'active' : ''}`}
                        onMouseEnter={() => setActiveSegmentKey(item.key)}
                        onFocus={() => setActiveSegmentKey(item.key)}
                        onMouseLeave={() => setActiveSegmentKey(null)}
                        onBlur={() => setActiveSegmentKey(null)}
                      >
                        <span className={`chart-dot ${item.className}`}></span>
                        <span>{item.label}</span>
                        <strong>{loading ? '' : `${item.pct}%`}</strong>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="branch-chart-shell">
                  <div className="branch-chart-summary">
                    <div>
                      <span className="branch-summary-kicker">Branch insight</span>
                      <strong className="branch-summary-title">
                        {loading ? 'Loading branch distribution...' : `${leadingBranch?.label || 'No branch'} leads the applicant flow`}
                      </strong>
                    </div>
                    <span className="branch-summary-metric">
                      {loading ? '' : `${leadingBranch?.pct || '0.0'}% of applicants`}
                    </span>
                  </div>

                  <div className="branch-chart-layout">
                    <div className="branch-chart-axis">
                      {branchAxisTicks.map((tick) => (
                        <span key={tick.key}>{loading ? '-' : tick.value}</span>
                      ))}
                    </div>

                    <div className="branch-chart-plot">
                      {branchAxisTicks.map((tick) => (
                        <div key={`grid-${tick.key}`} className="branch-chart-grid-line"></div>
                      ))}

                      <div className="branch-chart-columns">
                        {branchDistribution.map((item) => (
                          <div key={item.key} className="branch-chart-column-wrap">
                            <div className="branch-chart-bar-meta">
                              <strong>{loading ? '-' : item.value}</strong>
                              <span>{loading ? '' : `${item.pct}%`}</span>
                            </div>
                            <div
                              className={`branch-chart-bar ${item.className}`}
                              style={{ height: `${loading ? 0 : Math.max((item.value / maxBranchValue) * 100, item.value > 0 ? 12 : 0)}%` }}
                            ></div>
                            <div className="branch-chart-label-row">
                              <span className={`chart-dot ${item.className}`}></span>
                              <span className="branch-chart-label">{item.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="chart-slide-nav">
                <button
                  type="button"
                  className={`chart-slide-btn ${chartPage === 0 ? 'disabled' : ''}`}
                  onClick={() => setChartPage((current) => Math.max(0, current - 1))}
                  disabled={chartPage === 0}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <div className="chart-slide-dots" aria-label="Chart pages">
                  <span className={`chart-slide-dot ${chartPage === 0 ? 'active' : ''}`}></span>
                  <span className={`chart-slide-dot ${chartPage === 1 ? 'active' : ''}`}></span>
                </div>
                <button
                  type="button"
                  className={`chart-slide-btn ${chartPage === 1 ? 'disabled' : ''}`}
                  onClick={() => setChartPage((current) => Math.min(1, current + 1))}
                  disabled={chartPage === 1}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="overview-side-stack">
          <section className="overview-panel compact-panel">
            <div className="overview-panel-header">
              <h4>Upcoming Interviews</h4>
              <div className="mini-icon blue-soft">
                <CalendarDays size={18} />
              </div>
            </div>

            {loading ? (
              <div className="overview-empty-state">Loading upcoming interviews...</div>
            ) : upcomingInterviews.schedule.length === 0 ? (
              <div className="overview-empty-state">No interviews scheduled yet.</div>
            ) : (
              <div className="upcoming-interviews-block">
                {upcomingInterviews.schedule.slice(0, 2).map((item) => (
                  <div className="upcoming-interview-item" key={item.date}>
                    <div className="upcoming-interview-date-row">
                      <CalendarDays size={16} />
                      <strong>{formatInterviewDate(item.date)}</strong>
                    </div>
                    <p>{item.count} applicant(s) scheduled</p>
                  </div>
                ))}
                <div className="upcoming-interview-total">
                  Total: <strong>{upcomingInterviews.totalScheduled} applicant(s)</strong> scheduled
                </div>
              </div>
            )}
          </section>

          <section className="overview-panel compact-panel">
            <div className="overview-panel-header">
              <h4>Recent Applications</h4>
              <div className="mini-icon blue-soft">
                <ClipboardList size={18} />
              </div>
            </div>

            {loading && <div className="overview-empty-state">Loading recent applications...</div>}
            {!loading && error && <div className="overview-empty-state">{error}</div>}
            {!loading && !error && (
              <div className="recent-application-list">
                {recentApplications.length === 0 ? (
                  <div className="overview-empty-state">No applications submitted today.</div>
                ) : (
                  recentApplications.map((app) => (
                    <div className="recent-application-card" key={app.id}>
                      <div className="recent-app-title">{app.name || 'Unnamed Applicant'}</div>
                      <div className="recent-app-meta">{app.id || 'N/A'}</div>
                    </div>
                  ))
                )}
                <div className="recent-footer">
                  Total: <strong>{todayApplications.length} applicant(s)</strong> applied today
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Overview;
