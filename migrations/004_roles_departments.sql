-- =================================================================
-- Add Roles and Departments tables for enhanced user management
-- =================================================================

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    manager_id UUID, -- Will reference users.id after creation
    budget DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, organization_id) -- Department names must be unique within organization
);

-- Create indexes for departments
CREATE INDEX IF NOT EXISTS idx_departments_organization_id ON departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(manager_id);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- Add trigger for departments
CREATE TRIGGER update_departments_updated_at 
    BEFORE UPDATE ON departments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{}', -- Store role permissions as JSON
    is_system_role BOOLEAN DEFAULT false, -- For built-in roles like owner, admin, member
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, organization_id) -- Role names must be unique within organization
);

-- Create indexes for roles
CREATE INDEX IF NOT EXISTS idx_roles_organization_id ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_system_role ON roles(is_system_role);

-- Add trigger for roles
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add department_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Add role_id to users table (in addition to existing role column for backward compatibility)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id) ON DELETE SET NULL;

-- Create index for new user columns
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- Add foreign key constraint from departments.manager_id to users.id
ALTER TABLE departments 
ADD CONSTRAINT departments_manager_id_fkey 
FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- Insert default system roles for organizations
INSERT INTO roles (name, description, organization_id, permissions, is_system_role)
SELECT 
    'Owner' as name,
    'Organization owner with full administrative access' as description,
    id as organization_id,
    '{"admin": true, "manage_users": true, "manage_departments": true, "manage_roles": true, "manage_organization": true, "manage_documents": true, "view_reports": true}' as permissions,
    true as is_system_role
FROM organizations
ON CONFLICT (name, organization_id) DO NOTHING;

INSERT INTO roles (name, description, organization_id, permissions, is_system_role)
SELECT 
    'Admin' as name,
    'Administrator with elevated permissions' as description,
    id as organization_id,
    '{"admin": false, "manage_users": true, "manage_departments": true, "manage_roles": false, "manage_organization": false, "manage_documents": true, "view_reports": true}' as permissions,
    true as is_system_role
FROM organizations
ON CONFLICT (name, organization_id) DO NOTHING;

INSERT INTO roles (name, description, organization_id, permissions, is_system_role)
SELECT 
    'Member' as name,
    'Standard member with basic access' as description,
    id as organization_id,
    '{"admin": false, "manage_users": false, "manage_departments": false, "manage_roles": false, "manage_organization": false, "manage_documents": false, "view_reports": false}' as permissions,
    true as is_system_role
FROM organizations
ON CONFLICT (name, organization_id) DO NOTHING;

-- Create default departments for organizations
INSERT INTO departments (name, description, organization_id)
SELECT 
    'General' as name,
    'Default department for new users' as description,
    id as organization_id
FROM organizations
ON CONFLICT (name, organization_id) DO NOTHING;

INSERT INTO departments (name, description, organization_id)
SELECT 
    'IT' as name,
    'Information Technology department' as description,
    id as organization_id
FROM organizations
ON CONFLICT (name, organization_id) DO NOTHING;

INSERT INTO departments (name, description, organization_id)
SELECT 
    'HR' as name,
    'Human Resources department' as description,
    id as organization_id
FROM organizations
ON CONFLICT (name, organization_id) DO NOTHING;

INSERT INTO departments (name, description, organization_id)
SELECT 
    'Finance' as name,
    'Finance and Accounting department' as description,
    id as organization_id
FROM organizations
ON CONFLICT (name, organization_id) DO NOTHING;

-- =================================================================
-- Migration complete! 
-- =================================================================
