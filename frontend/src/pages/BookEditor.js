import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tldraw, createTLStore, defaultShapeUtils } from 'tldraw';
import 'tldraw/tldraw.css';
import io from 'socket.io-client';
import axios from 'axios';
import MenuBar from '../components/MenuBar';

const BookEditor = ({ token, setToken }) => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }));
  const [socket, setSocket] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState([]);
  const [bookSettings, setBookSettings] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.emit('joinBook', bookId);
    
    newSocket.on('canvasUpdate', (data) => {
      if (data.pageNumber === currentPage) {
        store.loadSnapshot(data.canvasData);
      }
    });

    newSocket.on('pageUpdate', (data) => {
      if (data.pageNumber === currentPage) {
        store.loadSnapshot(data.canvasData);
      }
    });

    fetchBookSettings();
    fetchPages();

    return () => newSocket.close();
  }, [bookId, currentPage, store]);

  const fetchBookSettings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/books', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const book = response.data.find(b => b.id === parseInt(bookId));
      if (book) {
        setBookSettings({ size: book.size || 'A4', orientation: book.orientation || 'portrait' });
      }
    } catch (error) {
      console.error('Failed to fetch book settings:', error);
    }
  };

  const getCanvasSize = () => {
    if (!bookSettings) return { width: 2480, height: 3508 }; // A4 portrait default
    
    const sizes = {
      A4: { width: 2480, height: 3508 },
      A5: { width: 1748, height: 2480 },
      square_21: { width: 2480, height: 2480 },
      square_15: { width: 1772, height: 1772 }
    };
    
    let size = sizes[bookSettings.size] || sizes.A4;
    
    if (bookSettings.orientation === 'landscape') {
      return { width: size.height, height: size.width };
    }
    
    return size;
  };

  const createPageFrame = (editor) => {
    const { width, height } = getCanvasSize();
    const margin = 118; // 10mm at 300dpi
    
    editor.createShape({
      type: 'geo',
      x: margin,
      y: margin,
      props: {
        w: width - (margin * 2),
        h: height - (margin * 2),
        geo: 'rectangle',
        fill: 'none',
        color: 'black',
        size: 's'
      }
    });
  };

  const fetchPages = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/books/${bookId}/pages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPages(response.data);
      
      const currentPageData = response.data.find(p => p.page_number === currentPage);
      if (currentPageData && currentPageData.canvas_data) {
        console.log('Loading canvas data for page', currentPage);
        store.loadSnapshot(currentPageData.canvas_data);
      } else {
        console.log('No canvas data found for page', currentPage);
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    }
  };

  const savePage = async () => {
    try {
      const canvasData = store.getSnapshot();
      console.log('Saving page', currentPage, 'with data:', canvasData);
      
      const response = await axios.put(
        `http://localhost:5000/api/books/${bookId}/pages/${currentPage}`,
        { canvasData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Save response:', response.data);
      
      if (socket) {
        socket.emit('canvasChange', {
          bookId,
          pageNumber: currentPage,
          canvasData
        });
      }
      
      alert('Page saved successfully!');
    } catch (error) {
      console.error('Failed to save page:', error);
      alert('Failed to save page: ' + (error.response?.data?.error || error.message));
    }
  };

  const changePage = (newPage) => {
    savePage();
    setCurrentPage(newPage);
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
          <button onClick={() => changePage(currentPage + 1)}>
            Nächste Seite →
          </button>
        </div>
        <button onClick={savePage}>Speichern</button>
      </div>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <Tldraw 
          store={store}
          onMount={(editor) => {
            editor.updateInstanceState({ isDebugMode: false });
            
            // Create frame for new pages
            const currentPageData = pages.find(p => p.page_number === currentPage);
            if (!currentPageData && bookSettings) {
              setTimeout(() => createPageFrame(editor), 100);
            }
          }}
        />
      </div>
    </div>
  );
};

export default BookEditor;