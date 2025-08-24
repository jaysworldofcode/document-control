-- ================================================================
-- Message Attachments and Reactions Table
-- ================================================================

-- Create message_attachments table for file attachments in direct messages
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_uploaded_by ON message_attachments(uploaded_by);

-- Enable Row Level Security
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_attachments
-- Users can view attachments from messages they're part of
CREATE POLICY "Users can view attachments from their messages" ON message_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages
            WHERE messages.id = message_attachments.message_id
            AND (messages.sender_id = auth.uid() OR messages.recipient_id = auth.uid())
        )
    );

-- Users can only insert attachments to their own messages
CREATE POLICY "Users can add attachments to their messages" ON message_attachments
    FOR INSERT WITH CHECK (
        uploaded_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM messages
            WHERE messages.id = message_attachments.message_id
            AND messages.sender_id = auth.uid()
        )
    );

-- Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments" ON message_attachments
    FOR DELETE USING (uploaded_by = auth.uid());

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate reactions
    CONSTRAINT unique_user_message_reaction UNIQUE (message_id, user_id, reaction)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- Enable Row Level Security
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_reactions
-- Users can view reactions on messages they're part of
CREATE POLICY "Users can view reactions on their messages" ON message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages
            WHERE messages.id = message_reactions.message_id
            AND (messages.sender_id = auth.uid() OR messages.recipient_id = auth.uid())
        )
    );

-- Users can add reactions to messages they're part of
CREATE POLICY "Users can add reactions to messages" ON message_reactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM messages
            WHERE messages.id = message_reactions.message_id
            AND (messages.sender_id = auth.uid() OR messages.recipient_id = auth.uid())
        )
    );

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions" ON message_reactions
    FOR DELETE USING (user_id = auth.uid());

-- Enable realtime for the new tables
ALTER PUBLICATION supabase_realtime ADD TABLE message_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
