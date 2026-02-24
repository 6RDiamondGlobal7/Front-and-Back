import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getApiBaseUrl } from '../config/api';
import './Reports.css';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const Reports = () => {
  const API_BASE_URL = getApiBaseUrl();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

  const [reportType, setReportType] = useState('monthly');
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear + 1; y >= currentYear - 5; y -= 1) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  const requestParams = useMemo(() => {
    const params = { reportType, year };
    if (reportType === 'monthly') {
      params.month = month;
    } else if (reportType === 'quarterly') {
      params.quarter = Math.ceil(month / 3) || currentQuarter;
    }
    return params;
  }, [reportType, month, year, currentQuarter]);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_BASE_URL}/api/reports`, { params: requestParams });
        setReportData(response.data);
      } catch (err) {
        console.error('Error loading reports:', err);
        setReportData(null);
        setError('Unable to load report data.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [API_BASE_URL, requestParams]);

  const summary = reportData?.summary || {
    totalApplications: 0,
    newApplications: 0,
    interviewCount: 0,
    hiredCount: 0,
    rejectedCount: 0,
    interviewRate: 0,
    hiringRate: 0,
    rejectionRate: 0
  };

  const statusBreakdown = reportData?.statusBreakdown || {
    Applied: 0,
    Interview: 0,
    Hired: 0,
    Rejected: 0
  };

  const reportLabel = reportData?.meta?.label || `${monthNames[month - 1]} ${year} Report`;
  const rangeText = reportData?.meta?.dateRange
    ? `${reportData.meta.dateRange.from} to ${reportData.meta.dateRange.to}`
    : 'Summary unavailable';

  const handleExportPdf = () => {
    if (!reportData || exporting) return;

    setExporting(true);
    try {
      const doc = new jsPDF('p', 'pt', 'a4');
      const brandBlue = [93, 156, 236];
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(...brandBlue);
      doc.rect(0, 0, pageWidth, 82, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('6R Diamond International Cargo Logistics, Inc.', 36, 34);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Recruitment Report', 36, 50);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 36, 66);

      doc.setTextColor(45, 55, 72);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(reportLabel, 36, 108);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Period: ${rangeText}`, 36, 124);

      autoTable(doc, {
        startY: 142,
        head: [['Metric', 'Value']],
        body: [
          ['Total Applications', String(summary.totalApplications)],
          ['New Applications', String(summary.newApplications)],
          ['Interview', String(summary.interviewCount)],
          ['Hired', String(summary.hiredCount)],
          ['Rejected', String(summary.rejectedCount)],
          ['Interview Rate', formatPercent(summary.interviewRate)],
          ['Hiring Rate', formatPercent(summary.hiringRate)],
          ['Rejection Rate', formatPercent(summary.rejectionRate)]
        ],
        theme: 'striped',
        headStyles: { fillColor: brandBlue },
        styles: { fontSize: 10 }
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 18,
        head: [['Status', 'Count']],
        body: [
          ['Applied', String(statusBreakdown.Applied || 0)],
          ['Interview', String(statusBreakdown.Interview || 0)],
          ['Hired', String(statusBreakdown.Hired || 0)],
          ['Rejected', String(statusBreakdown.Rejected || 0)]
        ],
        theme: 'grid',
        headStyles: { fillColor: brandBlue },
        styles: { fontSize: 10 }
      });

      const detailRows = (reportData.records || []).map((row) => [
        row.id,
        row.name,
        row.status,
        row.position,
        row.branch,
        row.date
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 18,
        head: [['Applicant #', 'Name', 'Status', 'Position', 'Branch', 'Applied Date']],
        body: detailRows.length > 0 ? detailRows : [['-', 'No records found for selected filter', '-', '-', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: brandBlue },
        styles: { fontSize: 9 },
        didDrawPage: (data) => {
          doc.setFontSize(9);
          doc.setTextColor(130);
          doc.text(`6RDiamond HR Reports | Page ${data.pageNumber}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 18);
        }
      });

      const safe = reportLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      doc.save(`6rdiamond-${safe}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="reports-container">
      <div className="reports-header-section">
        <div className="header-with-icon">
          <div className="title-icon-box">📊</div>
          <div className="title-text">
            <h2>Reports & Analytics</h2>
            <p>Track recruitment performance and key metrics</p>
          </div>
        </div>
      </div>

      <div className="config-card">
        <div className="card-header-row">
          <span className="calendar-icon">📅</span>
          <h3>Report Configuration</h3>
        </div>
        <div className="config-form">
          <div className="config-group">
            <label>Report Type</label>
            <select className="config-select" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="monthly">Monthly Report</option>
              <option value="quarterly">Quarterly Report</option>
              <option value="annual">Annual Report</option>
            </select>
          </div>
          <div className="config-group">
            <label>Month</label>
            <select
              className="config-select"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              disabled={reportType === 'annual'}
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div className="config-group">
            <label>Year</label>
            <select className="config-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="report-dashboard">
        <div className="dashboard-header">
          <div className="header-left">
            <h3>{reportLabel}</h3>
            <p>📅 {rangeText}</p>
          </div>
          <button className="export-pdf-btn" onClick={handleExportPdf} disabled={!reportData || loading || exporting}>
            {exporting ? 'Exporting...' : '📥 Export PDF'}
          </button>
        </div>

        {loading && <div className="report-state loading">Loading report...</div>}
        {!loading && error && <div className="report-state error">{error}</div>}

        {!loading && !error && (
          <>
            <div className="metrics-row">
              <div className="metric-card light-blue">
                <div className="metric-icon">📄</div>
                <p>Total Applications</p>
                <h4>{summary.totalApplications}</h4>
              </div>
              <div className="metric-card soft-blue">
                <div className="metric-icon">📋</div>
                <p>New Applications</p>
                <h4>{summary.newApplications}</h4>
              </div>
              <div className="metric-card soft-green">
                <div className="metric-icon">✅</div>
                <p>Hired</p>
                <h4>{summary.hiredCount}</h4>
              </div>
              <div className="metric-card soft-red">
                <div className="metric-icon">🚫</div>
                <p>Rejected</p>
                <h4>{summary.rejectedCount}</h4>
              </div>
            </div>

            <div className="success-rate-section">
              <div className="success-main-display">
                <div className="trend-icon">📈</div>
                <p className="success-label">Hiring Success Rate</p>
                <h2 className="success-percentage">{formatPercent(summary.hiringRate)}</h2>
                <p className="success-subtext">{summary.hiredCount} hired out of {summary.totalApplications} total applications</p>
              </div>

              <div className="rate-breakdown-grid">
                <div className="rate-mini-card">
                  <p>Interview Rate</p>
                  <h5>{formatPercent(summary.interviewRate)}</h5>
                  <span>{summary.interviewCount} reached interview</span>
                </div>
                <div className="rate-mini-card">
                  <p>Hiring Rate</p>
                  <h5>{formatPercent(summary.hiringRate)}</h5>
                  <span>{summary.hiredCount} successfully hired</span>
                </div>
                <div className="rate-mini-card">
                  <p>Rejection Rate</p>
                  <h5>{formatPercent(summary.rejectionRate)}</h5>
                  <span>{summary.rejectedCount} rejected</span>
                </div>
              </div>
            </div>

            <div className="status-breakdown-wrapper">
              <h3 className="section-title-bar">Application Status Breakdown</h3>
              <div className="status-grid">
                <div className="status-pill-item blue-pill">
                  <div className="pill-dot"></div>
                  <span>Applied</span>
                  <strong>{statusBreakdown.Applied}</strong>
                </div>
                <div className="status-pill-item purple-pill">
                  <div className="pill-dot"></div>
                  <span>Interview</span>
                  <strong>{statusBreakdown.Interview}</strong>
                </div>
                <div className="status-pill-item green-pill">
                  <div className="pill-dot"></div>
                  <span>Hired</span>
                  <strong>{statusBreakdown.Hired}</strong>
                </div>
                <div className="status-pill-item red-pill">
                  <div className="pill-dot"></div>
                  <span>Rejected</span>
                  <strong>{statusBreakdown.Rejected}</strong>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
