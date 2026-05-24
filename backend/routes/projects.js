const express = require('express');
const { pool } = require('../db');
const { authenticate, requireAdmin, requireProjectAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects — list projects for current user
router.get('/', authenticate, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(`
        SELECT p.*, u.name as owner_name,
          COUNT(DISTINCT pm.user_id) as member_count,
          COUNT(DISTINCT t.id) as task_count,
          COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks
        FROM projects p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN project_members pm ON p.id = pm.project_id
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id, u.name
        ORDER BY p.created_at DESC
      `);
    } else {
      result = await pool.query(`
        SELECT p.*, u.name as owner_name,
          COUNT(DISTINCT pm2.user_id) as member_count,
          COUNT(DISTINCT t.id) as task_count,
          COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks
        FROM projects p
        JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN project_members pm2 ON p.id = pm2.project_id
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id, u.name
        ORDER BY p.created_at DESC
      `, [req.user.id]);
    }
    res.json({ projects: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// POST /api/projects — admin only
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { name, description, deadline } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required.' });

  try {
    const result = await pool.query(
      'INSERT INTO projects (name, description, deadline, owner_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || null, deadline || null, req.user.id]
    );
    const project = result.rows[0];

    // Auto-add creator as admin member
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, req.user.id, 'admin']
    );

    res.status(201).json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const project = await pool.query(`
      SELECT p.*, u.name as owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = $1
    `, [req.params.id]);

    if (project.rows.length === 0)
      return res.status(404).json({ error: 'Project not found.' });

    const members = await pool.query(`
      SELECT u.id, u.name, u.email, u.avatar_color, pm.role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
    `, [req.params.id]);

    res.json({ project: project.rows[0], members: members.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project.' });
  }
});

// PATCH /api/projects/:id — admin only
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  const { name, description, status, deadline } = req.body;
  try {
    const result = await pool.query(`
      UPDATE projects SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        deadline = COALESCE($4, deadline)
      WHERE id = $5
      RETURNING *
    `, [name, description, status, deadline, req.params.id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Project not found.' });

    res.json({ project: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

// DELETE /api/projects/:id — admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Project not found.' });
    res.json({ message: 'Project deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

// POST /api/projects/:id/members — add member (admin only)
router.post('/:id/members', authenticate, requireAdmin, async (req, res) => {
  const { user_id, role } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required.' });

  try {
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (project_id, user_id) DO NOTHING',
      [req.params.id, user_id, role || 'member']
    );
    res.json({ message: 'Member added successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add member.' });
  }
});

// DELETE /api/projects/:id/members/:userId — remove member (admin only)
router.delete('/:id/members/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    );
    res.json({ message: 'Member removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member.' });
  }
});

module.exports = router;
