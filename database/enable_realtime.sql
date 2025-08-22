-- Enable realtime for chat tables in Supabase
-- Run these SQL commands in your Supabase SQL Editor

-- Enable realtime for project_chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE project_chat_messages;

-- Enable realtime for project_chat_reactions table  
ALTER PUBLICATION supabase_realtime ADD TABLE project_chat_reactions;

-- Enable realtime for project_chat_attachments table
ALTER PUBLICATION supabase_realtime ADD TABLE project_chat_attachments;

-- Enable realtime for project_chat_participants table (if you create it)
-- ALTER PUBLICATION supabase_realtime ADD TABLE project_chat_participants;

-- Verify which tables have realtime enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
