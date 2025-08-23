-- Create the rejection-attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('rejection-attachments', 'rejection-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Create document_rejection_attachments table
CREATE TABLE IF NOT EXISTS document_rejection_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID NOT NULL REFERENCES document_approval_steps(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_rejection_attachments_step_id ON document_rejection_attachments(step_id);
CREATE INDEX IF NOT EXISTS idx_document_rejection_attachments_uploaded_by ON document_rejection_attachments(uploaded_by);