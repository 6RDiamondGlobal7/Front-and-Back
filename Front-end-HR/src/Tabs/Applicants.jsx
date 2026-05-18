import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Briefcase,
  CheckCircle,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  Search,
  UsersRound,
  X,
  XCircle
} from 'lucide-react';
import './Applicants.css';
import { getApiBaseUrl } from '../config/api';
import ConfirmationModal from '../components/ConfirmationModal';
import CustomSelect from '../components/CustomSelect';

const PRIORITIZED_BRANCHES = ['Manila', 'Cebu', 'Davao'];
const APPLICATION_ACTIVE_WINDOW_DAYS = 90;

const getDisplayStatus = (status) => (
  String(status || '').toLowerCase() === 'applied' ? 'In Process' : status
);

const Applicants = () => {
  const API_BASE_URL = getApiBaseUrl();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [positionFilter, setPositionFilter] = useState('All Positions');
  const [branchFilter, setBranchFilter] = useState('Manila');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'applicantNumber', direction: 'desc' });
  const itemsPerPage = 5;

  const formatPosition = (id) => {
    if (!id || id === 'Not assigned' || id === 'Not specified') return id;
    const roles = {
      'corp-sec': 'Corporate Secretary',
      'licensed-broker': 'Licensed Customs Broker',
      'office-manager': 'Office Manager',
      messenger: 'Messenger / Logistics',
      secretary: 'Secretary to the Office Manager',
      'brokerage-specialist': 'Brokerage Specialist',
      'import-export-head': 'Import & Export Head',
      'admin-staff': 'Administration Staff'
    };
    return roles[id] || id.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatBranch = (text) => {
    if (!text || text === 'Not assigned' || text === 'Not specified') return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const formatAppliedDate = (app) => {
    const rawValue = app.created_at || app.application_date || app.date_applied || app.updated_at;
    if (!rawValue) return 'N/A';

    const date = new Date(rawValue);
    if (Number.isNaN(date.getTime())) return rawValue;

    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getApplicationDate = (app) => {
    const rawValue = app?.created_at || app?.application_date || app?.date_applied || app?.updated_at;
    if (!rawValue) return null;
    const parsed = new Date(rawValue);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const formatPolicyDate = (value) => {
    if (!value) return 'N/A';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const buildApplicationDuration = (app) => {
    const appliedAt = getApplicationDate(app);
    if (!appliedAt) {
      return {
        appliedLabel: 'N/A',
        activeUntilLabel: 'N/A',
        daysRemainingLabel: 'N/A',
        isExpired: false
      };
    }

    const activeUntil = new Date(appliedAt);
    activeUntil.setDate(activeUntil.getDate() + APPLICATION_ACTIVE_WINDOW_DAYS);

    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysRemaining = Math.ceil((activeUntil.getTime() - now.getTime()) / msPerDay);
    const clampedRemaining = Math.max(0, Math.min(APPLICATION_ACTIVE_WINDOW_DAYS, daysRemaining));

    return {
      appliedLabel: formatPolicyDate(appliedAt),
      activeUntilLabel: formatPolicyDate(activeUntil),
      daysRemainingLabel: `${clampedRemaining} / ${APPLICATION_ACTIVE_WINDOW_DAYS} days`,
      isExpired: clampedRemaining <= 0
    };
  };

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/applicants`);
      const formattedData = response.data.map((app) => ({
        ...app,
        landlineNumber: app.landlineNumber || app.landline_number || 'N/A',
        application_letter_url: app.application_letter_url || app.cover_letter_url || '',
        branch: formatBranch(app.branch),
        position: formatPosition(app.position)
      }));
      setApplicants(formattedData);
    } catch (error) {
      console.error('Error fetching applicants:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplicants();
  }, [API_BASE_URL]);

  const handleUpdateStatus = async (id, newStatus) => {
    setStatusUpdateLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/api/applicants/${id}/status`, { status: newStatus });
      setApplicants((prev) => prev.map((app) => (
        app.id === id ? { ...app, status: newStatus } : app
      )));
      setSelectedApplicant(null);
      setConfirmAction(null);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const isSelectableFilterValue = (value) => (
    Boolean(value) && value !== 'Not assigned' && value !== 'Not specified'
  );

  const branches = useMemo(() => {
    const discoveredBranches = Array.from(
      new Set(applicants.map((item) => item.branch).filter(isSelectableFilterValue))
    );
    const extras = discoveredBranches
      .filter((branch) => !PRIORITIZED_BRANCHES.includes(branch))
      .sort((a, b) => a.localeCompare(b));
    return [...PRIORITIZED_BRANCHES, ...extras];
  }, [applicants]);

  const positionOptions = useMemo(() => {
    const baseApplicants = applicants.filter((app) => {
      const appStatus = String(app.status || '').toLowerCase();
      const matchesStatus = statusFilter === 'All' || appStatus === statusFilter.toLowerCase();
      const matchesBranch = !branchFilter || app.branch === branchFilter;
      return matchesStatus && matchesBranch;
    });

    const countsByPosition = baseApplicants.reduce((acc, app) => {
      if (!isSelectableFilterValue(app.position)) return acc;
      acc[app.position] = (acc[app.position] || 0) + 1;
      return acc;
    }, {});

    const positions = Object.entries(countsByPosition)
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      })
      .map(([position, count]) => ({
        value: position,
        label: `${position} (${count})`
      }));

    return [
      { value: 'All Positions', label: `All Positions (${baseApplicants.length})` },
      ...positions
    ];
  }, [applicants, statusFilter, branchFilter]);

  useEffect(() => {
    if (branches.length > 0 && !branches.includes(branchFilter)) {
      setBranchFilter(branches[0]);
    }
  }, [branches, branchFilter]);

  useEffect(() => {
    if (!positionOptions.some((option) => option.value === positionFilter)) {
      setPositionFilter('All Positions');
    }
  }, [positionOptions, positionFilter]);

  const filteredData = applicants.filter((app) => {
    const appStatus = String(app.status || '').toLowerCase();
    const appName = String(app.name || '').toLowerCase();
    const appId = String(app.id || '').toLowerCase();
    const matchesStatus = statusFilter === 'All' || appStatus === statusFilter.toLowerCase();
    const matchesPosition = positionFilter === 'All Positions' || app.position === positionFilter;
    const matchesBranch = !branchFilter || app.branch === branchFilter;
    const matchesSearch = appName.includes(searchQuery.toLowerCase()) || appId.includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPosition && matchesBranch && matchesSearch;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;

    if (sortConfig.key === 'applicantNumber') {
      return String(a.id || '').localeCompare(String(b.id || ''), undefined, { numeric: true }) * directionMultiplier;
    }

    if (sortConfig.key === 'name') {
      return String(a.name || '').localeCompare(String(b.name || '')) * directionMultiplier;
    }

    if (sortConfig.key === 'appliedDate') {
      const aRaw = a.created_at || a.application_date || a.date_applied || a.updated_at;
      const bRaw = b.created_at || b.application_date || b.date_applied || b.updated_at;
      const aTime = new Date(aRaw || 0).getTime();
      const bTime = new Date(bRaw || 0).getTime();
      const safeATime = Number.isNaN(aTime) ? 0 : aTime;
      const safeBTime = Number.isNaN(bTime) ? 0 : bTime;
      return (safeATime - safeBTime) * directionMultiplier;
    }

    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentItems = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const updateStatus = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const getSortLabel = (key, label) => {
    if (sortConfig.key !== key) return `${label} unsorted`;
    return `${label} sorted ${sortConfig.direction === 'asc' ? 'ascending' : 'descending'}`;
  };

  const handleDownloadResume = (app) => {
    if (!app?.resume_url) {
      alert('No resume uploaded for this applicant.');
      return;
    }
    window.open(app.resume_url, '_blank', 'noopener,noreferrer');
  };

  const openStatusConfirmation = (applicant, status) => {
    setConfirmAction({
      applicantId: applicant.id,
      applicantName: applicant.name,
      status
    });
  };

  const getConfirmationTone = (status) => {
    if (status === 'Interview') return 'interview';
    if (status === 'Rejected') return 'danger';
    if (status === 'Hired') return 'success';
    return 'warning';
  };

  const getApplicationLetterUrl = (applicant) => (
    applicant?.application_letter_url || applicant?.cover_letter_url || ''
  );

  const getLandlineNumber = (applicant) => (
    applicant?.landlineNumber || applicant?.landline_number || applicant?.landline || 'N/A'
  );

  return (
    <div className="applicants-container">
      <div className="hr-page-heading">
        <div className="hr-page-icon">
          <UsersRound size={22} />
        </div>
        <div>
          <h2>Applicants</h2>
        </div>
      </div>

      <div className="top-tabs-card">
        {[
          { value: 'All', label: 'All' },
          { value: 'Applied', label: 'In Process' },
          { value: 'Interview', label: 'Interview' },
          { value: 'Hired', label: 'Hired' },
          { value: 'Rejected', label: 'Rejected' }
        ].map((tab, index, array) => {
          const count = applicants.filter((a) => (
            tab.value === 'All' ? true : String(a.status || '').toLowerCase() === tab.value.toLowerCase()
          )).length;

          return (
            <React.Fragment key={tab.value}>
              <button
                className={`tab-btn ${statusFilter === tab.value ? 'active' : ''}`}
                onClick={() => updateStatus(tab.value)}
              >
                {tab.label}
                <span className="tab-count">({count})</span>
              </button>
              {index < array.length - 1 && <span className="tab-divider">|</span>}
            </React.Fragment>
          );
        })}
      </div>

      <div className="applicants-filters-card">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search by name or applicant number"
            className="search-input"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="select-wrapper">
          <CustomSelect
            icon={<Briefcase size={18} />}
            options={positionOptions}
            value={positionFilter}
            onChange={(nextValue) => {
              setPositionFilter(nextValue);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="select-wrapper">
          <CustomSelect
            icon={<MapPin size={18} />}
            options={branches}
            value={branchFilter}
            onChange={(nextValue) => {
              setBranchFilter(nextValue);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-scroll-shell">
          <table className="applicants-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className="sortable-header" onClick={() => handleSort('applicantNumber')} aria-label={getSortLabel('applicantNumber', 'Applicant Number')}>
                    <span>Applicant Number</span>
                    <ChevronsUpDown size={14} className={`sort-icon ${sortConfig.key === 'applicantNumber' ? 'active' : ''}`} />
                  </button>
                </th>
                <th>
                  <button type="button" className="sortable-header" onClick={() => handleSort('name')} aria-label={getSortLabel('name', 'Name')}>
                    <span>Name</span>
                    <ChevronsUpDown size={14} className={`sort-icon ${sortConfig.key === 'name' ? 'active' : ''}`} />
                  </button>
                </th>
                <th>Contact</th>
                <th>
                  <button type="button" className="sortable-header" onClick={() => handleSort('appliedDate')} aria-label={getSortLabel('appliedDate', 'Date of Application')}>
                    <span>Date of Application</span>
                    <ChevronsUpDown size={14} className={`sort-icon ${sortConfig.key === 'appliedDate' ? 'active' : ''}`} />
                  </button>
                </th>
                <th>Status</th>
                <th>Position</th>
                <th>Branch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="no-data">Loading applicants...</td></tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((app) => (
                  <tr key={app.id}>
                    <td className="bold">{app.id}</td>
                    <td className="bold">{app.name}</td>
                    <td>
                      <div className="contact-wrapper">
                        <div className="contact-info">
                          <Mail size={14} className="contact-icon" /> {app.email}
                        </div>
                        <div className="contact-info">
                          <Phone size={14} className="contact-icon" /> {app.phone}
                        </div>
                      </div>
                    </td>
                    <td>{formatAppliedDate(app)}</td>
                    <td>
                      <span className={`status-pill ${String(app.status || '').toLowerCase()}`}>
                        {getDisplayStatus(app.status)}
                      </span>
                    </td>
                    <td>{app.position}</td>
                    <td>{app.branch}</td>
                    <td>
                      <div className="actions-wrapper">
                        <button className="action-icon" title="View Details" onClick={() => setSelectedApplicant(app)}>
                          <Eye size={18} />
                        </button>
                        <button
                          className={`action-icon ${!app.resume_url ? 'disabled' : ''}`}
                          title={app.resume_url ? 'Download Resume' : 'No Resume Uploaded'}
                          onClick={() => handleDownloadResume(app)}
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" className="no-data">No applicants found matching filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-container">
          <div className="pagination-info">
            Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            -
            {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} applicants
          </div>
          <div className="pagination-controls">
            <button
              className="page-nav-text"
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            {[...Array(totalPages || 0)].map((_, index) => (
              <button
                key={index + 1}
                className={`page-number ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button
              className="page-nav-text"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {selectedApplicant && (
        <div className="app-modal-overlay" onClick={() => setSelectedApplicant(null)}>
          <div className="app-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="app-modal-header">
              <div className="app-modal-title-area">
                <h3>Applicant Details</h3>
                <p className="app-modal-subtitle">
                  {selectedApplicant.name} - Applicant Number: {selectedApplicant.id}
                </p>
              </div>
              <button className="app-modal-close-btn" onClick={() => setSelectedApplicant(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="app-modal-body">
              <section>
                <div className="app-section-header">
                  <FileText className="app-section-icon" size={20} />
                  <span className="app-section-title">Personal Information</span>
                </div>
                {(() => {
                  const duration = buildApplicationDuration(selectedApplicant);
                  return (
                    <div className="app-duration-card" aria-label="Application duration policy">
                      <div className="app-duration-head">
                        <span className="app-duration-title">Application Duration</span>
                        <span className="app-duration-badge">{APPLICATION_ACTIVE_WINDOW_DAYS} days</span>
                      </div>
                      <div className={`app-duration-grid ${duration.isExpired ? 'expired' : ''}`}>
                        <div className="app-duration-item">
                          <span className="app-duration-label">Application Date</span>
                          <span className="app-duration-value">{duration.appliedLabel}</span>
                        </div>
                        <div className="app-duration-item">
                          <span className="app-duration-label">Active Until</span>
                          <span className="app-duration-value">{duration.activeUntilLabel}</span>
                        </div>
                        <div className="app-duration-item app-duration-item-wide">
                          <span className="app-duration-label">Remaining Window</span>
                          <span className="app-duration-value">{duration.daysRemainingLabel}{duration.isExpired ? ' (Expired)' : ''}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div className="app-info-grid">
                  <div className="app-info-item"><span className="app-info-label">First Name</span><span className="app-info-value">{selectedApplicant.firstName || 'N/A'}</span></div>
                  <div className="app-info-item"><span className="app-info-label">Middle Initial</span><span className="app-info-value">{selectedApplicant.middleInitial || 'N/A'}</span></div>
                  <div className="app-info-item"><span className="app-info-label">Last Name</span><span className="app-info-value">{selectedApplicant.lastName || 'N/A'}</span></div>
                  <div className="app-info-item"><span className="app-info-label">Date of Birth</span><span className="app-info-value">{selectedApplicant.birthday || 'N/A'}</span></div>
                  <div className="app-info-item"><span className="app-info-label">Age</span><span className="app-info-value">{selectedApplicant.age || 'N/A'}</span></div>
                  <div className="app-info-item"><span className="app-info-label">Nationality</span><span className="app-info-value">{selectedApplicant.nationality || 'N/A'}</span></div>
                  <div className="app-info-item"><span className="app-info-label">Email</span><span className="app-info-value">{selectedApplicant.email || 'N/A'}</span></div>
                  <div className="app-info-item"><span className="app-info-label">Phone</span><span className="app-info-value">{selectedApplicant.phone || 'N/A'}</span></div>
                  <div className="app-info-item"><span className="app-info-label">Branch</span><span className="app-info-value">{selectedApplicant.branch || 'N/A'}</span></div>
                  <div className="app-info-item"><span className="app-info-label">Landline Number</span><span className="app-info-value">{getLandlineNumber(selectedApplicant)}</span></div>
                  <div className="app-info-item"><span className="app-info-label">Position Applied</span><span className="app-info-value">{selectedApplicant.position || 'N/A'}</span></div>
                </div>

                <div className="app-address-title">Address</div>
                <div className="app-address-grid">
                  <div className="app-info-item"><span className="app-info-label">Region</span><span className="app-info-value">{selectedApplicant.region || 'N/A'}</span></div>
                  <div className="app-info-item"><span className="app-info-label">Province</span><span className="app-info-value">{selectedApplicant.province || 'N/A'}</span></div>
                  <div className="app-info-item"><span className="app-info-label">City/Municipality</span><span className="app-info-value">{selectedApplicant.city || 'N/A'}</span></div>
                  <div className="app-info-item"><span className="app-info-label">Barangay</span><span className="app-info-value">{selectedApplicant.barangay || 'N/A'}</span></div>
                  <div className="app-info-item" style={{ gridColumn: 'span 2' }}><span className="app-info-label">Detailed Address</span><span className="app-info-value">{selectedApplicant.detailedAddress || 'N/A'}</span></div>
                </div>
              </section>

              <section>
                <div className="app-section-header">
                  <FileText className="app-section-icon" size={20} />
                  <span className="app-section-title">Documents</span>
                </div>
                <div className="app-doc-list">
                  {selectedApplicant.resume_url ? (
                    <div className="app-doc-card">
                      <div className="app-doc-info">
                        <div className="app-doc-icon-box"><FileText size={24} strokeWidth={1.5} /></div>
                        <div className="app-doc-details">
                          <span className="app-doc-type">Resume</span>
                          <span className="app-doc-name">{selectedApplicant.name.replace(/\s+/g, '_')}_Resume.pdf</span>
                        </div>
                      </div>
                      <div className="app-doc-actions">
                        <button className="app-btn-doc" onClick={() => window.open(selectedApplicant.resume_url, '_blank')}>
                          <Eye size={16} /> View
                        </button>
                        <a href={selectedApplicant.resume_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                          <button className="app-btn-doc">
                            <Download size={16} /> Download
                          </button>
                        </a>
                      </div>
                    </div>
                  ) : <p className="no-data modal-text-helper">No Resume Uploaded</p>}

                  {getApplicationLetterUrl(selectedApplicant) ? (
                    <div className="app-doc-card">
                      <div className="app-doc-info">
                        <div className="app-doc-icon-box"><FileText size={24} strokeWidth={1.5} /></div>
                        <div className="app-doc-details">
                          <span className="app-doc-type">Application Letter</span>
                          <span className="app-doc-name">{selectedApplicant.name.replace(/\s+/g, '_')}_ApplicationLetter.pdf</span>
                        </div>
                      </div>
                      <div className="app-doc-actions">
                        <button className="app-btn-doc" onClick={() => window.open(getApplicationLetterUrl(selectedApplicant), '_blank')}>
                          <Eye size={16} /> View
                        </button>
                        <a href={getApplicationLetterUrl(selectedApplicant)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                          <button className="app-btn-doc">
                            <Download size={16} /> Download
                          </button>
                        </a>
                      </div>
                    </div>
                  ) : <p className="no-data modal-text-helper">No Application Letter Uploaded</p>}
                </div>
              </section>

              <section>
                <div className="app-section-header">
                  <FileText className="app-section-icon" size={20} />
                  <span className="app-section-title">Medical Condition Declaration</span>
                </div>
                <div className="app-medical-box">
                  <div className="app-info-item">
                    <span className="app-info-label">Has Pre-existing Medical Conditions?</span>
                    <span className="app-info-value">
                      {selectedApplicant.medicalCondition
                        ? selectedApplicant.medicalCondition.charAt(0).toUpperCase() + selectedApplicant.medicalCondition.slice(1).toLowerCase()
                        : 'No'}
                    </span>
                  </div>
                  {selectedApplicant.medicalCondition === 'yes' && (
                    <div className="app-info-item app-medical-detail">
                      <span className="app-info-label">Condition Details</span>
                      <span className="app-info-value">{selectedApplicant.medicalDetails || 'No details provided'}</span>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {String(selectedApplicant.status || '').toLowerCase() === 'applied' && (
              <div className="app-modal-footer">
                <button
                  className="app-btn-approve interview-action footer-action"
                  onClick={() => openStatusConfirmation(selectedApplicant, 'Interview')}
                >
                  Approve for Interview
                </button>
                <button
                  className="app-btn-reject footer-action"
                  onClick={() => openStatusConfirmation(selectedApplicant, 'Rejected')}
                >
                  <XCircle size={18} strokeWidth={2.5} /> Reject Application
                </button>
              </div>
            )}

            {String(selectedApplicant.status || '').toLowerCase() === 'interview' && (
              <div className="app-modal-footer">
                <button
                  className="app-btn-approve footer-action hire-action"
                  onClick={() => openStatusConfirmation(selectedApplicant, 'Hired')}
                >
                  <CheckCircle size={18} strokeWidth={2.5} /> Hire Applicant
                </button>
                <button
                  className="app-btn-reject footer-action"
                  onClick={() => openStatusConfirmation(selectedApplicant, 'Rejected')}
                >
                  <XCircle size={18} strokeWidth={2.5} /> Reject Applicant
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={Boolean(confirmAction)}
        title={confirmAction ? `Confirm ${confirmAction.status}` : ''}
        message={confirmAction ? `Are you sure you want to mark ${confirmAction.applicantName || 'this applicant'} as ${confirmAction.status}?` : ''}
        confirmLabel={confirmAction ? `Yes, mark as ${confirmAction.status}` : 'Confirm'}
        tone={getConfirmationTone(confirmAction?.status)}
        loading={statusUpdateLoading}
        onCancel={() => {
          if (!statusUpdateLoading) setConfirmAction(null);
        }}
        onConfirm={() => handleUpdateStatus(confirmAction.applicantId, confirmAction.status)}
      />
    </div>
  );
};

export default Applicants;
