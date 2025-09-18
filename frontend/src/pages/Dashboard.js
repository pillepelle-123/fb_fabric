import React from 'react';
import MenuBar from '../components/MenuBar';

const Dashboard = ({ token, setToken }) => {
  return (
    <div>
      <MenuBar setToken={setToken} />
      <div style={{ padding: '20px' }}>
        <h1>Dashboard</h1>
        <p>Willkommen in der Freundschaftsbuch App!</p>
        <p>Verwenden Sie das Menü oben, um zu Ihren Büchern zu navigieren.</p>
      </div>
    </div>
  );
};

export default Dashboard;