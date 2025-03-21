const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env
const { Clerk } = require('@clerk/clerk-sdk-node');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // or specify individual connection parameters:
  // user: process.env.DB_USER,
  // host: process.env.DB_HOST,
  // database: process.env.DB_NAME,
  // password: process.env.DB_PASSWORD,
  // port: process.env.DB_PORT,
});
const app = express();
const port = process.env.PORT || 5001; // Changed from 5000 to 5001
const teamMembersRoutes = require('./src/routes/teamMembers');
const surveyRoutes = require('./src/routes/surveys');

// Configure CORS with specific options
app.use(cors({
  origin: 'http://localhost:3000', // Allow your React app origin
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'], // Allow these HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
  credentials: true // Allow cookies and credentials
}));

app.use(express.json()); // Middleware to parse JSON request bodies

// Initialize Clerk with your secret key
const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

const clerkAuthMiddleware = require('./src/middleware/clerkAuthMiddleware');

// Protected route example
app.get('/api/protected', clerkAuthMiddleware, (req, res) => {
  res.json({ 
    message: 'This is a protected route',
    userId: req.userId
  });
});

// Routes
app.use('/api/directors/team-members', teamMembersRoutes);
app.use('/api/surveys', surveyRoutes);

// Updated list of valid roles
const validRoles = [
  'Product Manager',
  'Product Designer',
  'Developer',
  'Product Marketer',
  'Business Analyst'
];

app.post('/api/directors/team-members', clerkAuthMiddleware, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    console.log('Received request to add team member:', { name, email, role });
    
    // Validate input
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }
    
    // Validate role
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        validRoles: validRoles
      });
    }
    
    // Insert into database
    const query = 'INSERT INTO team_members (name, email, role) VALUES ($1, $2, $3) RETURNING *';
    const values = [name, email, role];
    
    console.log('Executing query:', query, 'with values:', values);
    
    const result = await pool.query(query, values);
    console.log('Database result:', result.rows[0]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding team member:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Failed to add team member', 
      message: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
