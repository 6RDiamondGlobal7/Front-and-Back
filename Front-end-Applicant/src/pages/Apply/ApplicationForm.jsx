import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ApplicationForm.css';

/* --- ICONS --- */
const IconUpload = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> );
const IconClose = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );
const IconFile = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> );
const IconCheckCircle = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> );
const IconCalendar = () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> );
const IconChevronLeft = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg> );
const IconChevronRight = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg> );
const IconWarning = () => ( <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> );

/* --- CUSTOM DATE PICKER --- */
const CustomDatePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('days');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const handleDayClick = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const offset = newDate.getTimezoneOffset();
    const adjustedDate = new Date(newDate.getTime() - (offset*60*1000));
    onChange({ target: { name: 'birthday', value: adjustedDate.toISOString().split('T')[0] } });
    setIsOpen(false);
  };

  const handleYearClick = (year) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setViewMode('days');
  };

  const changeMonth = (offset) => { setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1)); };
  
  const getDaysArray = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getYearsArray = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= 1950; y--) years.push(y);
    return years;
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="cdp-container" ref={containerRef}>
      <div className="cdp-input-wrapper" onClick={() => setIsOpen(!isOpen)}>
        <input type="text" className="af-input cdp-input" value={formatDate(value)} placeholder="Select Birthday" readOnly />
        <div className="cdp-icon"><IconCalendar /></div>
      </div>
      {isOpen && (
        <div className="cdp-popup">
          <div className="cdp-header">
            {viewMode === 'days' && <button className="cdp-nav-btn" onClick={() => changeMonth(-1)}><IconChevronLeft /></button>}
            <div className="cdp-title" onClick={() => setViewMode(viewMode === 'days' ? 'years' : 'days')}>
              {viewMode === 'days' ? `${months[viewDate.getMonth()]} ${viewDate.getFullYear()}` : 'Select Year'}
              {viewMode === 'days' && <span className="cdp-toggle-hint"> (Click to change)</span>}
            </div>
            {viewMode === 'days' && <button className="cdp-nav-btn" onClick={() => changeMonth(1)}><IconChevronRight /></button>}
          </div>
          <div className="cdp-body">
            {viewMode === 'days' ? (
              <>
                <div className="cdp-weekdays">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}</div>
                <div className="cdp-days-grid">
                  {getDaysArray().map((day, index) => (
                    <div key={index} className={`cdp-day ${!day ? 'empty' : ''} ${value && new Date(value).getDate() === day && new Date(value).getMonth() === viewDate.getMonth() && new Date(value).getFullYear() === viewDate.getFullYear() ? 'selected' : ''}`} onClick={() => day && handleDayClick(day)}>{day}</div>
                  ))}
                </div>
              </>
            ) : (
              <div className="cdp-years-grid">
                {getYearsArray().map(year => (
                  <div key={year} className={`cdp-year ${viewDate.getFullYear() === year ? 'selected' : ''}`} onClick={() => handleYearClick(year)}>{year}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* --- MAIN FORM COMPONENT --- */
const ApplicationForm = () => {
  const navigate = useNavigate();
  const { branch, roleId } = useParams();
  
  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = localStorage.getItem('formStep');
    return savedStep ? parseInt(savedStep) : 3;
  });

  const [showSample, setShowSample] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const resumeInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const prcInputRef = useRef(null); 

  const isBrokerRole = roleId ? roleId.toLowerCase().includes('broker') : false;

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', middleInitial: '', suffix: '',
    nationality: '', birthday: '', age: '', email: '', contactNumber: '',
    region: '', province: '', city: '', barangay: '', detailedAddress: '',
    resume: null, coverLetter: null, prcId: null, medicalCondition: null, medicalDetails: ''
  });

  const [ageError, setAgeError] = useState(false);
  const [contactError, setContactError] = useState(false);

  // UPDATED REGIONS WITH FULL ABBREVIATIONS
  const regions = [
    "NCR - National Capital Region",
    "CAR - Cordillera Administrative Region",
    "Region I - Ilocos Region",
    "Region II - Cagayan Valley",
    "Region III - Central Luzon",
    "Region IV-A - CALABARZON",
    "MIMAROPA Region",
    "Region V - Bicol Region",
    "Region VI - Western Visayas",
    "Region VII - Central Visayas",
    "Region VIII - Eastern Visayas",
    "NIR - Negros Island Region",
    "Region IX - Zamboanga Peninsula",
    "Region X - Northern Mindanao",
    "Region XI - Davao Region",
    "Region XII - SOCCSKSARGEN",
    "Region XIII - Caraga",
    "BARMM - Bangsamoro Autonomous Region in Muslim Mindanao"
  ];

  useEffect(() => {
    if (formData.birthday) {
      const birthDate = new Date(formData.birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      
      setFormData(prev => ({ ...prev, age: age >= 0 ? age : '' }));

      if (age < 18 || age > 59) {
        setAgeError(true);
      } else {
        setAgeError(false);
      }
    }
  }, [formData.birthday]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contactNumber') {
      const numericValue = value.replace(/\D/g, ''); 
      if (numericValue.length <= 11) {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
        if (numericValue.length === 11 && numericValue.startsWith('0')) setContactError(false);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileClick = (ref) => {
    if (ref.current && !ref.current.disabled) ref.current.click();
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) setFormData(prev => ({ ...prev, [fieldName]: file }));
  };

  const validateStep3 = () => {
    const required = ['firstName', 'lastName', 'nationality', 'birthday', 'age', 'email', 'contactNumber', 'region', 'province', 'city', 'barangay', 'detailedAddress'];
    let missing = false;
    for (let field of required) {
      if (!formData[field] || formData[field].toString().trim() === '') missing = true;
    }
    let invalidContact = false;
    if (!formData.contactNumber.startsWith('0') || formData.contactNumber.length !== 11) {
      invalidContact = true;
      setContactError(true);
    } else {
      setContactError(false);
    }
    return { missing, invalidContact }; 
  };

  const validateStep4 = () => {
    if (!formData.resume) return true;
    if (formData.medicalCondition === null) return true;
    if (formData.medicalCondition === 'yes' && !formData.medicalDetails.trim()) return true;
    if (isBrokerRole && !formData.prcId) return true;
    return false;
  };

  const handleNext = () => {
    if (currentStep === 3) {
      const { missing, invalidContact } = validateStep3();
      let errors = [];
      if (missing) errors.push("Fill in all required fields.");
      if (ageError) errors.push("Age must be between 18 and 59.");
      if (invalidContact) errors.push("Contact number must start with 0 and be 11 digits.");
      if (errors.length > 0) {
        setErrorMessage(errors.join(" "));
        setShowError(true);
      } else {
        setCurrentStep(4);
        localStorage.setItem('formStep', '4');
        window.scrollTo(0, 0);
      }
    } else {
      if (validateStep4()) {
        setErrorMessage("Please upload all required documents and complete the medical declaration.");
        setShowError(true);
      } else {
        localStorage.removeItem('formStep');
        navigate(`/apply/${branch}/${roleId}/review`, { state: formData });
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 4) {
        setCurrentStep(3);
        localStorage.setItem('formStep', '3');
    }
    else navigate(`/apply/${branch}/${roleId}`);
  };

  return (
    <div className="af-page-container">
      <div className="af-top-nav">
        <button className="af-back-btn" onClick={handleBack}>← Back</button>
        <div className="af-progress-wrapper">
          <div className="af-progress-header-row">
            <span className="af-progress-text">Progress</span>
            <span className="af-progress-step">Step {currentStep} of 5</span>
          </div>
          <div className="af-progress-bar"><div className="af-progress-fill" style={{ width: currentStep === 3 ? '60%' : '80%' }}></div></div>
        </div>
      </div>

      <div className="af-card">
        <div className="af-header">
          <div>
            <h1 className="af-title">Application Form</h1>
            <p className="af-subtitle">{currentStep === 3 ? "Fill out your personal information" : "Upload documents and medical declaration"}</p>
          </div>
          <button className="af-sample-btn" onClick={() => setShowSample(true)}>Sample Form</button>
        </div>

        {currentStep === 3 && (
          <div className="af-step-content fade-in">
            <h3 className="af-section-title"><span className="af-dot">•</span> Personal Information</h3>
            <div className="af-grid">
              <div className="af-group"><label className="af-label">First Name <span className="req">*</span></label><input type="text" name="firstName" className="af-input" placeholder="e.g., Juan" value={formData.firstName} onChange={handleChange} /></div>
              <div className="af-group"><label className="af-label">Last Name <span className="req">*</span></label><input type="text" name="lastName" className="af-input" placeholder="e.g., Dela Cruz" value={formData.lastName} onChange={handleChange} /></div>
              <div className="af-group"><label className="af-label">Middle Initial (Optional)</label><input type="text" name="middleInitial" className="af-input" placeholder="e.g., P" value={formData.middleInitial} onChange={handleChange} /></div>
              <div className="af-group"><label className="af-label">Suffix (Optional)</label><input type="text" name="suffix" className="af-input" placeholder="e.g., Jr., III" value={formData.suffix} onChange={handleChange} /></div>
              <div className="af-group"><label className="af-label">Nationality <span className="req">*</span></label><input type="text" name="nationality" className="af-input" placeholder="e.g., Filipino" value={formData.nationality} onChange={handleChange} /></div>
              <div className="af-group">
                <label className="af-label">Birthday <span className="req">*</span></label>
                <CustomDatePicker value={formData.birthday} onChange={handleChange} />
              </div>
              <div className="af-group">
                <label className="af-label">Age <span className="req">*</span></label>
                <input type="text" className={`af-input disabled ${ageError ? 'input-error' : ''}`} value={ageError && formData.age ? "Invalid Age" : formData.age} placeholder="Auto-calculated" readOnly />
              </div>
              <div className="af-group"><label className="af-label">Email Address <span className="req">*</span></label><input type="email" name="email" className="af-input" placeholder="e.g., juan.delacruz@email.com" value={formData.email} onChange={handleChange} /></div>
              <div className="af-group full-width-mobile">
                <label className="af-label">Contact Number <span className="req">*</span></label>
                <input type="text" name="contactNumber" className={`af-input ${contactError ? 'input-error' : ''}`} placeholder="e.g., 09171234567" value={formData.contactNumber} onChange={handleChange} />
              </div>
            </div>
            <h3 className="af-section-title"><span className="af-dot">•</span> Address</h3>
            <div className="af-grid">
              <div className="af-group">
                <label className="af-label">Region <span className="req">*</span></label>
                <select name="region" className="af-input" value={formData.region} onChange={handleChange}>
                    <option value="">Select Region</option>
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="af-group"><label className="af-label">Province <span className="req">*</span></label><input type="text" name="province" className="af-input" placeholder="e.g., Metro Manila" value={formData.province} onChange={handleChange} /></div>
              <div className="af-group"><label className="af-label">City/Municipality <span className="req">*</span></label><input type="text" name="city" className="af-input" placeholder="e.g., Quezon City" value={formData.city} onChange={handleChange} /></div>
              <div className="af-group"><label className="af-label">Barangay <span className="req">*</span></label><input type="text" name="barangay" className="af-input" placeholder="e.g., Commonwealth" value={formData.barangay} onChange={handleChange} /></div>
              <div className="af-group full-width"><label className="af-label">Detailed Address (House No., Street, Subdivision) <span className="req">*</span></label><input type="text" name="detailedAddress" className="af-input" value={formData.detailedAddress} onChange={handleChange} placeholder="e.g., 123 Sampaguita Street, Villa Esperanza Subdivision" /></div>
            </div>
            <button className="af-next-btn" onClick={handleNext}>Next: Documents & Medical →</button>
          </div>
        )}

        {currentStep === 4 && (
          <div className="af-step-content fade-in">
            <h3 className="af-section-title"><span className="af-dot">•</span> Required Documents</h3>
            <div className="af-upload-section">
              <label className="af-label">Resume/CV (PDF format) <span className="req">*</span></label>
              <input type="file" ref={resumeInputRef} style={{ display: 'none' }} accept=".pdf" onChange={(e) => handleFileChange(e, 'resume')} />
              <div className={`af-upload-box ${formData.resume ? 'uploaded' : ''}`} onClick={() => handleFileClick(resumeInputRef)}>
                {formData.resume ? <><IconCheckCircle /><span className="af-file-name">{formData.resume.name}</span></> : <><IconUpload /><span>Click to upload your resume</span></>}
              </div>
              <div className="af-note-box"><p><strong>Note:</strong> Make sure to add your 2x2 recent photo (taken within 6 months) in your resume</p><p><strong>File name format:</strong> FirstName_LastName_Resume.pdf</p></div>
            </div>
            <div className="af-upload-section">
              <label className="af-label">
                PRC ID (Front & Back - PDF/Image) 
                {isBrokerRole ? <span className="req"> *</span> : <span className="af-optional-text"> (For Licensed Customs Broker role only)</span>}
              </label>
              <input type="file" ref={prcInputRef} style={{ display: 'none' }} accept=".pdf,.jpg,.png" disabled={!isBrokerRole} onChange={(e) => handleFileChange(e, 'prcId')} />
              <div className={`af-upload-box ${formData.prcId ? 'uploaded' : ''} ${!isBrokerRole ? 'disabled' : ''}`} onClick={() => handleFileClick(prcInputRef)}>
                {formData.prcId ? ( <><IconCheckCircle /><span className="af-file-name">{formData.prcId.name}</span></> ) : ( <><IconUpload /><span>{isBrokerRole ? "Click to upload PRC ID (Front & Back)" : "Not applicable for this position"}</span></> )}
              </div>
            </div>
            <div className="af-upload-section">
              <label className="af-label">Cover Letter (Optional)</label>
              <input type="file" ref={coverInputRef} style={{ display: 'none' }} accept=".pdf" onChange={(e) => handleFileChange(e, 'coverLetter')} />
              <div className={`af-upload-box ${formData.coverLetter ? 'uploaded' : ''}`} onClick={() => handleFileClick(coverInputRef)}>
                {formData.coverLetter ? <><IconCheckCircle /><span className="af-file-name">{formData.coverLetter.name}</span></> : <><IconUpload /><span>Click to upload cover letter (optional)</span></>}
              </div>
              <div className="af-note-box"><p><strong>File name format:</strong> FirstName_LastName_CoverLetter.pdf</p></div>
            </div>
            
            <h3 className="af-section-title" style={{marginTop: '40px'}}><span className="af-dot">•</span> Medical Condition Declaration</h3>
            <p className="af-med-question">Do you have any medical condition that may affect your work performance? <span className="req">*</span></p>
            <div className="af-med-options">
              <div className={`af-med-option ${formData.medicalCondition === 'yes' ? 'selected' : ''}`} onClick={() => setFormData({...formData, medicalCondition: 'yes'})}>Yes</div>
              <div className={`af-med-option ${formData.medicalCondition === 'no' ? 'selected' : ''}`} onClick={() => setFormData({...formData, medicalCondition: 'no'})}>No</div>
            </div>

            {formData.medicalCondition === 'yes' && (
              <div className="af-med-details-area fade-in">
                <label className="af-label">Please specify your condition</label>
                <textarea 
                  name="medicalDetails" 
                  className="af-textarea" 
                  placeholder="Describe your medical condition and how it might affect your work..."
                  value={formData.medicalDetails}
                  onChange={handleChange}
                ></textarea>
              </div>
            )}

            <button className="af-next-btn" onClick={handleNext}>Next: Review & Submit →</button>
          </div>
        )}
      </div>

      {showError && (
        <div className="af-modal-overlay">
          <div className="af-error-content fade-in">
            <div className="af-error-icon-bg"><IconWarning /></div>
            <h2 className="af-error-title">Submission Error</h2>
            <p className="af-error-desc">{errorMessage}</p>
            <button className="af-error-btn" onClick={() => setShowError(false)}>OK</button>
          </div>
        </div>
      )}

      {showSample && (
        <div className="af-modal-overlay">
          <div className="af-modal-content">
            <button className="af-modal-close" onClick={() => setShowSample(false)}><IconClose /></button>
            <h2 className="af-modal-title">Sample Complete Application</h2>
            <p className="af-modal-subtitle">Use this as a guide to fill out your application correctly</p>
            <div className="af-modal-scroll">
                <div className="af-sample-section af-sample-section-blue">
                    <h4 className="af-sample-header" style={{color: '#1A242F'}}>• Personal Information</h4>
                    <div className="af-grid sample-grid">
                        <div className="af-sample-field"><label>First Name</label><div className="af-input sample">Juan</div></div>
                        <div className="af-sample-field"><label>Last Name</label><div className="af-input sample">Dela Cruz</div></div>
                        <div className="af-sample-field"><label>Middle Initial</label><div className="af-input sample">P</div></div>
                        <div className="af-sample-field"><label>Nationality</label><div className="af-input sample">Filipino</div></div>
                        <div className="af-sample-field"><label>Birthday</label><div className="af-input sample">01/15/1995</div></div>
                        <div className="af-sample-field"><label>Age</label><div className="af-input sample">30</div></div>
                        <div className="af-sample-field"><label>Email Address</label><div className="af-input sample">juan.delacruz@email.com</div></div>
                        <div className="af-sample-field"><label>Contact Number</label><div className="af-input sample">09171234567</div></div>
                    </div>
                </div>
                <div className="af-sample-section af-sample-section-green">
                    <h4 className="af-sample-header" style={{color: '#15803d'}}>• Address</h4>
                    <div className="af-grid sample-grid">
                        <div className="af-sample-field"><label>Region</label><div className="af-input sample">NCR - National Capital Region</div></div>
                        <div className="af-sample-field"><label>Province</label><div className="af-input sample">Metro Manila</div></div>
                        <div className="af-sample-field"><label>City/Municipality</label><div className="af-input sample">Quezon City</div></div>
                        <div className="af-sample-field"><label>Barangay</label><div className="af-input sample">Commonwealth</div></div>
                        <div className="af-sample-field full-width"><label>Detailed Address (House No., Street, Subdivision)</label><div className="af-input sample">123 Sampaguita Street, Villa Esperanza Subdivision</div></div>
                    </div>
                </div>
                <div className="af-sample-section af-sample-section-yellow">
                    <h4 className="af-sample-header" style={{color: '#1A242F'}}>• Required Documents</h4>
                    <div className="af-sample-field"><label>Resume/CV (PDF format)</label><div className="af-input sample file-look"><IconFile /> Juan_DelaCruz_Resume.pdf</div></div>
                    <div className="af-sample-field"><label>PRC ID (Front & Back - PDF/Image)</label><div className="af-input sample file-look"><IconFile /> Juan_DelaCruz_PRCID.pdf</div></div>
                    <div className="af-sample-field"><label>Cover Letter (Optional - PDF format)</label><div className="af-input sample file-look"><IconFile /> Juan_DelaCruz_CoverLetter.pdf</div></div>
                </div>
                <div className="af-sample-section af-sample-section-purple">
                    <h4 className="af-sample-header" style={{color: '#1A242F'}}>• Medical Condition Declaration</h4>
                    <p style={{fontSize: '13px', color: '#475569', marginBottom: '8px'}}>Do you have any medical condition that may affect your work performance?</p>
                    <div className="af-med-sample-row"><div className="af-med-radio"><span>○</span> Yes</div><div className="af-med-radio selected"><span>●</span> No</div></div>
                    <p style={{fontSize: '11px', fontStyle: 'italic', color: '#64748b', marginTop: '8px'}}>* If "Yes", please specify your condition in the text box that will appear</p>
                </div>
            </div>
            <div className="af-modal-footer"><strong>Note:</strong> Make sure all information is accurate and complete before submitting your application.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationForm;