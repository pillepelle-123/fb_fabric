import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MenuBar from '../components/MenuBar';

const BookSettings = ({ token, setToken }) => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [settings, setSettings] = useState({
    size: 'A4',
    orientation: 'portrait'
  });

  const sizeOptions = [
    { value: 'A4', label: 'A4 (21.0 x 29.7 cm)' },
    { value: 'A5', label: 'A5 (14.8 x 21.0 cm)' },
    { value: 'square_21', label: 'Quadrat 21x21 cm' },
    { value: 'square_15', label: 'Quadrat 15x15 cm' }
  ];

  useEffect(() => {
    fetchBook();
  }, [bookId]);

  const fetchBook = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/books', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentBook = response.data.find(b => b.id === parseInt(bookId));
      if (currentBook) {
        setBook(currentBook);
        setSettings({
          size: currentBook.size || 'A4',
          orientation: currentBook.orientation || 'portrait'
        });
      }
    } catch (error) {
      console.error('Failed to fetch book');
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:5000/api/books/${bookId}/settings`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Einstellungen gespeichert!');
      navigate('/my-books');
    } catch (error) {
      alert('Fehler beim Speichern: ' + (error.response?.data?.error || error.message));
    }
  };

  if (!book) return <div>Laden...</div>;

  return (
    <div>
      <MenuBar setToken={setToken} />
      <div style={{ padding: '20px', maxWidth: '600px' }}>
        <h1>Bucheinstellungen: {book.title}</h1>
        
        <form onSubmit={saveSettings}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Größe:</label>
            <select
              value={settings.size}
              onChange={(e) => setSettings({...settings, size: e.target.value})}
              style={{ width: '100%', padding: '10px' }}
            >
              {sizeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Ausrichtung:</label>
            <select
              value={settings.orientation}
              onChange={(e) => setSettings({...settings, orientation: e.target.value})}
              style={{ width: '100%', padding: '10px' }}
            >
              <option value="portrait">Hochformat</option>
              <option value="landscape">Querformat</option>
            </select>
          </div>

          <div>
            <button type="submit" style={{ padding: '10px 20px', marginRight: '10px' }}>
              Speichern
            </button>
            <button type="button" onClick={() => navigate('/my-books')} style={{ padding: '10px 20px' }}>
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookSettings;