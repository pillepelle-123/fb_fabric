import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Key as KeyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import AppBarComponent from '../components/AppBarComponent';

const UserSettings = ({ token, setToken }) => {
  const [userInfo, setUserInfo] = useState({
    username: '',
    email: ''
  });
  
  const [formData, setFormData] = useState({
    newUsername: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(true);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserInfo(response.data);
      setFormData(prev => ({ ...prev, newUsername: response.data.username }));
    } catch (error) {
      setError('Failed to fetch user information');
    }
  };

  // Check username availability with debounce
  useEffect(() => {
    const checkUsername = async () => {
      if (formData.newUsername && formData.newUsername !== userInfo.username) {
        try {
          const response = await axios.get(
            `http://localhost:5000/api/users/check-username/${formData.newUsername}`
          );
          setUsernameAvailable(response.data.available);
        } catch (error) {
          console.error('Failed to check username:', error);
        }
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.newUsername, userInfo.username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const updateUsername = async () => {
    if (!formData.newUsername) {
      setError('Benutzername darf nicht leer sein');
      return;
    }

    if (!usernameAvailable) {
      setError('Dieser Benutzername ist bereits vergeben');
      return;
    }

    setLoading(true);
    try {
      await axios.put('http://localhost:5000/api/me/username', 
        { username: formData.newUsername },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Benutzername erfolgreich aktualisiert');
      fetchUserInfo();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update username');
    }
    setLoading(false);
  };

  const updatePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Bitte alle Passwortfelder ausfüllen');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Neue Passwörter stimmen nicht überein');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Neues Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);
    try {
      await axios.put('http://localhost:5000/api/me/password', 
        { 
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Passwort erfolgreich aktualisiert');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update password');
    }
    setLoading(false);
  };

  return (
    <>
      <AppBarComponent setToken={setToken} />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Username Settings */}
        <Card elevation={3} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Benutzernamen ändern
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                name="newUsername"
                label="Neuer Benutzername"
                value={formData.newUsername}
                onChange={handleChange}
                error={!usernameAvailable && formData.newUsername !== userInfo.username}
                helperText={
                  !usernameAvailable && formData.newUsername !== userInfo.username
                    ? 'Dieser Benutzername ist bereits vergeben'
                    : ' '
                }
                fullWidth
              />
              <Button
                variant="contained"
                onClick={updateUsername}
                disabled={loading || !usernameAvailable}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                Speichern
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Passwort ändern
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                name="currentPassword"
                label="Aktuelles Passwort"
                type="password"
                value={formData.currentPassword}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                name="newPassword"
                label="Neues Passwort"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                name="confirmPassword"
                label="Neues Passwort bestätigen"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={updatePassword}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <KeyIcon />}
                sx={{ mt: 1 }}
              >
                Passwort ändern
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default UserSettings;