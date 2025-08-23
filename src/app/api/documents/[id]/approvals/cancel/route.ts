import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { logDocumentActivity } from '@/utils/document-logging';

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

// POST - Cancel approval workflow
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await request.nextUrl.pathname.split('/');
    const documentId = params[params.indexOf('documents') + 1];

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Get the current workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('document_approval_workflows')
      .select('*')
      .eq('document_id', documentId)
      .in('overall_status', ['pending', 'under-review'])
      .single();

    if (workflowError) {
      console.error('Error fetching workflow:', workflowError);
      return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 });
    }

    if (!workflow) {
      return NextResponse.json({ error: 'No active workflow found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Delete the workflow and its steps (cascade delete will handle steps)
    const { error: deleteError } = await supabase
      .from('document_approval_workflows')
      .delete()
      .eq('id', workflow.id);

    if (deleteError) {
      console.error('Error deleting workflow:', deleteError);
      return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
    }

    // Reset document status to draft
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'draft',
        updated_at: now
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document status:', updateError);
      return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
    }

    // Log the activity
    await logDocumentActivity(documentId, {
      action: 'status_change',
      description: 'Approval workflow cancelled',
      details: {
        oldValue: workflow.overall_status,
        newValue: 'draft',
        reason: 'Approval workflow cancelled by user'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Approval workflow cancelled successfully'
    });

  } catch (error) {
    console.error('Error in cancelling approval workflow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
