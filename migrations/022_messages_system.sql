-- Create messages table for 1-on-1 messaging
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure sender and recipient are different
    CONSTRAINT messages_sender_recipient_different CHECK (sender_id != recipient_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);

-- Create composite index for conversation queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(
    LEAST(sender_id, recipient_id),
    GREATEST(sender_id, recipient_id),
    sent_at
);

-- Create view for conversations (latest message per conversation)
CREATE OR REPLACE VIEW conversations AS
SELECT DISTINCT
    CASE 
        WHEN m.sender_id < m.recipient_id 
        THEN m.sender_id 
        ELSE m.recipient_id 
    END as user1_id,
    CASE 
        WHEN m.sender_id < m.recipient_id 
        THEN m.recipient_id 
        ELSE m.sender_id 
    END as user2_id,
    m.id as last_message_id,
    m.message as last_message,
    m.sent_at as last_message_time,
    m.sender_id as last_message_sender,
    m.read_at as last_message_read_at
FROM messages m
INNER JOIN (
    SELECT 
        LEAST(sender_id, recipient_id) as user1,
        GREATEST(sender_id, recipient_id) as user2,
        MAX(sent_at) as max_sent_at
    FROM messages
    GROUP BY user1, user2
) latest ON 
    LEAST(m.sender_id, m.recipient_id) = latest.user1 
    AND GREATEST(m.sender_id, m.recipient_id) = latest.user2 
    AND m.sent_at = latest.max_sent_at;

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
-- Users can only see messages they sent or received
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Users can only insert messages they are sending
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Users can only update messages they sent (for marking as read, etc.)
CREATE POLICY "Users can update their sent messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
