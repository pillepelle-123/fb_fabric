import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  Fade,
} from '@mui/material';
import { Delete as DeleteIcon, Unarchive as UnarchiveIcon, Add as AddIcon } from '@mui/icons-material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AppBarComponent from '../components/AppBarComponent';
import ConfirmDialog from '../components/ConfirmDialog';

const BookArchive = ({ token, setToken }) => {
  const [books, setBooks] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/books', {
        headers: { Authorization: `Bearer ${token}` },
        params: { archived: true }
      });
      setBooks(response.data);
    } catch (error) {
      console.error('Failed to fetch archived books');
    }
  };

  const handleDelete = async (book) => {
    try {
      await axios.delete(`http://localhost:5000/api/books/${book.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBooks(); // Refresh the list after deletion
      setDeleteDialogOpen(false);
      setSelectedBook(null);
    } catch (error) {
      console.error('Failed to delete book');
    }
  };

  const handleRestore = async (book) => {
    try {
      await axios.put(
        `http://localhost:5000/api/books/${book.id}`,
        { archived: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/book/my'); // Redirect after restore
    } catch (error) {
      console.error('Failed to restore book');
    }
  };

  return (
    <>
      <AppBarComponent setToken={setToken} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Archivierte Freundschaftsbücher
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start', mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<UnarchiveIcon />}
              onClick={() => navigate('/book/my')}
              sx={{ mb: 0 }}
            >
              {!isMobile && 'Zu meinen Büchern'}
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
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      elevation: 8,
                      transform: 'translateY(-4px)',
                    },
                  }}
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
                      startIcon={<DeleteIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBook(book);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      Löschen
                    </Button>
                    <Button
                      size="small"
                      startIcon={<UnarchiveIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(book);
                      }}
                    >
                      Wiederherstellen
                    </Button>
                  </CardActions>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Buch löschen"
        content="Möchten Sie dieses Buch wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={() => handleDelete(selectedBook)}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedBook(null);
        }}
      />
    </>
  );
};

export default BookArchive;