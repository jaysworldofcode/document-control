import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { DocumentLog, DocumentLogAction } from '@/types/document-log.types';

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

// Helper function to check if user has access to document
async function checkDocumentAccess(userId: string, documentId: string): Promise<boolean> {
  try {
    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (userError || !userData?.organization_id) {
      return false;
    }

    // Check if document exists and user has access through project
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        id,
        project_id,
        projects!inner(id, organization_id)
      `)
      .eq('id', documentId)
      .eq('projects.organization_id', userData.organization_id)
      .single();

    if (docError || !document) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking document access:', error);
    return false;
  }
}

// GET - Fetch activity logs for a document
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Check if user has access to this document
    const hasAccess = await checkDocumentAccess(user.userId, documentId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Get document details for response
    const { data: document } = await supabase
      .from('documents')
      .select('title, name')
      .eq('id', documentId)
      .single();

    // Fetch activity logs for this document
    const { data: logs, error } = await supabase
      .from('document_activity_logs')
      .select(`
        *,
        user:users!document_activity_logs_user_id_fkey(id, first_name, last_name, email)
      `)
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching logs:', error);
      return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }

    // Transform logs to match frontend interface
    const transformedLogs = logs?.map(log => ({
      id: log.id,
      documentId: log.document_id,
      action: log.action as DocumentLogAction,
      timestamp: log.created_at,
      userId: log.user_id,
      userName: log.user ? 
        `${log.user.first_name} ${log.user.last_name}` : 'Unknown User',
      details: {
        description: log.description,
        oldValue: log.old_value,
        newValue: log.new_value,
        version: log.version,
        reason: log.reason,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        fileSize: log.file_size,
        fileName: log.file_name
      },
      metadata: log.metadata
    })) || [];

    return NextResponse.json({
      documentId,
      documentName: document?.title || document?.name || 'Unknown Document',
      logs: transformedLogs,
      totalLogs: transformedLogs.length
    });

  } catch (error) {
    console.error('Error in GET /api/documents/[id]/logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new activity log entry
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;
    const body = await request.json();
    const { action, description, details, metadata } = body;

    if (!documentId || !action || !description) {
      return NextResponse.json({ 
        error: 'Document ID, action, and description are required' 
      }, { status: 400 });
    }

    // Check if user has access to this document
    const hasAccess = await checkDocumentAccess(user.userId, documentId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Get client IP and user agent
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create the log entry with manual timestamp handling
    const now = new Date().toISOString();
    const { data: newLog, error } = await supabase
      .from('document_activity_logs')
      .insert({
        document_id: documentId,
        user_id: user.userId,
        action: action,
        description: description,
        old_value: details?.oldValue,
        new_value: details?.newValue,
        version: details?.version,
        reason: details?.reason,
        ip_address: ip,
        user_agent: userAgent,
        file_size: details?.fileSize,
        file_name: details?.fileName,
        metadata: metadata || {},
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating log entry:', error);
      return NextResponse.json({ error: 'Failed to create log entry' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      log: newLog,
      message: 'Activity logged successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/documents/[id]/logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
