-- =================================================================
-- Migration: Update column types in document_versions for better flexibility
-- =================================================================

-- Update column types to handle longer values
ALTER TABLE document_versions 
ALTER COLUMN file_type TYPE TEXT,
ALTER COLUMN sharepoint_path TYPE TEXT,
ALTER COLUMN sharepoint_id TYPE TEXT,
ALTER COLUMN file_name TYPE TEXT;

-- Add comments explaining the changes
COMMENT ON COLUMN document_versions.file_type IS 'MIME type of the file (changed from VARCHAR(50) to TEXT to handle long MIME types like application/vnd.openxmlformats-officedocument.*)';
COMMENT ON COLUMN document_versions.sharepoint_path IS 'Path to the file in SharePoint (changed from VARCHAR(500) to TEXT for flexibility)';
COMMENT ON COLUMN document_versions.sharepoint_id IS 'SharePoint file ID (changed from VARCHAR(255) to TEXT for flexibility)';
COMMENT ON COLUMN document_versions.file_name IS 'Name of the file (changed from VARCHAR(255) to TEXT for flexibility)';
