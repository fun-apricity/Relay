const express = require('express');
const { pool } = require('../db');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/tasks?project_id=&status=&assignee_id=&priority=
router.get('/', authenticate, async (req, res) => {
  const { project_id, status, assignee_id, priority } = req.query;

  try {
    let query = `
      SELECT t.*,
        u.name as assignee_name, u.avatar_color as assignee_color,
        c.name as creator_name,
        p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users c ON t.created_by = c.id
      LEFT JOIN projects p ON t.project_id = p.id
    `;
    const params = [];
    const conditions = [];

    // Non-admins only see tasks in their projects or assigned to them
    if (req.user.role !== 'admin') {
      query += ` LEFT JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = $${params.length + 1}`;
      params.push(req.user.id);
      conditions.push(`(pm.user_id = $${params.length} OR t.assignee_id = $${params.length})`);
    }

    if (project_id) {
      params.push(project_id);
      conditions.push(`t.project_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`t.status = $${params.length}`);
    }
    if (assignee_id) {
      params.push(assignee_id);
      conditions.push(`t.assignee_id = $${params.length}`);
    }
    if (priority) {
      params.push(priority);
      conditions.push(`t.priority = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ tasks: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// POST /api/tasks
router.post('/', authenticate, async (req, res) => {
  const { title, description, project_id, assignee_id, priority, due_date } = req.body;

  if (!title) return res.status(400).json({ error: 'Task title is required.' });
  if (!project_id) return res.status(400).json({ error: 'Project ID is required.' });

  try {
    // Check project access
    if (req.user.role !== 'admin') {
      const access = await pool.query(
        'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
        [project_id, req.user.id]
      );
      if (access.rows.length === 0)
        return res.status(403).json({ error: 'No access to this project.' });
    }

    const result = await pool.query(`
      INSERT INTO tasks (title, description, project_id, assignee_id, created_by, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title, description || null, project_id, assignee_id || null, req.user.id, priority || 'medium', due_date || null]);

    const task = result.rows[0];

    // Fetch with joined data
    const full = await pool.query(`
      SELECT t.*,
        u.name as assignee_name, u.avatar_color as assignee_color,
        p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1
    `, [task.id]);

    res.status(201).json({ task: full.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// GET /api/tasks/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
        u.name as assignee_name, u.avatar_color as assignee_color,
        c.name as creator_name,
        p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users c ON t.created_by = c.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Task not found.' });

    const comments = await pool.query(`
      SELECT tc.*, u.name as user_name, u.avatar_color
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = $1
      ORDER BY tc.created_at ASC
    `, [req.params.id]);

    res.json({ task: result.rows[0], comments: comments.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task.' });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', authenticate, async (req, res) => {
  const { title, description, status, priority, assignee_id, due_date } = req.body;

  try {
    const result = await pool.query(`
      UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        assignee_id = COALESCE($5, assignee_id),
        due_date = COALESCE($6, due_date),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [title, description, status, priority, assignee_id, due_date, req.params.id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Task not found.' });

    res.json({ task: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (task.rows.length === 0)
      return res.status(404).json({ error: 'Task not found.' });

    // Only admin or task creator can delete
    if (req.user.role !== 'admin' && task.rows[0].created_by !== req.user.id)
      return res.status(403).json({ error: 'Not authorized to delete this task.' });

    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', authenticate, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Comment content is required.' });

  try {
    const result = await pool.query(`
      INSERT INTO task_comments (task_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [req.params.id, req.user.id, content]);

    const comment = await pool.query(`
      SELECT tc.*, u.name as user_name, u.avatar_color
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.id = $1
    `, [result.rows[0].id]);

    res.status(201).json({ comment: comment.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

module.exports = router;
