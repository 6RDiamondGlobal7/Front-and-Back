import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Search,
  MapPin,
  MoreVertical,
  Briefcase,
  Users,
  Eye,
  Plus,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  X,
  XCircle,
  Trash2
} from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import './JobPostings.css';
import CustomSelect from '../components/CustomSelect';

const DEFAULT_CONTRACT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];

const buildDefaultDescription = (jobTitle = '') => {
  return [
    `- Lead and execute core responsibilities for ${jobTitle || 'this role'}`,
    '- Coordinate with cross-functional teams for daily operations',
    '- Ensure quality output and compliance with internal policies',
    '- Support continuous process improvement and reporting'
  ].join('\n');
};

const JobPostings = () => {
  const API_BASE_URL = getApiBaseUrl();

  const [jobs, setJobs] = useState([]);
  const [summary, setSummary] = useState({
    activeJobPosts: 0,
    totalApplications: 0,
    viewsThisMonth: 0
  });

  const [jobDescriptions, setJobDescriptions] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeMenu, setActiveMenu] = useState(null);
  const [activeFilterMenu, setActiveFilterMenu] = useState(null);

  const [activeModal, setActiveModal] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    department: '',
    contract_type: '',
    description: ''
  });

  const [createForm, setCreateForm] = useState({
    job_title: '',
    department: '',
    branch: '',
    contract_type: 'Full-time',
    description: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedBranch, setSelectedBranch] = useState('All Branches');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getDescriptionForJob = (job) => {
    if (!job) return '';
    return jobDescriptions[job.job_id] || buildDefaultDescription(job.job_title);
  };

  const fetchJobPostingsDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE_URL}/api/job-postings/dashboard`);
      const payload = response.data || {};
      const incomingJobs = Array.isArray(payload.jobs) ? payload.jobs : [];

      setJobs(incomingJobs);
      setSummary({
        activeJobPosts: Number(payload.summary?.activeJobPosts || 0),
        totalApplications: Number(payload.summary?.totalApplications || 0),
        viewsThisMonth: Number(payload.summary?.viewsThisMonth || 0)
      });

      setJobDescriptions((prev) => {
        const next = { ...prev };
        incomingJobs.forEach((job) => {
          if (!next[job.job_id]) {
            next[job.job_id] = buildDefaultDescription(job.job_title);
          }
        });
        return next;
      });
    } catch (err) {
      console.error('Failed to load job postings dashboard:', err);
      setError('Unable to load job postings data.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobPostingsDashboard();
  }, [API_BASE_URL]);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenu(null);
      setActiveFilterMenu(null);
    };

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const departments = useMemo(() => {
    const values = Array.from(new Set(jobs.map((job) => job.department).filter(Boolean)));
    return ['All Departments', ...values.sort((a, b) => a.localeCompare(b))];
  }, [jobs]);

  const editableDepartments = useMemo(() => departments.filter((d) => d !== 'All Departments'), [departments]);
  const createDepartments = useMemo(() => {
    const fallback = ['Brokerage', 'Operations', 'Logistics', 'Documentation', 'Admin'];
    return editableDepartments.length > 0 ? editableDepartments : fallback;
  }, [editableDepartments]);

  const allBranches = useMemo(() => {
    const values = Array.from(new Set(jobs.map((job) => job.branch).filter(Boolean)));
    return ['All Branches', ...values.sort((a, b) => a.localeCompare(b))];
  }, [jobs]);

  const createBranches = useMemo(() => {
    const fallback = ['Manila', 'Cebu', 'Davao'];
    const clean = allBranches.filter((b) => b !== 'All Branches');
    return clean.length > 0 ? clean : fallback;
  }, [allBranches]);

  const contractTypes = useMemo(() => {
    const values = Array.from(new Set(jobs.map((job) => job.contract_type).filter(Boolean)));
    return Array.from(new Set([...DEFAULT_CONTRACT_TYPES, ...values]));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const title = String(job.job_title || '').toLowerCase();
      const matchesSearch = title.includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === 'All Departments' || job.department === selectedDept;
      const matchesBranch = selectedBranch === 'All Branches' || job.branch === selectedBranch;
      return matchesSearch && matchesDept && matchesBranch;
    });
  }, [jobs, searchQuery, selectedDept, selectedBranch]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / itemsPerPage));

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(start, start + itemsPerPage);
  }, [filteredJobs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept, selectedBranch]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const toggleActionMenu = (e, jobId) => {
    e.stopPropagation();
    setActiveFilterMenu(null);
    setActiveMenu(activeMenu === jobId ? null : jobId);
  };

  const toggleFilterMenu = (e, type) => {
    e.stopPropagation();
    setActiveMenu(null);
    setActiveFilterMenu(activeFilterMenu === type ? null : type);
  };

  const selectFilterOption = (type, value) => {
    if (type === 'dept') setSelectedDept(value);
    if (type === 'branch') setSelectedBranch(value);
    setActiveFilterMenu(null);
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusLabel = (status) => {
    if (status === true || status === 'true' || status === 'Active' || status === 'Open') return 'Active';
    return 'Closed';
  };

  const getStatusClassName = (status) => getStatusLabel(status).toLowerCase();

  const openModal = (type, job = null) => {
    setSelectedJob(job);
    setActiveModal(type);
    setActiveMenu(null);

    if (type === 'edit' && job) {
      setEditForm({
        department: job.department || '',
        contract_type: job.contract_type || contractTypes[0] || 'Full-time',
        description: getDescriptionForJob(job)
      });
    }

    if (type === 'create') {
      setCreateForm({
        job_title: '',
        department: createDepartments[0] || '',
        branch: createBranches[0] || '',
        contract_type: contractTypes[0] || 'Full-time',
        description: ''
      });
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedJob(null);
    setSaving(false);
  };

  const handleCreateJob = async () => {
    if (!createForm.job_title.trim()) {
      alert('Job title is required.');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/jobs`, {
        job_title: createForm.job_title,
        department: createForm.department,
        branch: createForm.branch,
        contract_type: createForm.contract_type
      });

      const created = response.data?.job;
      if (created?.job_id) {
        setJobDescriptions((prev) => ({
          ...prev,
          [created.job_id]: createForm.description || buildDefaultDescription(created.job_title)
        }));
      }

      closeModal();
      fetchJobPostingsDashboard();
    } catch (err) {
      console.error('Failed to create job posting:', err);
      alert('Failed to create job posting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!selectedJob) return;

    setSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/api/jobs/${selectedJob.job_id}`, {
        department: editForm.department,
        contract_type: editForm.contract_type
      });

      setJobs((prev) => prev.map((job) => (
        job.job_id === selectedJob.job_id
          ? { ...job, department: editForm.department, contract_type: editForm.contract_type }
          : job
      )));

      setJobDescriptions((prev) => ({ ...prev, [selectedJob.job_id]: editForm.description }));
      closeModal();
      fetchJobPostingsDashboard();
    } catch (err) {
      console.error('Failed to update job posting:', err);
      alert('Failed to update job posting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClosePosition = async () => {
    if (!selectedJob) return;

    setSaving(true);
    try {
      await axios.patch(`${API_BASE_URL}/api/jobs/${selectedJob.job_id}/status`, { job_status: false });
      setJobs((prev) => prev.map((job) => (
        job.job_id === selectedJob.job_id ? { ...job, job_status: false } : job
      )));
      closeModal();
      fetchJobPostingsDashboard();
    } catch (err) {
      console.error('Failed to close position:', err);
      alert('Failed to close position. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPosition = async (job) => {
    if (!job) return;

    setSaving(true);
    try {
      await axios.patch(`${API_BASE_URL}/api/jobs/${job.job_id}/status`, { job_status: true });
      setJobs((prev) => prev.map((item) => (
        item.job_id === job.job_id ? { ...item, job_status: true } : item
      )));
      fetchJobPostingsDashboard();
    } catch (err) {
      console.error('Failed to open position:', err);
      alert('Failed to open position. Please try again.');
    } finally {
      setSaving(false);
      setActiveMenu(null);
    }
  };

  const handleDeleteJob = async () => {
    if (!selectedJob) return;

    setSaving(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/jobs/${selectedJob.job_id}`);
      setJobs((prev) => prev.filter((job) => job.job_id !== selectedJob.job_id));
      closeModal();
      fetchJobPostingsDashboard();
    } catch (err) {
      console.error('Failed to delete job posting:', err);
      alert('Failed to delete job posting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    {
      label: 'Active Job Posts',
      value: summary.activeJobPosts,
      icon: <Briefcase size={20} />,
      bgColor: '#DCFCE7',
      color: '#16A34A'
    },
    {
      label: 'Total Applications',
      value: summary.totalApplications,
      icon: <Users size={20} />,
      bgColor: '#E0E7FF',
      color: '#6366F1'
    },
    {
      label: 'Views This Month',
      value: summary.viewsThisMonth.toLocaleString('en-US'),
      icon: <Eye size={20} />,
      bgColor: '#FFEDD5',
      color: '#EA580C'
    }
  ];

  return (
      <div className="jobs-container">
      <div className="hr-page-heading">
        <div className="hr-page-icon"><Briefcase size={22} /></div>
        <div className="title-text">
          <h2>Job Posting Management</h2>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="filters-card">
        <div className="search-box-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-actions-right">
          <div className="custom-dropdown-container">
            <div className="custom-dropdown-btn" onClick={(e) => toggleFilterMenu(e, 'dept')}>
              <div className="custom-dropdown-btn-main">
                <Filter size={14} style={{ color: '#94a3b8' }} />
                <span>{selectedDept}</span>
              </div>
              <ChevronDown size={16} className={`custom-dropdown-chevron ${activeFilterMenu === 'dept' ? 'open' : ''}`} />
            </div>
            {activeFilterMenu === 'dept' && (
              <div className="filter-drop-menu" onClick={(e) => e.stopPropagation()}>
                {departments.map((dept) => (
                  <div
                    key={dept}
                    className={`filter-drop-item ${selectedDept === dept ? 'selected' : ''}`}
                    onClick={() => selectFilterOption('dept', dept)}
                  >
                    {dept}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="custom-dropdown-container">
            <div className="custom-dropdown-btn" onClick={(e) => toggleFilterMenu(e, 'branch')}>
              <div className="custom-dropdown-btn-main">
                <Filter size={14} style={{ color: '#94a3b8' }} />
                <span>{selectedBranch}</span>
              </div>
              <ChevronDown size={16} className={`custom-dropdown-chevron ${activeFilterMenu === 'branch' ? 'open' : ''}`} />
            </div>
            {activeFilterMenu === 'branch' && (
              <div className="filter-drop-menu" onClick={(e) => e.stopPropagation()}>
                {allBranches.map((branch) => (
                  <div
                    key={branch}
                    className={`filter-drop-item ${selectedBranch === branch ? 'selected' : ''}`}
                    onClick={() => selectFilterOption('branch', branch)}
                  >
                    {branch}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="add-new-btn" type="button" onClick={() => openModal('create')}>
            <Plus size={16} strokeWidth={2.5} /> Add New Job Opening
          </button>
        </div>
      </div>

      <div className="table-card">
        {loading && <div className="no-results"><h3>Loading job postings...</h3></div>}
        {!loading && error && <div className="no-results"><h3>{error}</h3></div>}

        {!loading && !error && (
          <>
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>JOB TITLE</th>
                  <th>DEPARTMENT</th>
                  <th>BRANCH</th>
                  <th>CONTRACT TYPE</th>
                  <th>APPLICANTS</th>
                  <th>DATE POSTED</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedJobs.map((job) => {
                  const statusLabel = getStatusLabel(job.job_status);
                  const isClosed = statusLabel === 'Closed';

                  return (
                    <tr key={job.job_id}>
                      <td className="bold-text">{job.job_title || 'N/A'}</td>
                      <td>{job.department || 'N/A'}</td>
                      <td>
                        <div className="branch-cell">
                          <MapPin size={14} color="#94a3b8" />
                          <span>{job.branch || 'N/A'}</span>
                        </div>
                      </td>
                      <td><span className="type-badge">{job.contract_type || 'N/A'}</span></td>
                      <td>
                        <div className="applicant-cell">
                          <Users size={14} color="#5d9cec" />
                          <strong>{job.total_applicants || 0}</strong> applicants
                        </div>
                      </td>
                      <td>{formatDate(job.date_posted)}</td>
                      <td><span className={`status-badge ${getStatusClassName(job.job_status)}`}>{statusLabel}</span></td>
                      <td className="action-cell">
                        <button className="dots-btn" type="button" onClick={(e) => toggleActionMenu(e, job.job_id)}>
                          <MoreVertical size={18} />
                        </button>
                        {activeMenu === job.job_id && (
                          <div className="action-dropdown" onClick={(e) => e.stopPropagation()}>
                            <button className="drop-item view" type="button" onClick={() => openModal('view', job)}>
                              <Eye size={16} /> View Description
                            </button>
                            <button className="drop-item" type="button" onClick={() => openModal('edit', job)}>
                              <Edit size={16} /> Edit Job
                            </button>
                            {isClosed ? (
                              <button className="drop-item open-action" type="button" onClick={() => handleOpenPosition(job)}>
                                <Plus size={16} /> Open Position
                              </button>
                            ) : (
                              <button className="drop-item close-action" type="button" onClick={() => openModal('close', job)}>
                                <XCircle size={16} /> Close Position
                              </button>
                            )}
                            <div className="drop-divider"></div>
                            <button className="drop-item delete-action" type="button" onClick={() => openModal('delete', job)}>
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredJobs.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="no-results">
                        <h3>No job postings found</h3>
                        <p>Try changing search text or filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="table-footer">
              <span className="pagination-info">
                Showing {filteredJobs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                -
                {Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length} job postings
              </span>
              <div className="pagination-controls">
                <button
                  className="page-text-btn"
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      className={`page-btn ${currentPage === pageNumber ? 'active' : ''}`}
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>
                <button
                  className="page-text-btn"
                  type="button"
                  disabled={currentPage === totalPages || filteredJobs.length === 0}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {activeModal === 'create' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Job Opening</h3>
              <button className="modal-close-btn" onClick={closeModal}><X size={22} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Job Title</label>
                <input
                  className="form-input"
                  value={createForm.job_title}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, job_title: e.target.value }))}
                  placeholder="e.g. Licensed Customs Broker"
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <CustomSelect
                  className="form-select"
                  value={createForm.department}
                  onChange={(nextValue) => setCreateForm((prev) => ({ ...prev, department: nextValue }))}
                  options={createDepartments}
                />
              </div>
              <div className="form-group">
                <label>Branch</label>
                <CustomSelect
                  className="form-select"
                  value={createForm.branch}
                  onChange={(nextValue) => setCreateForm((prev) => ({ ...prev, branch: nextValue }))}
                  options={createBranches}
                />
              </div>
              <div className="form-group">
                <label>Contract Type</label>
                <CustomSelect
                  className="form-select"
                  value={createForm.contract_type}
                  onChange={(nextValue) => setCreateForm((prev) => ({ ...prev, contract_type: nextValue }))}
                  options={contractTypes}
                />
              </div>
              <div className="form-group">
                <label>Job Description</label>
                <textarea
                  className="form-textarea"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={buildDefaultDescription(createForm.job_title || 'this role')}
                />
              </div>
            </div>
            <div className="modal-footer modal-footer-split">
              <button className="btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="btn-save" onClick={handleCreateJob} disabled={saving}>{saving ? 'Creating...' : 'Create Job'}</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'view' && selectedJob && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>View Description</h3>
              <button className="modal-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="view-description-box">
                <strong>{selectedJob.job_title}</strong>
                <pre className="description-pre">{getDescriptionForJob(selectedJob)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'edit' && selectedJob && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Job Posting</h3>
              <button className="modal-close-btn" onClick={closeModal}><X size={22} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Job Title</label>
                <input className="form-input" value={selectedJob.job_title || ''} readOnly />
              </div>
              <div className="form-group">
                <label>Department</label>
                <CustomSelect
                  className="form-select"
                  value={editForm.department}
                  onChange={(nextValue) => setEditForm((prev) => ({ ...prev, department: nextValue }))}
                  options={editableDepartments}
                />
              </div>
              <div className="form-group">
                <label>Contract Type</label>
                <CustomSelect
                  className="form-select"
                  value={editForm.contract_type}
                  onChange={(nextValue) => setEditForm((prev) => ({ ...prev, contract_type: nextValue }))}
                  options={contractTypes}
                />
              </div>
              <div className="form-group">
                <label>Job Description</label>
                <textarea
                  className="form-textarea"
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer modal-footer-split">
              <button className="btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="btn-save" onClick={handleEditSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'close' && selectedJob && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container close-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header close-modal-header">
              <div className="close-modal-title-wrap">
                <div className="close-icon-pill"><XCircle size={20} /></div>
                <h3>Close Job Position</h3>
              </div>
              <button className="modal-close-btn" onClick={closeModal}><X size={22} /></button>
            </div>
            <div className="modal-body close-modal-body">
              <p>Are you sure you want to close "{selectedJob.job_title}"? This will stop accepting new applications for this position.</p>
            </div>
            <div className="modal-footer modal-footer-split">
              <button className="btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="btn-close-position" onClick={handleClosePosition} disabled={saving}>{saving ? 'Closing...' : 'Close Position'}</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'delete' && selectedJob && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container close-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header close-modal-header">
              <div className="close-modal-title-wrap">
                <div className="close-icon-pill"><Trash2 size={20} /></div>
                <h3>Delete Job Posting</h3>
              </div>
              <button className="modal-close-btn" onClick={closeModal}><X size={22} /></button>
            </div>
            <div className="modal-body close-modal-body">
              <p>Are you sure you want to delete "{selectedJob.job_title}"? This action cannot be undone.</p>
            </div>
            <div className="modal-footer modal-footer-split">
              <button className="btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="btn-delete-position" onClick={handleDeleteJob} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostings;
