import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../config/api'; // <-- DINAGDAG NATIN ITO
import './Overview.css';

const Overview = () => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // <-- BINAGO NATIN ITO PARA MAGING DYNAMIC ANG URL
  const API_BASE_URL = getApiBaseUrl();

  useEffect(() => {
    const fetchApplicants = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_BASE_URL}/api/applicants`);
        setApplicants(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Unable to load dashboard data.');
        setApplicants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [API_BASE_URL]);

  const stats = useMemo(() => {
    const applied = applicants.filter((a) => {
      const status = (a.status || '').toLowerCase();
      return status === 'applied' || status === 'pending';
    }).length;

    const interview = applicants.filter((a) => (a.status || '').toLowerCase() === 'interview').length;
    const hired = applicants.filter((a) => (a.status || '').toLowerCase() === 'hired').length;
    const rejected = applicants.filter((a) => (a.status || '').toLowerCase() === 'rejected').length;

    return {
      total: applicants.length,
      applied,
      interview,
      hired,
      rejected
    };
  }, [applicants]);

  const recentApplications = useMemo(() => {
    return [...applicants]
      .sort((a, b) => {
        const aNum = Number(String(a.id || '').replace(/\D/g, '')) || 0;
        const bNum = Number(String(b.id || '').replace(/\D/g, '')) || 0;
        return bNum - aNum;
      })
      .slice(0, 5);
  }, [applicants]);

  const chartData = useMemo(() => {
    const total = stats.applied + stats.interview + stats.hired + stats.rejected;
    const safePct = (value) => (total > 0 ? ((value / total) * 100).toFixed(1) : '0.0');

    return [
      { key: 'applied', label: 'Applied', className: 'blue', value: stats.applied, pct: safePct(stats.applied) },
      { key: 'interview', label: 'Interview', className: 'orange', value: stats.interview, pct: safePct(stats.interview) },
      { key: 'hired', label: 'Hired', className: 'green', value: stats.hired, pct: safePct(stats.hired) },
      { key: 'rejected', label: 'Rejected', className: 'red', value: stats.rejected, pct: safePct(stats.rejected) }
    ];
  }, [stats]);

  const pieSegments = useMemo(() => {
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return [];

    const colorMap = {
      blue: '#5d9cec',
      orange: '#f6b93b',
      green: '#2ecc71',
      red: '#e74c3c'
    };

    let startAngle = -90;
    return chartData
      .filter((item) => item.value > 0)
      .map((item) => {
        const sweep = (item.value / total) * 360;
        const endAngle = startAngle + sweep;
        const midAngle = startAngle + sweep / 2;
        const segment = {
          ...item,
          startAngle,
          endAngle,
          midAngle,
          color: colorMap[item.className] || '#5d9cec',
          isLarge: sweep > 180
        };
        startAngle = endAngle;
        return segment;
      });
  }, [chartData]);

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = (Math.PI / 180) * angleDeg;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  };

  const buildArcPath = (cx, cy, r, startAngle, endAngle, isLarge) => {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${isLarge ? 1 : 0} 1 ${end.x} ${end.y} Z`;
  };

  return (
    <div className="overview-content">
      <div className="tab-title-area">
        <div className="title-icon">OV</div>
        <h2>Dashboard Overview</h2>
      </div>

      <div className="stats-container">
        <div className="stat-card border-blue">
          <div className="stat-info">
            <p>Total Applicants</p>
            <h3>{loading ? '-' : stats.total}</h3>
          </div>
          <div className="stat-icon blue-bg">AP</div>
        </div>
        <div className="stat-card border-orange">
          <div className="stat-info">
            <p>Pending Approval</p>
            <h3>{loading ? '-' : stats.applied}</h3>
          </div>
          <div className="stat-icon orange-bg">PD</div>
        </div>
        <div className="stat-card border-purple">
          <div className="stat-info">
            <p>For Interview</p>
            <h3>{loading ? '-' : stats.interview}</h3>
          </div>
          <div className="stat-icon purple-bg">IN</div>
        </div>
        <div className="stat-card border-green">
          <div className="stat-info">
            <p>Hired Applicants</p>
            <h3>{loading ? '-' : stats.hired}</h3>
          </div>
          <div className="stat-icon green-bg">HR</div>
        </div>
      </div>

      <div className="data-grid">
        <div className="chart-section card">
          <h4>Applicant Status Distribution</h4>
          <div className="dummy-chart-container">
            <div className="pie-placeholder">
              <svg viewBox="0 0 320 320" className="pie-svg" role="img" aria-label="Applicant status distribution pie chart">
                <circle cx="160" cy="160" r="130" fill="#e2e8f0" />
                {pieSegments.map((segment) => (
                  <path
                    key={segment.key}
                    d={buildArcPath(160, 160, 130, segment.startAngle, segment.endAngle, segment.isLarge)}
                    fill={segment.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                ))}
                {pieSegments.map((segment) => {
                  const labelPoint = polarToCartesian(160, 160, 84, segment.midAngle);
                  return (
                    <text
                      key={`${segment.key}-label`}
                      x={labelPoint.x}
                      y={labelPoint.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pie-label"
                    >
                      {segment.value}
                    </text>
                  );
                })}
              </svg>
            </div>
            <div className="chart-legend">
              {chartData.map((item) => (
                <span key={item.key}>
                  <i className={`dot ${item.className}`}></i>
                  {item.label} ({loading ? '-' : item.value}) {loading ? '' : `- ${item.pct}%`}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="lists-section">
          <div className="list-card card">
            <div className="list-header">
              <h4>Upcoming Interviews</h4>
              <span className="icon">INT</span>
            </div>
            <div className="list-item-box blue-fade">
              <p className="date">Live Status</p>
              <p className="subtext">
                {loading ? 'Loading...' : `${stats.interview} applicant(s) in interview stage`}
              </p>
            </div>
          </div>

          <div className="list-card card">
            <div className="list-header">
              <h4>Recent Applications</h4>
              <span className="icon">RC</span>
            </div>
            {loading && <div className="empty-state">Loading recent applications...</div>}
            {!loading && error && <div className="empty-state">{error}</div>}
            {!loading && !error && recentApplications.length === 0 && (
              <div className="empty-state">No applications yet.</div>
            )}
            {!loading && !error && recentApplications.map((app) => (
              <div className="application-item" key={app.id}>
                <p className="name">{app.name || 'Unnamed Applicant'}</p>
                <p className="date">{app.id || 'N/A'}</p>
              </div>
            ))}
            {!loading && !error && recentApplications.length > 0 && (
              <div className="view-all">{recentApplications.length} latest application(s)</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
