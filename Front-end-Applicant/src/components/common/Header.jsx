import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header style={{
      background: 'white',
      position: 'fixed',
      width: '100%',
      top: 0,
      zIndex: 1000,
      padding: '15px 20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link 
          to="/" 
          style={{
            textDecoration: 'none',
            color: '#003366',
            fontSize: '24px',
            fontWeight: 'bold'
          }}
        >
          GRIAMND
        </Link>
        
        <nav>
          <Link 
            to="/" 
            style={{
              marginRight: '20px',
              textDecoration: 'none',
              color: '#333',
              fontWeight: '500'
            }}
          >
            HOME
          </Link>
          <Link 
            to="/apply"
            style={{
              background: '#0066cc',
              color: 'white',
              padding: '8px 20px',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '600'
            }}
          >
            APPLY HERE
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;