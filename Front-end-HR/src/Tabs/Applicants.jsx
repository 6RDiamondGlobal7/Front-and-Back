import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ChevronLeft, ChevronRight, Eye, Download, ChevronDown,
  Search, Mail, Phone, FileText, CheckCircle, X, XCircle // Added CheckCircle here
} from 'lucide-react';
import './Applicants.css';
import { getApiBaseUrl } from '../config/api';

const Applicants = () => {
  const API_BASE_URL = getApiBaseUrl();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [positionFilter, setPositionFilter] = useState('All Positions');
  const [branchFilter, setBranchFilter] = useState('All Branches');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- FORMATTING HELPERS ---
  const formatPosition = (id) => {
    if (!id || id === 'Not assigned' || id === 'Not specified') return id;
    const roles = {
      'corp-sec': 'Corporate Secretary',
      'licensed-broker': 'Licensed Customs Broker',
      'office-manager': 'Office Manager',
      'messenger': 'Messenger / Logistics',
      'secretary': 'Secretary to the Office Manager',
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

  // --- FETCH DATA ---
  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/applicants`);

      // Format the branch and position immediately upon receiving the data
      const formattedData = response.data.map((app) => ({
        ...app,
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchApplicants();
  }, [API_BASE_URL]);

  // --- HANDLE STATUS UPDATE ---
  const handleUpdateStatus = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this applicant as ${newStatus}?`)) return;

    try {
      await axios.put(`${API_BASE_URL}/api/applicants/${id}/status`, { status: newStatus });
      setApplicants((prev) => prev.map((app) => (
        app.id === id ? { ...app, status: newStatus } : app
      )));
      setSelectedApplicant(null);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  // --- FILTERS & PAGINATION ---
  const positions = ['All Positions', ...new Set(applicants.map((item) => item.position))];
  const branches = ['All Branches', ...new Set(applicants.map((item) => item.branch))];

  const filteredData = applicants.filter((app) => {
    const appStatus = (app.status || '').toLowerCase();
    const appName = (app.name || '').toLowerCase();
    const appId = (app.id || '').toLowerCase();
    const matchesStatus = statusFilter === 'All' || appStatus === statusFilter.toLowerCase();
    const matchesPosition = positionFilter === 'All Positions' || app.position === positionFilter;
    const matchesBranch = branchFilter === 'All Branches' || app.branch === branchFilter;
    const matchesSearch = appName.includes(searchQuery.toLowerCase()) || appId.includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPosition && matchesBranch && matchesSearch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const updateStatus = (val) => { setStatusFilter(val); setCurrentPage(1); };

  const handleDownloadResume = (app) => {
    if (!app?.resume_url) {
      alert('No resume uploaded for this applicant.');
      return;
    }
    window.open(app.resume_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="applicants-container">
      {/* HEADER */}
      <div className="tab-title-area">
        <div className="title-icon">👥</div>
        <h2>Applicants</h2>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="top-tabs-card">
        {['All', 'Applied', 'Interview', 'Hired', 'Rejected'].map((tab, index, array) => {
          const count = applicants.filter((a) => (
            tab === 'All' ? true : (a.status || '').toLowerCase() === tab.toLowerCase()
          )).length;

          return (
            <React.Fragment key={tab}>
              <button
                className={`tab-btn ${statusFilter === tab ? 'active' : ''}`}
                onClick={() => updateStatus(tab)}
              >
                {tab} ({count})
              </button>
              {index < array.length - 1 && <span className="tab-divider">|</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* FILTERS AREA */}
      <div className="filters-card">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search by name or ID..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="select-wrapper">
          <FileText className="select-left-icon" size={18} />
          <select className="filter-select" value={positionFilter} onChange={(e) => { setPositionFilter(e.target.value); setCurrentPage(1); }}>
            {positions.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
          </select>
          <ChevronDown className="select-right-icon" size={18} />
        </div>

        <div className="select-wrapper">
          <Search className="select-left-icon" size={18} />
          <select className="filter-select" value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}>
            {branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
          </select>
          <ChevronDown className="select-right-icon" size={18} />
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="applicants-table">
          <thead>
            <tr>
              <th>Applicant #</th>
              <th>Name</th>
              <th>Contact Information</th>
              <th>Status</th>
              <th>Position</th>
              <th>Branch</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="no-data">Loading applicants...</td></tr>
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
                  <td>
                    <span className={`status-pill ${(app.status || '').toLowerCase()}`}>
                      {app.status}
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
              <tr><td colSpan="7" className="no-data">No applicants found matching filters.</td></tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {currentItems.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
          </div>
          <div className="pagination-controls">
            <button
              className="page-nav-text"
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
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
              Next
              <ChevronRight size={14} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL (PROTOTYPE DESIGN) */}
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
              {/* PERSONAL INFO */}
              <section>
                <div className="app-section-header">
                  <FileText className="app-section-icon" size={20} />
                  <span className="app-section-title">Personal Information</span>
                </div>
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

              {/* DOCUMENTS */}
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
                  ) : <p className="no-data" style={{ fontSize: '0.85rem', color: '#718096', paddingLeft: '10px' }}>No Resume Uploaded</p>}

                  {selectedApplicant.cover_letter_url ? (
                    <div className="app-doc-card">
                      <div className="app-doc-info">
                        <div className="app-doc-icon-box"><FileText size={24} strokeWidth={1.5} /></div>
                        <div className="app-doc-details">
                          <span className="app-doc-type">Cover Letter</span>
                          <span className="app-doc-name">{selectedApplicant.name.replace(/\s+/g, '_')}_CoverLetter.pdf</span>
                        </div>
                      </div>
                      <div className="app-doc-actions">
                        <button className="app-btn-doc" onClick={() => window.open(selectedApplicant.cover_letter_url, '_blank')}>
                          <Eye size={16} /> View
                        </button>
                        <a href={selectedApplicant.cover_letter_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                          <button className="app-btn-doc">
                            <Download size={16} /> Download
                          </button>
                        </a>
                      </div>
                    </div>
                  ) : <p className="no-data" style={{ fontSize: '0.85rem', color: '#718096', paddingLeft: '10px' }}>No Cover Letter Uploaded</p>}
                </div>
              </section>

              {/* MEDICAL CONDITION */}
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
                    <div className="app-info-item" style={{ marginTop: '15px' }}>
                      <span className="app-info-label">Condition Details</span>
                      <span className="app-info-value">{selectedApplicant.medicalDetails || 'No details provided'}</span>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* ACTION BUTTONS FOR "APPLIED" STATUS */}
            {(selectedApplicant.status || '').toLowerCase() === 'applied' && (
              <div className="app-modal-footer" style={{ display: 'flex', gap: '15px', padding: '0 24px 24px 24px' }}>
                <button
                  className="app-btn-approve"
                  style={{ flex: 1, padding: '14px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                  onClick={() => handleUpdateStatus(selectedApplicant.id, 'Interview')}
                >
                  Approve for Interview
                </button>
                <button
                  className="app-btn-reject"
                  style={{ flex: 1, padding: '14px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  onClick={() => handleUpdateStatus(selectedApplicant.id, 'Rejected')}
                >
                  <XCircle size={18} strokeWidth={2.5} /> Reject Application
                </button>
              </div>
            )}

            {/* ACTION BUTTONS FOR "INTERVIEW" STATUS */}
            {(selectedApplicant.status || '').toLowerCase() === 'interview' && (
              <div className="app-modal-footer" style={{ display: 'flex', gap: '15px', padding: '0 24px 24px 24px' }}>
                <button
                  className="app-btn-approve"
                  style={{ flex: 1, padding: '14px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', backgroundColor: '#22c55e' }} // Green color for Hire
                  onClick={() => handleUpdateStatus(selectedApplicant.id, 'Hired')}
                >
                  <CheckCircle size={18} strokeWidth={2.5} /> Hire Applicant
                </button>
                <button
                  className="app-btn-reject"
                  style={{ flex: 1, padding: '14px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  onClick={() => handleUpdateStatus(selectedApplicant.id, 'Rejected')}
                >
                  <XCircle size={18} strokeWidth={2.5} /> Reject Applicant
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
};

export default Applicants;