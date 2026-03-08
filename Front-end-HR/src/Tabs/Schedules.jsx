import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import { getApiBaseUrl } from '../config/api';
import { 
  Search, Clock, MapPin, Mail, Phone, Check, X, Download, Calendar, 
  Briefcase, CheckCircle, Eye, Users
} from 'lucide-react';
import './Schedules.css';

const Schedules = () => {
  const API_BASE_URL = getApiBaseUrl();
  const [activeTab, setActiveTab] = useState('Set Schedule');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [pendingApplicants, setPendingApplicants] = useState([]);
  const [scheduledApplicants, setScheduledApplicants] = useState([]);
  
  // Selection States (Left Panel)
  const [selectedIds, setSelectedIds] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(''); 
  const [selectedDate, setSelectedDate] = useState('');
  
  // Staged for Time Slot Assignment (Right Panel)
  const [stagedApplicants, setStagedApplicants] = useState([]);
  
  // Modals
  const [showConfirmDateModal, setShowConfirmDateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [viewApplicantModal, setViewApplicantModal] = useState(null);

  // Form States (Right Panel)
  const [scheduleForm, setScheduleForm] = useState({
    location: '',
    room: '',
    reminders: 'Be on time.'
  });

  const TIME_SLOTS = [
    '8:00 AM - 9:00 AM', '8:30 AM - 9:30 AM', '9:00 AM - 10:00 AM',
    '9:30 AM - 10:30 AM', '10:00 AM - 11:00 AM', '10:30 AM - 11:30 AM',
    '1:00 PM - 2:00 PM', '1:30 PM - 2:30 PM', '2:00 PM - 3:00 PM',
    '2:30 PM - 3:30 PM', '3:00 PM - 4:00 PM', '3:30 PM - 4:30 PM'
  ];

  // --- BRANCH DETAILS DICTIONARY (Para sa Auto-Fill) ---
  const branchDetails = {
    'Manila': { location: 'Burke Building, Burke St, Binondo, Manila, 1006 Metro Manila', room: '210' },
    'Cebu': { location: 'Cebu Business Park, Archbishop Reyes Ave, Cebu City, 6000 Cebu', room: '306' },
    'Davao': { location: 'Abreeza Business Park, J.P. Laurel Ave, Davao City, 8000 Davao del Sur', room: '402' }
  };

  const handleBranchChange = (e) => {
    const branch = e.target.value;
    setSelectedBranch(branch);
    
    // Auto-fill logic
    if (branchDetails[branch]) {
      setScheduleForm(prev => ({
        ...prev,
        location: branchDetails[branch].location,
        room: branchDetails[branch].room
      }));
    } else {
      setScheduleForm(prev => ({ ...prev, location: '', room: '' }));
    }
  };

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    // Fetch pending
    const { data: pendingData } = await supabase
      .from('applicantfacttable')
      .select(`*, applicant:applicant_no(*), status!inner(interview)`) 
      .eq('status.interview', 1)
      .is('schedule_id', null); 

    // Fetch scheduled
    const { data: interviewData } = await supabase
      .from('applicantfacttable')
      .select(`*, applicant:applicant_no(*), schedule:schedule_id(*), status!inner(interview)`) 
      .eq('status.interview', 1)
      .not('schedule_id', 'is', null);

    if (pendingData) setPendingApplicants(pendingData);
    if (interviewData) setScheduledApplicants(interviewData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- CHECKBOX SELECTION ---
  const toggleSelection = (applicant_no) => {
    setSelectedIds(prev => 
      prev.includes(applicant_no) ? prev.filter(x => x !== applicant_no) : [...prev, applicant_no]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPending.length) setSelectedIds([]);
    else setSelectedIds(filteredPending.map(app => app.applicant_no));
  };

  // --- ASSIGN DATE (MOVE TO STAGED) ---
  const handleConfirmDate = () => {
    if (!selectedDate) return alert("Please select a date first.");
    const applicantsToStage = pendingApplicants
      .filter(app => selectedIds.includes(app.applicant_no))
      .map(app => ({
        ...app,
        assignedDate: selectedDate,
        timeSlot: ''
      }));

    setStagedApplicants(prev => [...prev, ...applicantsToStage]);
    setSelectedIds([]); 
    setSelectedDate('');
    setShowConfirmDateModal(false);
  };

  const handleTimeSlotChange = (applicant_no, value) => {
    setStagedApplicants(prev => prev.map(app => 
      app.applicant_no === applicant_no ? { ...app, timeSlot: value } : app
    ));
  };

  const removeStagedApplicant = (applicant_no) => {
    setStagedApplicants(prev => prev.filter(app => app.applicant_no !== applicant_no));
  };

  // --- COMPLETE SCHEDULING (MGA INAYOS SA DATABASE) ---
  const handleSaveSchedule = async () => {
    const unassigned = stagedApplicants.some(app => !app.timeSlot);
    if (unassigned) return alert("Please assign time slots to all selected applicants.");

    setLoading(true);
    let hasError = false;

    for (const app of stagedApplicants) {
      // Tinanggal ko yung .single() kasi baka ito ang nagccause ng silent error
      const { data: schedData, error: schedError } = await supabase
        .from('schedule')
        .insert([{
            interview_schedule: app.assignedDate,
            interview_time: app.timeSlot,
            room_number: `${scheduleForm.location}, Room ${scheduleForm.room}`,
            reminders: scheduleForm.reminders
        }])
        .select();

      if (schedError) {
        console.error("Insert Schedule Error:", schedError);
        alert(`Supabase Insert Error: ${schedError.message}`);
        hasError = true;
        continue; // Skip kung may error sa insert
      }

      // Kapag successful ang pagpasok sa schedule table, i-update ang fact table
      if (schedData && schedData.length > 0) {
        // Fallback sa 'id' kung hindi 'schedule_id' ang name ng primary key sa database mo
        const newScheduleId = schedData[0].schedule_id || schedData[0].id; 

        const { error: updateError } = await supabase
          .from('applicantfacttable')
          .update({ schedule_id: newScheduleId })
          .eq('applicant_no', app.applicant_no);

        if (updateError) {
          console.error("Update Fact Table Error:", updateError);
          alert(`Supabase Update Error: ${updateError.message}`);
          hasError = true;
        }
      }
    }
    
    setLoading(false);

    if (!hasError) {
      setStagedApplicants([]);
      fetchData(); 
      setShowSuccessModal(true);
    }
  };

  // --- APPROVE / REJECT ---
  const handleDecision = async (status) => {
    if (!viewApplicantModal) return;
    const confirmMsg = status === 'Hired' ? "Hire this candidate?" : "Reject this candidate?";
    if (!window.confirm(confirmMsg)) return;

    try {
      await axios.put(`${API_BASE_URL}/api/applicants/${viewApplicantModal.applicant_no}/status`, { status: status });
      alert(`Application ${status}`);
      setViewApplicantModal(null);
      fetchData(); 
    } catch (err) {
      alert("Failed to update status. Please try again.");
    }
  };

  // --- FILTERS ---
  const filteredPending = pendingApplicants.filter(app => {
    if (stagedApplicants.some(staged => staged.applicant_no === app.applicant_no)) return false;
    const matchesSearch = `${app.applicant?.first_name} ${app.applicant?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch ? app.applicant?.branch === selectedBranch : true; 
    return matchesSearch && matchesBranch;
  });

  const groupedScheduled = scheduledApplicants.reduce((groups, app) => {
    const date = app.schedule?.interview_schedule || 'Unknown Date';
    if (!groups[date]) groups[date] = [];
    groups[date].push(app);
    return groups;
  }, {});

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // ================= VIEW: SET SCHEDULE =================
  const SetScheduleView = () => (
    <div className="sched-grid-layout">
      {/* LEFT PANEL */}
      <div className="sched-card">
        <div className="sched-card-header">
          <h3 className="sched-title">Select Applicants</h3>
          <button className="text-btn-blue" onClick={toggleSelectAll}>Select All</button>
        </div>
        
        <div className="sched-filters">
          <div className="input-wrap">
            <Search className="input-icon" size={18} />
            <input 
              type="text" placeholder="Search applicants..." className="form-control"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="input-wrap">
            <MapPin className="input-icon" size={18} />
            <select className="form-control select-control" value={selectedBranch} onChange={handleBranchChange}>
              <option value="">All Branches</option>
              <option value="Manila">Manila</option>
              <option value="Cebu">Cebu</option>
              <option value="Davao">Davao</option>
            </select>
          </div>
        </div>

        <div className="sched-applicant-list">
          {filteredPending.length === 0 ? (
            <div className="empty-state-text">No pending applicants found.</div>
          ) : (
            filteredPending.map((app) => (
              <label key={app.applicant_no} className={`applicant-row ${selectedIds.includes(app.applicant_no) ? 'selected' : ''}`}>
                <input 
                  type="checkbox" className="custom-cb" 
                  checked={selectedIds.includes(app.applicant_no)}
                  onChange={() => toggleSelection(app.applicant_no)}
                />
                <div className="app-info">
                  <div className="app-info-top">
                    <span className="app-badge">{app.applicant_no}</span>
                    <span className="app-name">{app.applicant?.first_name} {app.applicant?.last_name}</span>
                  </div>
                  <div className="app-info-bot">
                    <span><Mail size={12}/> {app.applicant?.email}</span>
                    <span>|</span>
                    <span><Phone size={12}/> {app.applicant?.contact_number}</span>
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="assign-date-box">
          <label className="assign-date-label"><Calendar size={18} /> Assign Date</label>
          <input 
            type="date" 
            className="form-control text-center date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={selectedIds.length === 0}
          />
          {selectedIds.length > 0 && selectedDate && (
            <button className="btn-primary full-width mt-3" onClick={() => setShowConfirmDateModal(true)}>
              <Calendar size={18} /> Confirm & Move to Assign Times
            </button>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="sched-card">
        <div className="sched-card-header">
          <h3 className="sched-title">Assign Times</h3>
          <span className="text-muted">{stagedApplicants.length} Applicant(s) with Dates</span>
        </div>

        <div className="form-group-custom">
          <label>Location</label>
          <input type="text" className="form-control" value={scheduleForm.location} onChange={(e) => setScheduleForm({...scheduleForm, location: e.target.value})} />
        </div>
        <div className="form-group-custom">
          <label>Room Number</label>
          <input type="text" className="form-control" value={scheduleForm.room} onChange={(e) => setScheduleForm({...scheduleForm, room: e.target.value})} />
        </div>
        <div className="form-group-custom">
          <label>Reminders</label>
          <input type="text" className="form-control" value={scheduleForm.reminders} onChange={(e) => setScheduleForm({...scheduleForm, reminders: e.target.value})} />
        </div>

        <div className="staged-area">
          {stagedApplicants.length === 0 ? (
             <div className="empty-yellow-box">
               <Clock size={40} className="text-yellow" />
               <h4>No applicants with dates yet</h4>
               <p>Assign dates to applicants first</p>
             </div>
          ) : (
            <>
              <div className="success-banner">
                <Users size={24} className="text-gray" />
                <h5>All applicants have dates assigned</h5>
                <p>Great! Now assign time slots to your applicants</p>
              </div>
              
              <div className="staged-cards-list">
                {stagedApplicants.map(app => (
                  <div key={app.applicant_no} className="staged-item">
                    <div className="staged-item-head">
                      <div className="staged-item-title">
                        <span className="app-badge">{app.applicant_no}</span> 
                        {app.applicant?.first_name} {app.applicant?.last_name}
                      </div>
                      <button className="btn-icon text-red" onClick={() => removeStagedApplicant(app.applicant_no)}><X size={18}/></button>
                    </div>
                    <div className="staged-item-date">
                      <Calendar size={14}/> {formatDateForDisplay(app.assignedDate)}
                    </div>
                    <select 
                      className="form-control mt-2"
                      value={app.timeSlot}
                      onChange={(e) => handleTimeSlotChange(app.applicant_no, e.target.value)}
                    >
                      <option value="">Select time slot...</option>
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <button 
          className="btn-primary full-width mt-auto" 
          onClick={handleSaveSchedule} 
          disabled={loading || stagedApplicants.length === 0}
        >
          <Calendar size={18} /> {loading ? 'Saving...' : 'Complete Scheduling'}
        </button>
      </div>
    </div>
  );

  // ================= VIEW: INTERVIEW =================
  const InterviewView = () => (
    <div className="interview-container">
      <div className="interview-header">
        <div className="d-flex-center">
          <Calendar size={24} className="text-blue" />
          <h3 className="sched-title m-0">Interview Schedule</h3>
        </div>
        <div className="d-flex-center gap-3">
          <span className="badge-light-blue">{scheduledApplicants.length} Total Interviews Scheduled</span>
          <button className="btn-outline"><Calendar size={16}/> Filter by Date</button>
        </div>
      </div>

      <div className="interview-list">
        {Object.keys(groupedScheduled).length === 0 ? (
          <div className="empty-state-text text-center p-5">No interviews scheduled yet.</div>
        ) : (
          Object.keys(groupedScheduled).sort().map(date => (
            <div key={date} className="date-group">
              <div className="date-group-title">
                <Calendar size={20} className="text-muted" />
                <div>
                  <h4>{formatDateForDisplay(date)}</h4>
                  <p>{groupedScheduled[date].length} interviews scheduled</p>
                </div>
              </div>
              
              <div className="date-group-content">
                {groupedScheduled[date].map(app => (
                  <div key={app.applicant_no} className="interview-item-row">
                    <div className="interview-time-col">
                      <Clock size={16}/> {app.schedule?.interview_time.split(' - ')[0]}
                    </div>
                    <div className="interview-info-col">
                      <div className="app-info-top mb-1">
                        <span className="app-badge">{app.applicant_no}</span>
                        <span className="app-name">{app.applicant?.first_name} {app.applicant?.last_name}</span>
                      </div>
                      <div className="app-info-bot">
                        <span><Mail size={12}/> {app.applicant?.email}</span>
                        <span>|</span>
                        <span><Phone size={12}/> {app.applicant?.contact_number}</span>
                      </div>
                    </div>
                    <div className="interview-action-col">
                      <button className="btn-text-muted" onClick={() => setViewApplicantModal(app)}>
                        <Eye size={18}/> View
                      </button>
                      <button className="btn-primary sm" onClick={() => window.open(app.applicant?.resume_url || '#', '_blank')}>
                        <Download size={16}/> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="schedules-wrapper">
      {/* TAB NAVIGATION */}
      <div className="custom-tabs-container">
        <button className={`custom-tab ${activeTab === 'Set Schedule' ? 'active' : ''}`} onClick={() => setActiveTab('Set Schedule')}>
          <Calendar size={16} /> Set Schedule
        </button>
        <button className={`custom-tab ${activeTab === 'Interview' ? 'active' : ''}`} onClick={() => setActiveTab('Interview')}>
          Interview
        </button>
      </div>

      <div className="tabs-content-area">
        {activeTab === 'Set Schedule' ? <SetScheduleView /> : <InterviewView />}
      </div>

      {/* MODAL 1: CONFIRM DATE (STEP 4) */}
      {showConfirmDateModal && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal-box sm-modal">
            <div className="modal-top">
              <Calendar size={24} className="text-blue" />
              <h2>Confirm Date Assignment</h2>
            </div>
            <p className="text-muted mb-4">Please review the following information before proceeding</p>
            
            <div className="gray-box mb-3">
              <label>INTERVIEW DATE</label>
              <div className="box-val"><Calendar size={18}/> {formatDateForDisplay(selectedDate)}</div>
            </div>

            <div className="gray-box mb-4">
              <label>SELECTED APPLICANTS ({selectedIds.length})</label>
              <ul className="selected-list">
                {pendingApplicants.filter(app => selectedIds.includes(app.applicant_no)).map(app => (
                  <li key={app.applicant_no}>• {app.applicant?.first_name} {app.applicant?.last_name} ({app.applicant_no})</li>
                ))}
              </ul>
            </div>

            <div className="yellow-info-box mb-4">
              <CheckCircle size={20} className="text-yellow-dark" />
              <div>
                <strong>Next Step</strong>
                <p>After confirmation, you'll be able to assign specific time slots to each applicant.</p>
              </div>
            </div>

            <div className="modal-btn-group">
              <button className="btn-outline flex-1" onClick={() => setShowConfirmDateModal(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={handleConfirmDate}>Confirm & Proceed</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SUCCESS (STEP 8) */}
      {showSuccessModal && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal-box sm-modal text-center">
            <div className="success-circle mx-auto mb-3"><Calendar size={28} className="text-green" /></div>
            <h2 className="mb-2">Scheduling Complete</h2>
            <p className="text-muted mb-4">All applicants have been assigned time slots. You can now proceed to the interview tab to view the schedule.</p>
            
            <div className="green-info-box text-left mx-auto mb-4">
              <Calendar size={20} className="text-green-dark" />
              <div>
                <strong>Interview Schedule Ready</strong>
                <p>{stagedApplicants.length} interviews are scheduled and ready to go.</p>
              </div>
            </div>
            
            <button className="btn-primary full-width" onClick={() => { setShowSuccessModal(false); setActiveTab('Interview'); }}>Got It</button>
          </div>
        </div>
      )}

      {/* MODAL 3: APPLICANT DETAILS (STEP 9) */}
      {viewApplicantModal && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal-box lg-modal p-0">
            <div className="modal-header-blue">
              <div>
                <h2>Applicant Details</h2>
                <p>{viewApplicantModal.applicant?.first_name} {viewApplicantModal.applicant?.last_name} - Applicant Number: {viewApplicantModal.applicant_no}</p>
              </div>
              <button className="btn-icon-white" onClick={() => setViewApplicantModal(null)}><X size={24}/></button>
            </div>
            
            <div className="modal-body-scroll">
              <div className="white-card mb-4">
                <h4 className="card-sec-title"><Briefcase size={18}/> Personal Information</h4>
                <div className="info-grid-2">
                  <div className="info-block"><label>First Name</label><p>{viewApplicantModal.applicant?.first_name}</p></div>
                  <div className="info-block"><label>Middle Initial</label><p>{viewApplicantModal.applicant?.middle_initial || 'N/A'}</p></div>
                  <div className="info-block"><label>Last Name</label><p>{viewApplicantModal.applicant?.last_name}</p></div>
                  <div className="info-block"><label>Date of Birth</label><p>{viewApplicantModal.applicant?.birthday}</p></div>
                  <div className="info-block"><label>Age</label><p>{viewApplicantModal.applicant?.age}</p></div>
                  <div className="info-block"><label>Nationality</label><p>{viewApplicantModal.applicant?.nationality}</p></div>
                  <div className="info-block"><label>Email</label><p>{viewApplicantModal.applicant?.email}</p></div>
                  <div className="info-block"><label>Phone</label><p>{viewApplicantModal.applicant?.contact_number}</p></div>
                  <div className="info-block"><label>Branch</label><p>{viewApplicantModal.applicant?.branch}</p></div>
                  <div className="info-block"><label>Position Applied</label><p>{viewApplicantModal.applicant?.position_applied}</p></div>
                </div>
              </div>

              <div className="white-card mb-0">
                <h4 className="card-sec-title">Address</h4>
                <div className="info-grid-3">
                  <div className="info-block"><label>Region</label><p>{viewApplicantModal.applicant?.region}</p></div>
                  <div className="info-block"><label>Province</label><p>{viewApplicantModal.applicant?.province}</p></div>
                  <div className="info-block"><label>City/Municipality</label><p>{viewApplicantModal.applicant?.city_municipality}</p></div>
                </div>
              </div>
            </div>

            <div className="modal-footer-btns">
              <button className="btn-green flex-1" onClick={() => handleDecision('Hired')}><Check size={20}/> Hire</button>
              <button className="btn-red flex-1" onClick={() => handleDecision('Rejected')}><X size={20}/> Reject Application</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules;