import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false); // Clears the session

  return (
    <div className="App">
      {isLoggedIn ? 
        <Dashboard onLogout={handleLogout} /> : 
        <Login onLogin={handleLogin} />
      }
    </div>
  );
}

export default App;