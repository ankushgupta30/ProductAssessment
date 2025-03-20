const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env
const { Clerk } = require('@clerk/clerk-sdk-node');
const app = express();
const port = process.env.PORT || 5000; // Use environment port or default to 5000
const teamMembersRoutes = require('./src/routes/teamMembers');

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON request bodies

// Initialize Clerk with your secret key
const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

const authenticateClerk = require('./src/middleware/clerkAuthMiddleware');

// Protected route example
app.get('/api/protected', authenticateClerk, (req, res) => {
  res.json({ 
    message: 'This is a protected route',
    userId: req.userId
  });
});

// Routes
app.use('/api/directors/team-members', teamMembersRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
