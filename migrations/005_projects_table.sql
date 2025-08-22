-- Projects table migration
-- This creates the projects table and related tables for the document control system

-- =================================================================
-- STEP 1: Create the projects table
-- =================================================================

CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'archived')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    documents_count INTEGER DEFAULT 0,
    budget VARCHAR(100),
    client VARCHAR(255),
    client_id UUID,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- SharePoint Integration
    sharepoint_folder_path VARCHAR(500),
    sharepoint_folder_id VARCHAR(255),
    sharepoint_excel_path VARCHAR(500),
    sharepoint_excel_id VARCHAR(255),
    excel_logging_enabled BOOLEAN DEFAULT false,
    
    -- Custom Fields Configuration (stored as JSONB)
    custom_fields JSONB DEFAULT '[]',
    
    -- Metadata
    tags JSONB DEFAULT '[]',
    category VARCHAR(100),
    is_archived BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);
CREATE INDEX IF NOT EXISTS idx_projects_is_archived ON projects(is_archived);

-- Add trigger for projects
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- STEP 2: Create project_managers table (many-to-many relationship)
-- =================================================================

CREATE TABLE IF NOT EXISTS project_managers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    can_approve_documents BOOLEAN DEFAULT false,
    is_primary_manager BOOLEAN DEFAULT false,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Ensure unique combination of project and user
    UNIQUE(project_id, user_id)
);

-- Create indexes for project_managers
CREATE INDEX IF NOT EXISTS idx_project_managers_project_id ON project_managers(project_id);
CREATE INDEX IF NOT EXISTS idx_project_managers_user_id ON project_managers(user_id);
CREATE INDEX IF NOT EXISTS idx_project_managers_is_primary ON project_managers(is_primary_manager);

-- =================================================================
-- STEP 3: Create project_team table (many-to-many relationship)
-- =================================================================

CREATE TABLE IF NOT EXISTS project_team (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100) DEFAULT 'team member',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Ensure unique combination of project and user
    UNIQUE(project_id, user_id)
);

-- Create indexes for project_team
CREATE INDEX IF NOT EXISTS idx_project_team_project_id ON project_team(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_user_id ON project_team(user_id);

-- =================================================================
-- STEP 4: Create documents table (for future use)
-- =================================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(50),
    sharepoint_path VARCHAR(500),
    custom_field_values JSONB DEFAULT '{}',
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);

-- Add trigger for documents
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- Migration complete!
-- =================================================================

-- You should now have:
-- 1. projects table with full project data and SharePoint integration
-- 2. project_managers table for many-to-many manager relationships
-- 3. project_team table for team member relationships
-- 4. documents table for future document management
-- 5. Proper foreign key constraints and indexes
-- 6. Auto-updating timestamps
