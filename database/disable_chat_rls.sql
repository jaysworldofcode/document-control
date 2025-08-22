-- Disable RLS on chat tables to allow API-based access control
-- This removes all RLS policies and allows direct database access
-- All permissions are now handled in the API layer

-- Disable RLS on all chat tables
ALTER TABLE project_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_chat_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_chat_reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_chat_participants DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies for chat tables
DROP POLICY IF EXISTS "Users can view chat messages in their projects" ON project_chat_messages;
DROP POLICY IF EXISTS "Users can view chat messages for projects they're involved in" ON project_chat_messages;
DROP POLICY IF EXISTS "Users can view chat messages for accessible projects" ON project_chat_messages;
DROP POLICY IF EXISTS "Users can insert chat messages in their projects" ON project_chat_messages;
DROP POLICY IF EXISTS "Users can insert chat messages for projects they're involved in" ON project_chat_messages;
DROP POLICY IF EXISTS "Users can insert chat messages for accessible projects" ON project_chat_messages;
DROP POLICY IF EXISTS "Users can update their own chat messages" ON project_chat_messages;

DROP POLICY IF EXISTS "Users can view attachments for messages they can see" ON project_chat_attachments;
DROP POLICY IF EXISTS "Users can view attachments for accessible messages" ON project_chat_attachments;
DROP POLICY IF EXISTS "Users can insert attachments for messages they can see" ON project_chat_attachments;

DROP POLICY IF EXISTS "Users can view reactions for messages they can see" ON project_chat_reactions;
DROP POLICY IF EXISTS "Users can view reactions for accessible messages" ON project_chat_reactions;
DROP POLICY IF EXISTS "Users can add reactions to messages they can see" ON project_chat_reactions;
DROP POLICY IF EXISTS "Users can manage reactions for accessible messages" ON project_chat_reactions;
DROP POLICY IF EXISTS "Users can manage their own reactions" ON project_chat_reactions;

DROP POLICY IF EXISTS "Users can view participants for projects they access" ON project_chat_participants;
DROP POLICY IF EXISTS "Users can view participants for projects they're involved in" ON project_chat_participants;
DROP POLICY IF EXISTS "Users can view participants for accessible projects" ON project_chat_participants;
DROP POLICY IF EXISTS "Users can insert participants for projects they access" ON project_chat_participants;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE '%chat%' 
AND schemaname = 'public';

-- This should show 'f' (false) for all chat tables indicating RLS is disabled
