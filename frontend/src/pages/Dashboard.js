import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Book as BookIcon,
  Group as GroupIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppBarComponent from '../components/AppBarComponent';

const Dashboard = ({ token, setToken }) => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
    username: '',
    totalBooks: 0,
    ownedBooks: 0,
    involvedBooks: 0,
    recentBooks: [],
    totalPages: 0,
    activeProjects: 0
  });

  const friendshipQuotes = [
    { text: "Freundschaft ist die einzige Zement, der die Welt zusammenhalten wird.", author: "Woodrow Wilson" },
    { text: "Ein Freund ist ein Mensch, der die Melodie deines Herzens kennt und sie dir vorspielt, wenn du sie vergessen hast.", author: "Albert Einstein" },
    { text: "Freundschaft ist das einzige Zement, das die Welt jemals zusammenhalten wird.", author: "Woodrow Wilson" },
    { text: "Wahre Freundschaft ist eine sehr langsam wachsende Pflanze.", author: "George Washington" },
    { text: "Freunde sind die Familie, die wir uns aussuchen.", author: "Unbekannt" },
    { text: "Ein wahrer Freund ist jemand, der dich kennt, wie du bist, versteht, wo du warst, dich begleitet in dem, was du wirst.", author: "Unbekannt" },
    { text: "Freundschaft verdoppelt die Freude und halbiert das Leid.", author: "Francis Bacon" },
    { text: "Die schönsten Entdeckungen macht man nicht auf fremden Ländern, sondern indem man mit neuen Augen auf sein Umfeld blickt.", author: "Marcel Proust" }
  ];

  const [currentQuote, setCurrentQuote] = useState(friendshipQuotes[0]);

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * friendshipQuotes.length);
    setCurrentQuote(friendshipQuotes[randomIndex]);
  };

  useEffect(() => {
    fetchUserStats();
    getRandomQuote();
  }, []);

  const fetchUserStats = async () => {
    try {
      // Fetch user info and books
      const booksResponse = await axios.get('http://localhost:5000/api/books', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const books = booksResponse.data;
      const ownedBooks = books.filter(book => book.role === 'admin').length;
      const involvedBooks = 0; // Placeholder
      const totalBooks = ownedBooks + involvedBooks;
      
      // Sort by last_saved_at for recent books
      const recentBooks = books
        .filter(book => book.last_saved_at)
        .sort((a, b) => new Date(b.last_saved_at) - new Date(a.last_saved_at))
        .slice(0, 5);
      
      // Calculate total pages across all books
      let totalPages = 0;
      for (const book of books) {
        try {
          const pagesResponse = await axios.get(`http://localhost:5000/api/books/${book.id}/pages`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          totalPages += pagesResponse.data.length;
        } catch (error) {
          console.error('Failed to fetch pages for book:', book.id);
        }
      }
      
      setUserStats({
        username: 'Benutzer', // Placeholder - would need user endpoint
        totalBooks,
        ownedBooks,
        involvedBooks,
        recentBooks,
        totalPages,
        activeProjects: books.filter(book => {
          const lastSaved = new Date(book.last_saved_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return lastSaved > weekAgo;
        }).length
      });
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nie gespeichert';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <AppBarComponent setToken={setToken} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Welcome Header */}
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
          Willkommen zurück, {userStats.username}!
        </Typography>

        <Grid 
          container 
          spacing={3} 
          sx={{
            width: '100%',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fit, minmax(280px, 1fr))'
            },
            gridAutoFlow: 'row dense',
            gap: 3,
            '& .MuiGrid-item': {
              width: '100%',
              margin: 0,
              maxWidth: 'none'
            }
          }}
        >
          {/* Container 1: Book Statistics */}
          <Grid item>
            <Card elevation={3} sx={{ width: '100%', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  <BookIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Meine Bücher
                </Typography>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h2" component="div" color="primary" sx={{ fontWeight: 'bold' }}>
                    {userStats.totalBooks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Bücher insgesamt
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                    <Box>
                      <Typography variant="h5" color="success.main">
                        {userStats.ownedBooks}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Eigene Bücher
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5" color="info.main">
                        {userStats.involvedBooks}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Beteiligt an
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Container 2: Community */}
          <Grid item>
            <Card elevation={3} sx={{ width: '100%', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Community
                </Typography>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h3" component="div" color="secondary.main">
                    3
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Projektmitglieder
                  </Typography>
                  <Button variant="outlined" sx={{ mt: 2 }}>
                    Community
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Container 3: Recent Projects */}
          <Grid item sx={{ gridColumn: { xs: '1', sm: 'span 2' } }}>
            <Card elevation={3} sx={{ width: '100%', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Zuletzt bearbeitet
                </Typography>
                {userStats.recentBooks.length > 0 ? (
                  <List>
                    {userStats.recentBooks.map((book, index) => (
                      <React.Fragment key={book.id}>
                        <ListItem 
                          button 
                          onClick={() => navigate(`/book/${book.id}`)}
                          sx={{ borderRadius: 1, mb: 1 }}
                        >
                          <ListItemIcon>
                            <BookIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={book.title}
                            secondary={`Zuletzt gespeichert: ${formatDate(book.last_saved_at)}`}
                          />
                          <Chip label={book.role} size="small" color="primary" variant="outlined" />
                        </ListItem>
                        {index < userStats.recentBooks.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    Noch keine Bücher bearbeitet
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Container 4: Quick Actions */}
          <Grid item>
            <Card elevation={3} sx={{ width: '100%', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Schnellaktionen
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/book/create')}
                    fullWidth
                  >
                    Freundschaftsbuch erstellen
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SearchIcon />}
                    fullWidth
                    disabled
                  >
                    Projektmitglieder finden
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Container 5: Activity Statistics */}
          <Grid item>
            <Card elevation={3} sx={{ width: '100%', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Aktivitätsstatistiken
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {userStats.totalPages}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Seiten erstellt
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {userStats.activeProjects}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Aktive Projekte
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Container 6: Motivation */}
          <Grid item>
            <Card elevation={3} sx={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  <FavoriteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Inspiration
                </Typography>
                <Typography variant="body1" sx={{ color: 'white', fontStyle: 'italic', cursor: 'pointer' }} onClick={getRandomQuote}>
                  "{currentQuote.text}"
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1, display: 'block' }}>
                  - {currentQuote.author}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1, display: 'block', fontSize: '0.7rem' }}>
                  Klicken für neues Zitat
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Dashboard;