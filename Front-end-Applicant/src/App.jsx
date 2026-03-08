import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Lazy load components
const Central = lazy(() => import('./pages/Company/Central'));
const ApplyLanding = lazy(() => import('./pages/Apply/ApplyLanding'));
const SelectBranch = lazy(() => import('./pages/Apply/SelectBranch'));
const SelectPosition = lazy(() => import('./pages/Apply/SelectPosition'));
const RoleDetails = lazy(() => import('./pages/Apply/RoleDetails'));
const ApplicationForm = lazy(() => import('./pages/Apply/ApplicationForm'));
const ApplicationReview = lazy(() => import('./pages/Apply/ApplicationReview')); // <--- BAGONG IMPORT
const Confirmation = lazy(() => import('./pages/Apply/Confirmation'));
const Success = lazy(() => import('./pages/Apply/Success'));
const StatusDashboard = lazy(() => import('./pages/Status/StatusDashboard'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', marginTop: '50px'}}>Loading...</div>}>
        <Routes>
          {/* Landing & Branch */}
          <Route path="/" element={<Central />} />
          <Route path="/apply" element={<ApplyLanding />} />
          <Route path="/apply/branch" element={<SelectBranch />} />
          
          {/* Role Selection */}
          <Route path="/apply/:branch" element={<SelectPosition />} />
          <Route path="/apply/select-position" element={<Navigate to="/apply/Manila" replace />} />
          
          {/* Role Details */}
          <Route path="/apply/:branch/:roleId" element={<RoleDetails />} />
          
          {/* Application Form */}
          <Route path="/apply/:branch/:roleId/form" element={<ApplicationForm />} />
          <Route path="/apply/form" element={<ApplicationForm />} />
          
          {/* Review Page (ITO ANG KULANG KAYA WHITE SCREEN) */}
          <Route path="/apply/:branch/:roleId/review" element={<ApplicationReview />} />

          {/* Post-Submission (Optional/Legacy routes if still used) */}
          <Route path="/apply/confirmation" element={<Confirmation />} />
          <Route path="/apply/success" element={<Success />} />
          
          {/* Status Dashboard */}
          <Route path="/status/dashboard" element={<StatusDashboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;