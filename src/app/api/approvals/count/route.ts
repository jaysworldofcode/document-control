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

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get count of documents pending user's approval
    // First, verify the tables exist
    // const { error: schemaError } = await supabase
    //   .from('document_approval_workflows')
    //   .select('id')
    //   .limit(1);

    // if (schemaError) {
    //   console.error('Schema verification error:', schemaError);
    //   return NextResponse.json(
    //     { error: 'Database schema error. Please ensure all required tables exist.' },
    //     { status: 500 }
    //   );
    // }

    // First get the workflow IDs where the user is a current approver
    const { data: steps, error: stepsError } = await supabase
      .from('document_approval_steps')
      .select('workflow_id')
      .eq('approver_id', user.userId)
      .eq('status', 'pending');

    if (stepsError) {
      console.error('Error fetching approval steps:', stepsError);
      return NextResponse.json({ 
        error: `Failed to fetch approval steps: ${stepsError.message}` 
      }, { status: 500 });
    }

    // If no pending steps, return 0
    if (!steps || steps.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    // Get count of workflows that are pending/under review
    const workflowIds = steps.map(step => step.workflow_id);
    const { count, error: countError } = await supabase
      .from('document_approval_workflows')
      .select('*', { count: 'exact', head: true })
      .in('id', workflowIds)
      .or('overall_status.eq.pending,overall_status.eq.under-review');

    if (countError) {
      console.error('Error fetching workflows count:', countError);
      return NextResponse.json({ 
        error: `Failed to fetch workflows count: ${countError.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });

  } catch (error) {
    console.error('Error in GET /api/approvals/count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
