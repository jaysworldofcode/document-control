-- =================================================================
-- Migration: Update project_sharepoint_configs to use organization auth
-- =================================================================

-- Remove authentication fields from project_sharepoint_configs table
-- These will now be stored only in the main sharepoint_configs table
ALTER TABLE project_sharepoint_configs
    DROP COLUMN IF EXISTS tenant_id,
    DROP COLUMN IF EXISTS client_id,
    DROP COLUMN IF EXISTS client_secret;

-- Update comments to reflect new structure
COMMENT ON TABLE project_sharepoint_configs IS 'SharePoint site configurations per project. Authentication credentials are stored in the main sharepoint_configs table at the organization level.';

-- If there are any existing triggers related to these fields, drop them
DROP TRIGGER IF EXISTS update_project_sharepoint_configs_credentials ON project_sharepoint_configs;

-- Make sure all projects have a valid reference to their organization for SharePoint auth
CREATE OR REPLACE FUNCTION fix_document_sharepoint_references() 
RETURNS void AS $$
DECLARE
    doc RECORD;
    project_config RECORD;
BEGIN
    -- For each document with a project_sharepoint_config_id
    FOR doc IN 
        SELECT d.id, d.project_id, d.project_sharepoint_config_id 
        FROM documents d
        WHERE d.project_sharepoint_config_id IS NOT NULL
    LOOP
        -- Check if the config still exists
        SELECT * INTO project_config 
        FROM project_sharepoint_configs 
        WHERE id = doc.project_sharepoint_config_id;
        
        -- If config doesn't exist, try to find another one for this project
        IF project_config.id IS NULL THEN
            SELECT * INTO project_config 
            FROM project_sharepoint_configs 
            WHERE project_id = doc.project_id
            ORDER BY is_default DESC, created_at ASC
            LIMIT 1;
            
            -- If found, update the document
            IF project_config.id IS NOT NULL THEN
                UPDATE documents
                SET project_sharepoint_config_id = project_config.id,
                    updated_at = NOW()
                WHERE id = doc.id;
                
                RAISE NOTICE 'Updated document % to use SharePoint config %', doc.id, project_config.id;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function to fix any broken references
SELECT fix_document_sharepoint_references();

-- Drop the temporary function
DROP FUNCTION IF EXISTS fix_document_sharepoint_references();

-- =================================================================
-- Migration complete!
-- =================================================================
