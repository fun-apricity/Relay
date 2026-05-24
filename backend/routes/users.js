const express = require('express');
const { pool } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — admin only, list all users
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, avatar_color, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// GET /api/users/search?q= — search users by name or email (for assigning tasks)
router.get('/search', authenticate, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ users: [] });

  try {
    const result = await pool.query(
      `SELECT id, name, email, role, avatar_color FROM users
       WHERE name ILIKE $1 OR email ILIKE $1
       LIMIT 10`,
      [`%${q}%`]
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Search failed.' });
  }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, avatar_color, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found.' });

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// PATCH /api/users/:id/role — admin only
router.patch('/:id/role', authenticate, requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role))
    return res.status(400).json({ error: 'Role must be admin or member.' });

  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found.' });

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role.' });
  }
});

module.exports = router;
