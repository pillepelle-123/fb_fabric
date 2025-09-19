import React, { useState, useEffect } from 'react';
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
  Popper,
  Paper,
  Grow,
  MenuList,
  MenuItem,
  ClickAwayListener,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Book as BookIcon,
  Archive as ArchiveIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const AppBarComponent = ({ setToken, username: propUsername }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [username, setUsername] = useState(propUsername || localStorage.getItem('username'));
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

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
    setUserMenuOpen(true);
  };

  const handleUserMenuClose = () => {
    setUserMenuOpen(false);
  };

  const [bookMenuAnchor, setBookMenuAnchor] = useState(null);
  const [bookMenuOpen, setBookMenuOpen] = useState(false);

  const handleBookMenuOpen = (event) => {
    setBookMenuAnchor(event.currentTarget);
    setBookMenuOpen(true);
  };

  const handleBookMenuClose = () => {
    setBookMenuOpen(false);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' }
  ];

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <List>
        {menuItems.map((item) => {
          const isActive = (item.path === '/dashboard' && isDashboardPage);
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
        <ListItem>
          <ListItemIcon><BookIcon /></ListItemIcon>
          <ListItemText primary="Bücher" />
        </ListItem>
        <List component="div" disablePadding>
          <ListItem 
            button 
            sx={{ pl: 4 }}
            onClick={() => {
              navigate('/book/my');
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon><BookIcon /></ListItemIcon>
            <ListItemText primary="Meine Bücher" />
          </ListItem>
          <ListItem 
            button 
            sx={{ pl: 4 }}
            onClick={() => {
              navigate('/book/archive');
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon><ArchiveIcon /></ListItemIcon>
            <ListItemText primary="Archiv" />
          </ListItem>
        </List>
        <ListItem 
          button 
          onClick={() => {
            navigate('/user/profile');
            setDrawerOpen(false);
          }}
        >
          <ListItemIcon><PersonIcon /></ListItemIcon>
          <ListItemText primary="Profil" />
        </ListItem>
        <ListItem 
          button 
          onClick={() => {
            navigate('/user/settings');
            setDrawerOpen(false);
          }}
        >
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          <ListItemText primary="Einstellungen" />
        </ListItem>
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
                const isActive = (item.path === '/dashboard' && isDashboardPage);
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
              <Box
                onMouseEnter={handleBookMenuOpen}
                onMouseLeave={handleBookMenuClose}
                sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              >
                <Button
                  color="inherit"
                  startIcon={<BookIcon />}
                >
                  Bücher
                </Button>
                <Popper
                  open={bookMenuOpen}
                  anchorEl={bookMenuAnchor}
                  role={undefined}
                  placement="bottom-start"
                  transition
                  disablePortal
                  sx={{ zIndex: 1300 }}
                >
                  {({ TransitionProps }) => (
                    <Grow
                      {...TransitionProps}
                      style={{ transformOrigin: 'top left' }}
                    >
                      <Paper>
                        <ClickAwayListener onClickAway={handleBookMenuClose}>
                          <MenuList autoFocusItem={bookMenuOpen}>
                            <MenuItem
                              onClick={() => {
                                navigate('/book/my');
                                handleBookMenuClose();
                              }}
                            >
                              <ListItemIcon>
                                <BookIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText>Meine Bücher</ListItemText>
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                navigate('/book/archive');
                                handleBookMenuClose();
                              }}
                            >
                              <ListItemIcon>
                                <ArchiveIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText>Archiv</ListItemText>
                            </MenuItem>
                          </MenuList>
                        </ClickAwayListener>
                      </Paper>
                    </Grow>
                  )}
                </Popper>
              </Box>
              <Box 
                onMouseEnter={handleUserMenuOpen}
                onMouseLeave={handleUserMenuClose}
                sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              >
                <Avatar 
                  sx={{ 
                    width: 28, 
                    height: 28,
                    marginRight: 0.5,
                    color: 'primary.main',
                    bgcolor: 'white',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    paddingLeft: 0.2,
                    paddingTop: 0.2,
                    cursor: 'pointer',
                  }}
                >
                  {username?.[0]?.toUpperCase() || '?'}
                </Avatar>
                <Button
                  color="inherit"
                >
                  {username}
                </Button>
                <Popper
                  open={userMenuOpen}
                  anchorEl={userMenuAnchor}
                  role={undefined}
                  placement="bottom-start"
                  transition
                  disablePortal
                  sx={{ zIndex: 1300 }}
                >
                  {({ TransitionProps }) => (
                    <Grow
                      {...TransitionProps}
                      style={{ transformOrigin: 'top left' }}
                    >
                      <Paper>
                        <ClickAwayListener onClickAway={handleUserMenuClose}>
                          <MenuList autoFocusItem={userMenuOpen}>
                            <MenuItem
                              onClick={() => {
                                navigate('/user/profile');
                                handleUserMenuClose();
                              }}
                            >
                              <ListItemIcon>
                                <PersonIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText>Profil</ListItemText>
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                navigate('/user/settings');
                                handleUserMenuClose();
                              }}
                            >
                              <ListItemIcon>
                                <SettingsIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText>Einstellungen</ListItemText>
                            </MenuItem>
                          </MenuList>
                        </ClickAwayListener>
                      </Paper>
                    </Grow>
                  )}
                </Popper>
              </Box>
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