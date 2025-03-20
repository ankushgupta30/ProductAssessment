const { Clerk } = require('@clerk/clerk-sdk-node');

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

const authenticateClerk = async (req, res, next) => {
  try {
    // Get the session token from the Authorization header
    const sessionToken = req.headers.authorization?.split(' ')[1];
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }
    
    // Verify the session token
    const session = await clerk.verifyToken(sessionToken);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    
    // Attach the session to the request object
    req.session = session;
    req.userId = session.sub;
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
};

module.exports = authenticateClerk; 