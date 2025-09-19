import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import io from 'socket.io-client';
import axios from 'axios';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import AppBarComponent from '../components/AppBarComponent';
import { useSnackbar } from '../components/SnackbarProvider';
import ConfirmDialog from '../components/ConfirmDialog';

const BookEditor = ({ token, setToken }) => {
  const { showSnackbar } = useSnackbar();
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState([]);
  const [editor, setEditor] = useState(null);
  const [tempPages, setTempPages] = useState([]);
  const [deletedPages, setDeletedPages] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, onConfirm: null });
  const [bookTitle, setBookTitle] = useState('');
  const [pageMenuAnchor, setPageMenuAnchor] = useState(null);


  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.emit('joinBook', bookId);
    
    fetchPages();

    return () => newSocket.close();
  }, [bookId, currentPage]);



  useEffect(() => {
    if (editor) {
      // First check temp pages for any changes
      const tempPageData = tempPages.find(p => p.page_number === currentPage);
      
      if (tempPageData && tempPageData.canvas_data && typeof tempPageData.canvas_data === 'object' && tempPageData.canvas_data.store) {
        editor.store.loadSnapshot(tempPageData.canvas_data);
      } else {
        // Then check saved pages
        const savedPageData = pages.find(p => p.page_number === currentPage);
        if (savedPageData && savedPageData.canvas_data && typeof savedPageData.canvas_data === 'object' && savedPageData.canvas_data.store) {
          editor.store.loadSnapshot(savedPageData.canvas_data);
        } else if (tempPages.find(p => p.page_number === currentPage)) {
          // Clear canvas for new temp page without valid data
          setTimeout(() => {
            editor.selectAll();
            editor.deleteShapes(editor.getSelectedShapeIds());
          }, 100);
        }
      }
    }
  }, [editor, pages, tempPages, deletedPages, currentPage]);



  const fetchPages = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/books/${bookId}/pages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPages(response.data);
      

    } catch (error) {
      console.error('Failed to fetch pages:', error);
    }
  };

  // Fetch book title
  useEffect(() => {
    const fetchBookTitle = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/books', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const book = response.data.find(b => b.id === parseInt(bookId));
        if (book) {
          setBookTitle(book.title);
        }
      } catch (error) {
        console.error('Failed to fetch book title:', error);
      }
    };
    fetchBookTitle();
  }, [bookId, token]);

  const savePage = async () => {
    if (!editor) {
      showSnackbar('Editor nicht bereit', 'warning');
      return;
    }
    
    try {
      // Save current page canvas data first
      const canvasData = editor.store.getSnapshot();
      
      // Collect all pages with their data
      const allPagesToSave = [];
      
      // Add existing pages (excluding deleted ones)
      for (const page of pages) {
        if (!deletedPages.includes(page.page_number)) {
          const tempPageData = tempPages.find(p => p.page_number === page.page_number);
          const pageData = page.page_number === currentPage ? canvasData : 
                          (tempPageData?.canvas_data || page.canvas_data);
          allPagesToSave.push({ original_number: page.page_number, canvas_data: pageData });
        }
      }
      
      // Add temp pages (new pages)
      for (const tempPage of tempPages) {
        if (!pages.find(p => p.page_number === tempPage.page_number)) {
          const pageData = tempPage.page_number === currentPage ? canvasData : 
                          (tempPage.canvas_data || {});
          allPagesToSave.push({ original_number: tempPage.page_number, canvas_data: pageData });
        }
      }
      
      // Sort by original page number
      allPagesToSave.sort((a, b) => a.original_number - b.original_number);
      
      // Delete all existing pages
      await axios.delete(
        `http://localhost:5000/api/books/${bookId}/pages/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Save pages with sequential numbering (1, 2, 3...)
      for (let i = 0; i < allPagesToSave.length; i++) {
        await axios.put(
          `http://localhost:5000/api/books/${bookId}/pages/${i + 1}`,
          { canvasData: allPagesToSave[i].canvas_data },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      // Update current page to new sequential number
      const currentPageIndex = allPagesToSave.findIndex(p => p.original_number === currentPage);
      if (currentPageIndex !== -1) {
        setCurrentPage(currentPageIndex + 1);
      } else {
        setCurrentPage(1);
      }
      
      // Clear temp pages and deleted pages, then refresh
      setTempPages([]);
      setDeletedPages([]);
      fetchPages();
      
      showSnackbar('Freundschaftsbuch erfolgreich gespeichert!', 'success');
    } catch (error) {
      showSnackbar('Fehler beim Speichern: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const changePage = (newPage) => {
    // Check if target page is deleted
    if (deletedPages.includes(newPage)) {
      return; // Don't navigate to deleted pages
    }
    
    // Save current page content before switching
    if (editor) {
      const canvasData = editor.store.getSnapshot();
      
      // Update temp page if it exists, or update saved page data
      const tempPageIndex = tempPages.findIndex(p => p.page_number === currentPage);
      if (tempPageIndex !== -1) {
        setTempPages(prev => prev.map(p => 
          p.page_number === currentPage 
            ? { ...p, canvas_data: canvasData }
            : p
        ));
      } else {
        // For saved pages, we need to track changes too
        setTempPages(prev => {
          const existingTemp = prev.find(p => p.page_number === currentPage);
          if (existingTemp) {
            return prev.map(p => 
              p.page_number === currentPage 
                ? { ...p, canvas_data: canvasData }
                : p
            );
          } else {
            return [...prev, { page_number: currentPage, canvas_data: canvasData }];
          }
        });
      }
    }
    
    setCurrentPage(newPage);
  };

  const addNewPage = () => {
    const allPages = [...pages, ...tempPages].filter(p => !deletedPages.includes(p.page_number));
    const maxPage = allPages.length > 0 ? Math.max(...allPages.map(p => p.page_number)) : 0;
    const newPageNumber = maxPage + 1;
    
    // For new books with no pages, start with page 1
    const pageNumber = allPages.length === 0 ? 1 : newPageNumber;
    
    // Add to temporary pages
    setTempPages(prev => [...prev, { page_number: pageNumber, canvas_data: null }]);
    setCurrentPage(pageNumber);
    
    // Clear canvas for new page
    if (editor) {
      setTimeout(() => {
        editor.selectAll();
        editor.deleteShapes(editor.getSelectedShapeIds());
      }, 100);
    }
  };

  const deletePage = () => {
    setConfirmDialog({
      open: true,
      onConfirm: () => {
        // Add to deleted pages if it's a saved page
        if (pages.find(p => p.page_number === currentPage)) {
          setDeletedPages(prev => [...prev, currentPage]);
        }
        
        // Remove from temp pages if it's a temp page
        setTempPages(prev => prev.filter(p => p.page_number !== currentPage));
        
        // Always go to previous page
        setCurrentPage(Math.max(1, currentPage - 1));
        setConfirmDialog({ open: false, onConfirm: null });
      }
    });
  };

  const getTotalPages = () => {
    const allPages = [...pages, ...tempPages].filter(p => !deletedPages.includes(p.page_number));
    return allPages.length;
  };

  const getMaxPage = () => {
    const allPages = [...pages, ...tempPages].filter(p => !deletedPages.includes(p.page_number));
    return allPages.length > 0 ? Math.max(...allPages.map(p => p.page_number)) : 1;
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBarComponent setToken={setToken} />
      
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense" sx={{ minHeight: 48 }}>
          <IconButton
            edge="start"
            onClick={() => navigate('/book/my')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={() => {
                const allPages = [...pages, ...tempPages]
                  .filter(p => !deletedPages.includes(p.page_number))
                  .map(p => p.page_number)
                  .sort((a, b) => a - b);
                const prevPage = allPages.reverse().find(p => p < currentPage);
                if (prevPage) changePage(prevPage);
              }}
              disabled={(() => {
                const allPages = [...pages, ...tempPages]
                  .filter(p => !deletedPages.includes(p.page_number))
                  .map(p => p.page_number)
                  .sort((a, b) => a - b);
                return !allPages.find(p => p < currentPage);
              })()}
              size="small"
            >
              <NavigateBeforeIcon />
            </IconButton>
            
            <Chip 
              label={`Seite ${currentPage}`} 
              variant="outlined" 
              size="small"
              onClick={(e) => setPageMenuAnchor(e.currentTarget)}
              sx={{ mx: 1, cursor: 'pointer' }}
            />
            
            <IconButton
              onClick={() => {
                const allPages = [...pages, ...tempPages]
                  .filter(p => !deletedPages.includes(p.page_number))
                  .map(p => p.page_number)
                  .sort((a, b) => a - b);
                const nextPage = allPages.find(p => p > currentPage);
                if (nextPage) changePage(nextPage);
              }}
              disabled={(() => {
                const allPages = [...pages, ...tempPages]
                  .filter(p => !deletedPages.includes(p.page_number))
                  .map(p => p.page_number)
                  .sort((a, b) => a - b);
                return !allPages.find(p => p > currentPage);
              })()}
              size="small"
            >
              <NavigateNextIcon />
            </IconButton>
          </Box>
          
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
            {bookTitle}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<AddIcon />}
              onClick={addNewPage}
              size="small"
              variant="outlined"
            >
              Neue Seite
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              onClick={deletePage}
              disabled={getTotalPages() <= 1}
              size="small"
              variant="outlined"
              color="error"
            >
              Seite löschen
            </Button>
            <Button
              startIcon={<SaveIcon />}
              onClick={savePage}
              size="small"
              variant="contained"
            >
              Buch Speichern
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box className="tldraw-container" sx={{ 
        flex: 1, 
        minHeight: 0
      }}>
        <Tldraw 
          onMount={(editorInstance) => {
            setEditor(editorInstance);
            editorInstance.setCamera({ x: 0, y: 0, z: 1 });
          }}
        />
      </Box>
      
      <Menu
        anchorEl={pageMenuAnchor}
        open={Boolean(pageMenuAnchor)}
        onClose={() => setPageMenuAnchor(null)}
      >
        {[...pages, ...tempPages]
          .filter(p => !deletedPages.includes(p.page_number))
          .sort((a, b) => a.page_number - b.page_number)
          .map(page => (
            <MenuItem
              key={page.page_number}
              onClick={() => {
                changePage(page.page_number);
                setPageMenuAnchor(null);
              }}
              selected={page.page_number === currentPage}
            >
              Seite {page.page_number}
            </MenuItem>
          ))
        }
      </Menu>
      
      <ConfirmDialog
        open={confirmDialog.open}
        title="Seite löschen"
        message="Möchten Sie diese Seite wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ open: false, onConfirm: null })}
      />
    </Box>
  );
};

export default BookEditor;