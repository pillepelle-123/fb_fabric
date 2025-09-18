import React, { useState } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Tab,
  Tabs,
  Fade,
  Alert,
} from '@mui/material';
import { Login as LoginIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';

const Login = ({ setToken }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { username: formData.username, email: formData.email, password: formData.password };
      
      console.log('Sending request to:', `http://localhost:5000${endpoint}`, payload);
      const response = await axios.post(`http://localhost:5000${endpoint}`, payload);
      setToken(response.data.token);
    } catch (error) {
      console.error('Authentication error:', error.response?.data || error.message);
      setError(error.response?.data?.error || error.message || 'Authentication failed');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Fade in timeout={800}>
        <Paper elevation={6} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h3" component="h1" align="center" gutterBottom color="primary">
            Freundschaftsbuch
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={isLogin ? 0 : 1} 
              onChange={(e, newValue) => {
                setIsLogin(newValue === 0);
                setError('');
                setFormData({ username: '', email: '', password: '' });
              }}
              centered
            >
              <Tab label="Anmelden" icon={<LoginIcon />} />
              <Tab label="Registrieren" icon={<PersonAddIcon />} />
            </Tabs>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit}>
            {!isLogin && (
              <TextField
                fullWidth
                label="Benutzername"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
                sx={{ mb: 2 }}
              />
            )}
            
            <TextField
              fullWidth
              label="E-Mail"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Passwort"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              startIcon={isLogin ? <LoginIcon /> : <PersonAddIcon />}
              sx={{ py: 1.5 }}
            >
              {isLogin ? 'Anmelden' : 'Registrieren'}
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default Login;