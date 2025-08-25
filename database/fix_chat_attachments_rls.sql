-- This script creates the storage bucket for chat attachments
-- Run this in the Supabase SQL Editor

-- Make sure we have the required storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Update bucket configuration with size limits (5MB)
UPDATE storage.buckets 
SET file_size_limit = 5242880
WHERE id = 'chat-attachments';

-- Grant anonymous access (not using RLS)
-- This is a simple approach that doesn't require debugging complex RLS policies
-- Note: In production, you might want to reconsider security, but this approach 
-- keeps things simple and easy to debug

-- 1. Enable public access
UPDATE storage.buckets 
SET public = true
WHERE id = 'chat-attachments';

-- 2. Grant basic access without RLS
-- Anyone with a valid Supabase JWT can upload/download files
-- This avoids RLS policy complexity
GRANT ALL ON SCHEMA storage TO anon, authenticated, service_role;
