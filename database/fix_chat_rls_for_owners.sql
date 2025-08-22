-- Fix RLS policies to include organization owners
-- Run these SQL commands in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view chat messages for projects they're involved in" ON project_chat_messages;
DROP POLICY IF EXISTS "Users can insert chat messages for projects they're involved in" ON project_chat_messages;

-- Create updated policies that include organization owners
CREATE POLICY "Users can view chat messages for accessible projects" ON project_chat_messages
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            LEFT JOIN project_managers pm ON p.id = pm.project_id
            LEFT JOIN project_team pt ON p.id = pt.project_id
            LEFT JOIN organizations o ON p.organization_id = o.id
            WHERE (
                pm.user_id = auth.uid() OR 
                pt.user_id = auth.uid() OR
                o.owner_id = auth.uid()  -- Allow organization owners
            )
            AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can insert chat messages for accessible projects" ON project_chat_messages
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
                o.owner_id = auth.uid()  -- Allow organization owners
            )
            AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        )
    );

-- Also fix the attachment policies
DROP POLICY IF EXISTS "Users can view attachments for messages they can see" ON project_chat_attachments;

CREATE POLICY "Users can view attachments for accessible messages" ON project_chat_attachments
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
                    o.owner_id = auth.uid()  -- Allow organization owners
                )
                AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
            )
        )
    );

-- Fix reactions policies too
DROP POLICY IF EXISTS "Users can view reactions for messages they can see" ON project_chat_reactions;
DROP POLICY IF EXISTS "Users can add reactions to messages they can see" ON project_chat_reactions;

CREATE POLICY "Users can view reactions for accessible messages" ON project_chat_reactions
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
                    o.owner_id = auth.uid()  -- Allow organization owners
                )
                AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can manage reactions for accessible messages" ON project_chat_reactions
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
                    o.owner_id = auth.uid()  -- Allow organization owners
                )
                AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
            )
        )
    );

-- Fix participants policies too
DROP POLICY IF EXISTS "Users can view participants for projects they're involved in" ON project_chat_participants;

CREATE POLICY "Users can view participants for accessible projects" ON project_chat_participants
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            LEFT JOIN project_managers pm ON p.id = pm.project_id
            LEFT JOIN project_team pt ON p.id = pt.project_id
            LEFT JOIN organizations o ON p.organization_id = o.id
            WHERE (
                pm.user_id = auth.uid() OR 
                pt.user_id = auth.uid() OR
                o.owner_id = auth.uid()  -- Allow organization owners
            )
            AND p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        )
    );

-- Verify the policies are applied
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename LIKE '%chat%';
