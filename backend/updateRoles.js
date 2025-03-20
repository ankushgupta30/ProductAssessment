const { Pool } = require('pg');
require('dotenv').config();

// Use the same database connection configuration as in your server.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // or your individual connection parameters
});

async function updateRoleConstraint() {
  try {
    // Connect to the database
    const client = await pool.connect();
    
    console.log('Connected to database. Updating role constraint...');
    
    // Drop the existing constraint
    await client.query(`
      ALTER TABLE team_members 
      DROP CONSTRAINT IF EXISTS team_members_role_check;
    `);
    
    console.log('Dropped existing constraint (if any)');
    
    // Add the new constraint
    await client.query(`
      ALTER TABLE team_members
      ADD CONSTRAINT team_members_role_check 
      CHECK (role IN ('product_manager', 'product_designer', 'developer', 'product_marketer', 'business_analyst'));
    `);
    
    console.log('Added new role constraint successfully');
    
    // Release the client back to the pool
    client.release();
    
    console.log('Done!');
  } catch (error) {
    console.error('Error updating role constraint:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
updateRoleConstraint(); 