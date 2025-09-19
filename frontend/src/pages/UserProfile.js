import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Email as EmailIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Book as BookIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppBarComponent from '../components/AppBarComponent';

const UserProfile = ({ token, setToken }) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
    created_at: '',
    totalBooks: 0,
    recentActivity: []
  });

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const [userResponse, booksResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/me', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/books', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const books = booksResponse.data;
      const recentBooks = books
        .filter(book => book.last_saved_at)
        .sort((a, b) => new Date(b.last_saved_at) - new Date(a.last_saved_at))
        .slice(0, 5);

      console.log('User response data:', userResponse.data);
      setUserInfo({
        ...userResponse.data,
        totalBooks: books.length,
        recentActivity: recentBooks
      });
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unbekannt';
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Ungültiges Datum';
    }
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <>
      <AppBarComponent setToken={setToken} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Profile Header */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem'
                }}
              >
                {userInfo.username ? userInfo.username[0].toUpperCase() : '?'}
              </Avatar>
              <Box>
                <Typography variant="h4" gutterBottom>
                  {userInfo.username}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Mitglied seit {formatDate(userInfo.created_at)}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* User Details */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Persönliche Informationen
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Benutzername"
                      secondary={userInfo.username}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="E-Mail"
                      secondary={userInfo.email}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Mitglied seit"
                      secondary={formatDate(userInfo.created_at)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <BookIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Freundschaftsbücher"
                      secondary={`${userInfo.totalBooks} Bücher erstellt`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Letzte Aktivitäten
                </Typography>
                <List>
                  {userInfo.recentActivity.map((book) => (
                    <React.Fragment key={book.id}>
                      <ListItem 
                        button 
                        onClick={() => navigate(`/book/${book.id}`)}
                      >
                        <ListItemIcon>
                          <BookIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={book.title}
                          secondary={`Zuletzt bearbeitet: ${formatDate(book.last_saved_at)}`}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default UserProfile;