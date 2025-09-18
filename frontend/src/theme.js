import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2C3A4E',   // Base blue-slate
      light: '#45566F',  // Slightly lighter
      dark: '#1B2532',   // Even darker variant
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1976D2',   // Vibrant blue accent
      light: '#63A4FF',
      dark: '#004BA0',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F4F6F8', // Cool grey background
      paper: '#FFFFFF',
    },
    divider: '#B0BEC5',   // Neutral grey divider
    text: {
      primary: '#1E293B',   // Very dark slate
      secondary: '#475569', // Medium slate
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 500 },
    h2: { fontSize: '2rem', fontWeight: 500 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  spacing: 8,
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2C3A4E',   // Base color remains consistent
      light: '#3E5068',
      dark: '#1B2532',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#64B5F6',   // Softer blue for dark mode
      light: '#90CAF9',
      dark: '#1565C0',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    divider: '#374151',  // Dark slate divider
    text: {
      primary: '#E5E7EB',   // Light grey for readability
      secondary: '#9CA3AF', // Muted grey
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 500 },
    h2: { fontSize: '2rem', fontWeight: 500 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  spacing: 8,
});
