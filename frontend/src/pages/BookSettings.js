import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import {
  Container,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Paper,
  CircularProgress,
  Slide,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import AppBarComponent from '../components/AppBarComponent';
import { useSnackbar } from '../components/SnackbarProvider';

const BookSettings = ({ token, setToken }) => {
  const { showSnackbar } = useSnackbar();
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [settings, setSettings] = useState({
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

  useEffect(() => {
    fetchBook();
  }, [bookId]);

  const fetchBook = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/books`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentBook = response.data.find(b => b.id === parseInt(bookId));
      if (currentBook) {
        setBook(currentBook);
        setSettings({
          title: currentBook.title || '',
          description: currentBook.description || '',
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
        `${API_URL}/api/books/${bookId}/settings`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSnackbar('Einstellungen gespeichert!', 'success');
      navigate('/book/my');
    } catch (error) {
      showSnackbar('Fehler beim Speichern: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  if (!book) return (
    <>
      <AppBarComponent setToken={setToken} />
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    </>
  );

  return (
    <>
      <AppBarComponent setToken={setToken} />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Slide in direction="up" timeout={500}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Bucheinstellungen: {book.title}
            </Typography>
            
            <Box component="form" onSubmit={saveSettings} sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Titel"
                value={settings.title}
                onChange={(e) => setSettings({...settings, title: e.target.value})}
                required
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Beschreibung"
                multiline
                rows={3}
                value={settings.description}
                onChange={(e) => setSettings({...settings, description: e.target.value})}
                sx={{ mb: 3 }}
              />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Größe</InputLabel>
                <Select
                  value={settings.size}
                  label="Größe"
                  onChange={(e) => setSettings({...settings, size: e.target.value})}
                >
                  {sizeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel>Ausrichtung</InputLabel>
                <Select
                  value={settings.orientation}
                  label="Ausrichtung"
                  onChange={(e) => setSettings({...settings, orientation: e.target.value})}
                >
                  <MenuItem value="portrait">Hochformat</MenuItem>
                  <MenuItem value="landscape">Querformat</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/book/my')}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                >
                  Speichern
                </Button>
              </Box>
            </Box>
          </Paper>
        </Slide>
      </Container>
    </>
  );
};

export default BookSettings;