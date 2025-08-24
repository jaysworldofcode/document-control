-- =================================================================
-- Migration: Ensure all documents have initial version entries
-- =================================================================

-- First, check which documents don't have any version records
WITH documents_without_versions AS (
  SELECT d.id 
  FROM documents d
  LEFT JOIN document_versions dv ON d.id = dv.document_id
  WHERE dv.id IS NULL
)

-- Create version 1.0 entries for all documents without versions
INSERT INTO document_versions (
  document_id,
  version_number,
  file_name,
  file_size,
  file_type,
  sharepoint_path,
  sharepoint_id,
  download_url,
  uploaded_by,
  is_current_version,
  changes_summary
)
SELECT 
  d.id,
  '1.0',
  d.file_name,
  d.file_size,
  d.file_type,
  d.sharepoint_path,
  d.sharepoint_id,
  d.download_url,
  d.uploaded_by,
  TRUE,
  'Initial document version'
FROM documents d
WHERE d.id IN (SELECT id FROM documents_without_versions);

-- Add comment to explain what this migration does
COMMENT ON TABLE document_versions IS 'Version history for documents with SharePoint integration. Each document should have at least one version entry.';
