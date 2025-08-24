-- Fix RLS for message_attachments to allow service role to bypass

-- 1. Ensure the service_role has the right permissions
GRANT ALL ON message_attachments TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- 2. Create a policy to allow service_role to manage attachments
CREATE POLICY "Service role can manage all attachments" ON message_attachments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 3. Update existing policy to be more permissive for inserts from backend
DROP POLICY IF EXISTS "Users can add attachments to their messages" ON message_attachments;
CREATE POLICY "Users can add attachments to their messages" ON message_attachments
    FOR INSERT WITH CHECK (
        (uploaded_by = auth.uid() OR auth.role() = 'service_role') AND
        EXISTS (
            SELECT 1 FROM messages
            WHERE messages.id = message_attachments.message_id
            AND (messages.sender_id = uploaded_by OR auth.role() = 'service_role')
        )
    );
