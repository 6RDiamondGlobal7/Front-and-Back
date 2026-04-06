import React, { useEffect, useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { getApiBaseUrl } from './config/api';
import './App.css';

const HR_LOGIN_STORAGE_KEY = 'hr_login_session';
const HR_USER_STORAGE_KEY = 'hr_logged_in_user';
const HR_REMEMBER_ID_STORAGE_KEY = 'hr_saved_employee_id';
const HR_ACTIVE_EMPLOYEE_ID_KEY = 'hr_active_employee_id';

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(HR_USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
};

function App() {
  const API_BASE_URL = getApiBaseUrl();

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem(HR_LOGIN_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());

  useEffect(() => {
    const hydrateUserFromSession = async () => {
      if (!isLoggedIn || currentUser) return;

      const employeeId =
        String(sessionStorage.getItem(HR_ACTIVE_EMPLOYEE_ID_KEY) || '').trim() ||
        String(localStorage.getItem(HR_ACTIVE_EMPLOYEE_ID_KEY) || '').trim() ||
        String(localStorage.getItem(HR_REMEMBER_ID_STORAGE_KEY) || '').trim();

      if (!employeeId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/hr/${encodeURIComponent(employeeId)}/profile`);
        if (!response.ok) return;
        const data = await response.json();
        const user = data?.user && typeof data.user === 'object' ? data.user : null;
        if (!user) return;

        setCurrentUser(user);
        sessionStorage.setItem(HR_USER_STORAGE_KEY, JSON.stringify(user));
        sessionStorage.setItem(HR_ACTIVE_EMPLOYEE_ID_KEY, String(user.id || employeeId));

        if (localStorage.getItem(HR_LOGIN_STORAGE_KEY) === 'true') {
          localStorage.setItem(HR_USER_STORAGE_KEY, JSON.stringify(user));
          localStorage.setItem(HR_ACTIVE_EMPLOYEE_ID_KEY, String(user.id || employeeId));
        }
      } catch {
        // Keep UI usable even if profile hydration fails.
      }
    };

    hydrateUserFromSession();
  }, [API_BASE_URL, currentUser, isLoggedIn]);

  const handleLogin = ({ rememberMe, user }) => {
    const safeUser = user && typeof user === 'object' ? user : null;
    setIsLoggedIn(true);
    setCurrentUser(safeUser);

    if (safeUser?.id) {
      sessionStorage.setItem(HR_ACTIVE_EMPLOYEE_ID_KEY, String(safeUser.id));
    }
    if (safeUser) {
      sessionStorage.setItem(HR_USER_STORAGE_KEY, JSON.stringify(safeUser));
    } else {
      sessionStorage.removeItem(HR_USER_STORAGE_KEY);
    }

    if (rememberMe) {
      localStorage.setItem(HR_LOGIN_STORAGE_KEY, 'true');
      if (safeUser) {
        localStorage.setItem(HR_USER_STORAGE_KEY, JSON.stringify(safeUser));
        if (safeUser.id) {
          localStorage.setItem(HR_ACTIVE_EMPLOYEE_ID_KEY, String(safeUser.id));
        }
      } else {
        localStorage.removeItem(HR_USER_STORAGE_KEY);
        localStorage.removeItem(HR_ACTIVE_EMPLOYEE_ID_KEY);
      }
    } else {
      localStorage.removeItem(HR_LOGIN_STORAGE_KEY);
      localStorage.removeItem(HR_USER_STORAGE_KEY);
      localStorage.removeItem(HR_ACTIVE_EMPLOYEE_ID_KEY);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem(HR_LOGIN_STORAGE_KEY);
    localStorage.removeItem(HR_USER_STORAGE_KEY);
    localStorage.removeItem(HR_ACTIVE_EMPLOYEE_ID_KEY);
    sessionStorage.removeItem(HR_USER_STORAGE_KEY);
    sessionStorage.removeItem(HR_ACTIVE_EMPLOYEE_ID_KEY);
  };

  return (
    <div className="App">
      {isLoggedIn ? 
        <Dashboard onLogout={handleLogout} user={currentUser} /> : 
        <Login onLogin={handleLogin} />
      }
    </div>
  );
}

export default App;
