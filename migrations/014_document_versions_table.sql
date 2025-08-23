-- =================================================================
-- Migration: Create document versions table for version control
-- =================================================================

-- Create document_versions table
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_number VARCHAR(50) NOT NULL, -- e.g., "1.0", "1.1", "2.0"
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    sharepoint_path VARCHAR(500),
    sharepoint_id VARCHAR(255),
    download_url TEXT,
    description TEXT,
    changes_summary TEXT, -- What changed in this version
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_current_version BOOLEAN DEFAULT FALSE, -- Only one version should be current
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique version numbers per document
    UNIQUE(document_id, version_number)
);

-- Create indexes for document_versions
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_uploaded_by ON document_versions(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_document_versions_version_number ON document_versions(version_number);
CREATE INDEX IF NOT EXISTS idx_document_versions_is_current ON document_versions(is_current_version);
CREATE INDEX IF NOT EXISTS idx_document_versions_sharepoint_id ON document_versions(sharepoint_id);

-- Add comments for documentation
COMMENT ON TABLE document_versions IS 'Version history for documents with SharePoint integration';
COMMENT ON COLUMN document_versions.version_number IS 'Version number like 1.0, 1.1, 2.0, etc.';
COMMENT ON COLUMN document_versions.changes_summary IS 'Description of what changed in this version';
COMMENT ON COLUMN document_versions.is_current_version IS 'Whether this is the current/active version of the document';
COMMENT ON COLUMN document_versions.sharepoint_path IS 'SharePoint file path for this version';
COMMENT ON COLUMN document_versions.sharepoint_id IS 'SharePoint file ID from Microsoft Graph API for this version';

-- NOTE: Current version management is handled by our API
-- No database functions or triggers - keeping it simple for developers

-- =================================================================
-- Migration complete!
-- =================================================================

-- The document_versions table now supports:
-- 1. Complete version history for documents
-- 2. SharePoint integration for each version
-- 3. Change tracking with descriptions
-- 4. Current version management (handled by API, not database functions)
-- 5. Proper indexing for performance
-- 6. Simple structure that's easy for developers to understand and debug
