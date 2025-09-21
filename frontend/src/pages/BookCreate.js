import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL, PAGE_SIZES } from '../config';
import {
  Container,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Paper,
  Slide,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import AppBarComponent from '../components/AppBarComponent';
import { useSnackbar } from '../components/SnackbarProvider';

const BookCreate = ({ token, setToken }) => {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    size: 'A4',
    orientation: 'portrait'
  });

  const sizeOptions = Object.entries(PAGE_SIZES).map(([key, size]) => ({
    value: key,
    label: size.name
  }));

  const createBook = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/books`, {
        ...formData,
        page_size: formData.size
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/book/my');
    } catch (error) {
      showSnackbar('Fehler beim Erstellen: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  return (
    <>
      <AppBarComponent setToken={setToken} />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Slide in direction="up" timeout={500}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Neues Freundschaftsbuch erstellen
            </Typography>
            
            <Box component="form" onSubmit={createBook} sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Titel"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Beschreibung"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                sx={{ mb: 3 }}
              />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Seitengröße</InputLabel>
                <Select
                  value={formData.size}
                  label="Seitengröße"
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
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
                  value={formData.orientation}
                  label="Ausrichtung"
                  onChange={(e) => setFormData({...formData, orientation: e.target.value})}
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
                  Erstellen
                </Button>
              </Box>
            </Box>
          </Paper>
        </Slide>
      </Container>
    </>
  );
};

export default BookCreate;