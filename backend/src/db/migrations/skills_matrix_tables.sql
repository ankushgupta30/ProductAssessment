-- Skills Matrix Database Schema

-- Survey Templates
CREATE TABLE IF NOT EXISTS survey_templates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- Survey Categories (e.g., "Communication", "Technical Skills")
CREATE TABLE IF NOT EXISTS survey_categories (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES survey_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL
);

-- Survey Questions
CREATE TABLE IF NOT EXISTS survey_questions (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES survey_categories(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    display_order INTEGER NOT NULL
);

-- Survey Assignments (links surveys to team members)
CREATE TABLE IF NOT EXISTS survey_assignments (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES survey_templates(id),
    team_member_id INTEGER REFERENCES team_members(id) ON DELETE CASCADE,
    access_key VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unfilled', -- unfilled, link_generated, submitted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    expire_at TIMESTAMP
);

-- Survey Responses
CREATE TABLE IF NOT EXISTS survey_responses (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES survey_assignments(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES survey_questions(id),
    response_value INTEGER CHECK (response_value BETWEEN 1 AND 5),
    comments TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 