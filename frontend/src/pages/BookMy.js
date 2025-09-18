import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MenuBar from '../components/MenuBar';

const BookMy = ({ token, setToken }) => {
  const [books, setBooks] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/books', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(response.data);
    } catch (error) {
      console.error('Failed to fetch books');
    }
  };



  return (
    <div>
      <MenuBar setToken={setToken} />
      <div style={{ padding: '20px' }}>
      <h1>Meine Freundschaftsbücher</h1>
      
      <button 
        onClick={() => navigate('/create-book')}
        style={{ padding: '10px 20px', marginBottom: '20px' }}
      >
        Neues Buch erstellen
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {books.map(book => (
          <div 
            key={book.id} 
            style={{ 
              border: '1px solid #ccc', 
              padding: '20px', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={() => navigate(`/book/${book.id}`)}
          >
            <h3>{book.title}</h3>
            <p>{book.description}</p>
            <small>Rolle: {book.role} | {book.size || 'A4'} | {book.orientation === 'landscape' ? 'Querformat' : 'Hochformat'}</small>
            <div style={{ marginTop: '10px' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`/book/${book.id}/settings`); }}
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                Einstellungen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
};

export default BookMy;