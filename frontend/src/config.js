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

// Page sizes at 300 DPI in pixels
export const PAGE_SIZES = {
  A4: {
    name: 'DIN A4',
    pageWidth: 2480,
    pageHeight: 3508,
    canvasWidth: 2678, // 8% larger
    canvasHeight: 3789  // 8% larger
  },
  A3: {
    name: 'DIN A3',
    pageWidth: 3508,
    pageHeight: 4961,
    canvasWidth: 3789,
    canvasHeight: 5358
  },
  LETTER: {
    name: 'US Letter',
    pageWidth: 2550,
    pageHeight: 3300,
    canvasWidth: 2754,
    canvasHeight: 3564
  },
  SQUARE_SM: {
    name: 'Quadratisch (15x15 cm)',
    pageWidth: 1771,
    pageHeight: 1771,
    canvasWidth: 1913,
    canvasHeight: 1913
  }
};

export const getPageDimensions = (pageSize, orientation = 'portrait') => {
  const size = PAGE_SIZES[pageSize] || PAGE_SIZES.A4;
  
  if (orientation === 'landscape') {
    return {
      ...size,
      pageWidth: size.pageHeight,
      pageHeight: size.pageWidth,
      canvasWidth: size.canvasHeight,
      canvasHeight: size.canvasWidth
    };
  }
  
  return size;
};