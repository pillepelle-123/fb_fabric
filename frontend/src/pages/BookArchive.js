import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
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
  Checkbox,
} from '@mui/material';
import { Delete as DeleteIcon, Unarchive as UnarchiveIcon, CheckBoxOutlineBlank as SelectIcon, Close as CloseIcon, SelectAll as SelectAllIcon } from '@mui/icons-material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AppBarComponent from '../components/AppBarComponent';
import ConfirmDialog from '../components/ConfirmDialog';

const BookArchive = ({ token, setToken }) => {
  const [books, setBooks] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

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
        params: { archived: true }
      });
      setBooks(response.data);
    } catch (error) {
      console.error('Failed to fetch archived books');
    }
  };

  const handleDelete = async (book) => {
    try {
      await axios.delete(`${API_URL}/api/books/${book.id}`, {
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
        `${API_URL}/api/books/${book.id}`,
        { archived: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBooks();
    } catch (error) {
      console.error('Failed to restore book');
    }
  };

  const handleMultiRestore = async () => {
    try {
      await Promise.all(
        selectedBooks.map(bookId => 
          axios.put(`${API_URL}/api/books/${bookId}`, 
            { archived: false },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
      fetchBooks();
      setMultiSelectMode(false);
      setSelectedBooks([]);
      setRestoreDialogOpen(false);
    } catch (error) {
      console.error('Failed to restore books');
    }
  };

  const handleMultiDelete = async () => {
    try {
      await Promise.all(
        selectedBooks.map(bookId => 
          axios.delete(`${API_URL}/api/books/${bookId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      fetchBooks();
      setMultiSelectMode(false);
      setSelectedBooks([]);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete books');
    }
  };

  const toggleBookSelection = (bookId) => {
    setSelectedBooks(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const exitMultiSelectMode = () => {
    setMultiSelectMode(false);
    setSelectedBooks([]);
  };

  const toggleSelectAll = () => {
    if (selectedBooks.length === books.length) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks(books.map(book => book.id));
    }
  };

  const allSelected = selectedBooks.length === books.length && books.length > 0;

  return (
    <>
      <AppBarComponent setToken={setToken} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Archivierte Freundschaftsbücher
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start', mb: 3 }}>
            {!multiSelectMode ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<UnarchiveIcon />}
                  onClick={() => navigate('/book/my')}
                  sx={{ mb: 0 }}
                >
                  {!isMobile && 'Zu meinen Büchern'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SelectIcon />}
                  onClick={() => setMultiSelectMode(true)}
                  sx={{ mb: 0 }}
                >
                  {!isMobile && 'Auswählen'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<UnarchiveIcon />}
                  onClick={() => {
                    if (selectedBooks.length > 0) {
                      setRestoreDialogOpen(true);
                    }
                  }}
                  disabled={selectedBooks.length === 0}
                  sx={{ mb: 0 }}
                >
                  Wiederherstellen ({selectedBooks.length})
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    if (selectedBooks.length > 0) {
                      setDeleteDialogOpen(true);
                    }
                  }}
                  disabled={selectedBooks.length === 0}
                  sx={{ mb: 0 }}
                >
                  Löschen ({selectedBooks.length})
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SelectAllIcon />}
                  onClick={toggleSelectAll}
                  sx={{ mb: 0 }}
                >
                  {allSelected ? 'Alle abwählen' : 'Alle auswählen'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={exitMultiSelectMode}
                  sx={{ mb: 0 }}
                >
                  Abbrechen
                </Button>
              </>
            )}
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
                    cursor: multiSelectMode ? 'pointer' : 'default',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    border: multiSelectMode && selectedBooks.includes(book.id) ? '2px solid' : 'none',
                    borderColor: 'primary.main',
                    '&:hover': {
                      elevation: 8,
                      transform: 'translateY(-4px)',
                    },
                  }}
                  onClick={() => multiSelectMode ? toggleBookSelection(book.id) : undefined}
                >
                  {multiSelectMode && (
                    <Checkbox
                      checked={selectedBooks.includes(book.id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        borderRadius: '50%',
                      }}
                    />
                  )}
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
                  {!multiSelectMode && (
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
                  )}
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>
      <ConfirmDialog
        open={deleteDialogOpen}
        title={selectedBooks.length > 0 ? `${selectedBooks.length} Bücher löschen` : "Buch löschen"}
        content={selectedBooks.length > 0 ? `Möchten Sie ${selectedBooks.length} Bücher wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.` : "Möchten Sie dieses Buch wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."}
        onConfirm={selectedBooks.length > 0 ? handleMultiDelete : () => handleDelete(selectedBook)}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedBook(null);
        }}
      />
      <ConfirmDialog
        open={restoreDialogOpen}
        title={`${selectedBooks.length} Bücher wiederherstellen`}
        content={`Möchten Sie ${selectedBooks.length} Bücher wirklich wiederherstellen?`}
        onConfirm={handleMultiRestore}
        onCancel={() => {
          setRestoreDialogOpen(false);
        }}
      />
    </>
  );
};

export default BookArchive;