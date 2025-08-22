-- Chat Messages Table
CREATE TABLE IF NOT EXISTS project_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
    reply_to UUID REFERENCES project_chat_messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- Chat Attachments Table
CREATE TABLE IF NOT EXISTS project_chat_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES project_chat_messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Reactions Table
CREATE TABLE IF NOT EXISTS project_chat_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES project_chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'angry', 'sad')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction_type)
);

-- Chat Participants (optional - for tracking active participants)
CREATE TABLE IF NOT EXISTS project_chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(project_id, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON project_chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON project_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON project_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON project_chat_messages(reply_to);

CREATE INDEX IF NOT EXISTS idx_chat_attachments_message_id ON project_chat_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_chat_reactions_message_id ON project_chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_user_id ON project_chat_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_participants_project_id ON project_chat_participants(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON project_chat_participants(user_id);

-- RLS Policies for Chat Messages
ALTER TABLE project_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat messages for projects they're involved in" ON project_chat_messages
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            LEFT JOIN project_managers pm ON p.id = pm.project_id
            LEFT JOIN project_team pt ON p.id = pt.project_id
            WHERE (pm.user_id = auth.uid() OR pt.user_id = auth.uid())
            AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can insert chat messages for projects they're involved in" ON project_chat_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        project_id IN (
            SELECT p.id FROM projects p
            LEFT JOIN project_managers pm ON p.id = pm.project_id
            LEFT JOIN project_team pt ON p.id = pt.project_id
            WHERE (pm.user_id = auth.uid() OR pt.user_id = auth.uid())
            AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own chat messages" ON project_chat_messages
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for Chat Attachments
ALTER TABLE project_chat_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments for messages they can see" ON project_chat_attachments
    FOR SELECT USING (
        message_id IN (
            SELECT id FROM project_chat_messages
            WHERE project_id IN (
                SELECT p.id FROM projects p
                LEFT JOIN project_managers pm ON p.id = pm.project_id
                LEFT JOIN project_team pt ON p.id = pt.project_id
                WHERE (pm.user_id = auth.uid() OR pt.user_id = auth.uid())
                AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can insert attachments for their messages" ON project_chat_attachments
    FOR INSERT WITH CHECK (
        message_id IN (
            SELECT id FROM project_chat_messages
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for Chat Reactions
ALTER TABLE project_chat_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions for messages they can see" ON project_chat_reactions
    FOR SELECT USING (
        message_id IN (
            SELECT id FROM project_chat_messages
            WHERE project_id IN (
                SELECT p.id FROM projects p
                LEFT JOIN project_managers pm ON p.id = pm.project_id
                LEFT JOIN project_team pt ON p.id = pt.project_id
                WHERE (pm.user_id = auth.uid() OR pt.user_id = auth.uid())
                AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can insert reactions" ON project_chat_reactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own reactions" ON project_chat_reactions
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for Chat Participants
ALTER TABLE project_chat_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants for projects they're involved in" ON project_chat_participants
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            LEFT JOIN project_managers pm ON p.id = pm.project_id
            LEFT JOIN project_team pt ON p.id = pt.project_id
            WHERE (pm.user_id = auth.uid() OR pt.user_id = auth.uid())
            AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        )
    );

-- Function to update last_seen_at for chat participants
CREATE OR REPLACE FUNCTION update_chat_participant_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO project_chat_participants (project_id, user_id, last_seen_at)
    VALUES (NEW.project_id, NEW.user_id, NOW())
    ON CONFLICT (project_id, user_id)
    DO UPDATE SET last_seen_at = NOW(), is_active = TRUE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_seen_at when a message is sent
CREATE TRIGGER update_chat_participant_last_seen_trigger
    AFTER INSERT ON project_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_participant_last_seen();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at for chat messages
CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON project_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
