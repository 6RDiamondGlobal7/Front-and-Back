import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SelectBranch.css'; // Sisiguraduhin nating ito ang gamit na CSS

/* --- ICONS --- */
const IconMapPin = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> );
const IconArrowRight = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg> );
const IconArrowLeft = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path></svg> );


const BRANCHES = [
  { id: 'manila', label: 'Manila', active: true },
  { id: 'cebu', label: 'Cebu', active: true },
  { id: 'davao', label: 'Davao', active: true },
];

const SelectBranch = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleBack = () => {
    navigate('/apply'); // Bumalik sa Landing Page
  };

  const handleNext = () => {
    if (selected) {
      // Dito papasok sa Select Position with specific branch (e.g., /apply/manila)
      navigate(`/apply/${selected}`);
    }
  };

  return (
    <div className="sb-page-container">
      {/* Back Button */}
      <button className="sb-back-btn" onClick={handleBack}> <IconArrowLeft/> Back</button>

      <div className="sb-card">
        <h1 className="sb-title">Select Branch</h1>
        <p className="sb-subtitle">Choose the branch you want to apply for</p>

        {/* Branch Options */}
        <div className="sb-grid">
          {BRANCHES.map((branch) => (
            <div 
              key={branch.id} 
              className={`sb-option ${selected === branch.id ? 'selected' : ''}`}
              onClick={() => setSelected(branch.id)}
            >
              <div className="sb-icon-wrapper"><IconMapPin /></div>
              <span className="sb-label">{branch.label}</span>
            </div>
          ))}
        </div>

        {/* Proceed Button */}
        <button 
          className="sb-next-btn" 
          disabled={!selected}
          onClick={handleNext}
        >
          Next: Select Role <IconArrowRight />
        </button>
      </div>
    </div>
  );
};

export default SelectBranch;