-- =================================================================
-- Supabase Storage Setup for Chat Attachments
-- =================================================================

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 
  'chat-attachments',
  'chat-attachments',
  true, -- Public bucket for easy access
  52428800, -- 50MB limit per file
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
    'application/json',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg'
  ]
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'chat-attachments'
);

-- =================================================================
-- Storage Access Policies
-- =================================================================

-- Policy for authenticated users to upload files
CREATE POLICY "Authenticated users can upload chat attachments" ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'chat-attachments');

-- Policy for authenticated users to view their organization's files
CREATE POLICY "Users can view chat attachments in their organization" ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'chat-attachments');

-- Policy for users to delete their own uploads
CREATE POLICY "Users can delete their own chat attachments" ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[2]);

-- =================================================================
-- Enable real-time updates for chat attachments
-- =================================================================

-- Add project_chat_attachments to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'project_chat_attachments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_chat_attachments;
  END IF;
END $$;
