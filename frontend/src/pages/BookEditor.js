import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import io from 'socket.io-client';
import axios from 'axios';
import MenuBar from '../components/MenuBar';

const BookEditor = ({ token, setToken }) => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState([]);
  const [editor, setEditor] = useState(null);
  const [tempPages, setTempPages] = useState([]);
  const [deletedPages, setDeletedPages] = useState([]);


  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.emit('joinBook', bookId);
    
    fetchPages();

    return () => newSocket.close();
  }, [bookId, currentPage]);

  // Auto-save canvas changes every 2 seconds
  useEffect(() => {
    if (!editor) return;
    
    const autoSave = setInterval(() => {
      const canvasData = editor.store.getSnapshot();
      
      // Update temp page data
      const tempPageIndex = tempPages.findIndex(p => p.page_number === currentPage);
      if (tempPageIndex !== -1) {
        setTempPages(prev => prev.map(p => 
          p.page_number === currentPage 
            ? { ...p, canvas_data: canvasData }
            : p
        ));
      }
    }, 2000);
    
    return () => clearInterval(autoSave);
  }, [editor, currentPage, tempPages]);

  useEffect(() => {
    if (editor) {
      // First check temp pages for any changes
      const tempPageData = tempPages.find(p => p.page_number === currentPage);
      
      if (tempPageData && tempPageData.canvas_data) {
        editor.store.loadSnapshot(tempPageData.canvas_data);
      } else {
        // Then check saved pages
        const savedPageData = pages.find(p => p.page_number === currentPage);
        if (savedPageData && savedPageData.canvas_data) {
          editor.store.loadSnapshot(savedPageData.canvas_data);
        } else if (tempPages.find(p => p.page_number === currentPage && !p.canvas_data)) {
          // Clear canvas for new temp page without data
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

  const savePage = async () => {
    if (!editor) {
      alert('Editor not ready');
      return;
    }
    
    try {
      // Save current page canvas data first
      const canvasData = editor.store.getSnapshot();
      
      // Save all temp pages to database
      for (const tempPage of tempPages) {
        const pageData = tempPage.page_number === currentPage ? canvasData : (tempPage.canvas_data || {});
        
        await axios.put(
          `http://localhost:5000/api/books/${bookId}/pages/${tempPage.page_number}`,
          { canvasData: pageData },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      // Save current page if it's not a temp page
      if (!tempPages.find(p => p.page_number === currentPage)) {
        await axios.put(
          `http://localhost:5000/api/books/${bookId}/pages/${currentPage}`,
          { canvasData },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      // Clear temp pages and refresh
      setTempPages([]);
      fetchPages();
      
      alert('All pages saved successfully!');
    } catch (error) {
      alert('Failed to save pages: ' + (error.response?.data?.error || error.message));
    }
  };

  const changePage = (newPage) => {
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
    
    // Add to temporary pages
    setTempPages(prev => [...prev, { page_number: newPageNumber, canvas_data: null }]);
    setCurrentPage(newPageNumber);
    
    // Clear canvas for new page
    if (editor) {
      setTimeout(() => {
        editor.selectAll();
        editor.deleteShapes(editor.getSelectedShapeIds());
      }, 100);
    }
  };

  const deletePage = () => {
    if (confirm('Seite löschen?')) {
      // Add to deleted pages if it's a saved page
      if (pages.find(p => p.page_number === currentPage)) {
        setDeletedPages(prev => [...prev, currentPage]);
      }
      
      // Remove from temp pages if it's a temp page
      setTempPages(prev => prev.filter(p => p.page_number !== currentPage));
      
      // Navigate to previous page or page 1
      const newPage = Math.max(1, currentPage - 1);
      setCurrentPage(newPage);
    }
  };

  const getMaxPage = () => {
    const allPages = [...pages, ...tempPages].filter(p => !deletedPages.includes(p.page_number));
    return allPages.length > 0 ? Math.max(...allPages.map(p => p.page_number)) : 1;
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MenuBar setToken={setToken} />
      <div style={{ 
        padding: '10px 20px', 
        borderBottom: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button onClick={() => navigate('/my-books')}>← Zurück</button>
        <div>
          <button 
            onClick={() => changePage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            ← Vorherige Seite
          </button>
          <span style={{ margin: '0 20px' }}>Seite {currentPage}</span>
          <button 
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage >= getMaxPage()}
          >
            Nächste Seite →
          </button>
          <button 
            onClick={addNewPage}
            style={{ marginLeft: '10px' }}
          >
            Neue Seite
          </button>
          <button 
            onClick={deletePage}
            style={{ marginLeft: '10px' }}
          >
            Seite löschen
          </button>
        </div>
        <button onClick={savePage}>Speichern</button>
      </div>
      
      <div style={{ 
        flex: 1, 
        minHeight: 0,
        transform: 'scale(1)',
        transformOrigin: '0 0',
        zoom: 1
      }}>
        <Tldraw 
          onMount={(editorInstance) => {
            setEditor(editorInstance);
            editorInstance.setCamera({ x: 0, y: 0, z: 1 });
          }}
        />
      </div>
    </div>
  );
};

export default BookEditor;