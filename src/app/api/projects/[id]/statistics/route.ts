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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  
  try {
    // Check auth status
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch project data to confirm access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get total documents count
    const { count: totalDocuments, error: documentsError } = await supabase
      .from("documents")
      .select("id", { count: 'exact', head: true })
      .eq("project_id", projectId);

    if (documentsError) {
      return NextResponse.json({ error: "Failed to fetch document statistics", details: documentsError.message }, { status: 500 });
    }

    // Get documents needing review (pending review)
    const { count: pendingReviewCount, error: pendingError } = await supabase
      .from("documents")
      .select("id", { count: 'exact', head: true })
      .eq("project_id", projectId)
      .eq("status", "pending_review");

    if (pendingError) {
      return NextResponse.json({ error: "Failed to fetch pending review statistics" }, { status: 500 });
    }

    // Get team members count
    const { data: teamMembers, error: teamError } = await supabase
      .from("project_team")
      .select("user_id")
      .eq("project_id", projectId);

    if (teamError) {
      return NextResponse.json({ error: "Failed to fetch team statistics", details: teamError.message }, { status: 500 });
    }

    // Get count of managers
    const { data: managers, error: managersError } = await supabase
      .from("project_team")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("role", "manager");

    if (managersError) {
      return NextResponse.json({ error: "Failed to fetch manager statistics" }, { status: 500 });
    }

    // Calculate progress as percentage of approved documents
    const { count: approvedCount, error: approvedError } = await supabase
      .from("documents")
      .select("id", { count: 'exact', head: true })
      .eq("project_id", projectId)
      .eq("status", "approved");

    if (approvedError) {
      return NextResponse.json({ error: "Failed to fetch approval statistics" }, { status: 500 });
    }

    // Calculate progress percentage
    const progressPercentage = totalDocuments && totalDocuments > 0 
      ? Math.round((approvedCount || 0) / totalDocuments * 100) 
      : 0;

    return NextResponse.json({
      totalDocuments: totalDocuments || 0,
      pendingReview: pendingReviewCount || 0,
      progress: progressPercentage,
      teamSize: {
        managers: managers?.length || 0,
        members: teamMembers?.length || 0,
      }
    });
  } catch (error) {
    console.error("Error fetching project statistics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
