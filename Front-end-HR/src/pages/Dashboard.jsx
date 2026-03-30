import React, { useState } from 'react';
import logoImg from '../assets/logo.png';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Calendar, 
  BarChart3, 
  LogOut 
} from 'lucide-react'; // Professional, monochrome icons
import Overview from '../Tabs/Overview';
import Applicants from '../Tabs/Applicants';
import JobPostings from '../Tabs/JobPostings';
import Schedules from '../Tabs/Schedules';
import Reports from '../Tabs/Reports';
import ConfirmationModal from '../components/ConfirmationModal';
import './Dashboard.css';

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="logo-container">
            <img src={logoImg} alt="6R Diamond Logo" className="sidebar-logo" />
          </div>
          <nav className="nav-menu">
            <button 
              className={activeTab === 'Dashboard' ? 'nav-item active' : 'nav-item'} 
              onClick={() => setActiveTab('Dashboard')}
            >
              <LayoutDashboard size={20} className="nav-icon" /> Dashboard
            </button>
            <button 
              className={activeTab === 'Applicants' ? 'nav-item active' : 'nav-item'} 
              onClick={() => setActiveTab('Applicants')}
            >
              <Users size={20} className="nav-icon" /> Applicants
            </button>
            <button 
              className={activeTab === 'Jobs' ? 'nav-item active' : 'nav-item'} 
              onClick={() => setActiveTab('Jobs')}
            >
              <Briefcase size={20} className="nav-icon" /> Job Postings
            </button>
            <button 
              className={activeTab === 'Schedules' ? 'nav-item active' : 'nav-item'} 
              onClick={() => setActiveTab('Schedules')}
            >
              <Calendar size={20} className="nav-icon" /> Schedules
            </button>
            <button 
              className={activeTab === 'Reports' ? 'nav-item active' : 'nav-item'} 
              onClick={() => setActiveTab('Reports')}
            >
              <BarChart3 size={20} className="nav-icon" /> Reports
            </button>
          </nav>
        </div>
        <button className="logout-button" onClick={() => setShowLogoutModal(true)}>
          <LogOut size={20} className="nav-icon" /> Logout
        </button>
      </aside>

      <div className="main-section">
        <header className="dashboard-header">
          <div className="header-titles">
            <h1>6R Diamond International Cargo Logistics, Inc.</h1>
            <p>Recruitment Management System</p>
          </div>
          <div className="user-info">
            <div className="user-text">
              <span className="user-name">HANSI RODELLO</span>
              <span className="user-role">HR Manager</span>
            </div>
            <div className="user-badge">HR</div>
          </div>
        </header>

        <main className="content-body">
          {activeTab === 'Dashboard' && <Overview />}
          {activeTab === 'Applicants' && <Applicants />}
          {activeTab === 'Jobs' && <JobPostings />}
          {activeTab === 'Schedules' && <Schedules />}
          {activeTab === 'Reports' && <Reports />}

          {activeTab !== 'Dashboard' && 
           activeTab !== 'Applicants' && 
           activeTab !== 'Jobs' && 
           activeTab !== 'Schedules' &&
           activeTab !== 'Reports' && (
            <div className="placeholder-view">
              <h2>{activeTab} Section</h2>
              <p>This content is under development.</p>
            </div>
          )}
        </main>
      </div>

      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access the HR Dashboard."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        tone="danger"
        icon={LogOut}
        showCloseButton={false}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={onLogout}
      />
    </div>
  );
};

export default Dashboard;
