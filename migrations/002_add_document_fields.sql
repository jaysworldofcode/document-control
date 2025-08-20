-- Migration: 002_add_document_fields.sql
-- Description: Add additional document fields and custom field functionality
-- Date: 2025-08-21
-- Author: System

-- Add additional columns to documents table for enhanced document management
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS document_number TEXT,
ADD COLUMN IF NOT EXISTS document_category TEXT,
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS retention_period INTEGER, -- in months
ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'internal' CHECK (access_level IN ('public', 'internal', 'confidential', 'restricted')),
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS document_size_mb DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS checksum TEXT;

-- Create document approval workflow table
CREATE TABLE IF NOT EXISTS public.document_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    approver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    step_order INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
    comments TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create document_tags table for better tagging system
CREATE TABLE IF NOT EXISTS public.document_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    description TEXT,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, name)
);

-- Create document_tag_assignments table
CREATE TABLE IF NOT EXISTS public.document_tag_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES public.document_tags(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(document_id, tag_id)
);

-- Create document_templates table
CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    template_file_path TEXT,
    custom_fields JSONB DEFAULT '{}',
    is_global BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create document_shares table for sharing documents with external users
CREATE TABLE IF NOT EXISTS public.document_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    shared_with_email TEXT,
    shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    access_type TEXT DEFAULT 'view' CHECK (access_type IN ('view', 'comment', 'download')),
    password_protected BOOLEAN DEFAULT false,
    password_hash TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER,
    last_accessed TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create document_bookmarks table
CREATE TABLE IF NOT EXISTS public.document_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(document_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_document_number ON public.documents(document_number);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(document_category);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_due_date ON public.documents(due_date);
CREATE INDEX IF NOT EXISTS idx_documents_access_level ON public.documents(access_level);
CREATE INDEX IF NOT EXISTS idx_documents_keywords ON public.documents USING GIN(keywords);

CREATE INDEX IF NOT EXISTS idx_document_approvals_document_id ON public.document_approvals(document_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_approver_id ON public.document_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_status ON public.document_approvals(status);

CREATE INDEX IF NOT EXISTS idx_document_tags_project_id ON public.document_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_document_tag_assignments_document_id ON public.document_tag_assignments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tag_assignments_tag_id ON public.document_tag_assignments(tag_id);

CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON public.document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_with_email ON public.document_shares(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_document_shares_expires_at ON public.document_shares(expires_at);

CREATE INDEX IF NOT EXISTS idx_document_bookmarks_user_id ON public.document_bookmarks(user_id);

-- Enable RLS on new tables
ALTER TABLE public.document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables

-- Document approvals policies
CREATE POLICY "Users can view approvals for documents in their projects" ON public.document_approvals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            JOIN public.project_members pm ON d.project_id = pm.project_id
            WHERE d.id = document_approvals.document_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Approvers can update their own approvals" ON public.document_approvals
    FOR UPDATE USING (approver_id = auth.uid());

-- Document tags policies
CREATE POLICY "Users can view tags for their projects" ON public.document_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = document_tags.project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Project managers can manage tags" ON public.document_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = document_tags.project_id AND user_id = auth.uid() AND role = 'manager'
        ) OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Document tag assignments policies
CREATE POLICY "Users can view tag assignments for documents in their projects" ON public.document_tag_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            JOIN public.project_members pm ON d.project_id = pm.project_id
            WHERE d.id = document_tag_assignments.document_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can manage tag assignments" ON public.document_tag_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            JOIN public.project_members pm ON d.project_id = pm.project_id
            WHERE d.id = document_tag_assignments.document_id AND pm.user_id = auth.uid() AND pm.role IN ('manager', 'member')
        )
    );

-- Document templates policies
CREATE POLICY "Users can view templates for their projects or global templates" ON public.document_templates
    FOR SELECT USING (
        is_global = true OR 
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = document_templates.project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Project managers can manage templates" ON public.document_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = document_templates.project_id AND user_id = auth.uid() AND role = 'manager'
        ) OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Document shares policies
CREATE POLICY "Users can view shares for documents in their projects" ON public.document_shares
    FOR SELECT USING (
        shared_by = auth.uid() OR 
        shared_with_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.documents d
            JOIN public.project_members pm ON d.project_id = pm.project_id
            WHERE d.id = document_shares.document_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create shares for documents they have access to" ON public.document_shares
    FOR INSERT WITH CHECK (
        shared_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.documents d
            JOIN public.project_members pm ON d.project_id = pm.project_id
            WHERE d.id = document_shares.document_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Share creators can update their shares" ON public.document_shares
    FOR UPDATE USING (shared_by = auth.uid());

-- Document bookmarks policies
CREATE POLICY "Users can manage their own bookmarks" ON public.document_bookmarks
    FOR ALL USING (user_id = auth.uid());

-- Add updated_at triggers
CREATE TRIGGER handle_updated_at_document_approvals
    BEFORE UPDATE ON public.document_approvals
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_document_templates
    BEFORE UPDATE ON public.document_templates
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to automatically generate document number
CREATE OR REPLACE FUNCTION public.generate_document_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.document_number IS NULL THEN
        NEW.document_number := 'DOC-' || TO_CHAR(NEW.created_at, 'YYYY') || '-' || 
                              LPAD(EXTRACT(DOY FROM NEW.created_at)::TEXT, 3, '0') || '-' ||
                              LPAD(EXTRACT(EPOCH FROM NEW.created_at)::TEXT, 10, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate document number
CREATE TRIGGER generate_document_number_trigger
    BEFORE INSERT ON public.documents
    FOR EACH ROW EXECUTE PROCEDURE public.generate_document_number();

-- Grant permissions on new tables
GRANT ALL ON public.document_approvals TO authenticated;
GRANT ALL ON public.document_tags TO authenticated;
GRANT ALL ON public.document_tag_assignments TO authenticated;
GRANT ALL ON public.document_templates TO authenticated;
GRANT ALL ON public.document_shares TO authenticated;
GRANT ALL ON public.document_bookmarks TO authenticated;
