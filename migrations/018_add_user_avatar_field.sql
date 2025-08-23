-- Migration: Add avatar fields to users table
-- Description: Adds avatar_url and avatar_thumbnail_url fields to store profile image URLs

-- Add avatar_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add avatar_thumbnail_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_thumbnail_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN users.avatar_url IS 'URL to full-size user profile image stored in Supabase storage';
COMMENT ON COLUMN users.avatar_thumbnail_url IS 'URL to thumbnail version of user profile image (96x96) for comments/chat';

-- Create storage bucket for profile images (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'profile-images'
);

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Profile images are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile image" ON storage.objects;

-- Create storage policy for profile images
-- Users can upload their own profile image
CREATE POLICY "Users can upload their own profile image" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view any profile image (public)
CREATE POLICY "Profile images are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');

-- Users can update their own profile image
CREATE POLICY "Users can update their own profile image" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own profile image
CREATE POLICY "Users can delete their own profile image" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Migration complete!
-- Users table now has avatar_url and avatar_thumbnail_url fields and profile-images storage bucket is configured
