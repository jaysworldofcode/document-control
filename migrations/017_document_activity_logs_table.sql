-- Migration: Create document_activity_logs table
-- Description: Tracks all user activities related to documents (view, edit, download, etc.)

-- Create document_activity_logs table
CREATE TABLE IF NOT EXISTS document_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'upload', 'download', 'view', 'edit', 'status_change', 'checkout', 
    'checkin', 'approval', 'rejection', 'version_upload', 'share', 
    'comment', 'delete', 'restore', 'move', 'copy'
  )),
  description TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  version VARCHAR(20),
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  file_size BIGINT,
  file_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for document_activity_logs
CREATE INDEX IF NOT EXISTS idx_document_activity_logs_document_id ON document_activity_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_activity_logs_user_id ON document_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_activity_logs_action ON document_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_document_activity_logs_created_at ON document_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_document_activity_logs_document_user ON document_activity_logs(document_id, user_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_document_activity_logs_document_action_time ON document_activity_logs(document_id, action, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE document_activity_logs IS 'Tracks all user activities and interactions with documents';
COMMENT ON COLUMN document_activity_logs.action IS 'Type of action performed on the document';
COMMENT ON COLUMN document_activity_logs.description IS 'Human-readable description of the action';
COMMENT ON COLUMN document_activity_logs.old_value IS 'Previous value before change (for status changes, etc.)';
COMMENT ON COLUMN document_activity_logs.new_value IS 'New value after change (for status changes, etc.)';
COMMENT ON COLUMN document_activity_logs.version IS 'Document version when action was performed';
COMMENT ON COLUMN document_activity_logs.reason IS 'Reason for the action (for rejections, etc.)';
COMMENT ON COLUMN document_activity_logs.ip_address IS 'IP address of the user who performed the action';
COMMENT ON COLUMN document_activity_logs.user_agent IS 'User agent string for audit purposes';
COMMENT ON COLUMN document_activity_logs.file_size IS 'File size in bytes when action was performed';
COMMENT ON COLUMN document_activity_logs.file_name IS 'File name when action was performed';
COMMENT ON COLUMN document_activity_logs.metadata IS 'Additional metadata in JSON format';

-- Note: Sample data insertion removed as it referenced non-existent columns
-- The table is ready for use with the activity logging API
