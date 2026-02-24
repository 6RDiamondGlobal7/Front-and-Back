import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ApplicationForm.css';

// --- ICONS ---
const IconFileBlue = () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> );
const IconCheckCircle = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> );
const IconCheckCircleBlue = () => ( <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> );
const IconCloseDark = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );
const IconWarningLarge = () => ( <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> );
const IconFile = () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> );
const IconClose = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );

const ApplicationReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { branch, roleId } = useParams();
  
  const formData = location.state || {};

  const getFullRoleName = (id) => {
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
    return roles[id] || id?.replace(/-/g, ' ').toUpperCase();
  };

  const [agreed, setAgreed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showIncomplete, setShowIncomplete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [signature, setSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    localStorage.setItem('formStep', '4');
    navigate(`/apply/${branch}/${roleId}/form`);
  };

  // --- SUBMIT FUNCTION WITH FILES ---
  const handleConfirmAction = async () => {
    if (!signature.trim()) {
      setShowConfirm(false);
      setTimeout(() => setShowIncomplete(true), 100);
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
    dataToSend.append('region', formData.region || '');
    dataToSend.append('province', formData.province || '');
    dataToSend.append('city', formData.city || '');
    dataToSend.append('barangay', formData.barangay || '');
    dataToSend.append('detailedAddress', formData.detailedAddress || '');
    
    // --- MEDICAL FIELDS ---
    dataToSend.append('medicalCondition', formData.medicalCondition || 'no');
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
        const response = await axios.post('http://localhost:5000/api/apply', dataToSend);

        if (response.status === 201) {
            console.log("Success! Applicant ID:", response.data.applicantId);
            setShowConfirm(false);
            setTimeout(() => setShowSuccess(true), 100);
        }
    } catch (error) {
        console.error("Submission Error:", error);
        const errorMsg = error.response?.data?.error || error.message;
        alert(`Failed to submit: ${errorMsg}`);
        setShowConfirm(false);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="af-page-container">
      <div className="af-top-nav">
        <button className="af-back-btn" onClick={handleBack}>← Back to Application Form</button>
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
                <div className="af-review-item"><label className="af-review-label-bold">NAME</label><span>{formData.firstName} {formData.lastName}</span></div>
                <div className="af-review-item"><label className="af-review-label-bold">EMAIL</label><span>{formData.email}</span></div>
                <div className="af-review-item"><label className="af-review-label-bold">PHONE</label><span>{formData.contactNumber}</span></div>
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

        <div className="af-privacy-area">
            <label className="af-checkbox-container">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span className="af-custom-checkbox"></span>
            </label>
            <p className="af-privacy-text" onClick={() => setAgreed(!agreed)}>
                I hereby certify that the information provided in this application is true and correct.
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
            <p className="af-modal-yellow-desc">Certify that information is correct.</p>
            <div className="af-modal-yellow-input-group">
                <label>Type your full name (in capital letters)</label>
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
            <p className="af-modal-yellow-desc">Your application and documents have been sent.</p>
            <button className="af-yellow-btn-ok" onClick={() => navigate('/apply')}>Close</button>
          </div>
        </div>
      )}

       {showSample && <div className="af-modal-overlay"><button onClick={() => setShowSample(false)}>Close</button></div>}
    </div>
  );
};

export default ApplicationReview;