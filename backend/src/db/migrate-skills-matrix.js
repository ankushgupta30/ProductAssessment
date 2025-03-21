require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'ankushgupta',
  host: 'localhost',
  database: 'product_assessment_db',  // Your actual database name
  port: 5432,
});

async function migrateSkillsMatrix() {
  const client = await pool.connect();
  try {
    console.log('Running Skills Matrix migration...');
    console.log('Using database connection:', process.env.DATABASE_URL);
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'migrations', 'skills_matrix_tables.sql');
    console.log('Looking for SQL file at:', sqlPath);
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found at: ${sqlPath}`);
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('Skills Matrix migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateSkillsMatrix(); 