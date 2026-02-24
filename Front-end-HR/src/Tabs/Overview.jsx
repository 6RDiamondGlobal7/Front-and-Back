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

  const pieStyle = useMemo(() => {
    const totalForPie = stats.applied + stats.interview + stats.hired + stats.rejected;
    if (totalForPie === 0) {
      return { background: '#e2e8f0' };
    }

    const appliedPct = (stats.applied / totalForPie) * 100;
    const interviewPct = (stats.interview / totalForPie) * 100;
    const hiredPct = (stats.hired / totalForPie) * 100;

    const p1 = appliedPct;
    const p2 = appliedPct + interviewPct;
    const p3 = p2 + hiredPct;

    return {
      background: `conic-gradient(#5d9cec ${p1}%, #f6b93b ${p1}% ${p2}%, #2ecc71 ${p2}% ${p3}%, #e74c3c ${p3}% 100%)`
    };
  }, [stats]);

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
            <div className="pie-placeholder" style={pieStyle}></div>
            <div className="chart-legend">
              <span><i className="dot blue"></i> Applied ({loading ? '-' : stats.applied})</span>
              <span><i className="dot orange"></i> Interview ({loading ? '-' : stats.interview})</span>
              <span><i className="dot green"></i> Hired ({loading ? '-' : stats.hired})</span>
              <span><i className="dot red"></i> Rejected ({loading ? '-' : stats.rejected})</span>
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