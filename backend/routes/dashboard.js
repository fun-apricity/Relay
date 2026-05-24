const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard — returns stats for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Task stats
    let taskStats;
    if (isAdmin) {
      taskStats = await pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'review' THEN 1 END) as review,
          COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
          COUNT(CASE WHEN due_date < NOW() AND status != 'done' THEN 1 END) as overdue
        FROM tasks
      `);
    } else {
      taskStats = await pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'review' THEN 1 END) as review,
          COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
          COUNT(CASE WHEN due_date < NOW() AND status != 'done' THEN 1 END) as overdue
        FROM tasks
        WHERE assignee_id = $1
      `, [userId]);
    }

    // Project stats
    let projectStats;
    if (isAdmin) {
      projectStats = await pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM projects
      `);
    } else {
      projectStats = await pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed
        FROM projects p
        JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = $1
      `, [userId]);
    }

    // My recent tasks (5 most recent)
    const recentTasks = await pool.query(`
      SELECT t.id, t.title, t.status, t.priority, t.due_date,
        p.name as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE ${isAdmin ? '1=1' : 't.assignee_id = $1'}
      ORDER BY t.updated_at DESC
      LIMIT 5
    `, isAdmin ? [] : [userId]);

    // Overdue tasks
    const overdueTasks = await pool.query(`
      SELECT t.id, t.title, t.priority, t.due_date,
        u.name as assignee_name,
        p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.due_date < NOW() AND t.status != 'done'
      ${!isAdmin ? 'AND t.assignee_id = $1' : ''}
      ORDER BY t.due_date ASC
      LIMIT 5
    `, isAdmin ? [] : [userId]);

    // User count (admin only)
    let userCount = null;
    if (isAdmin) {
      const uc = await pool.query('SELECT COUNT(*) as total FROM users');
      userCount = uc.rows[0].total;
    }

    res.json({
      taskStats: taskStats.rows[0],
      projectStats: projectStats.rows[0],
      recentTasks: recentTasks.rows,
      overdueTasks: overdueTasks.rows,
      userCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

module.exports = router;
