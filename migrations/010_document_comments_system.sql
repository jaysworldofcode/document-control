-- =================================================================
-- Migration: Create document comments and attachments tables
-- =================================================================

-- Create document_comments table
CREATE TABLE IF NOT EXISTS document_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    reply_to UUID REFERENCES document_comments(id) ON DELETE CASCADE,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comment_attachments table
CREATE TABLE IF NOT EXISTS comment_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES document_comments(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    storage_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comment_reactions table
CREATE TABLE IF NOT EXISTS comment_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES document_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'helpful', 'approve', 'reject')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id, reaction_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_user_id ON document_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_reply_to ON document_comments(reply_to);
CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment_id ON comment_attachments(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON comment_reactions(user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_document_comments_updated_at 
    BEFORE UPDATE ON document_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE document_comments IS 'Comments on documents with support for replies (threading)';
COMMENT ON TABLE comment_attachments IS 'File attachments for document comments stored in Supabase storage';
COMMENT ON TABLE comment_reactions IS 'User reactions to comments (like, love, helpful, etc.)';

COMMENT ON COLUMN document_comments.reply_to IS 'References parent comment ID for threaded replies';
COMMENT ON COLUMN comment_attachments.storage_path IS 'Path in Supabase storage bucket';
COMMENT ON COLUMN comment_attachments.storage_url IS 'Public URL for downloading the attachment';
COMMENT ON COLUMN comment_reactions.reaction_type IS 'Type of reaction: like, love, helpful, approve, reject';

-- =================================================================
-- Migration complete!
-- =================================================================

-- The comment system now supports:
-- 1. Threaded comments and replies
-- 2. File attachments stored in Supabase storage
-- 3. Comment reactions (like, love, helpful, etc.)
-- 4. Proper indexing for performance
-- 5. Access control handled entirely by API (no RLS)
