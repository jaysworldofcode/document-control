-- Migration: Add Roles and Departments tables
-- Description: Create comprehensive role and department management system

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    resource TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'manage')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(name)
);

-- Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    head_of_department TEXT,
    parent_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    location TEXT,
    budget BIGINT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    UNIQUE(name)
);

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    level TEXT NOT NULL CHECK (level IN ('admin', 'manager', 'user')),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    UNIQUE(name)
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(role_id, permission_id)
);

-- Create user_roles junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
    assigned_by UUID REFERENCES auth.users(id) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, role_id)
);

-- Create user_departments junction table (users can belong to multiple departments)
CREATE TABLE IF NOT EXISTS public.user_departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    assigned_by UUID REFERENCES auth.users(id) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, department_id)
);

-- Enable RLS on all tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Permissions policies (read-only for most users)
CREATE POLICY "Everyone can view permissions" ON public.permissions
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage permissions" ON public.permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Departments policies
CREATE POLICY "Everyone can view active departments" ON public.departments
    FOR SELECT USING (is_active = true OR created_by = auth.uid());

CREATE POLICY "Admins and managers can manage departments" ON public.departments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Roles policies
CREATE POLICY "Everyone can view active roles" ON public.roles
    FOR SELECT USING (is_active = true OR created_by = auth.uid());

CREATE POLICY "Admins and managers can manage roles" ON public.roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Role permissions policies
CREATE POLICY "Everyone can view role permissions" ON public.role_permissions
    FOR SELECT USING (true);

CREATE POLICY "Admins and managers can manage role permissions" ON public.role_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins and managers can manage user roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- User departments policies
CREATE POLICY "Users can view their own departments" ON public.user_departments
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins and managers can manage user departments" ON public.user_departments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_departments_parent ON public.departments(parent_department_id);
CREATE INDEX idx_departments_active ON public.departments(is_active);
CREATE INDEX idx_roles_department ON public.roles(department_id);
CREATE INDEX idx_roles_active ON public.roles(is_active);
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON public.role_permissions(permission_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role_id);
CREATE INDEX idx_user_departments_user ON public.user_departments(user_id);
CREATE INDEX idx_user_departments_department ON public.user_departments(department_id);

-- Insert default permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
    ('View Documents', 'Can view and read documents', 'documents', 'read'),
    ('Create Documents', 'Can create new documents', 'documents', 'create'),
    ('Edit Documents', 'Can modify existing documents', 'documents', 'update'),
    ('Delete Documents', 'Can delete documents', 'documents', 'delete'),
    ('Manage Projects', 'Can create, edit, and manage projects', 'projects', 'manage'),
    ('View Projects', 'Can view project information', 'projects', 'read'),
    ('Manage Users', 'Can create, edit, and manage user accounts', 'users', 'manage'),
    ('View Users', 'Can view user information', 'users', 'read'),
    ('System Administration', 'Full system administration access', 'system', 'manage'),
    ('Approve Documents', 'Can approve document workflows', 'documents', 'update'),
    ('Audit Access', 'Can access audit logs and compliance reports', 'audit', 'read'),
    ('Backup Management', 'Can manage system backups', 'system', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Insert default departments
INSERT INTO public.departments (name, description, head_of_department, location, budget, created_by) 
SELECT 
    'Engineering',
    'Software development and technical operations team responsible for building and maintaining our document management platform.',
    'Sarah Wilson',
    'San Francisco, CA',
    2500000,
    (SELECT id FROM auth.users LIMIT 1)
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.departments (name, description, head_of_department, location, budget, created_by)
SELECT 
    'Legal & Compliance',
    'Legal affairs and regulatory compliance team ensuring all document processes meet industry standards and legal requirements.',
    'Emily Rodriguez',
    'New York, NY',
    800000,
    (SELECT id FROM auth.users LIMIT 1)
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.departments (name, description, head_of_department, location, budget, created_by)
SELECT 
    'Quality Assurance',
    'Quality control and testing team ensuring the highest standards of document integrity and system reliability.',
    'Lisa Garcia',
    'Austin, TX',
    600000,
    (SELECT id FROM auth.users LIMIT 1)
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
ON CONFLICT (name) DO NOTHING;

-- Insert default roles
INSERT INTO public.roles (name, description, level, department_id, created_by)
SELECT 
    'System Administrator',
    'Full system administrator with complete access to all system features and administrative functions.',
    'admin',
    NULL,
    (SELECT id FROM auth.users LIMIT 1)
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.roles (name, description, level, department_id, created_by)
SELECT 
    'Project Manager',
    'Manages projects, coordinates teams, and oversees document workflows. Has comprehensive access to project management features.',
    'manager',
    (SELECT id FROM public.departments WHERE name = 'Engineering' LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1)
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.roles (name, description, level, department_id, created_by)
SELECT 
    'Senior Developer',
    'Senior software developer with advanced permissions for document management system development and maintenance.',
    'user',
    (SELECT id FROM public.departments WHERE name = 'Engineering' LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1)
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to System Administrator role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'System Administrator'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign basic permissions to Project Manager role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name IN (
    'View Documents', 'Create Documents', 'Edit Documents', 'Manage Projects', 
    'View Projects', 'View Users', 'Approve Documents'
)
WHERE r.name = 'Project Manager'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign basic permissions to Senior Developer role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.name IN (
    'View Documents', 'Create Documents', 'Edit Documents', 'View Projects', 'View Users'
)
WHERE r.name = 'Senior Developer'
ON CONFLICT (role_id, permission_id) DO NOTHING;
