import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to verify JWT token and get user info
async function verifyToken(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as { userId: string; email: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// POST - Upload profile image
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const baseFileName = `${user.userId}/${timestamp}_${randomId}`;
    
    const fileName = `${baseFileName}.${fileExt}`;

    // For now, we'll store the original image but in production you should use:
    // - Sharp library for server-side image compression
    // - Cloudinary for cloud-based image processing
    // - AWS Lambda for serverless image processing
    
    // Upload image to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName);

    if (!urlData || !urlData.publicUrl) {
      console.error('Failed to get public URL for uploaded file');
      // Try to delete the uploaded file if we can't get a URL
      await supabase.storage.from('profile-images').remove([fileName]);
      return NextResponse.json({ error: 'Failed to process uploaded image' }, { status: 500 });
    }

    // Update user's avatar_url in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        avatar_url: urlData.publicUrl,
        avatar_thumbnail_url: urlData.publicUrl // Use same image for both for now
      })
      .eq('id', user.userId);

    if (updateError) {
      console.error('Database update error:', updateError);
      // Try to delete the uploaded file if database update fails
      await supabase.storage.from('profile-images').remove([fileName]);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      avatarUrl: urlData.publicUrl,
      avatarThumbnailUrl: urlData.publicUrl,
      message: 'Profile image uploaded successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/user/avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove profile image
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's avatar URLs
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('avatar_url, avatar_thumbnail_url')
      .eq('id', user.userId)
      .single();

    if (fetchError || !userData?.avatar_url) {
      return NextResponse.json({ error: 'No avatar found' }, { status: 404 });
    }

    // Extract filename from URL
    if (!userData.avatar_url) {
      return NextResponse.json({ error: 'No avatar found' }, { status: 404 });
    }
    
    const urlParts = userData.avatar_url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `${user.userId}/${fileName}`;

    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from('profile-images')
      .remove([filePath]);

    if (deleteError) {
      console.error('Storage delete error:', deleteError);
      // Continue with database update even if file deletion fails
    }

    // Update user's avatar URLs to null
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        avatar_url: null,
        avatar_thumbnail_url: null 
      })
      .eq('id', user.userId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile image removed successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/user/avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
