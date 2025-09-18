const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const checkPermission = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const { bookId } = req.params;
      const result = await pool.query(
        'SELECT role FROM public.book_permissions WHERE book_id = $1 AND user_id = $2',
        [bookId, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'No access to this book' });
      }

      const userRole = result.rows[0].role;
      const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
      
      if (roleHierarchy[userRole] >= roleHierarchy[requiredRole]) {
        next();
      } else {
        res.status(403).json({ error: 'Insufficient permissions' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

module.exports = { generateToken, verifyToken, checkPermission, bcrypt };