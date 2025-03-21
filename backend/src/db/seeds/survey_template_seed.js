require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: 'ankushgupta',
  host: 'localhost',
  database: 'product_assessment_db',
  port: 5432,
});

/**
 * Seeds the initial survey template with categories and questions
 */
async function seedSurveyTemplate() {
  const client = await pool.connect();
  
  try {
    console.log('Seeding survey template...');
    console.log('Using database connection:', process.env.DATABASE_URL);
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    await client.query('BEGIN');
    
    // Create survey template
    const templateResult = await client.query(
      `INSERT INTO survey_templates (title, description, active) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      ['Product Skills Assessment', 'Comprehensive assessment of product team skills', true]
    );
    
    const templateId = templateResult.rows[0].id;
    console.log(`Created survey template with ID: ${templateId}`);
    
    // Create categories and questions
    const categories = [
      {
        name: 'Product Strategy',
        description: 'Ability to define product vision, strategy, and roadmap',
        questions: [
          'Demonstrates understanding of product vision and strategy',
          'Effectively translates business goals into product requirements',
          'Develops and maintains product roadmaps',
          'Conducts competitive analysis to identify market opportunities',
          'Prioritizes features based on business value and user needs'
        ]
      },
      {
        name: 'User Research',
        description: 'Skills in understanding user needs and behaviors',
        questions: [
          'Defines clear research objectives and methodologies',
          'Conducts effective user interviews and usability testing',
          'Analyzes and synthesizes research findings',
          'Creates and maintains user personas',
          'Effectively communicates user insights to stakeholders'
        ]
      },
      {
        name: 'Technical Understanding',
        description: 'Knowledge of technical concepts and ability to work with technical teams',
        questions: [
          'Understands technical architecture and constraints',
          'Effectively communicates with engineering teams',
          'Creates clear technical requirements',
          'Manages technical debt appropriately',
          'Understands and considers implementation complexity in decision-making'
        ]
      },
      {
        name: 'Communication & Collaboration',
        description: 'Ability to communicate effectively and collaborate with cross-functional teams',
        questions: [
          'Clearly articulates product decisions and rationale',
          'Facilitates productive team discussions and decision-making',
          'Manages stakeholder expectations effectively',
          'Collaborates effectively with cross-functional teams',
          'Provides and receives constructive feedback'
        ]
      },
      {
        name: 'Execution & Delivery',
        description: 'Ability to execute plans and deliver results',
        questions: [
          'Sets realistic timelines and delivers on commitments',
          'Effectively manages scope and handles changes',
          'Identifies and mitigates risks proactively',
          'Monitors and analyzes product performance metrics',
          'Iterates based on user feedback and data'
        ]
      }
    ];
    
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      
      // Insert category
      const categoryResult = await client.query(
        `INSERT INTO survey_categories (template_id, name, description, display_order) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id`,
        [templateId, category.name, category.description, i + 1]
      );
      
      const categoryId = categoryResult.rows[0].id;
      console.log(`Created category "${category.name}" with ID: ${categoryId}`);
      
      // Insert questions for this category
      for (let j = 0; j < category.questions.length; j++) {
        await client.query(
          `INSERT INTO survey_questions (category_id, question_text, display_order) 
           VALUES ($1, $2, $3)`,
          [categoryId, category.questions[j], j + 1]
        );
      }
      console.log(`Added ${category.questions.length} questions to category "${category.name}"`);
    }
    
    await client.query('COMMIT');
    console.log('Survey template seeded successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding survey template:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed function
seedSurveyTemplate()
  .then(() => console.log('Seed completed successfully'))
  .catch((err) => {
    console.error('Failed to seed survey template:', err);
    process.exit(1);
  }); 