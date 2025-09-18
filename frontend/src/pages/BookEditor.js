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

  const savePage = async () => {
    if (!editor) {
      alert('Editor not ready');
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
      
      alert('All pages saved successfully!');
    } catch (error) {
      alert('Failed to save pages: ' + (error.response?.data?.error || error.message));
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
    if (confirm('Seite löschen?')) {
      // Add to deleted pages if it's a saved page
      if (pages.find(p => p.page_number === currentPage)) {
        setDeletedPages(prev => [...prev, currentPage]);
      }
      
      // Remove from temp pages if it's a temp page
      setTempPages(prev => prev.filter(p => p.page_number !== currentPage));
      
      // Always go to previous page
      setCurrentPage(Math.max(1, currentPage - 1));
    }
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MenuBar setToken={setToken} />
      <div style={{ 
        padding: '10px 20px', 
        borderBottom: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button onClick={() => navigate('/book/my')}>← Zurück</button>
        <div>
          <button 
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
          >
            ← Vorherige Seite
          </button>
          <span style={{ margin: '0 20px' }}>Seite {currentPage}</span>
          <button 
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
            disabled={getTotalPages() <= 1}
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