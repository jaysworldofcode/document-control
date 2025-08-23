-- Add SharePoint site URL and document library configuration to projects table
-- This allows each project to have its own SharePoint site configuration

-- Add new SharePoint configuration fields to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sharepoint_site_url VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sharepoint_document_library VARCHAR(255) DEFAULT 'Documents';

-- Create indexes for the new SharePoint fields
CREATE INDEX IF NOT EXISTS idx_projects_sharepoint_site_url ON projects(sharepoint_site_url);
CREATE INDEX IF NOT EXISTS idx_projects_sharepoint_document_library ON projects(sharepoint_document_library);

-- Add comment to document the new fields
COMMENT ON COLUMN projects.sharepoint_site_url IS 'Project-specific SharePoint site URL (e.g., https://company.sharepoint.com/sites/projectname)';
COMMENT ON COLUMN projects.sharepoint_document_library IS 'Project-specific SharePoint document library name (default: Documents)';

-- Note: The organization-level SharePoint configuration (tenant ID, client ID, client secret) 
-- will still be stored in the sharepoint_configs table and shared across all projects.
-- Only the site URL and document library name are now project-specific.
