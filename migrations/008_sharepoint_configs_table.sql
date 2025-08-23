-- Create SharePoint configurations table
-- This table stores SharePoint integration settings for each organization

CREATE TABLE IF NOT EXISTS sharepoint_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    client_secret TEXT NOT NULL, -- Encrypted in production
    site_url VARCHAR(500) NOT NULL,
    document_library VARCHAR(255) NOT NULL DEFAULT 'Documents',
    is_enabled BOOLEAN DEFAULT false,
    sync_frequency VARCHAR(50) DEFAULT 'realtime', -- 'realtime', '5min', '15min', '1hour'
    auto_sync_enabled BOOLEAN DEFAULT true,
    version_control_enabled BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique configuration per organization
    UNIQUE(organization_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sharepoint_configs_organization_id ON sharepoint_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_sharepoint_configs_is_enabled ON sharepoint_configs(is_enabled);

-- Add trigger for updated_at
CREATE TRIGGER update_sharepoint_configs_updated_at 
    BEFORE UPDATE ON sharepoint_configs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Note: RLS is disabled for easier development and maintenance
-- Access control is handled through API endpoints with proper authentication
-- This approach is simpler and less prone to debugging issues

-- Add comments
COMMENT ON TABLE sharepoint_configs IS 'SharePoint integration configurations for organizations';
COMMENT ON COLUMN sharepoint_configs.tenant_id IS 'Azure AD tenant ID';
COMMENT ON COLUMN sharepoint_configs.client_id IS 'Azure AD application client ID';
COMMENT ON COLUMN sharepoint_configs.client_secret IS 'Azure AD application client secret (should be encrypted)';
COMMENT ON COLUMN sharepoint_configs.site_url IS 'SharePoint site URL';
COMMENT ON COLUMN sharepoint_configs.document_library IS 'Document library name to sync with';
COMMENT ON COLUMN sharepoint_configs.sync_frequency IS 'How often to sync documents';
COMMENT ON COLUMN sharepoint_configs.auto_sync_enabled IS 'Whether to automatically sync new documents';
COMMENT ON COLUMN sharepoint_configs.version_control_enabled IS 'Whether to enable version control in SharePoint';
