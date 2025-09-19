import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
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
import { Add as AddIcon, Settings as SettingsIcon, Archive as ArchiveIcon } from '@mui/icons-material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AppBarComponent from '../components/AppBarComponent';
import ConfirmDialog from '../components/ConfirmDialog';

const BookMy = ({ token, setToken }) => {
  const [books, setBooks] = useState([]);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/books`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { archived: false }
      });
      setBooks(response.data);
    } catch (error) {
      console.error('Failed to fetch books');
    }
  };

  const handleArchive = async (book) => {
    try {
      await axios.put(`${API_URL}/api/books/${book.id}`, 
        { archived: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBooks(); // Refresh the list after archiving
      setArchiveDialogOpen(false);
      setSelectedBook(null);
    } catch (error) {
      console.error('Failed to archive book');
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
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start', mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/book/create')}
              sx={{ mb: 0 }}
            >
              {!isMobile && 'Neues Buch erstellen'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ArchiveIcon />}
              onClick={() => navigate('/book/archive')}
              sx={{ mb: 0 }}
            >
              {!isMobile && 'Zum Archiv'}
            </Button>
          </Box>
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
                    <Button
                      size="small"
                      startIcon={<ArchiveIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBook(book);
                        setArchiveDialogOpen(true);
                      }}
                    >
                      Archivieren
                    </Button>
                  </CardActions>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>
      <ConfirmDialog
        open={archiveDialogOpen}
        title="Buch archivieren"
        content="Möchten Sie dieses Buch wirklich archivieren?"
        onConfirm={() => handleArchive(selectedBook)}
        onCancel={() => {
          setArchiveDialogOpen(false);
          setSelectedBook(null);
        }}
      />
    </>
  );
};

export default BookMy;