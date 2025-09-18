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


  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.emit('joinBook', bookId);
    
    fetchPages();

    return () => newSocket.close();
  }, [bookId, currentPage]);

  useEffect(() => {
    if (editor && pages.length > 0) {
      const currentPageData = pages.find(p => p.page_number === currentPage);
      if (currentPageData && currentPageData.canvas_data) {
        editor.store.loadSnapshot(currentPageData.canvas_data);
      }
    }
  }, [editor, pages, currentPage]);



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
      const canvasData = editor.store.getSnapshot();
      
      const response = await axios.put(
        `http://localhost:5000/api/books/${bookId}/pages/${currentPage}`,
        { canvasData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Page saved successfully!');
    } catch (error) {
      alert('Failed to save page: ' + (error.response?.data?.error || error.message));
    }
  };

  const changePage = (newPage) => {
    setCurrentPage(newPage);
  };

  const addNewPage = () => {
    const maxPage = pages.length > 0 ? Math.max(...pages.map(p => p.page_number)) : 0;
    setCurrentPage(maxPage + 1);
  };

  const getMaxPage = () => {
    return pages.length > 0 ? Math.max(...pages.map(p => p.page_number)) : 1;
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