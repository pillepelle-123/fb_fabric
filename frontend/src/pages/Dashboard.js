import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grow,
} from '@mui/material';
import AppBarComponent from '../components/AppBarComponent';

const Dashboard = ({ token, setToken }) => {
  return (
    <>
      <AppBarComponent setToken={setToken} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grow in timeout={800}>
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" gutterBottom color="primary">
              Dashboard
            </Typography>
            <Typography variant="h6" paragraph color="text.secondary">
              Willkommen in der Freundschaftsbuch App!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Verwenden Sie das Menü oben, um zu Ihren Büchern zu navigieren.
            </Typography>
          </Paper>
        </Grow>
      </Container>
    </>
  );
};

export default Dashboard;