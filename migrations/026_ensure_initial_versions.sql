-- =================================================================
-- Migration: Ensure all documents have initial version entries and clean up file types
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
  UPPER(SPLIT_PART(d.file_name, '.', array_length(string_to_array(d.file_name, '.'), 1))), -- Get file extension in uppercase
  d.sharepoint_path,
  d.sharepoint_id,
  d.download_url,
  d.uploaded_by,
  TRUE,
  'Initial document version'
FROM documents d
WHERE d.id IN (SELECT id FROM documents_without_versions);

-- Update existing documents to use simpler file type (just the file extension)
UPDATE documents
SET file_type = UPPER(SPLIT_PART(file_name, '.', array_length(string_to_array(file_name, '.'), 1)))
WHERE file_name LIKE '%.%';

-- Update existing document_versions to use simpler file type (just the file extension)
UPDATE document_versions
SET file_type = UPPER(SPLIT_PART(file_name, '.', array_length(string_to_array(file_name, '.'), 1)))
WHERE file_name LIKE '%.%';

-- Add comment to explain what this migration does
COMMENT ON TABLE document_versions IS 'Version history for documents with SharePoint integration. Each document should have at least one version entry.';
