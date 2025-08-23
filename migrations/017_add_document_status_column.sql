-- Add status column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- Update existing documents to have 'draft' status if null
UPDATE documents SET status = 'draft' WHERE status IS NULL;

-- Add check constraint to ensure valid status values
ALTER TABLE documents ADD CONSTRAINT documents_status_check 
CHECK (status IN ('draft', 'pending_review', 'under_review', 'approved', 'rejected'));
