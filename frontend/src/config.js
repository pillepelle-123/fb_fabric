// API Configuration for different environments
const config = {
  development: {
    API_URL: 'http://localhost:5000'
  },
  production: {
    API_URL: 'https://fb-backend-bvzo.onrender.com'
  }
};

// Determine environment based on hostname or NODE_ENV
const getEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  if (window.location.hostname === 'fb-frontend.onrender.com') {
    return 'production';
  }
  return 'development';
};

const currentConfig = config[getEnvironment()];

export const API_URL = currentConfig.API_URL;