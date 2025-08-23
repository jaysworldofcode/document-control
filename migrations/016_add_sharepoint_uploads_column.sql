-- =================================================================
-- Migration: Add sharepoint_uploads column to documents table
-- =================================================================

-- Add column to store all SharePoint upload locations
ALTER TABLE documents ADD COLUMN IF NOT EXISTS sharepoint_uploads JSONB;

-- Add index for better performance on JSON queries
CREATE INDEX IF NOT EXISTS idx_documents_sharepoint_uploads ON documents USING GIN (sharepoint_uploads);

-- Add comment
COMMENT ON COLUMN documents.sharepoint_uploads IS 'JSON array containing all SharePoint upload locations for this document';

-- =================================================================
-- Migration complete!
-- =================================================================
