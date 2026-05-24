import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../config/api';
import { 
  Search, Clock, MapPin, Mail, Phone, Check, X, Download, Calendar, 
  Briefcase, CheckCircle, Eye
} from 'lucide-react';
import './Schedules.css';
import ConfirmationModal from '../components/ConfirmationModal';
import CustomSelect from '../components/CustomSelect';
import DatePicker from '../components/DatePicker';
import Toast from '../components/Toast';

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
  const [selectedBranch, setSelectedBranch] = useState('Manila'); 
  const [selectedDate, setSelectedDate] = useState('');
  const [interviewSearchQuery, setInterviewSearchQuery] = useState('');
  const [interviewDateFilter, setInterviewDateFilter] = useState('');
  const [interviewBranchFilter, setInterviewBranchFilter] = useState('Manila');
  const [interviewPositionFilter, setInterviewPositionFilter] = useState('');
  
  // Staged for Time Slot Assignment (Right Panel)
  const [stagedApplicants, setStagedApplicants] = useState([]);
  
  // Modals
  const [showConfirmDateModal, setShowConfirmDateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedScheduleCount, setCompletedScheduleCount] = useState(0);
  const [viewApplicantModal, setViewApplicantModal] = useState(null);
  const [decisionModal, setDecisionModal] = useState(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, tone: 'info', message: '' });

  // Form States (Right Panel)
  const [scheduleForm, setScheduleForm] = useState({
    location: 'Burke Building, Burke St, Binondo, Manila, 1006 Metro Manila',
    room: '210',
    reminders: 'Be on time.'
  });

  const TIME_SLOTS = [
    '8:00 AM - 8:30 AM',
    '8:30 AM - 9:00 AM',
    '9:00 AM - 9:30 AM',
    '9:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:00 AM - 11:30 AM',
    '1:00 PM - 1:30 PM',
    '1:30 PM - 2:00 PM',
    '2:00 PM - 2:30 PM',
    '2:30 PM - 3:00 PM',
    '3:00 PM - 3:30 PM',
    '3:30 PM - 4:00 PM',
    '4:00 PM - 4:30 PM',
    '4:30 PM - 5:00 PM'
  ];

  const ROLE_ID_TO_TITLE = {
    'corp-sec': 'Corporate Secretary',
    'licensed-broker': 'Licensed Customs Broker',
    'office-manager': 'Office Manager',
    'messenger': 'Messenger / Logistics',
    'internship': 'Internship',
    'secretary': 'Secretary to the Office Manager',
    'brokerage-specialist': 'Brokerage Specialist',
    'import-export-head': 'Import & Export Head',
    'admin-staff': 'Administration Staff',
    'doc-head': 'Documentation Head'
  };

  const getPositionDisplayName = (roleId) => {
    const id = String(roleId || '').trim();
    return ROLE_ID_TO_TITLE[id] || id; // Fallback to id if not found
  };

  // --- BRANCH DETAILS DICTIONARY (Para sa Auto-Fill) ---
  const branchDetails = {
    'Manila': { location: 'Burke Building, Burke St, Binondo, Manila, 1006 Metro Manila', room: '210' },
    'Cebu': { location: 'Cebu Business Park, Archbishop Reyes Ave, Cebu City, 6000 Cebu', room: '306' },
    'Davao': { location: 'Abreeza Business Park, J.P. Laurel Ave, Davao City, 8000 Davao del Sur', room: '402' }
  };

  const normalizeBranch = (value) => {
    if (!value) return '';
    const cleaned = String(value).trim().toLowerCase();
    return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : '';
  };

  const normalizeApplicantPayload = (applicant) => {
    if (!applicant || typeof applicant !== 'object') return applicant;
    return {
      ...applicant,
      branch: normalizeBranch(applicant.branch)
    };
  };

  const handleBranchChange = (branch) => {
    const normalizedBranch = normalizeBranch(branch);
    setSelectedBranch(normalizedBranch);
    
    // Auto-fill logic
    if (branchDetails[normalizedBranch]) {
      setScheduleForm(prev => ({
        ...prev,
        location: branchDetails[normalizedBranch].location,
        room: branchDetails[normalizedBranch].room
      }));
    } else {
      setScheduleForm(prev => ({ ...prev, location: '', room: '' }));
    }
  };

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [queueResponse, applicantsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/interviews/queue`),
        axios.get(`${API_BASE_URL}/api/applicants`)
      ]);

      const data = queueResponse?.data || {};
      const pendingData = Array.isArray(data?.pendingApplicants) ? data.pendingApplicants : [];
      const interviewData = Array.isArray(data?.scheduledApplicants) ? data.scheduledApplicants : [];
      const applicantRows = Array.isArray(applicantsResponse?.data) ? applicantsResponse.data : [];
      const applicantsById = applicantRows.reduce((acc, row) => {
        const id = String(row?.id || '').trim();
        if (id) acc[id] = row;
        return acc;
      }, {});

      const hydrateApplicant = (item) => {
        const applicantNo = String(item?.applicant_no || item?.applicantNo || '').trim();
        const detailed = applicantsById[applicantNo] || null;
        return {
          ...item,
          applicant: normalizeApplicantPayload({
            ...(item?.applicant || {}),
            ...(detailed || {})
          })
        };
      };

      setPendingApplicants(
        pendingData.map(hydrateApplicant)
      );
      setScheduledApplicants(
        interviewData.map(hydrateApplicant)
      );
    } catch (error) {
      setToast({ open: true, tone: 'error', message: 'Failed to load interview queue.' });
    } finally {
      setLoading(false);
    }
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
    if (!selectedDate) {
      setToast({ open: true, tone: 'info', message: 'Please select a date first.' });
      return;
    }
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
    if (unassigned) {
      setToast({ open: true, tone: 'info', message: 'Please assign time slots to all selected applicants.' });
      return;
    }

    const roomValue = String(scheduleForm.room || '').trim();
    if (!roomValue) {
      setToast({ open: true, tone: 'info', message: 'Please enter a room number before completing scheduling.' });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        location: String(scheduleForm.location || '').trim(),
        room: roomValue,
        reminders: String(scheduleForm.reminders || '').trim(),
        schedules: stagedApplicants.map((app) => ({
          applicant_no: app.applicant_no,
          assignedDate: app.assignedDate,
          timeSlot: app.timeSlot
        }))
      };

      const { data } = await axios.post(`${API_BASE_URL}/api/interviews/schedule`, payload);
      const successCount = Number(data?.successCount || 0);
      const failedApplicants = Array.isArray(data?.failedApplicants) ? data.failedApplicants : [];

      if (successCount > 0) {
        setCompletedScheduleCount(successCount);
        setShowSuccessModal(true);
      }

      if (failedApplicants.length > 0) {
        const failedSet = new Set(failedApplicants.map((item) => String(item?.applicant_no || '')));
        setStagedApplicants((prev) => prev.filter((app) => failedSet.has(String(app.applicant_no))));
        setToast({
          open: true,
          tone: 'info',
          message: `${failedApplicants.length} applicant(s) failed to schedule. Please retry.`
        });
      } else {
        setStagedApplicants([]);
      }

      fetchData();
    } catch (err) {
      const message = err?.response?.data?.error || 'Failed to save schedule. Please try again.';
      setToast({ open: true, tone: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  // --- APPROVE / REJECT ---
  const handleDecision = async (status) => {
    if (!viewApplicantModal) return;

    try {
      setDecisionLoading(true);
      await axios.put(`${API_BASE_URL}/api/applicants/${viewApplicantModal.applicant_no}/status`, { status: status });
      setToast({ open: true, tone: 'success', message: `Application ${status}` });
      setViewApplicantModal(null);
      setDecisionModal(null);
      fetchData(); 
    } catch (err) {
      setToast({ open: true, tone: 'error', message: 'Failed to update status. Please try again.' });
    } finally {
      setDecisionLoading(false);
    }
  };

  const openDecisionModal = (status) => {
    if (!viewApplicantModal) return;
    setDecisionModal({
      status,
      applicantName: `${viewApplicantModal.applicant?.first_name || ''} ${viewApplicantModal.applicant?.last_name || ''}`.trim()
    });
  };

  // --- FILTERS ---
  const filteredPending = pendingApplicants.filter(app => {
    if (stagedApplicants.some(staged => staged.applicant_no === app.applicant_no)) return false;
    const matchesSearch = `${app.applicant?.first_name} ${app.applicant?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch ? normalizeBranch(app.applicant?.branch) === normalizeBranch(selectedBranch) : true; 
    return matchesSearch && matchesBranch;
  });

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getDateKey = (dateString) => String(dateString || '').trim().slice(0, 10);

  const getOccupiedTimeSlotsForDate = (dateString, currentApplicantNo) => {
    const targetDate = getDateKey(dateString);
    if (!targetDate) return new Set();

    const occupiedSlots = [
      ...scheduledApplicants
        .filter((app) => getDateKey(app.schedule?.interview_schedule) === targetDate)
        .map((app) => app.schedule?.interview_time)
        .filter(Boolean),
      ...stagedApplicants
        .filter((app) => app.applicant_no !== currentApplicantNo && getDateKey(app.assignedDate) === targetDate)
        .map((app) => app.timeSlot)
        .filter(Boolean)
    ];

    return new Set(occupiedSlots);
  };

  const getTimeSlotOptionsForApplicant = (currentApplicantNo, currentValue, currentDate) => {
    const usedSlots = getOccupiedTimeSlotsForDate(currentDate, currentApplicantNo);

    return [
      { value: '', label: 'Select time slot...' },
      ...TIME_SLOTS.map((slot) => ({
        value: slot,
        label: slot,
        disabled: usedSlots.has(slot) && slot !== currentValue
      }))
    ];
  };

  // Derive unique positions from ALL scheduled applicants (status = Interview)
  // so the dropdown only shows positions that actually exist in the current data
  const availablePositions = useMemo(() => {
    const seen = new Set();
    const positions = [];
    scheduledApplicants.forEach((app) => {
      const pos = String(app.applicant?.position_applied || '').trim();
      if (pos && !seen.has(pos.toLowerCase())) {
        seen.add(pos.toLowerCase());
        positions.push(pos);
      }
    });
    return positions.sort((a, b) => a.localeCompare(b));
  }, [scheduledApplicants]);

  const filteredScheduledApplicants = scheduledApplicants.filter((app) => {
    const fullName = `${app.applicant?.first_name || ''} ${app.applicant?.last_name || ''}`.toLowerCase();
    const applicantNo = String(app.applicant_no || '').toLowerCase();
    const matchesSearch = !interviewSearchQuery || fullName.includes(interviewSearchQuery.toLowerCase()) || applicantNo.includes(interviewSearchQuery.toLowerCase());
    const scheduleDate = app.schedule?.interview_schedule || '';
    const matchesDate = !interviewDateFilter || scheduleDate === interviewDateFilter;
    const applicantBranch = normalizeBranch(app.applicant?.branch);
    const matchesBranch = applicantBranch === normalizeBranch(interviewBranchFilter);
    const applicantPosition = String(app.applicant?.position_applied || '').trim().toLowerCase();
    const matchesPosition = !interviewPositionFilter || applicantPosition === interviewPositionFilter.toLowerCase();
    return matchesSearch && matchesDate && matchesBranch && matchesPosition;
  });

  const filteredGroupedScheduled = filteredScheduledApplicants.reduce((groups, app) => {
    const date = app.schedule?.interview_schedule || 'Unknown Date';
    if (!groups[date]) groups[date] = [];
    groups[date].push(app);
    return groups;
  }, {});

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
            <CustomSelect
              className="schedule-select"
              icon={<MapPin size={18} />}
              value={selectedBranch}
              onChange={handleBranchChange}
              placeholder="Select Branch"
              options={[
                { value: 'Manila', label: 'Manila' },
                { value: 'Cebu', label: 'Cebu' },
                { value: 'Davao', label: 'Davao' }
              ]}
            />
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
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            disabled={selectedIds.length === 0}
            placeholder="Select interview date"
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
              <div className="staged-cards-list">
                {stagedApplicants.map(app => (
                  <div key={app.applicant_no} className={`staged-item ${app.timeSlot ? 'assigned' : ''}`}>
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
                    <div className="mt-2">
                      <CustomSelect
                        className="schedule-select"
                        menuClassName="time-slot-menu"
                        optionClassName="time-slot-option"
                        value={app.timeSlot}
                        onChange={(nextValue) => handleTimeSlotChange(app.applicant_no, nextValue)}
                        placeholder="Select time slot..."
                        options={getTimeSlotOptionsForApplicant(app.applicant_no, app.timeSlot, app.assignedDate)}
                      />
                    </div>
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
        <div className="interview-header-main">
          <div className="d-flex-center">
            <Calendar size={24} className="text-blue" />
            <h3 className="sched-title m-0">Interview Schedule</h3>
          </div>
          <span className="badge-light-blue interview-total-badge">
            <Calendar size={16} />
            {filteredScheduledApplicants.length} Total Interviews Scheduled
          </span>
        </div>

        <div className="interview-filter-row">
          <div className="interview-search-box">
            <Search className="search-icon interview-search-icon" size={18} />
            <input
              type="text"
              className="form-control interview-search-input"
              placeholder="Search by name or ID..."
              value={interviewSearchQuery}
              onChange={(e) => setInterviewSearchQuery(e.target.value)}
            />
          </div>
          <div className="interview-branch-filter">
            <CustomSelect
              className="schedule-select"
              icon={<MapPin size={18} />}
              value={interviewBranchFilter}
              onChange={setInterviewBranchFilter}
              placeholder="Filter by Branch"
              options={[
                { value: 'Manila', label: 'Manila' },
                { value: 'Cebu', label: 'Cebu' },
                { value: 'Davao', label: 'Davao' }
              ]}
            />
          </div>
          <div className="interview-position-filter">
            <CustomSelect
              className="schedule-select"
              icon={<Briefcase size={18} />}
              value={interviewPositionFilter}
              onChange={setInterviewPositionFilter}
              placeholder="All Positions"
              options={[
                { value: '', label: 'All Positions' },
                ...availablePositions.map((pos) => ({ value: pos, label: getPositionDisplayName(pos) }))
              ]}
            />
          </div>
          <div className="interview-date-filter">
            <DatePicker
              value={interviewDateFilter}
              onChange={setInterviewDateFilter}
              placeholder="Filter by Date"
            />
            {interviewDateFilter && (
              <button
                type="button"
                className="interview-filter-clear"
                onClick={() => setInterviewDateFilter('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="interview-list">
        {Object.keys(filteredGroupedScheduled).length === 0 ? (
          <div className="empty-state-text text-center p-5">
            {scheduledApplicants.length === 0 ? 'No interviews scheduled yet.' : 'No interviews match the current filters.'}
          </div>
        ) : (
          Object.keys(filteredGroupedScheduled).sort().map(date => {
            const groupApps = filteredGroupedScheduled[date];
            const positionsInGroup = [...new Set(
              groupApps.map(a => String(a.applicant?.position_applied || '').trim()).filter(Boolean)
            )];
            return (
            <div key={date} className="date-group">
              <div className="date-group-title">
                <Calendar size={20} className="text-muted" />
                <div>
                  <h4>{formatDateForDisplay(date)}</h4>
                  <p>{groupApps.length} {groupApps.length === 1 ? 'interview' : 'interviews'} scheduled</p>
                </div>
                {positionsInGroup.length > 0 && (
                  <div className="date-group-positions">
                    {positionsInGroup.map((pos) => (
                      <span
                        key={pos}
                        className={`position-tag${interviewPositionFilter && interviewPositionFilter.toLowerCase() === pos.toLowerCase() ? ' active' : ''}`}
                        title={`Filter by ${getPositionDisplayName(pos)}`}
                        onClick={() => setInterviewPositionFilter(
                          interviewPositionFilter.toLowerCase() === pos.toLowerCase() ? '' : pos
                        )}
                      >
                        <Briefcase size={12} />
                        {getPositionDisplayName(pos)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="date-group-content">
                {filteredGroupedScheduled[date].map(app => (
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
                      <button className="interview-view-btn" onClick={() => setViewApplicantModal(app)}>
                        <Eye size={18}/> View
                      </button>
                      <button className="interview-download-btn" onClick={() => window.open(app.applicant?.resume_url || '#', '_blank')}>
                        <Download size={16}/> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="schedules-wrapper">
      <div className="hr-page-heading">
        <div className="hr-page-icon">
          <Calendar size={22} />
        </div>
        <div>
          <h2>Schedules</h2>
        </div>
      </div>

      <div className="custom-tabs-container">
        <button className={`custom-tab ${activeTab === 'Set Schedule' ? 'active' : ''}`} onClick={() => setActiveTab('Set Schedule')}>
          <Calendar size={16} /> Set Schedule
        </button>
        <button className={`custom-tab ${activeTab === 'Interview' ? 'active' : ''}`} onClick={() => setActiveTab('Interview')}>
          Interview
        </button>
      </div>

      <div className="tabs-content-area">
        {activeTab === 'Set Schedule' ? SetScheduleView() : InterviewView()}
      </div>

      {/* MODAL 1: CONFIRM DATE (STEP 4) */}
      {showConfirmDateModal && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal-box sm-modal confirm-date-modal">
            <div className="confirm-modal-header">
              <div className="confirm-modal-title-row">
                <div className="confirm-modal-icon-box">
                  <Calendar size={24} className="text-blue" />
                </div>
                <h2>Confirm Date Assignment</h2>
              </div>
              <p className="confirm-modal-subtext">Please review the following information before proceeding</p>
            </div>
            
            <div className="confirm-modal-body">
              <div className="gray-box confirm-info-card">
              <label>INTERVIEW DATE</label>
              <div className="box-val confirm-box-val"><Calendar size={18}/> {formatDateForDisplay(selectedDate)}</div>
            </div>

              <div className="gray-box confirm-info-card">
              <label>SELECTED APPLICANTS ({selectedIds.length})</label>
              <ul className="selected-list confirm-selected-list">
                {pendingApplicants.filter(app => selectedIds.includes(app.applicant_no)).map(app => (
                  <li key={app.applicant_no}>• {app.applicant?.first_name} {app.applicant?.last_name} ({app.applicant_no})</li>
                ))}
              </ul>
            </div>

              <div className="yellow-info-box confirm-next-step">
              <CheckCircle size={20} className="text-yellow-dark" />
              <div>
                <strong>Next Step</strong>
                <p>After confirmation, you'll be able to assign specific time slots to each applicant.</p>
              </div>
            </div>

            </div>

            <div className="modal-btn-group confirm-modal-actions">
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
                <p>{completedScheduleCount} interviews are scheduled and ready to go.</p>
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
                  <div className="info-block"><label>Phone</label><p>{viewApplicantModal.applicant?.contact_number || 'N/A'}</p></div>
                  <div className="info-block"><label>Landline Number</label><p>{viewApplicantModal.applicant?.landline_number || 'N/A'}</p></div>
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
              <button className="btn-green flex-1" onClick={() => openDecisionModal('Hired')}><Check size={20}/> Hire</button>
              <button className="btn-red flex-1" onClick={() => openDecisionModal('Rejected')}><X size={20}/> Reject Application</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={Boolean(decisionModal)}
        title={decisionModal ? `${decisionModal.status === 'Hired' ? 'Hire' : 'Reject'} Applicant` : ''}
        message={decisionModal ? `Are you sure you want to mark ${decisionModal.applicantName || 'this applicant'} as ${decisionModal.status}?` : ''}
        confirmLabel={decisionModal ? `Yes, ${decisionModal.status === 'Hired' ? 'hire' : 'reject'} applicant` : 'Confirm'}
        tone={decisionModal?.status === 'Hired' ? 'success' : 'warning'}
        loading={decisionLoading}
        onCancel={() => {
          if (!decisionLoading) setDecisionModal(null);
        }}
        onConfirm={() => handleDecision(decisionModal.status)}
      />

      <Toast
        open={toast.open}
        tone={toast.tone}
        message={toast.message}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />
    </div>
  );
};

export default Schedules;
