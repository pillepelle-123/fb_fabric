const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { pool, initDB } = require('./database');
const { generateToken, verifyToken, checkPermission, bcrypt } = require('./auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO public.users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
    );
    
    const token = generateToken(result.rows[0].id);
    console.log('Registration successful for user:', result.rows[0].id);
    res.json({ token, userId: result.rows[0].id });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: 'Registration failed: ' + err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM public.users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user.id);
    res.json({ token, userId: user.id, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Book routes
app.get('/api/books', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, bp.role FROM public.books b
      JOIN public.book_permissions bp ON b.id = bp.book_id
      WHERE bp.user_id = $1
    `, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.post('/api/books', verifyToken, async (req, res) => {
  try {
    const { title, description, size, orientation } = req.body;
    const bookResult = await pool.query(
      'INSERT INTO public.books (title, description, owner_id, size, orientation) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, req.userId, size || 'A4', orientation || 'portrait']
    );
    
    await pool.query(
      'INSERT INTO public.book_permissions (book_id, user_id, role) VALUES ($1, $2, $3)',
      [bookResult.rows[0].id, req.userId, 'admin']
    );
    
    res.json(bookResult.rows[0]);
  } catch (err) {
    console.error('Book creation error:', err);
    res.status(500).json({ error: 'Failed to create book: ' + err.message });
  }
});

app.put('/api/books/:bookId/settings', verifyToken, checkPermission('admin'), async (req, res) => {
  try {
    const { bookId } = req.params;
    const { size, orientation } = req.body;
    
    const result = await pool.query(
      'UPDATE public.books SET size = $1, orientation = $2 WHERE id = $3 RETURNING *',
      [size, orientation, bookId]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: 'Failed to update settings: ' + err.message });
  }
});

// Page routes
app.get('/api/books/:bookId/pages', verifyToken, checkPermission('viewer'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM public.pages WHERE book_id = $1 ORDER BY page_number',
      [req.params.bookId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch pages:', err);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

app.put('/api/books/:bookId/pages/:pageNumber', verifyToken, checkPermission('editor'), async (req, res) => {
  try {
    const { bookId, pageNumber } = req.params;
    const { canvasData } = req.body;
    
    console.log('Saving page:', bookId, pageNumber, 'Data size:', JSON.stringify(canvasData).length);
    
    const result = await pool.query(`
      INSERT INTO public.pages (book_id, page_number, canvas_data)
      VALUES ($1, $2, $3)
      ON CONFLICT (book_id, page_number)
      DO UPDATE SET canvas_data = $3
      RETURNING *
    `, [bookId, pageNumber, JSON.stringify(canvasData)]);
    
    io.to(`book-${bookId}`).emit('pageUpdate', {
      pageNumber: parseInt(pageNumber),
      canvasData
    });
    
    console.log('Page saved successfully');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to save page:', err);
    res.status(500).json({ error: 'Failed to save page: ' + err.message });
  }
});

// Socket.io for real-time collaboration
io.on('connection', (socket) => {
  socket.on('joinBook', (bookId) => {
    socket.join(`book-${bookId}`);
  });
  
  socket.on('canvasChange', (data) => {
    socket.to(`book-${data.bookId}`).emit('canvasUpdate', data);
  });
});

const PORT = process.env.PORT || 5000;

initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});