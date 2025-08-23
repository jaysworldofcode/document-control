-- =================================================================
-- Migration: Create project SharePoint configurations table
-- =================================================================

-- Create project_sharepoint_configs table for multiple configurations per project
CREATE TABLE IF NOT EXISTS project_sharepoint_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Friendly name for this configuration (e.g., "Technical Documents", "Legal Documents")
    description TEXT, -- Description of what this configuration is for
    tenant_id VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    client_secret TEXT NOT NULL, -- Encrypted in production
    site_url VARCHAR(500) NOT NULL,
    document_library VARCHAR(255) NOT NULL DEFAULT 'Documents',
    folder_path VARCHAR(500), -- Optional subfolder path within the document library
    is_enabled BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- One config per project can be default
    auto_upload BOOLEAN DEFAULT true, -- Whether to automatically upload to this location
    file_types JSON, -- Array of file types that should go to this location (e.g., ["pdf", "docx"])
    size_limit_mb INTEGER DEFAULT 100, -- Maximum file size for this configuration
    is_excel_logging_enabled BOOLEAN DEFAULT false,
    excel_sheet_path VARCHAR(500), -- Path to Excel file for logging
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique configuration names per project
    UNIQUE(project_id, name)
);

-- Create indexes for project_sharepoint_configs
CREATE INDEX IF NOT EXISTS idx_project_sharepoint_configs_project_id ON project_sharepoint_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_sharepoint_configs_is_enabled ON project_sharepoint_configs(is_enabled);
CREATE INDEX IF NOT EXISTS idx_project_sharepoint_configs_is_default ON project_sharepoint_configs(is_default);
CREATE INDEX IF NOT EXISTS idx_project_sharepoint_configs_created_by ON project_sharepoint_configs(created_by);

-- Add comments for documentation
COMMENT ON TABLE project_sharepoint_configs IS 'Multiple SharePoint configurations per project for organizing files in different libraries/folders';
COMMENT ON COLUMN project_sharepoint_configs.name IS 'Friendly name for this configuration (e.g., Technical Documents, Legal Documents)';
COMMENT ON COLUMN project_sharepoint_configs.folder_path IS 'Optional subfolder path within the document library';
COMMENT ON COLUMN project_sharepoint_configs.is_default IS 'Whether this is the default configuration for the project';
COMMENT ON COLUMN project_sharepoint_configs.auto_upload IS 'Whether files should automatically upload to this location';
COMMENT ON COLUMN project_sharepoint_configs.file_types IS 'JSON array of file types that should go to this location';
COMMENT ON COLUMN project_sharepoint_configs.size_limit_mb IS 'Maximum file size in MB for this configuration';

-- Update documents table to reference the specific configuration used
ALTER TABLE documents ADD COLUMN IF NOT EXISTS project_sharepoint_config_id UUID REFERENCES project_sharepoint_configs(id) ON DELETE SET NULL;

-- Add index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_documents_project_sharepoint_config_id ON documents(project_sharepoint_config_id);

-- Add comment
COMMENT ON COLUMN documents.project_sharepoint_config_id IS 'Reference to the specific SharePoint configuration used for this document';

-- NOTE: We intentionally do NOT add database triggers or functions
-- All business logic for managing default configurations is handled in our API
-- This makes the system easier to debug and maintain for developers

-- =================================================================
-- Migration complete!
-- =================================================================

-- The project_sharepoint_configs table now supports:
-- 1. Multiple SharePoint configurations per project
-- 2. Friendly names and descriptions for each configuration
-- 3. Different document libraries and folder paths
-- 4. File type and size restrictions per configuration
-- 5. Default configuration management (handled by API)
-- 6. Excel logging per configuration
-- 7. Simple structure without complex database functions
