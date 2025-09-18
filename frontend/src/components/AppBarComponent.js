import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Book as BookIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const AppBarComponent = ({ setToken }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isBookPage = location.pathname.startsWith('/book');
  const isDashboardPage = location.pathname === '/dashboard';

  const logout = () => {
    setToken(null);
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Bücher', icon: <BookIcon />, path: '/book/my' },
  ];

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <List>
        {menuItems.map((item) => {
          const isActive = (item.path === '/dashboard' && isDashboardPage) || 
                          (item.path === '/book/my' && isBookPage);
          return (
            <ListItem 
              button 
              key={item.text}
              onClick={() => {
                navigate(item.path);
                setDrawerOpen(false);
              }}
              sx={{
                backgroundColor: isActive ? 'primary.dark' : 'transparent',
                '&:hover': {
                  backgroundColor: isActive ? 'primary.main' : 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{ color: isActive ? 'white' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ color: isActive ? 'white' : 'inherit' }}
              />
            </ListItem>
          );
        })}
        <ListItem button onClick={logout}>
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Freundschaftsbuch
          </Typography>
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {menuItems.map((item) => {
                const isActive = (item.path === '/dashboard' && isDashboardPage) || 
                                (item.path === '/book/my' && isBookPage);
                return (
                  <Button
                    key={item.text}
                    color={isActive ? 'primary' : 'inherit'}
                    onClick={() => navigate(item.path)}
                    startIcon={item.icon}
                    variant={isActive ? 'contained' : 'text'}
                    sx={{
                      backgroundColor: isActive ? 'primary.dark' : 'transparent',
                      color: isActive ? 'white' : 'inherit',
                      '&:hover': {
                        backgroundColor: isActive ? 'primary.main' : 'rgba(255, 255, 255, 0.08)',
                      },
                    }}
                  >
                    {item.text}
                  </Button>
                );
              })}
              <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />}>
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default AppBarComponent;