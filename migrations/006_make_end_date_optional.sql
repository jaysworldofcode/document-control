-- Migration to make end_date optional in projects table
-- This allows projects to be created without an end date

ALTER TABLE projects 
ALTER COLUMN end_date DROP NOT NULL;

-- Update the constraint name for clarity
COMMENT ON COLUMN projects.end_date IS 'Project end date (optional - can be NULL for ongoing projects)';
