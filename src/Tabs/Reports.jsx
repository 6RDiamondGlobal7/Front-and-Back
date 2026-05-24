import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart3, CalendarRange, CircleCheck, FileText, TrendingUp, Users, XCircle } from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import CustomSelect from '../components/CustomSelect';
import './Reports.css';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const quarterOptions = [
  { value: 1, label: 'Q1 (January 1 to March 31)' },
  { value: 2, label: 'Q2 (April 1 to June 30)' },
  { value: 3, label: 'Q3 (July 1 to September 30)' },
  { value: 4, label: 'Q4 (October 1 to December 31)' }
];

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const applicationStatusOptions = [
  { value: 'all', label: 'All applications' },
  { value: 'Applied', label: 'In Process' },
  { value: 'Interview', label: 'Interview' },
  { value: 'Hired', label: 'Hired' },
  { value: 'Rejected', label: 'Rejected' }
];

const getStatusKey = (status) => {
  const clean = String(status || '').trim().toLowerCase();
  if (clean === 'applied' || clean === 'in process') return 'Applied';
  if (clean === 'interview') return 'Interview';
  if (clean === 'hired') return 'Hired';
  if (clean === 'rejected') return 'Rejected';
  return 'Applied';
};

const getDisplayStatus = (status) => (
  getStatusKey(status) === 'Applied' ? 'In Process' : getStatusKey(status)
);

const formatRoleName = (role) => {
  const raw = String(role || '').trim();
  if (!raw) return 'Not assigned';

  const roles = {
    'corp-sec': 'Corporate Secretary',
    'corporate-secretary': 'Corporate Secretary',
    'licensed-broker': 'Licensed Customs Broker',
    'office-manager': 'Office Manager',
    messenger: 'Messenger / Logistics',
    'messenger-logistics': 'Messenger / Logistics',
    secretary: 'Secretary to the Office Manager',
    'secretary-to-the-office-manager': 'Secretary to the Office Manager',
    'brokerage-specialist': 'Brokerage Specialist',
    'import-export-head': 'Import & Export Head',
    'admin-staff': 'Administration Staff',
    'doc-head': 'Documentation Head',
    'docs-head': 'Documentation Head',
    'documentation-head': 'Documentation Head'
  };

  const normalized = raw.toLowerCase().replace(/[_\s/]+/g, '-');
  if (roles[normalized]) return roles[normalized];

  return raw
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => {
      const lower = word.toLowerCase();
      if (['hr', 'prc', 'id'].includes(lower)) return lower.toUpperCase();
      if (lower === 'and') return 'and';
      if (lower === 'to') return 'to';
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
};

const calculateReportSummary = (records) => {
  const statusBreakdown = records.reduce((acc, row) => {
    const key = getStatusKey(row.status);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, { Applied: 0, Interview: 0, Hired: 0, Rejected: 0 });

  const totalApplications = records.length;
  const percentage = (count) => totalApplications > 0 ? (Number(count || 0) / totalApplications) * 100 : 0;

  return {
    summary: {
      totalApplications,
      newApplications: statusBreakdown.Applied,
      inProcessCount: statusBreakdown.Applied,
      interviewCount: statusBreakdown.Interview,
      hiredCount: statusBreakdown.Hired,
      rejectedCount: statusBreakdown.Rejected,
      interviewRate: percentage(statusBreakdown.Interview),
      hiringRate: percentage(statusBreakdown.Hired),
      rejectionRate: percentage(statusBreakdown.Rejected)
    },
    statusBreakdown
  };
};

const padDatePart = (value) => String(value).padStart(2, '0');

const formatRangeDate = (date) => (
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`
);

const getDisplayPeriodRange = ({ reportType, month, quarter, year }) => {
  if (reportType === 'monthly') {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return `${formatRangeDate(start)} to ${formatRangeDate(end)}`;
  }

  if (reportType === 'quarterly') {
    const startMonth = (quarter - 1) * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0);
    return `${formatRangeDate(start)} to ${formatRangeDate(end)}`;
  }

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  return `${formatRangeDate(start)} to ${formatRangeDate(end)}`;
};

const Reports = () => {
  const API_BASE_URL = getApiBaseUrl();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

  const [reportType, setReportType] = useState('monthly');
  const [month, setMonth] = useState(currentMonth);
  const [quarter, setQuarter] = useState(currentQuarter);
  const [year, setYear] = useState(currentYear);
  const [branch, setBranch] = useState('all');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
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

  const selectedBranchLabel = useMemo(() => {
    if (branch === 'all') return 'All branches';
    return branch.charAt(0).toUpperCase() + branch.slice(1);
  }, [branch]);

  const requestParams = useMemo(() => {
    const params = { reportType, year, branch };
    if (reportType === 'monthly') {
      params.month = month;
    } else if (reportType === 'quarterly') {
      params.quarter = quarter;
    }
    return params;
  }, [reportType, month, quarter, year, branch]);

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

  const reportRecords = reportData?.records || [];

  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(
      reportRecords
        .map((row) => String(row.position || '').trim())
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b));

    return [
      { value: 'all', label: 'All roles' },
      ...roles.map((role) => ({ value: role, label: formatRoleName(role) }))
    ];
  }, [reportRecords]);

  useEffect(() => {
    if (!roleOptions.some((option) => option.value === roleFilter)) {
      setRoleFilter('all');
    }
  }, [roleOptions, roleFilter]);

  const filteredRecords = useMemo(() => (
    reportRecords.filter((row) => {
      const matchesStatus = applicationStatusFilter === 'all' || getStatusKey(row.status) === applicationStatusFilter;
      const matchesRole = roleFilter === 'all' || row.position === roleFilter;
      return matchesStatus && matchesRole;
    })
  ), [reportRecords, applicationStatusFilter, roleFilter]);

  const filteredReport = useMemo(() => calculateReportSummary(filteredRecords), [filteredRecords]);

  const summary = reportData ? filteredReport.summary : {
    totalApplications: 0,
    newApplications: 0,
    interviewCount: 0,
    hiredCount: 0,
    rejectedCount: 0,
    inProcessCount: 0,
    interviewRate: 0,
    hiringRate: 0,
    rejectionRate: 0
  };

  const statusBreakdown = reportData ? filteredReport.statusBreakdown : {
    Applied: 0,
    Interview: 0,
    Hired: 0,
    Rejected: 0
  };
  const inProcessCount = summary.inProcessCount ?? summary.newApplications ?? statusBreakdown.Applied ?? 0;
  const selectedStatusLabel = applicationStatusOptions.find((option) => option.value === applicationStatusFilter)?.label || 'All applications';
  const selectedRoleLabel = roleOptions.find((option) => option.value === roleFilter)?.label || 'All roles';

  const displayPeriodRange = getDisplayPeriodRange({ reportType, month, quarter, year });

  const fallbackReportLabel = reportType === 'monthly'
    ? `${monthNames[month - 1]} ${year} Report`
    : reportType === 'quarterly'
      ? `Q${quarter} ${year} Report`
      : `${year} Annual Report`;

  const reportLabel = reportData?.meta?.label || fallbackReportLabel;
  const rangeText = displayPeriodRange;

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
      doc.text(`Branch: ${selectedBranchLabel}`, 36, 138);
      doc.text(`Application Status: ${selectedStatusLabel}`, 36, 152);
      doc.text(`Role / Position: ${selectedRoleLabel}`, 36, 166);

      autoTable(doc, {
        startY: 184,
        head: [['Metric', 'Value']],
        body: [
          ['Total Applications', String(summary.totalApplications)],
          ['In Process', String(inProcessCount)],
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
          ['In Process', String(statusBreakdown.Applied || 0)],
          ['Interview', String(statusBreakdown.Interview || 0)],
          ['Hired', String(statusBreakdown.Hired || 0)],
          ['Rejected', String(statusBreakdown.Rejected || 0)]
        ],
        theme: 'grid',
        headStyles: { fillColor: brandBlue },
        styles: { fontSize: 10 }
      });

      const detailRows = filteredRecords.map((row) => [
        row.id,
        row.name,
        getDisplayStatus(row.status),
        formatRoleName(row.position),
        row.branch,
        row.date
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 18,
        head: [['Applicant #', 'Name', 'Status', 'Position', 'Branch', 'Date of Application']],
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

      const safe = `${reportLabel}-${selectedBranchLabel}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      doc.save(`6rdiamond-${safe}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="reports-container">
      <div className="hr-page-heading">
        <div className="hr-page-icon">
          <BarChart3 size={22} />
        </div>
        <div className="title-text">
          <h2>Reports and Analytics</h2>
        </div>
      </div>

      <div className="config-card">
        <div className="card-header-row">
          <div className="card-header-title">
            <span className="calendar-icon"><CalendarRange size={18} /></span>
            <h3>Report Configuration</h3>
          </div>
        </div>
        <div className="config-form">
          <div className="config-group">
            <label>Report Type</label>
            <CustomSelect
              options={[
                { value: 'monthly', label: 'Monthly Report' },
                { value: 'quarterly', label: 'Quarterly Report' },
                { value: 'annual', label: 'Annual Report' }
              ]}
              value={reportType}
              onChange={setReportType}
              className="config-select"
            />
          </div>
          <div className="config-group">
            <label>{reportType === 'quarterly' ? 'Quarter' : 'Month'}</label>
            <CustomSelect
              options={reportType === 'quarterly'
                ? quarterOptions
                : monthNames.map((name, idx) => ({ value: idx + 1, label: name }))}
              value={reportType === 'quarterly' ? quarter : month}
              onChange={(nextValue) => {
                if (reportType === 'quarterly') {
                  setQuarter(Number(nextValue));
                } else {
                  setMonth(Number(nextValue));
                }
              }}
              disabled={reportType === 'annual'}
              className="config-select"
            />
          </div>
          <div className="config-group">
            <label>Year</label>
            <CustomSelect
              options={yearOptions.map((y) => ({ value: y, label: String(y) }))}
              value={year}
              onChange={(nextValue) => setYear(Number(nextValue))}
              className="config-select"
            />
          </div>
          <div className="config-group">
            <label>Branch</label>
            <CustomSelect
              options={[
                { value: 'all', label: 'All branches' },
                { value: 'manila', label: 'Manila' },
                { value: 'cebu', label: 'Cebu' },
                { value: 'davao', label: 'Davao' }
              ]}
              value={branch}
              onChange={setBranch}
              className="config-select"
            />
          </div>
        </div>
      </div>

      <div className="report-dashboard">
        <div className="dashboard-header">
          <div className="header-left">
            <h3>{reportLabel}</h3>
            <p>Period: {rangeText}</p>
            <p>Branch: {selectedBranchLabel}</p>
          </div>
          <button className="export-pdf-btn" onClick={handleExportPdf} disabled={!reportData || loading || exporting}>
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>

        <div className="report-filter-strip">
          <div className="report-filter-group">
            <label>Application Status</label>
            <CustomSelect
              options={applicationStatusOptions}
              value={applicationStatusFilter}
              onChange={setApplicationStatusFilter}
              className="report-filter-select"
            />
          </div>
          <div className="report-filter-group">
            <label>Role / Position</label>
            <CustomSelect
              options={roleOptions}
              value={roleFilter}
              onChange={setRoleFilter}
              className="report-filter-select"
            />
          </div>
        </div>

        {loading && <div className="report-state loading">Loading report...</div>}
        {!loading && error && <div className="report-state error">{error}</div>}

        {!loading && !error && (
          <>
            <div className="metrics-row">
              <div className="metric-card light-blue">
                <div className="metric-icon"><FileText size={18} /></div>
                <p>Total Applications</p>
                <h4>{summary.totalApplications}</h4>
              </div>
              <div className="metric-card soft-yellow">
                <div className="metric-icon"><CalendarRange size={18} /></div>
                <p>In Process</p>
                <h4>{inProcessCount}</h4>
              </div>
              <div className="metric-card soft-purple">
                <div className="metric-icon"><Users size={18} /></div>
                <p>Interview</p>
                <h4>{summary.interviewCount}</h4>
              </div>
              <div className="metric-card soft-green">
                <div className="metric-icon"><CircleCheck size={18} /></div>
                <p>Hired</p>
                <h4>{summary.hiredCount}</h4>
              </div>
              <div className="metric-card soft-red">
                <div className="metric-icon"><XCircle size={18} /></div>
                <p>Rejected</p>
                <h4>{summary.rejectedCount}</h4>
              </div>
            </div>

            <div className="success-rate-section">
              <div className="success-main-display">
                <div className="trend-icon"><TrendingUp size={24} /></div>
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

          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
