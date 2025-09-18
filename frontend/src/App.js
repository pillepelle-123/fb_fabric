import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyBooks from './pages/MyBooks';
import CreateBook from './pages/CreateBook';
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
            path="/my-books" 
            element={token ? <MyBooks token={token} setToken={setToken} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/create-book" 
            element={token ? <CreateBook token={token} setToken={setToken} /> : <Navigate to="/login" />} 
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