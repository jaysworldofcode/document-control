-- Fix real-time configuration for messages
-- Ensure the messages table is properly configured for real-time

-- Drop existing publication if it exists and recreate
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;

-- Add messages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Ensure realtime is enabled for the messages table
-- This might be needed if the previous migration didn't work properly
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Grant necessary permissions for realtime
GRANT SELECT ON messages TO anon;
GRANT SELECT ON messages TO authenticated;

-- Ensure the realtime schema has proper access
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Refresh the realtime publication
SELECT pg_notify('ddl_command_end', '');
