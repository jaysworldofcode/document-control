-- Migration 019: Document Approval Workflows System
-- Create tables for sequential document approval workflows

-- Create document_approval_workflows table
CREATE TABLE IF NOT EXISTS document_approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    current_step INTEGER DEFAULT 1 NOT NULL,
    total_steps INTEGER NOT NULL,
    overall_status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (overall_status IN ('pending', 'under-review', 'approved', 'rejected')),
    completed_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create document_approval_steps table
CREATE TABLE IF NOT EXISTS document_approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES document_approval_workflows(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES users(id),
    step_order INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'under-review', 'approved', 'rejected')),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    viewed_document BOOLEAN DEFAULT FALSE,
    downloaded_document BOOLEAN DEFAULT FALSE,
    opened_in_sharepoint BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure unique step order per workflow
    UNIQUE(workflow_id, step_order),
    -- Ensure unique approver per workflow
    UNIQUE(workflow_id, approver_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_approval_workflows_document_id ON document_approval_workflows(document_id);
CREATE INDEX IF NOT EXISTS idx_document_approval_workflows_requested_by ON document_approval_workflows(requested_by);
CREATE INDEX IF NOT EXISTS idx_document_approval_workflows_status ON document_approval_workflows(overall_status);
CREATE INDEX IF NOT EXISTS idx_document_approval_steps_workflow_id ON document_approval_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_document_approval_steps_approver_id ON document_approval_steps(approver_id);
CREATE INDEX IF NOT EXISTS idx_document_approval_steps_status ON document_approval_steps(status);
CREATE INDEX IF NOT EXISTS idx_document_approval_steps_order ON document_approval_steps(workflow_id, step_order);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_approval_workflows_updated_at
    BEFORE UPDATE ON document_approval_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_approval_steps_updated_at
    BEFORE UPDATE ON document_approval_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();