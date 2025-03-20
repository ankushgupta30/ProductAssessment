const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const authenticateClerk = require('../middleware/clerkAuthMiddleware');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ankushgupta@localhost:5432/product_assessment_db'
});

// Get all team members for the authenticated director
router.get('/', authenticateClerk, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM team_members WHERE director_id = $1',
      [req.userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Add a new team member
router.post('/', authenticateClerk, async (req, res) => {
  const { name, email, role } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO team_members (name, email, role, director_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, role || 'Product Manager', req.userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

// Delete a team member
router.delete('/:id', authenticateClerk, async (req, res) => {
  try {
    // First verify this team member belongs to the authenticated director
    const checkResult = await pool.query(
      'SELECT * FROM team_members WHERE id = $1 AND director_id = $2',
      [req.params.id, req.userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found or not authorized' });
    }
    
    await pool.query('DELETE FROM team_members WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});

module.exports = router; 