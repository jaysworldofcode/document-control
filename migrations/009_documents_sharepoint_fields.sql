-- =================================================================
-- Migration: Add SharePoint integration fields to documents table
-- =================================================================

-- Add SharePoint-specific fields to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS sharepoint_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS download_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_documents_sharepoint_id ON documents(sharepoint_id);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- Update existing records to have empty tags array if null
UPDATE documents SET tags = '[]' WHERE tags IS NULL;

-- Add comments to document the new fields
COMMENT ON COLUMN documents.sharepoint_id IS 'SharePoint file ID from Microsoft Graph API';
COMMENT ON COLUMN documents.download_url IS 'Direct download URL from SharePoint';
COMMENT ON COLUMN documents.description IS 'User-provided description of the document';
COMMENT ON COLUMN documents.tags IS 'JSON array of tags for document categorization';

-- =================================================================
-- Migration complete!
-- =================================================================

-- The documents table now supports:
-- 1. Full SharePoint integration with sharepoint_id and download_url
-- 2. Document descriptions and tags for better organization
-- 3. Proper indexing for efficient queries
-- 4. Backward compatibility with existing records
