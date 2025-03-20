const { Clerk } = require('@clerk/clerk-sdk-node');

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

const authenticateClerk = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }
    
    // Verify the token
    const { sub } = await clerk.verifyToken(token);
    
    if (!sub) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    
    // Add the user ID to the request object
    req.userId = sub;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
};

module.exports = authenticateClerk; 