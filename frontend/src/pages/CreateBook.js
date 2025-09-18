import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MenuBar from '../components/MenuBar';

const CreateBook = ({ token, setToken }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    size: 'A4',
    orientation: 'portrait'
  });

  const sizeOptions = [
    { value: 'A4', label: 'A4 (21.0 x 29.7 cm)' },
    { value: 'A5', label: 'A5 (14.8 x 21.0 cm)' },
    { value: 'square_21', label: 'Quadrat 21x21 cm' },
    { value: 'square_15', label: 'Quadrat 15x15 cm' }
  ];

  const createBook = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/books', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/my-books');
    } catch (error) {
      alert('Fehler beim Erstellen: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div>
      <MenuBar setToken={setToken} />
      <div style={{ padding: '20px', maxWidth: '600px' }}>
        <h1>Neues Freundschaftsbuch erstellen</h1>
        
        <form onSubmit={createBook}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Titel:</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              style={{ width: '100%', padding: '10px' }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Beschreibung:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              style={{ width: '100%', padding: '10px', height: '80px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Größe:</label>
            <select
              value={formData.size}
              onChange={(e) => setFormData({...formData, size: e.target.value})}
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
              value={formData.orientation}
              onChange={(e) => setFormData({...formData, orientation: e.target.value})}
              style={{ width: '100%', padding: '10px' }}
            >
              <option value="portrait">Hochformat</option>
              <option value="landscape">Querformat</option>
            </select>
          </div>

          <div>
            <button type="submit" style={{ padding: '10px 20px', marginRight: '10px' }}>
              Erstellen
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

export default CreateBook;