import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FabricCanvas from '../components/FabricCanvas';
import io from 'socket.io-client';
import axios from 'axios';
import { API_URL, getPageDimensions } from '../config';
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
  Print as PrintIcon,
} from '@mui/icons-material';
import AppBarComponent from '../components/AppBarComponent';
import { useSnackbar } from '../components/SnackbarProvider';
import ConfirmDialog from '../components/ConfirmDialog';
import PDFQualityDialog from '../components/PDFQualityDialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BookEditor = ({ token, setToken }) => {
  const { showSnackbar } = useSnackbar();
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState([]);
  const [canvasAPI, setCanvasAPI] = useState(null);
  const [currentPageData, setCurrentPageData] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, onConfirm: null });
  const [bookTitle, setBookTitle] = useState('');
  const [pageMenuAnchor, setPageMenuAnchor] = useState(null);
  const [bookPageSize, setBookPageSize] = useState('A4');
  const [bookOrientation, setBookOrientation] = useState('portrait');
  const [bookDataLoaded, setBookDataLoaded] = useState(false);
  const [pdfQualityDialog, setPdfQualityDialog] = useState(false);
  const [tempPages, setTempPages] = useState({}); // Temporary storage for all page data


  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);
    
    newSocket.emit('joinBook', bookId);
    
    fetchPages();

    // Suppress ResizeObserver errors
    const resizeObserverErrorHandler = (e) => {
      if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener('error', resizeObserverErrorHandler);

    return () => {
      newSocket.close();
      window.removeEventListener('error', resizeObserverErrorHandler);
    };
  }, [bookId, currentPage]);



  const savePage = async () => {
    if (!canvasAPI) {
      showSnackbar('Canvas nicht bereit', 'warning');
      return;
    }
    
    try {
      // Store current page in temp storage first
      const canvasData = canvasAPI.getCanvasData();
      const updatedTempPages = { ...tempPages, [currentPage]: canvasData };
      
      // Save all temp pages to database
      for (const [pageNum, pageData] of Object.entries(updatedTempPages)) {
        if (pageData !== null) {
          await axios.put(
            `${API_URL}/api/books/${bookId}/pages/${pageNum}`,
            { canvasData: pageData },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
      
      await fetchPages();
      showSnackbar('Freundschaftsbuch erfolgreich gespeichert!', 'success');
    } catch (error) {
      showSnackbar('Fehler beim Speichern: ' + (error.response?.data?.error || error.message), 'error');
    }
  };



  const fetchPages = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/books/${bookId}/pages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPages(response.data);
      
      // Load all pages into temp storage
      const tempData = {};
      response.data.forEach(page => {
        tempData[page.page_number] = page.canvas_data;
      });
      setTempPages(tempData);

    } catch (error) {
      console.error('Failed to fetch pages:', error);
    }
  };

  // Fetch book title
  useEffect(() => {
    const fetchBookTitle = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/books`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const book = response.data.find(b => b.id === parseInt(bookId));
        if (book) {
          setBookTitle(book.title);
          setBookPageSize(book.page_size || 'A4');
          setBookOrientation(book.orientation || 'portrait');
          setBookDataLoaded(true);
        }
      } catch (error) {
        console.error('Failed to fetch book title:', error);
      }
    };
    fetchBookTitle();
  }, [bookId, token]);

  useEffect(() => {
    if (canvasAPI) {
      const pageData = tempPages[currentPage];
      if (pageData && typeof pageData === 'object' && Object.keys(pageData).length > 0) {
        canvasAPI.loadCanvasData(pageData);
        setCurrentPageData(pageData);
      } else {
        canvasAPI.clearCanvas();
        setCurrentPageData({});
      }
    }
  }, [canvasAPI, currentPage, tempPages]);



  const changePage = (newPage) => {
    if (canvasAPI) {
      const canvasData = canvasAPI.getCanvasData();
      // Store current page data in temp storage
      setTempPages(prev => ({ ...prev, [currentPage]: canvasData }));
    }
    setCurrentPage(newPage);
    setCurrentPageData(null);
  };

  const addNewPage = () => {
    const allPageNumbers = [...Object.keys(tempPages).map(Number), ...pages.map(p => p.page_number)];
    const maxPage = allPageNumbers.length > 0 ? Math.max(...allPageNumbers) : 0;
    const newPageNumber = maxPage + 1;
    
    // Store current page data before switching
    if (canvasAPI) {
      const canvasData = canvasAPI.getCanvasData();
      setTempPages(prev => ({ ...prev, [currentPage]: canvasData }));
    }
    
    // Add new page to temp storage
    setTempPages(prev => ({ ...prev, [newPageNumber]: null }));
    setCurrentPage(newPageNumber);
    setCurrentPageData(null);
  };

  const deletePage = () => {
    setConfirmDialog({
      open: true,
      onConfirm: async () => {
        try {
          await axios.delete(
            `${API_URL}/api/books/${bookId}/pages/${currentPage}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          const newPage = Math.max(1, currentPage - 1);
          setCurrentPage(newPage);
          setCurrentPageData(null);
          await fetchPages();
          
          showSnackbar('Seite gelöscht', 'success');
        } catch (error) {
          showSnackbar('Fehler beim Löschen', 'error');
        }
        
        setConfirmDialog({ open: false, onConfirm: null });
      }
    });
  };

  const getTotalPages = () => Object.keys(tempPages).length;

  const getMaxPage = () => pages.length > 0 ? Math.max(...pages.map(p => p.page_number)) : 1;

  const exportToPDF = async (qualityOption = { quality: 0.7, format: 'jpeg' }) => {
    if (!canvasAPI) {
      showSnackbar('Canvas nicht bereit', 'warning');
      return;
    }

    try {
      // Store current page in temp storage for export
      const currentCanvasData = canvasAPI.getCanvasData();
      const exportTempPages = { ...tempPages, [currentPage]: currentCanvasData };
      
      showSnackbar('PDF wird erstellt...', 'info');
      
      const allPages = Object.keys(exportTempPages).map(Number).sort((a, b) => a - b);
      if (allPages.length === 0) {
        showSnackbar('Keine Seiten zum Drucken vorhanden', 'warning');
        return;
      }

      const pdf = new jsPDF({
        orientation: bookOrientation,
        unit: 'mm',
        format: bookPageSize.toLowerCase()
      });
      
      for (let i = 0; i < allPages.length; i++) {
        const pageNumber = allPages[i];
        const pageData = exportTempPages[pageNumber];
        
        if (pageData && typeof pageData === 'object') {
          canvasAPI.loadCanvasData(pageData);
          
          // Wait for canvas to render
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Export page content clipped to boundaries
          const imgData = canvasAPI.exportToPDF(qualityOption);
          
          if (imgData) {
            if (i > 0) pdf.addPage();
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          }
        }
      }
      
      // Restore current page from temp storage
      const currentPageData = exportTempPages[currentPage];
      if (currentPageData) {
        canvasAPI.loadCanvasData(currentPageData);
      }
      
      pdf.save(`${bookTitle || 'Freundschaftsbuch'}.pdf`);
      showSnackbar('PDF erfolgreich erstellt!', 'success');
      
    } catch (error) {
      console.error('PDF export error:', error);
      showSnackbar('Fehler beim Erstellen der PDF', 'error');
    }
  };

  // Auto-create first page if book has no pages
  useEffect(() => {
    if (pages.length === 0 && canvasAPI && bookDataLoaded) {
      addNewPage();
    }
  }, [pages, canvasAPI, bookDataLoaded]);

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
                const prevPage = Math.max(1, currentPage - 1);
                if (prevPage !== currentPage) changePage(prevPage);
              }}
              disabled={currentPage <= 1}
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
                const nextPage = currentPage + 1;
                const pageExists = pages.find(p => p.page_number === nextPage);
                if (pageExists) changePage(nextPage);
              }}
              disabled={!tempPages[currentPage + 1]}
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
              startIcon={<PrintIcon />}
              onClick={() => setPdfQualityDialog(true)}
              size="small"
              variant="outlined"
            >
              Drucken
            </Button>
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
              disabled={Object.keys(tempPages).length <= 1}
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
      
      <Box className="fabric-container" sx={{ 
        flex: 1, 
        minHeight: 0
      }}>
        {bookDataLoaded && (
          <FabricCanvas 
            onMount={(api) => {
              setCanvasAPI(api);
            }}
            pageSize={bookPageSize}
            orientation={bookOrientation}
            onCanvasChange={(data) => {
              // Store canvas changes in temp storage
              setTempPages(prev => ({ ...prev, [currentPage]: data }));
            }}
          />
        )}
      </Box>
      
      <Menu
        anchorEl={pageMenuAnchor}
        open={Boolean(pageMenuAnchor)}
        onClose={() => setPageMenuAnchor(null)}
      >
        {Object.keys(tempPages).map(pageNum => (
            <MenuItem
              key={pageNum}
              onClick={() => {
                changePage(Number(pageNum));
                setPageMenuAnchor(null);
              }}
              selected={Number(pageNum) === currentPage}
            >
              Seite {pageNum}
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
      
      <PDFQualityDialog
        open={pdfQualityDialog}
        onClose={() => setPdfQualityDialog(false)}
        onConfirm={(qualityOption) => {
          setPdfQualityDialog(false);
          exportToPDF(qualityOption);
        }}
      />
    </Box>
  );
};

export default BookEditor;