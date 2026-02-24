import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { 
  MoreVertical, 
  Edit, 
  Copy, 
  XCircle, 
  CheckCircle, 
  Trash2 
} from 'lucide-react'; 

const JobPostings = () => {
  // --- UI & Menu State ---
  const [activeMenu, setActiveMenu] = useState(null); 
  const [activeBranchMenu, setActiveBranchMenu] = useState(null);
  const [activeFilterMenu, setActiveFilterMenu] = useState(null); 
  const [modalType, setModalType] = useState(null); 
  const [selectedJob, setSelectedJob] = useState(null);
  
  // --- Data State ---
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Filter State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedBranch, setSelectedBranch] = useState('All Branches');

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const departments = ['All Departments', 'Brokerage', 'Operations', 'Logistics', 'Documentation', 'Sales', 'Admin'];
  const allBranches = ['All Branches', 'Manila', 'Cebu', 'Davao'];

  // --- 1. FETCH DATA ---
  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobpostings')
      .select('*')
      .order('date_posted', { ascending: false });

    if (error) console.error('Error fetching jobs:', error);
    else setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // --- 2. STATS ---
  const activeJobsCount = jobs.filter(j => j.job_status === true).length;
  const totalApplicantsCount = jobs.reduce((sum, job) => sum + (job.total_applicants || 0), 0);

  const stats = [
    { label: 'Active Job Posts', value: activeJobsCount, icon: '🏦', color: '#e6fff0' },
    { label: 'Total Applications', value: totalApplicantsCount, icon: '👥', color: '#e6f0ff' },
    { label: 'Views This Month', value: '1,247', icon: '👁️', color: '#fff0e6' },
  ];

  // --- 3. FILTERING & GROUPING LOGIC ---
  const filteredJobs = useMemo(() => {
    let filtered = jobs.filter(job => {
      const matchesSearch = job.job_title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === 'All Departments' || job.department === selectedDept;
      return matchesSearch && matchesDept;
    });

    if (selectedBranch !== 'All Branches') {
      return filtered.filter(job => job.branch === selectedBranch);
    } else {
      const grouped = filtered.reduce((acc, job) => {
        if (!acc[job.job_title]) {
          acc[job.job_title] = {
            ...job, 
            isGrouped: true, 
            branchList: [], 
            total_applicants: 0, 
            hasActiveBranch: false, 
            id: job.job_title 
          };
        }
        acc[job.job_title].branchList.push(job);
        acc[job.job_title].total_applicants += (job.total_applicants || 0);
        
        // Check Boolean status
        if (job.job_status === true) acc[job.job_title].hasActiveBranch = true;
        
        return acc;
      }, {});
      return Object.values(grouped);
    }
  }, [jobs, searchQuery, selectedDept, selectedBranch]);

  // --- 4. PAGINATION LOGIC ---
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedDept, selectedBranch]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  // --- 5. ACTIONS ---

  const toggleJobStatus = async (job_id, currentStatus) => {
    const newStatus = !currentStatus; // Flip Boolean
    
    // Optimistic Update
    setJobs(jobs.map(j => j.job_id === job_id ? { ...j, job_status: newStatus } : j));
    
    // Database Update
    const { error } = await supabase
      .from('jobpostings')
      .update({ job_status: newStatus }) 
      .eq('job_id', job_id);
    
    if (error) {
        console.error("Error updating:", error);
        fetchJobs(); 
    }
  };

  const handleDeleteJob = async () => {
    if (!selectedJob) return;
    const { error } = await supabase.from('jobpostings').delete().eq('job_id', selectedJob.job_id);
    if (!error) {
      setJobs(jobs.filter(j => j.job_id !== selectedJob.job_id));
      setModalType(null);
    }
  };

  const handleDuplicateJob = async (jobToDuplicate) => {
    const { job_id, created_at, ...jobData } = jobToDuplicate; 
    const { data, error } = await supabase.from('jobpostings').insert([
        { ...jobData, job_title: `${jobData.job_title} (Copy)`, date_posted: new Date(), job_status: true }
    ]).select();

    if (!error) {
        fetchJobs(); 
        setActiveMenu(null);
    }
  };

  const handleCloseJobModal = async () => {
    if (!selectedJob) return;
    // Pass 'true' (Active) so it flips to 'false' (Closed)
    await toggleJobStatus(selectedJob.job_id, true); 
    setModalType(null);
    setSelectedJob(null); 
  };

  // --- MENU HANDLERS ---
  const toggleActionMenu = (e, identifier) => {
    e.stopPropagation();
    setActiveBranchMenu(null);
    setActiveFilterMenu(null);
    setActiveMenu(activeMenu === identifier ? null : identifier);
  };

  const toggleBranchMenu = (e, identifier) => {
    e.stopPropagation();
    setActiveMenu(null); 
    setActiveBranchMenu(activeBranchMenu === identifier ? null : identifier);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenu(null);
      setActiveBranchMenu(null);
      setActiveFilterMenu(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="jobs-container">
      <style>{`
        .jobs-container { display: flex; flex-direction: column; gap: 24px; color: #2d3748; font-family: 'Inter', sans-serif; }
        .page-identifier { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #718096; margin-bottom: -10px; }
        .page-identifier .root { font-weight: 500; }
        .page-identifier .separator { color: #cbd5e0; }
        .page-identifier .current { color: #2d3748; font-weight: 600; }
        .header-with-icon { display: flex; align-items: center; gap: 15px; }
        .title-icon-box { background: white; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-size: 1.4rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .title-text h2 { font-size: 1.4rem; margin: 0; }
        .title-text p { font-size: 0.9rem; color: #718096; margin: 2px 0 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .stat-card { background: white; padding: 25px; border-radius: 15px; display: flex; align-items: center; gap: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        .stat-info { display: flex; flex-direction: column; }
        .stat-label { font-size: 0.85rem; color: #718096; font-weight: 500; }
        .stat-value { font-size: 1.8rem; font-weight: 800; }
        .filters-container { background: white; padding: 15px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02); position: relative; z-index: 100; }
        .search-box { display: flex; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 8px; width: 300px; }
        .search-box input { border: none; background: transparent; margin-left: 10px; outline: none; width: 100%; }
        .filter-dropdowns { display: flex; gap: 12px; align-items: center; }
        .custom-dropdown-btn { padding: 10px 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #4a5568; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 10px; position: relative; min-width: 170px; justify-content: space-between; }
        .custom-dropdown-btn:hover { border-color: #5d9cec; color: #5d9cec; }
        .custom-dropdown-btn.active-applied { border-color: #5d9cec; color: #5d9cec; background: #f0f7ff; }
        .filter-drop-menu { position: absolute; top: 110%; left: 0; background: white; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 1500; width: 100%; padding: 6px; border: 1px solid #edf2f7; }
        .filter-drop-item { padding: 10px 12px; font-size: 0.85rem; color: #4a5568; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
        .filter-drop-item:hover { background: #f8fafc; color: #5d9cec; }
        .filter-drop-item.selected { background: #5d9cec; color: white; }
        .add-new-btn { background: #5d9cec; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .table-card { background: white; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden; min-height: 400px; display: flex; flex-direction: column; justify-content: space-between; }
        .jobs-table { width: 100%; border-collapse: collapse; }
        .jobs-table th { background: #f8fafc; padding: 15px 20px; text-align: left; font-size: 0.75rem; color: #718096; border-bottom: 1px solid #edf2f7; }
        .jobs-table td { padding: 18px 20px; border-bottom: 1px solid #f7fafc; font-size: 0.85rem; }
        .bold-text { font-weight: 700; color: #2d3748; }
        .type-badge { background: #eef2ff; color: #5d9cec; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.75rem; }
        
        /* STATUS BADGE BUTTONS */
        .status-badge { padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; display: inline-block; border: none; cursor: pointer; }
        .status-badge.active { background: #e6fff0; color: #2ecc71; }
        .status-badge.closed { background: #fff5f5; color: #f56565; }
        .status-badge.mixed { background: #fffaf0; color: #ed8936; cursor: default; }

        .action-cell { position: relative; text-align: center; }
        .dots-btn { background: none; border: none; font-size: 1.2rem; color: #94a3b8; cursor: pointer; padding: 8px; border-radius: 50%; transition: background 0.2s; }
        .dots-btn:hover { background: #f1f5f9; color: #2d3748; }
        
        .action-dropdown { position: absolute; right: 30px; top: 10px; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); z-index: 2000; width: 200px; padding: 8px; border: 1px solid #edf2f7; text-align: left; }
        .drop-item { width: 100%; padding: 12px 15px; display: flex; align-items: center; gap: 12px; border: none; background: none; font-size: 0.9rem; color: #4a5568; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
        .drop-item:hover { background: #f8fafc; color: #2d3748; }
        .drop-item.close-action { color: #ed8936; } 
        .drop-item.close-action:hover { background: #fffaf0; }
        .drop-item.open-action { color: #38a169; } 
        .drop-item.open-action:hover { background: #f0fff4; }
        .drop-item.delete-action { color: #e53e3e; } 
        .drop-item.delete-action:hover { background: #fff5f5; }
        .drop-divider { height: 1px; background: #edf2f7; margin: 4px 0; }

        .branch-cell { display: flex; align-items: center; gap: 6px; cursor: pointer; position: relative; color: #4a5568; font-weight: 500; }
        .branch-dropdown { position: absolute; top: 100%; left: 0; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 1000; width: 240px; padding: 5px; border: 1px solid #edf2f7; margin-top: 5px; }
        .branch-item { padding: 10px; font-size: 0.8rem; color: #4a5568; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
        .branch-item:hover { background: #f8fafc; }
        .branch-status-dot { height: 8px; width: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }

        .applicant-cell { display: flex; align-items: center; gap: 8px; }
        .table-footer { padding: 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #edf2f7; }
        .pagination-info { font-size: 0.85rem; color: #718096; }
        .pagination-controls { display: flex; gap: 5px; }
        .page-btn { padding: 6px 12px; border: 1px solid #e2e8f0; background: white; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
        .page-btn.active { background: #5d9cec; color: white; border-color: #5d9cec; }
        .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .confirm-box { background: white; width: 400px; padding: 30px; border-radius: 16px; text-align: center; }
        .confirm-icon { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 2rem; }
        .confirm-icon.orange { background: #fff5eb; color: #ff7a00; }
        .confirm-icon.red { background: #fff5f5; color: #f56565; }
        .confirm-footer { display: flex; gap: 12px; margin-top: 25px; }
        .confirm-footer button { flex: 1; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer; border: none; }
        .btn-orange { background: #ff7a00; color: white; }
        .btn-danger { background: #f56565; color: white; }
        .btn-secondary { background: white; border: 1px solid #e2e8f0; color: #4a5568; }
        .no-results { padding: 60px 20px; text-align: center; color: #718096; }
      `}</style>

      {/* Header & Stats */}
      <div className="page-identifier">
        <span className="root">Recruitment</span>
        <span className="separator">/</span>
        <span className="current">Job Postings</span>
      </div>
      <div className="header-with-icon">
        <div className="title-icon-box">💼</div>
        <div className="title-text">
          <h2>Job Posting Management</h2>
          <p>Create, manage, and track job postings</p>
        </div>
      </div>
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: stat.color }}>{stat.icon}</div>
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search job title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="filter-dropdowns">
          <div className={`custom-dropdown-btn ${selectedDept !== 'All Departments' ? 'active-applied' : ''}`} onClick={(e) => {e.stopPropagation(); setActiveFilterMenu(activeFilterMenu === 'dept' ? null : 'dept');}}>
            <span>{selectedDept}</span> <small>⌄</small>
            {activeFilterMenu === 'dept' && (
              <div className="filter-drop-menu" onClick={e => e.stopPropagation()}>
                {departments.map((dept, idx) => (
                  <div key={idx} className={`filter-drop-item ${selectedDept === dept ? 'selected' : ''}`} onClick={() => {setSelectedDept(dept); setActiveFilterMenu(null);}}>
                    {dept}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={`custom-dropdown-btn ${selectedBranch !== 'All Branches' ? 'active-applied' : ''}`} onClick={(e) => {e.stopPropagation(); setActiveFilterMenu(activeFilterMenu === 'branch' ? null : 'branch');}}>
            <span>{selectedBranch}</span> <small>⌄</small>
            {activeFilterMenu === 'branch' && (
              <div className="filter-drop-menu" onClick={e => e.stopPropagation()}>
                {allBranches.map((branch, idx) => (
                  <div key={idx} className={`filter-drop-item ${selectedBranch === branch ? 'selected' : ''}`} onClick={() => {setSelectedBranch(branch); setActiveFilterMenu(null);}}>
                    {branch}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="add-new-btn">+ Add New Job</button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-card">
        {loading ? (
             <div className="no-results"><h3>Loading data...</h3></div>
        ) : filteredJobs.length > 0 ? (
          <>
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>JOB TITLE</th>
                  <th>DEPARTMENT</th>
                  <th>BRANCH</th>
                  <th>TYPE</th>
                  <th>APPLICANTS</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {currentJobs.map((job) => {
                  const rowId = job.isGrouped ? job.job_title : job.job_id;
                  
                  // BOOLEAN LOGIC HERE
                  const isActive = job.isGrouped ? job.hasActiveBranch : (job.job_status === true);
                  
                  return (
                    <tr key={rowId}>
                      <td className="bold-text">{job.job_title}</td>
                      <td>{job.department}</td>

                      {/* BRANCH COLUMN */}
                      <td>
                        {job.isGrouped ? (
                          <div className="branch-cell" onClick={(e) => toggleBranchMenu(e, rowId)}>
                            📍 <span>{job.branchList.length} Branches</span> <small>⌄</small>
                            {activeBranchMenu === rowId && (
                              <div className="branch-dropdown" onClick={e => e.stopPropagation()}>
                                {job.branchList.map((b) => {
                                  // BOOLEAN CHECK
                                  const isBranchActive = (b.job_status === true);
                                  return (
                                    <div key={b.job_id} className="branch-item">
                                      <div style={{display:'flex', alignItems:'center'}}>
                                        <span className="branch-status-dot" style={{background: isBranchActive ? '#2ecc71' : '#f56565'}}></span>
                                        {b.branch}
                                      </div>
                                      
                                      {/* CLICKABLE STATUS TOGGLE */}
                                      <button 
                                        className={`status-badge ${isBranchActive ? 'active' : 'closed'}`}
                                        style={{ fontSize:'0.65rem', padding:'2px 6px' }}
                                        onClick={(e) => {
                                          e.stopPropagation(); // Don't close the menu
                                          toggleJobStatus(b.job_id, b.job_status);
                                        }}
                                      >
                                        {isBranchActive ? 'Active' : 'Closed'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="branch-cell">📍 <span>{job.branch}</span></div>
                        )}
                      </td>

                      <td><span className="type-badge">{job.contract_type}</span></td>
                      <td><div className="applicant-cell"><span className="user-mini-icon">👥</span><strong>{job.total_applicants}</strong></div></td>
                      <td>{formatDate(job.date_posted)}</td>

                      {/* STATUS DISPLAY */}
                      <td>
                        <span className={`status-badge ${isActive ? 'active' : (job.isGrouped && !isActive) ? 'closed' : (!isActive ? 'closed' : 'mixed')}`} style={{cursor: 'default'}}>
                            {isActive ? 'Active' : 'Closed'}
                        </span>
                      </td>

                      {/* ACTIONS MENU */}
                      <td className="action-cell">
                        <button className="dots-btn" onClick={(e) => toggleActionMenu(e, rowId)}>
                          <MoreVertical size={18} />
                        </button>
                        
                        {activeMenu === rowId && (
                          <div className="action-dropdown" onClick={e => e.stopPropagation()}>
                            <button className="drop-item" onClick={() => setModalType('edit')}>
                              <Edit size={16} /> Edit Job
                            </button>

                            <button className="drop-item" onClick={() => handleDuplicateJob(job)}>
                              <Copy size={16} /> Duplicate
                            </button>

                            {/* CLOSE/OPEN BUTTONS (Non-grouped only) */}
                            {!job.isGrouped && (
                              <button 
                                  className={`drop-item ${isActive ? 'close-action' : 'open-action'}`}
                                  onClick={() => {
                                      setSelectedJob(job); 
                                      if (isActive) {
                                          setModalType('close'); 
                                      } else {
                                          // Force to TRUE if opening
                                          toggleJobStatus(job.job_id, false); 
                                      }
                                  }}
                              >
                                {isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                {isActive ? 'Close Position' : 'Open Position'}
                              </button>
                            )}
                            
                            {job.isGrouped && (
                                <button className="drop-item" style={{color:'#718096', cursor:'default'}}>
                                    <span style={{fontSize:'0.8rem'}}>Expand branch list to manage</span>
                                </button>
                            )}

                            <div className="drop-divider"></div>

                            <button className="drop-item delete-action" onClick={() => { setSelectedJob(job); setModalType('delete'); }}>
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="table-footer">
              <span className="pagination-info">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredJobs.length)} of {filteredJobs.length} results
              </span>
              <div className="pagination-controls">
                <button className="page-btn" onClick={handlePrevPage} disabled={currentPage === 1}>‹ Previous</button>
                <button className="page-btn active">{currentPage}</button>
                <button className="page-btn" onClick={handleNextPage} disabled={currentPage === totalPages}>Next ›</button>
              </div>
            </div>
          </>
        ) : (
          <div className="no-results">
            <h3>No job postings found</h3>
            <p>Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      {modalType === 'close' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon orange">⊗</div>
            <h3 style={{margin: '0 0 10px'}}>Close Position</h3>
            <p style={{color: '#718096', fontSize: '0.9rem'}}>Are you sure you want to close this position? It will no longer be visible to applicants.</p>
            <div className="confirm-footer">
              <button className="btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
              <button className="btn-orange" onClick={handleCloseJobModal}>Close Position</button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'delete' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon red">⚠️</div>
            <h3 style={{margin: '0 0 10px'}}>Delete Job Position</h3>
            <p style={{color: '#718096', fontSize: '0.9rem'}}>Are you sure you want to delete this job? This cannot be undone.</p>
            <div className="confirm-footer">
              <button className="btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteJob}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostings;