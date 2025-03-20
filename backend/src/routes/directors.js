const express = require('express');
const directorsController = require('../controllers/directorsController');
const authenticateClerk = require('../middleware/clerkAuthMiddleware'); // Import Clerk middleware

const router = express.Router();

{{ Remove login route - Clerk handles login on frontend }}
// router.post('/login', directorsController.login); // Remove this line

{{ Example of protecting a route with Clerk middleware }}
// Example: Protect the 'get directors' route (adjust as needed for your actual routes)
router.get('/protected-route', authenticateClerk, directorsController.getDirectors); // Apply middleware here

module.exports = router; 