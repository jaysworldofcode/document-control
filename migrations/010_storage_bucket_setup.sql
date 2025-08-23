-- Create storage bucket for comment attachments (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 
  'comment-attachments',
  'comment-attachments', 
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'comment-attachments'
);

-- Note: No RLS policies as requested - API will handle all access control
