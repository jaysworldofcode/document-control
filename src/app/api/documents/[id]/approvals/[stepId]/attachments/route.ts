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

// POST - Upload rejection attachments
export async function POST(request: NextRequest, { params }: { params: { id: string; stepId: string } }) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId, stepId } = params;
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Verify the step exists and belongs to the user
    const { data: step, error: stepError } = await supabase
      .from('document_approval_steps')
      .select('id, approver_id')
      .eq('id', stepId)
      .single();

    if (stepError || !step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 });
    }

    if (step.approver_id !== user.userId) {
      return NextResponse.json({ error: 'Not authorized to add attachments to this step' }, { status: 403 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('rejection-attachments')
        .upload(`${documentId}/${stepId}/${file.name}`, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        continue;
      }

      // Create attachment record
      const { data: attachment, error: attachmentError } = await supabase
        .from('document_rejection_attachments')
        .insert({
          step_id: stepId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: uploadData.path,
          uploaded_by: user.userId
        })
        .select()
        .single();

      if (attachmentError) {
        console.error('Error creating attachment record:', attachmentError);
        continue;
      }

      uploadedFiles.push(attachment);
    }

    return NextResponse.json({
      success: true,
      attachments: uploadedFiles
    });

  } catch (error) {
    console.error('Error uploading attachments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch rejection attachments
export async function GET(request: NextRequest, { params }: { params: { id: string; stepId: string } }) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stepId } = params;

    // Get attachments
    const { data: attachments, error } = await supabase
      .from('document_rejection_attachments')
      .select(`
        *,
        uploaded_by_user:users!document_rejection_attachments_uploaded_by_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('step_id', stepId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching attachments:', error);
      return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
    }

    // Get signed URLs for each attachment
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (attachment) => {
        const { data: { signedUrl } } = await supabase.storage
          .from('rejection-attachments')
          .createSignedUrl(attachment.storage_path, 60 * 60); // 1 hour expiry

        return {
          ...attachment,
          downloadUrl: signedUrl
        };
      })
    );

    return NextResponse.json(attachmentsWithUrls);

  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}