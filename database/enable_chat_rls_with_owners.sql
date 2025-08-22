-- Enable RLS with proper organization owner support
-- Simple, clear policies that work well with APIs and realtime

-- Enable RLS on all chat tables
ALTER TABLE project_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_chat_participants ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies for chat messages
CREATE POLICY "Users can view messages in accessible projects" ON project_chat_messages
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            LEFT JOIN project_managers pm ON p.id = pm.project_id
            LEFT JOIN project_team pt ON p.id = pt.project_id
            LEFT JOIN organizations o ON p.organization_id = o.id
            WHERE (
                pm.user_id = auth.uid() OR 
                pt.user_id = auth.uid() OR
                o.owner_id = auth.uid()  -- Include organization owners
            )
            AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can insert messages in accessible projects" ON project_chat_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        project_id IN (
            SELECT p.id FROM projects p
            LEFT JOIN project_managers pm ON p.id = pm.project_id
            LEFT JOIN project_team pt ON p.id = pt.project_id
            LEFT JOIN organizations o ON p.organization_id = o.id
            WHERE (
                pm.user_id = auth.uid() OR 
                pt.user_id = auth.uid() OR
                o.owner_id = auth.uid()  -- Include organization owners
            )
            AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages" ON project_chat_messages
    FOR UPDATE USING (user_id = auth.uid());

-- Simple RLS policies for chat reactions
CREATE POLICY "Users can view reactions in accessible projects" ON project_chat_reactions
    FOR SELECT USING (
        message_id IN (
            SELECT id FROM project_chat_messages
            WHERE project_id IN (
                SELECT p.id FROM projects p
                LEFT JOIN project_managers pm ON p.id = pm.project_id
                LEFT JOIN project_team pt ON p.id = pt.project_id
                LEFT JOIN organizations o ON p.organization_id = o.id
                WHERE (
                    pm.user_id = auth.uid() OR 
                    pt.user_id = auth.uid() OR
                    o.owner_id = auth.uid()  -- Include organization owners
                )
                AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can manage reactions in accessible projects" ON project_chat_reactions
    FOR ALL USING (
        user_id = auth.uid() AND
        message_id IN (
            SELECT id FROM project_chat_messages
            WHERE project_id IN (
                SELECT p.id FROM projects p
                LEFT JOIN project_managers pm ON p.id = pm.project_id
                LEFT JOIN project_team pt ON p.id = pt.project_id
                LEFT JOIN organizations o ON p.organization_id = o.id
                WHERE (
                    pm.user_id = auth.uid() OR 
                    pt.user_id = auth.uid() OR
                    o.owner_id = auth.uid()  -- Include organization owners
                )
                AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
            )
        )
    );

-- Simple RLS policies for chat attachments
CREATE POLICY "Users can view attachments in accessible projects" ON project_chat_attachments
    FOR SELECT USING (
        message_id IN (
            SELECT id FROM project_chat_messages
            WHERE project_id IN (
                SELECT p.id FROM projects p
                LEFT JOIN project_managers pm ON p.id = pm.project_id
                LEFT JOIN project_team pt ON p.id = pt.project_id
                LEFT JOIN organizations o ON p.organization_id = o.id
                WHERE (
                    pm.user_id = auth.uid() OR 
                    pt.user_id = auth.uid() OR
                    o.owner_id = auth.uid()  -- Include organization owners
                )
                AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can insert attachments in accessible projects" ON project_chat_attachments
    FOR INSERT WITH CHECK (
        message_id IN (
            SELECT id FROM project_chat_messages
            WHERE project_id IN (
                SELECT p.id FROM projects p
                LEFT JOIN project_managers pm ON p.id = pm.project_id
                LEFT JOIN project_team pt ON p.id = pt.project_id
                LEFT JOIN organizations o ON p.organization_id = o.id
                WHERE (
                    pm.user_id = auth.uid() OR 
                    pt.user_id = auth.uid() OR
                    o.owner_id = auth.uid()  -- Include organization owners
                )
                AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
            )
        )
    );

-- Simple RLS policies for chat participants
CREATE POLICY "Users can view participants in accessible projects" ON project_chat_participants
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            LEFT JOIN project_managers pm ON p.id = pm.project_id
            LEFT JOIN project_team pt ON p.id = pt.project_id
            LEFT JOIN organizations o ON p.organization_id = o.id
            WHERE (
                pm.user_id = auth.uid() OR 
                pt.user_id = auth.uid() OR
                o.owner_id = auth.uid()  -- Include organization owners
            )
            AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can insert participants in accessible projects" ON project_chat_participants
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT p.id FROM projects p
            LEFT JOIN project_managers pm ON p.id = pm.project_id
            LEFT JOIN project_team pt ON p.id = pt.project_id
            LEFT JOIN organizations o ON p.organization_id = o.id
            WHERE (
                pm.user_id = auth.uid() OR 
                pt.user_id = auth.uid() OR
                o.owner_id = auth.uid()  -- Include organization owners
            )
            AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        )
    );

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename LIKE '%chat%' 
ORDER BY tablename, policyname;
