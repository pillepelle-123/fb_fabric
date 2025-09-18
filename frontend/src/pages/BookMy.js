import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Box,
  Fade,
} from '@mui/material';
import { Add as AddIcon, Settings as SettingsIcon } from '@mui/icons-material';
import AppBarComponent from '../components/AppBarComponent';

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
    <>
      <AppBarComponent setToken={setToken} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Meine Freundschaftsbücher
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/book/create')}
            sx={{ mb: 3 }}
          >
            Neues Buch erstellen
          </Button>
        </Box>

        <Grid container spacing={3}>
          {books.map((book, index) => (
            <Grid item xs={12} sm={6} md={4} key={book.id}>
              <Fade in timeout={300 + index * 100}>
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      elevation: 8,
                      transform: 'translateY(-4px)',
                    },
                  }}
                  onClick={() => navigate(`/book/${book.id}`)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {book.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {book.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={book.role} size="small" color="primary" />
                      <Chip label={book.size || 'A4'} size="small" variant="outlined" />
                      <Chip 
                        label={book.orientation === 'landscape' ? 'Querformat' : 'Hochformat'} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<SettingsIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/book/${book.id}/settings`);
                      }}
                    >
                      Einstellungen
                    </Button>
                  </CardActions>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
};

export default BookMy;