import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ApplicationForm.css';
import { getApiBaseUrl } from '../../config/api';
import { useToast } from '../../components/ui/ToastProvider';

// --- ICONS ---
const IconFileBlue = () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> );
const IconCheckCircle = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> );
const IconCheckCircleBlue = () => ( <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> );
const IconCloseDark = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );
const IconWarningLarge = () => ( <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> );
const IconFile = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> );
const IconClose = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );
const IconArrowLeft = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path></svg> );

const ApplicationReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { branch, roleId } = useParams();
  const API_BASE_URL = getApiBaseUrl();
  
  const formData = location.state || {};

  const getFullRoleName = (id) => {
    const roles = {
      'corp-sec': 'Corporate Secretary',
      'licensed-broker': 'Licensed Customs Broker',
      'office-manager': 'Office Manager',
      'messenger': 'Messenger / Logistics',
      internship: 'Internship',
      'secretary': 'Secretary to the Office Manager',
      'brokerage-specialist': 'Brokerage Specialist',
      'import-export-head': 'Import & Export Head',
      'admin-staff': 'Administration Staff'
    };
    return roles[id] || id?.replace(/-/g, ' ').toUpperCase();
  };

  const [agreed, setAgreed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [signature, setSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const expectedFullName = [
    formData.firstName,
    formData.middleInitial,
    formData.lastName,
    formData.suffix
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const normalizeName = (value) => String(value || '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

  const handleBack = () => {
    localStorage.setItem('formStep', '4');
    navigate(`/apply/${branch}/${roleId}/form`, { state: formData });
  };

  // --- SUBMIT FUNCTION WITH FILES ---
  const handleConfirmAction = async () => {
    const typedName = normalizeName(signature);
    const expectedName = normalizeName(expectedFullName);

    if (!typedName) {
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: 'Please type your full name exactly as entered in the application form.',
        timeout: 9000
      });
      return;
    }

    if (!expectedName || typedName !== expectedName) {
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: expectedFullName
          ? `The name must match your application form name: ${expectedFullName}.`
          : 'The name must match the name entered in the application form.',
        timeout: 9000
      });
      return;
    } 

    setIsSubmitting(true);

    // 1. Create FormData Object (Required for Files)
    const dataToSend = new FormData();

    // 2. Append Text Fields
    dataToSend.append('firstName', formData.firstName || '');
    dataToSend.append('lastName', formData.lastName || '');
    dataToSend.append('middleInitial', formData.middleInitial || '');
    dataToSend.append('suffix', formData.suffix || '');
    dataToSend.append('nationality', formData.nationality || '');
    dataToSend.append('birthday', formData.birthday || '');
    dataToSend.append('age', formData.age || '');
    dataToSend.append('email', formData.email || '');
    dataToSend.append('contactNumber', formData.contactNumber || '');
    dataToSend.append('landlineNumber', formData.landlineNumber || '');
    dataToSend.append('region', formData.region || '');
    dataToSend.append('province', formData.province || '');
    dataToSend.append('city', formData.city || '');
    dataToSend.append('barangay', formData.barangay || '');
    dataToSend.append('detailedAddress', formData.detailedAddress || '');
    
    // --- MEDICAL FIELDS ---
    dataToSend.append('medicalCondition', formData.medicalCondition || 'disagree');
    dataToSend.append('medicalDetails', formData.medicalDetails || '');
    
    // --- APPLIED YOUR SPECIFIC CODE SNIPPET HERE ---
    dataToSend.append('branch', branch); 
    dataToSend.append('positionApplied', roleId); 
    // ----------------------------------------------

    // 3. Append Files (Only if they exist)
    if (formData.resume) {
        dataToSend.append('resume', formData.resume);
    }
    if (formData.coverLetter) {
        dataToSend.append('coverLetter', formData.coverLetter);
    }
    if (formData.prcId) {
        dataToSend.append('prcId', formData.prcId);
    }

    try {
        // 4. Send using Axios (It automatically handles the Multipart header)
        const response = await axios.post(`${API_BASE_URL}/api/apply`, dataToSend);

        if (response.status === 201) {
            console.log("Success! Applicant ID:", response.data.applicantId);
            setShowConfirm(false);
            setTimeout(() => setShowSuccess(true), 100);
        }
    } catch (error) {
      console.error("Submission Error:", error);
      const errorMsg = error.response?.data?.error || error.message;
      showToast({ type: 'error', title: 'Submission Failed', message: errorMsg, timeout: 9000 });
      setShowConfirm(false);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="af-page-container">
      <div className="af-top-nav">
        <button className="af-back-btn" onClick={handleBack}><IconArrowLeft /> Back to Application Form</button>
        <div className="af-progress-wrapper">
          <div className="af-progress-header-row"><span className="af-progress-text">Progress</span><span className="af-progress-step">Step 5 of 5</span></div>
          <div className="af-progress-bar"><div className="af-progress-fill" style={{ width: '100%' }}></div></div>
        </div>
      </div>

      <div className="af-card">
        <div className="af-header">
          <div><h1 className="af-title">Application Form</h1><p className="af-subtitle">Review and submit</p></div>
          <button className="af-sample-btn" onClick={() => setShowSample(true)}>Sample</button>
        </div>

        <div className="af-review-position-box">
            <div className="af-review-pos-label">Position Applied For</div>
            <div className="af-review-pos-value">{getFullRoleName(roleId)}</div>
        </div>

        {/* PERSONAL INFO */}
        <div className="af-review-section-card">
            <h3 className="af-section-title"><span className="af-dot">•</span> Personal Information</h3>
            <div className="af-review-grid-inner">
                <div className="af-review-item"><label className="af-review-label-bold">NAME</label><span>{formData.firstName || 'N/A'} {formData.lastName || ''}</span></div>
                <div className="af-review-item"><label className="af-review-label-bold">MIDDLE INITIAL</label><span>{formData.middleInitial || 'N/A'}</span></div>
                <div className="af-review-item"><label className="af-review-label-bold">SUFFIX</label><span>{formData.suffix || 'N/A'}</span></div>
                <div className="af-review-item"><label className="af-review-label-bold">NATIONALITY</label><span>{formData.nationality || 'N/A'}</span></div>
                <div className="af-review-item"><label className="af-review-label-bold">BIRTHDAY</label><span>{formData.birthday || 'N/A'}</span></div>
                <div className="af-review-item"><label className="af-review-label-bold">AGE</label><span>{formData.age || 'N/A'}</span></div>
                <div className="af-review-item"><label className="af-review-label-bold">EMAIL</label><span>{formData.email || 'N/A'}</span></div>
                <div className="af-review-item"><label className="af-review-label-bold">PHONE</label><span>{formData.contactNumber || 'N/A'}</span></div>
                <div className="af-review-item"><label className="af-review-label-bold">LANDLINE</label><span>{formData.landlineNumber || 'N/A'}</span></div>
            </div>
        </div>

        {/* ADDRESS */}
        <div className="af-review-section-card">
            <h3 className="af-section-title"><span className="af-dot">•</span> Address</h3>
            <div className="af-review-grid-inner">
                <div className="af-review-item"><label className="af-review-label-bold">REGION</label><span>{formData.region || 'N/A'}</span></div>
                <div className="af-review-item"><label className="af-review-label-bold">PROVINCE</label><span>{formData.province || 'N/A'}</span></div>
                <div className="af-review-item"><label className="af-review-label-bold">CITY / MUNICIPALITY</label><span>{formData.city || 'N/A'}</span></div>
                <div className="af-review-item"><label className="af-review-label-bold">BARANGAY</label><span>{formData.barangay || 'N/A'}</span></div>
                <div className="af-review-item"><label className="af-review-label-bold">DETAILED ADDRESS</label><span>{formData.detailedAddress || 'N/A'}</span></div>
            </div>
        </div>

        {/* MEDICAL EXAMINATION NOTICE */}
        <div className="af-review-section-card">
            <h3 className="af-section-title"><span className="af-dot">•</span> Medical Examination Notice</h3>
            <p className="af-review-notice-text">
              Applicants are required to undergo a medical process or physical examination through the company's accredited diagnostic clinic as part of the application process.
            </p>
            <div className="af-review-grid-inner">
                <div className="af-review-item">
                    <label className="af-review-label-bold">APPLICANT RESPONSE</label>
                    <span>
                      {formData.medicalCondition === 'agree'
                        ? 'Agreed'
                        : formData.medicalCondition === 'disagree'
                          ? 'Disagreed'
                          : 'N/A'}
                    </span>
                </div>
            </div>
        </div>

        {/* DOCUMENTS */}
        <div className="af-review-section-card">
            <h3 className="af-section-title"><span className="af-dot">•</span> Documents</h3>
            <div className="af-review-doc-list">
                {/* Note: We display .name because React can't display the File object itself */}
                <div className="af-review-doc-item"><IconFileBlue /> {formData.resume?.name || "No Resume Attached"}</div>
                {formData.prcId && <div className="af-review-doc-item"><IconFileBlue /> {formData.prcId.name}</div>}
                {formData.coverLetter && <div className="af-review-doc-item"><IconFileBlue /> {formData.coverLetter.name}</div>}
            </div>
        </div>

        {/* PRE-EMPLOYMENT REQUIREMENTS CHECKLIST */}
        <div className="af-review-section-card">
            <h3 className="af-section-title"><span className="af-dot">•</span> Pre-employment Requirements Checklist</h3>
            <p className="af-review-notice-text">
              Please prepare the following documents before the hiring date. These are required for your onboarding process.
            </p>
            <div className="af-preemployment-checklist">
                <div className="af-checklist-item">
                    <span className="af-checklist-box">□</span>
                    <span className="af-checklist-text">Police Clearance</span>
                </div>
                <div className="af-checklist-item">
                    <span className="af-checklist-box">□</span>
                    <span className="af-checklist-text">Photocopy of SSS (Social Security System)</span>
                </div>
                <div className="af-checklist-item">
                    <span className="af-checklist-box">□</span>
                    <span className="af-checklist-text">Photocopy of PhilHealth</span>
                </div>
                <div className="af-checklist-item">
                    <span className="af-checklist-box">□</span>
                    <span className="af-checklist-text">Photocopy of Pag-IBIG</span>
                </div>
                <div className="af-checklist-item">
                    <span className="af-checklist-box">□</span>
                    <span className="af-checklist-text">Other necessary employment documents as requested</span>
                </div>
            </div>
        </div>

        <div className="af-falsification-notice">
            <div className="af-falsification-icon"><IconWarningLarge /></div>
            <div>
                <h3>Falsification Notice</h3>
                <p>
                    Falsification of documents or information submitted in this application may result in perjury, immediate disqualification from the application process, and other appropriate action.
                </p>
            </div>
        </div>

        <div className="af-privacy-area">
            <label className="af-checkbox-container">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span className="af-custom-checkbox"></span>
            </label>
          <p className="af-privacy-text" onClick={() => setAgreed(!agreed)}>
            I declare that the information and documents I have provided in this application are complete, true, and accurate to the best of my knowledge. I consent to the collection, use, and processing of my personal data for recruitment and employment purposes. I understand that any falsification or misrepresentation may lead to disqualification or further action.
          </p>
        </div>

        <button className="af-next-btn blue-btn" onClick={() => setShowConfirm(true)} disabled={!agreed} style={{opacity: agreed ? 1 : 0.6}}>
            <IconCheckCircle /> Submit Application
        </button>
      </div>

      {showConfirm && (
        <div className="af-modal-overlay">
          <div className="af-modal-yellow-box fade-in">
            <h3 className="af-modal-yellow-title">Confirmation</h3>
            <p className="af-modal-yellow-desc">Please confirm that you agree to the declaration: the information and documents you provided are true and accurate, you consent to processing of your personal data for recruitment purposes, and you understand that falsification may result in disqualification.</p>
            <div className="af-modal-yellow-input-group">
                <label>Type your full name exactly as entered in the application form</label>
                {expectedFullName && (
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    Application form name: {expectedFullName}
                  </div>
                )}
                <input type="text" placeholder="FIRST NAME LAST NAME" value={signature} onChange={(e) => setSignature(e.target.value.toUpperCase())} autoFocus />
            </div>
            <div className="af-modal-yellow-actions">
              <button className="af-yellow-btn-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="af-yellow-btn-confirm" onClick={handleConfirmAction} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="af-modal-overlay">
          <div className="af-modal-yellow-box center fade-in" style={{maxWidth: '420px', padding: '48px 32px'}}>
            <button className="af-modal-yellow-close" onClick={() => navigate('/apply')}><IconCloseDark /></button>
            <div className="af-yellow-icon-circle success"><IconCheckCircleBlue /></div>
            <h3 className="af-modal-yellow-title">Application Submitted!</h3>
            <p className="af-modal-yellow-desc">Your application and documents have been sent. Your applicant number and password were also sent to your email.</p>
            <button className="af-yellow-btn-ok" onClick={() => navigate('/apply')}>Close</button>
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
                <h4 className="af-sample-header" style={{ color: '#1A242F' }}>• Personal Information</h4>
                <div className="af-grid sample-grid">
                  <div className="af-sample-field"><label>First Name</label><div className="af-input sample">Juan</div></div>
                  <div className="af-sample-field"><label>Last Name</label><div className="af-input sample">Dela Cruz</div></div>
                  <div className="af-sample-field"><label>Middle Initial</label><div className="af-input sample">P</div></div>
                  <div className="af-sample-field"><label>Nationality</label><div className="af-input sample">Filipino</div></div>
                  <div className="af-sample-field"><label>Birthday</label><div className="af-input sample">01/15/1995</div></div>
                  <div className="af-sample-field"><label>Age</label><div className="af-input sample">30</div></div>
                  <div className="af-sample-field"><label>Email Address</label><div className="af-input sample">juan.delacruz@email.com</div></div>
                  <div className="af-sample-field"><label>Contact Number</label><div className="af-input sample">09171234567</div></div>
                  <div className="af-sample-field"><label>Landline Number (Optional)</label><div className="af-input sample">0281234567</div></div>
                </div>
              </div>
              <div className="af-sample-section af-sample-section-green">
                <h4 className="af-sample-header" style={{ color: '#15803d' }}>• Address</h4>
                <div className="af-grid sample-grid">
                  <div className="af-sample-field"><label>Region</label><div className="af-input sample">NCR - National Capital Region</div></div>
                  <div className="af-sample-field"><label>Province</label><div className="af-input sample">Metro Manila</div></div>
                  <div className="af-sample-field"><label>City/Municipality</label><div className="af-input sample">Quezon City</div></div>
                  <div className="af-sample-field"><label>Barangay</label><div className="af-input sample">Commonwealth</div></div>
                  <div className="af-sample-field full-width"><label>Detailed Address (House No., Street, Subdivision)</label><div className="af-input sample">123 Sampaguita Street, Villa Esperanza Subdivision</div></div>
                </div>
              </div>
              <div className="af-sample-section af-sample-section-yellow">
                <h4 className="af-sample-header" style={{ color: '#1A242F' }}>• Required Documents</h4>
                <div className="af-sample-field"><label>Resume/CV (PDF format)</label><div className="af-input sample file-look"><IconFile /> Juan_DelaCruz_Resume.pdf</div></div>
                <div className="af-sample-field"><label>PRC ID (Front & Back - PDF/Image)</label><div className="af-input sample file-look"><IconFile /> Juan_DelaCruz_PRCID.pdf</div></div>
                <div className="af-sample-field"><label>Application Letter (Optional - PDF format)</label><div className="af-input sample file-look"><IconFile /> Juan_DelaCruz_ApplicationLetter.pdf</div></div>
              </div>
              <div className="af-sample-section af-sample-section-purple">
                <h4 className="af-sample-header" style={{ color: '#1A242F' }}>• Medical Examination Notice</h4>
                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}>Applicants are required to undergo a medical process or physical examination through the company's accredited diagnostic clinic.</p>
                <div className="af-med-sample-row"><div className="af-med-radio selected"><span>●</span> Agree</div><div className="af-med-radio"><span>○</span> Disagree</div></div>
                <p style={{ fontSize: '11px', fontStyle: 'italic', color: '#64748b', marginTop: '8px' }}>* If "Disagree" is selected, the application process will not proceed.</p>
              </div>
            </div>
            <div className="af-modal-footer"><strong>Note:</strong> Make sure all information is accurate and complete before submitting your application.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationReview;
