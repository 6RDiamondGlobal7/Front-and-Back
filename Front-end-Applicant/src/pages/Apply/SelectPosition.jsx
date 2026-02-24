import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './ApplicationForm.css';

// --- ICONS ---
const IconArrowRight = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg> );
const IconArrowLeft = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path></svg> );
const IconLoading = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFB81C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg> );

// --- MASTER LIST OF ROLES ---
const ROLES_DATA = [
  { id: 'corp-sec', title: 'Corporate Secretary', desc: 'Oversee brokerage division operations and manage corporate secretarial duties' },
  { id: 'licensed-broker', title: 'Licensed Customs Broker', desc: 'Handle customs clearance procedures and regulatory compliance' },
  { id: 'office-manager', title: 'Office Manager', desc: 'Manage office operations and administrative functions' },
  { id: 'messenger', title: 'Messenger / Logistics', desc: 'Handle document delivery and logistics coordination' },
  { id: 'secretary', title: 'Secretary to the Office Manager', desc: 'Provide administrative support to the Office Manager' },
  { id: 'brokerage-specialist', title: 'Brokerage Specialist', desc: 'Specialize in brokerage operations and client services' },
  { id: 'import-export-head', title: 'Import & Export Head', desc: 'Lead import and export operations and compliance' },
  { id: 'admin-staff', title: 'Administration Staff', desc: 'Support administrative and operational functions' },
  { id: 'doc-head', title: 'Documentations Head', desc: 'Manage documentation processes and compliance records' },
];

const SelectPosition = () => {
  const navigate = useNavigate();
  const { branch } = useParams();
  
  const [availableJobTitles, setAvailableJobTitles] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);

  const displayBranch = branch ? branch.charAt(0).toUpperCase() + branch.slice(1) : 'Manila';

  // --- HELPER: ROBUST STATUS CHECKER ---
  const isJobActive = (status) => {
    if (status === true) return true;
    if (status === 'true') return true;
    if (status === 'Open') return true;
    if (status === 'Active') return true;
    return false;
  };

  // --- FETCH JOBS ---
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/jobs');
        
        // Filter jobs based on Branch AND Status
        const branchJobs = response.data.filter(job => {
            // 1. Check Location Match
            const matchesBranch = job.location?.toLowerCase().includes(branch.toLowerCase()) || 
                                  job.branch?.toLowerCase().includes(branch.toLowerCase());
            
            // 2. Check Status Match
            const isOpen = isJobActive(job.job_status);

            return matchesBranch && isOpen;
        });

        const titles = branchJobs.map(job => job.job_title.trim());
        setAvailableJobTitles(titles);
        
      } catch (err) {
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    if (branch) {
        fetchJobs();
    }
  }, [branch]);

  const handleBack = () => {
    navigate('/apply/branch');
  };

  const handleRoleClick = (roleId, isAvailable) => {
    if (isAvailable) {
      setSelectedRole(roleId);
    }
  };

  const handleNext = () => {
    if (selectedRole) {
      navigate(`/apply/${branch}/${selectedRole}`);
    }
  };

  return (
    <div className="af-page-container">
      <div className="af-top-nav">
        <button className="af-back-btn" onClick={handleBack}><IconArrowLeft/> Back to Branch Selection</button>
        <div className="af-progress-wrapper">
            <span className="af-progress-step">Step 1 of 5</span>
            <div className="af-progress-bar"><div className="af-progress-fill" style={{ width: '20%' }}></div></div>
        </div>
      </div>

      <div className="af-card">
        <div className="sp-header">
          <h1 className="af-title">Select Position</h1>
          <p className="af-subtitle">Applying for: <span style={{color: '#FFB81C'}}>{displayBranch} Branch</span></p>
        </div>

        {loading ? (
           <div style={{textAlign: 'center', padding: '40px'}}><IconLoading /></div>
        ) : (
          <div className="sp-grid">
            {ROLES_DATA.map((role) => {
              
              // Compare DB Titles with Role Titles
              const isAvailable = availableJobTitles.some(
                  dbTitle => dbTitle.toLowerCase() === role.title.toLowerCase()
              );

              return (
                <div 
                  key={role.id} 
                  className={`sp-role-card ${!isAvailable ? 'disabled' : ''} ${selectedRole === role.id ? 'selected' : ''}`}
                  onClick={() => handleRoleClick(role.id, isAvailable)}
                  style={{ 
                    border: selectedRole === role.id ? '2px solid #FFB81C' : '1px solid #e2e8f0',
                    backgroundColor: selectedRole === role.id ? '#FFFBEB' : (isAvailable ? 'white' : '#F8FAFC'), 
                    opacity: isAvailable ? 1 : 0.6, 
                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                    filter: isAvailable ? 'none' : 'grayscale(100%)'
                  }}
                >
                  <div className="sp-card-header">
                    <h3 className="sp-role-title" style={{ color: isAvailable ? '#1e293b' : '#94a3b8' }}>{role.title}</h3>
                    {!isAvailable && <span className="sp-badge-closed" style={{fontSize: '10px', background:'#cbd5e1', color:'#475569', padding:'2px 8px', borderRadius:'4px', fontWeight:'bold', letterSpacing:'0.5px'}}>CLOSED</span>}
                  </div>
                  <p className="sp-role-desc" style={{ color: isAvailable ? '#64748b' : '#a0aec0' }}>{role.desc}</p>
                </div>
              );
            })}
          </div>
        )}
        
        <button 
          className="af-next-btn" 
          onClick={handleNext} 
          disabled={!selectedRole}
          style={{ opacity: selectedRole ? 1 : 0.5, marginTop: '40px' }}
        >
          Next <IconArrowRight />
        </button>
      </div>
    </div>
  );
};

export default SelectPosition;