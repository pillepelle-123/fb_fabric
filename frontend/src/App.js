import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BookMy from './pages/BookMy';
import BookCreate from './pages/BookCreate';
import BookSettings from './pages/BookSettings';
import BookEditor from './pages/BookEditor';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={!token ? <Login setToken={setToken} /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard" 
            element={token ? <Dashboard token={token} setToken={setToken} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/book/my" 
            element={token ? <BookMy token={token} setToken={setToken} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/book/create" 
            element={token ? <BookCreate token={token} setToken={setToken} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/book/:bookId/settings" 
            element={token ? <BookSettings token={token} setToken={setToken} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/book/:bookId" 
            element={token ? <BookEditor token={token} setToken={setToken} /> : <Navigate to="/login" />} 
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;