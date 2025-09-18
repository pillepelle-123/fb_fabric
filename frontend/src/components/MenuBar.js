import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const MenuBar = ({ setToken }) => {
  const navigate = useNavigate();

  const logout = () => {
    setToken(null);
    navigate('/login');
  };

  return (
    <div style={{ 
      padding: '10px 20px', 
      borderBottom: '1px solid #ccc',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <div>
        <Link to="/dashboard" style={{ marginRight: '20px', textDecoration: 'none' }}>Dashboard</Link>
        <Link to="/my-books" style={{ textDecoration: 'none' }}>Meine Bücher</Link>
      </div>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default MenuBar;