import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ApplicationForm.css'; // Shared CSS

const IconCheckBlue = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

const RoleDetails = () => {
  const navigate = useNavigate();
  const { branch, roleId } = useParams();

  const handleBack = () => {
    navigate(`/apply/${branch}`);
  };

  const handleProceed = () => {
    navigate(`/apply/${branch}/${roleId}/form`);
  };

  const getRoleContent = () => {
    if (roleId === 'corp-sec') {
      return {
        title: 'Corporate Secretary/Division Manager for Brokerage',
        desc: 'Oversee brokerage division operations and manage corporate secretarial duties',
        responsibilities: [
          'Oversee daily operations of the brokerage division',
          'Ensure compliance with SEC and corporate regulatory requirements',
          'Manage and maintain corporate documents and records',
          'Serve as liaison between the board of directors and management',
          'Handle administrative duties for the brokerage department'
        ],
        qualifications: [
          'Bachelor\'s Degree in Business, Law, or related field',
          'Proven experience in corporate governance or brokerage management',
          'Strong organizational and leadership skills',
          'Excellent written and verbal communication skills'
        ],
        benefits: [
          'Competitive Executive Salary',
          'Comprehensive Health Insurance',
          'Government Benefits',
          'Professional Development Support'
        ]
      };
    } else if (roleId === 'licensed-broker') {
      return {
        title: 'Licensed Customs Broker',
        desc: 'Handle customs clearance procedures and regulatory compliance',
        responsibilities: [
          'Sign and process customs import/export entries and declarations',
          'Represent the company in Bureau of Customs (BOC) transactions',
          'Ensure accurate tariff classification and computation of duties and taxes',
          'Advise clients on latest customs laws, regulations, and CMTA compliance'
        ],
        qualifications: [
          'Valid PRC License as Customs Broker (Required)',
          'Bachelor\'s Degree in Customs Administration',
          'In-depth knowledge of TCCP, CMTA, and BOC procedures'
        ],
        benefits: [
          'Professional License Allowance',
          'Competitive salary',
          'Health insurance (HMO)'
        ]
      };
    } else if (roleId === 'office-manager' || roleId === 'secretary') {
      return {
        title: 'Secretary to the Office Manager',
        desc: 'Provide administrative support to the Office Manager',
        responsibilities: [
          'Provide administrative support to the Office Manager',
          'Manage calendars, appointments, and meetings',
          'Prepare correspondence, reports, and presentations',
          'Handle incoming calls and visitor inquiries',
          'Maintain filing systems and office records',
          'Coordinate travel arrangements and logistics'
        ],
        qualifications: [
          'Bachelor\'s degree or relevant certification',
          'Minimum 2 years of secretarial or administrative experience',
          'Excellent written and verbal communication skills',
          'Proficient in MS Office (Word, Excel, PowerPoint)',
          'Strong organizational skills and attention to detail'
        ],
        benefits: [
          'Competitive compensation',
          'Health insurance coverage',
          'Skill development programs',
          'Supportive work environment',
          'Leave benefits'
        ]
      };
    } else if (roleId === 'admin-staff') {
        return {
          title: 'Administration Staff',
          desc: 'Support administrative and operational functions',
          responsibilities: [
            'Provide general administrative support to the team',
            'Process and maintain operational documents and records',
            'Assist in data entry and database management'
          ],
          qualifications: [
            'Bachelor\'s degree in any field or relevant diploma',
            'Minimum 1 year of administrative experience',
            'Good computer skills (MS Office, email, internet)'
          ],
          benefits: [
            'Competitive starting salary',
            'Health insurance',
            'Training and mentorship'
          ]
        };
    } else {
      return {
        title: roleId ? roleId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Position Details',
        desc: 'Join our growing team and contribute to our logistics operations.',
        responsibilities: ['Perform duties as assigned', 'Collaborate with team'],
        qualifications: ['Relevant experience', 'Good communication skills'],
        benefits: ['Competitive salary', 'Health insurance']
      };
    }
  };

  const content = getRoleContent();

  return (
    <div className="af-page-container">
      <div className="af-top-nav">
        <button className="af-back-btn" onClick={handleBack}>← Back to Role Selection</button>
        <div className="af-progress-wrapper">
          <div className="af-progress-header-row">
            <span className="af-progress-text">Progress</span>
            <span className="af-progress-step">Step 2 of 5</span>
          </div>
          <div className="af-progress-bar">
            <div className="af-progress-fill" style={{ width: '40%' }}></div>
          </div>
        </div>
      </div>

      <div className="af-card">
        <div className="rd-header">
          <h1 className="af-title">{content.title}</h1>
          <p className="af-subtitle">{content.desc}</p>
        </div>

        <div className="rd-section">
          <h3 className="af-section-title"><span className="af-dot">•</span> Key Responsibilities</h3>
          <ul className="rd-list">
            {content.responsibilities.map((item, i) => (
              <li key={i}><div className="rd-icon"><IconCheckBlue /></div> <span>{item}</span></li>
            ))}
          </ul>
        </div>

        <div className="rd-section">
          <h3 className="af-section-title"><span className="af-dot">•</span> Qualifications</h3>
          <ul className="rd-list">
            {content.qualifications.map((item, i) => (
              <li key={i}><div className="rd-icon"><IconCheckBlue /></div> <span>{item}</span></li>
            ))}
          </ul>
        </div>

        <div className="rd-section">
          <h3 className="af-section-title"><span className="af-dot">•</span> Benefits & Perks</h3>
          <ul className="rd-list">
            {content.benefits.map((item, i) => (
              <li key={i}><div className="rd-icon"><IconCheckBlue /></div> <span>{item}</span></li>
            ))}
          </ul>
        </div>

        <button className="af-next-btn" onClick={handleProceed}>
          Proceed to Application Form →
        </button>
      </div>
    </div>
  );
};

export default RoleDetails;