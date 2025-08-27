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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;
    const body = await request.json();
    
    const {
      description,
      tags,
      status,
      customFieldValues,
      versionNotes,
      isNewVersion,
      file
    } = body;

    // Debug logging
    console.log('Update request body:', {
      description,
      tags,
      status,
      customFieldValues,
      versionNotes,
      isNewVersion
    });

    // First, verify the document exists and user has permission
    const { data: existingDoc, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // If uploading a new version, handle file upload first
    let newFileData = {};
    if (isNewVersion && file) {
      // For now, we'll just update the metadata without handling file upload
      // File upload would need to be handled separately with multipart/form-data
      console.log('New version upload requested but file handling not implemented in this endpoint');
    }

    // Update document metadata
    const updateData: any = {
      description,
      tags,
      status,
      custom_field_values: customFieldValues, // Use snake_case for database
      updated_at: new Date().toISOString()
    };

    // Debug logging
    console.log('Update data being sent to database:', updateData);
    console.log('Existing document custom_field_values:', existingDoc.custom_field_values);

    // Note: Version handling should be done through the document_versions table
    // For now, we're just updating the main document metadata

    const { data: updatedDoc, error: updateError } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating document:', updateError);
      console.error('Update data that failed:', updateData);
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      );
    }

    console.log('Document updated successfully:', updatedDoc);

    // Log the update activity
    try {
      await supabase
        .from('document_activity_logs')
        .insert({
          document_id: documentId,
          user_id: user.userId,
          action: isNewVersion ? 'version_uploaded' : 'updated',
          details: {
            changes: {
              description: description !== existingDoc.description,
              tags: JSON.stringify(tags) !== JSON.stringify(existingDoc.tags),
              status: status !== existingDoc.status,
              custom_field_values: JSON.stringify(customFieldValues) !== JSON.stringify(existingDoc.custom_field_values)
            },
            versionNotes: isNewVersion ? versionNotes : undefined
          },
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging activity:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      document: updatedDoc
    });

  } catch (error) {
    console.error('Error in document PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;

    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });

  } catch (error) {
    console.error('Error in document GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;

    // First, verify the document exists
    const { data: existingDoc, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete the document
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Error deleting document:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    // Log the deletion activity
    try {
      await supabase
        .from('document_activity_logs')
        .insert({
          document_id: documentId,
          user_id: user.userId,
          action: 'deleted',
          details: {
            documentName: existingDoc.name,
            documentType: existingDoc.fileType
          },
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging deletion:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error in document DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
