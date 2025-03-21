const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid'); // For generating unique access keys

// Create a database pool
const pool = new Pool({
  user: 'ankushgupta',
  host: 'localhost',
  database: 'product_assessment_db',
  port: 5432,
});

// Middleware to authenticate requests (similar to your existing auth middleware)
// You may need to replace this with your actual auth middleware
const authenticate = (req, res, next) => {
  // You should reuse your existing authentication middleware
  // For now, assuming every request is from an authenticated director
  next();
};

// GET all survey templates
router.get('/templates', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM survey_templates WHERE active = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching survey templates:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET a specific survey template with its questions
router.get('/templates/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the template
    const templateResult = await pool.query(
      'SELECT * FROM survey_templates WHERE id = $1',
      [id]
    );
    
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Survey template not found' });
    }
    
    const template = templateResult.rows[0];
    
    // Get categories
    const categoriesResult = await pool.query(
      'SELECT * FROM survey_categories WHERE template_id = $1 ORDER BY display_order',
      [id]
    );
    
    const categories = await Promise.all(
      categoriesResult.rows.map(async (category) => {
        // Get questions for each category
        const questionsResult = await pool.query(
          'SELECT * FROM survey_questions WHERE category_id = $1 ORDER BY display_order',
          [category.id]
        );
        
        return {
          ...category,
          questions: questionsResult.rows
        };
      })
    );
    
    res.json({
      ...template,
      categories
    });
  } catch (err) {
    console.error('Error fetching survey template details:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new survey assignment (generate link)
router.post('/assignments', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { templateId, teamMemberId } = req.body;
    
    if (!templateId || !teamMemberId) {
      return res.status(400).json({ error: 'Template ID and team member ID are required' });
    }
    
    console.log('Request body:', req.body);
    console.log('Template ID:', templateId);
    console.log('Team Member ID:', teamMemberId);
    
    // Check if team member exists
    const teamMemberResult = await client.query(
      'SELECT * FROM team_members WHERE id = $1',
      [teamMemberId]
    );
    
    console.log('Team member query result:', teamMemberResult.rows);
    
    if (teamMemberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    // Check if template exists
    const templateResult = await client.query(
      'SELECT * FROM survey_templates WHERE id = $1 AND active = true',
      [templateId]
    );
    
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Survey template not found or inactive' });
    }
    
    // Check if assignment already exists
    const existingAssignment = await client.query(
      'SELECT * FROM survey_assignments WHERE team_member_id = $1 AND template_id = $2 AND status != $3',
      [teamMemberId, templateId, 'submitted']
    );
    
    if (existingAssignment.rows.length > 0) {
      return res.json({ 
        message: 'Survey link already exists for this team member', 
        assignment: existingAssignment.rows[0] 
      });
    }
    
    // Generate unique access key
    const accessKey = uuidv4();
    
    // Set expiration date (30 days from now)
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 30);
    
    // Create new assignment
    const result = await client.query(
      'INSERT INTO survey_assignments (template_id, team_member_id, access_key, status, expire_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [templateId, teamMemberId, accessKey, 'link_generated', expireAt]
    );
    
    const assignment = result.rows[0];
    
    res.status(201).json({
      message: 'Survey link generated successfully',
      assignment,
      surveyUrl: `${req.protocol}://${req.get('host')}/survey/${accessKey}`
    });
  } catch (err) {
    console.error('Error generating survey link:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// GET survey by access key (for team member to take survey)
router.get('/access/:accessKey', async (req, res) => {
  try {
    const { accessKey } = req.params;
    
    // Get the assignment
    const assignmentResult = await pool.query(
      `SELECT sa.*, st.title as survey_title, tm.name as team_member_name 
       FROM survey_assignments sa 
       JOIN survey_templates st ON sa.template_id = st.id
       JOIN team_members tm ON sa.team_member_id = tm.id
       WHERE sa.access_key = $1`,
      [accessKey]
    );
    
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    const assignment = assignmentResult.rows[0];
    
    // Check if survey is expired
    if (assignment.expire_at && new Date(assignment.expire_at) < new Date()) {
      return res.status(400).json({ error: 'Survey link has expired' });
    }
    
    // Check if survey is already submitted
    if (assignment.status === 'submitted') {
      return res.status(400).json({ error: 'Survey has already been submitted' });
    }
    
    // Get the template with categories and questions
    const templateId = assignment.template_id;
    
    // Get categories
    const categoriesResult = await pool.query(
      'SELECT * FROM survey_categories WHERE template_id = $1 ORDER BY display_order',
      [templateId]
    );
    
    const categories = await Promise.all(
      categoriesResult.rows.map(async (category) => {
        // Get questions for each category
        const questionsResult = await pool.query(
          'SELECT * FROM survey_questions WHERE category_id = $1 ORDER BY display_order',
          [category.id]
        );
        
        return {
          ...category,
          questions: questionsResult.rows
        };
      })
    );
    
    res.json({
      assignment,
      surveyTitle: assignment.survey_title,
      teamMemberName: assignment.team_member_name,
      categories
    });
  } catch (err) {
    console.error('Error fetching survey by access key:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit survey responses
router.post('/submit', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { accessKey, responses } = req.body;
    
    if (!accessKey || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'Access key and responses array are required' });
    }
    
    await client.query('BEGIN');
    
    // Get the assignment
    const assignmentResult = await client.query(
      'SELECT * FROM survey_assignments WHERE access_key = $1',
      [accessKey]
    );
    
    if (assignmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    const assignment = assignmentResult.rows[0];
    
    // Check if survey is expired
    if (assignment.expire_at && new Date(assignment.expire_at) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Survey link has expired' });
    }
    
    // Check if survey is already submitted
    if (assignment.status === 'submitted') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Survey has already been submitted' });
    }
    
    // Save responses
    for (const response of responses) {
      await client.query(
        'INSERT INTO survey_responses (assignment_id, question_id, response_value, comments) VALUES ($1, $2, $3, $4)',
        [assignment.id, response.questionId, response.value, response.comments || null]
      );
    }
    
    // Update assignment status
    await client.query(
      'UPDATE survey_assignments SET status = $1, completed_at = NOW() WHERE id = $2',
      ['submitted', assignment.id]
    );
    
    await client.query('COMMIT');
    
    res.json({ message: 'Survey submitted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error submitting survey:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// GET survey results for a team (director view)
router.get('/results', authenticate, async (req, res) => {
  try {
    // Get all team members with their survey status
    const teamResult = await pool.query(
      `SELECT tm.id, tm.name, tm.email, tm.role,
        COALESCE(sa.status, 'unfilled') as survey_status,
        sa.completed_at
       FROM team_members tm
       LEFT JOIN survey_assignments sa ON tm.id = sa.team_member_id
       ORDER BY tm.name`
    );
    
    // For submitted surveys, get the average scores per category
    const teamWithScores = await Promise.all(
      teamResult.rows.map(async (member) => {
        if (member.survey_status === 'submitted') {
          // Get average scores per category
          const scoresResult = await pool.query(
            `SELECT sc.id, sc.name, ROUND(AVG(sr.response_value), 1) as average_score
             FROM survey_responses sr
             JOIN survey_assignments sa ON sr.assignment_id = sa.id
             JOIN survey_questions sq ON sr.question_id = sq.id
             JOIN survey_categories sc ON sq.category_id = sc.id
             WHERE sa.team_member_id = $1 AND sa.status = 'submitted'
             GROUP BY sc.id, sc.name
             ORDER BY sc.display_order`,
            [member.id]
          );
          
          return {
            ...member,
            category_scores: scoresResult.rows
          };
        }
        
        return member;
      })
    );
    
    res.json(teamWithScores);
  } catch (err) {
    console.error('Error fetching survey results:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 