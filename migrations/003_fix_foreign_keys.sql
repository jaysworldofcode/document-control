-- This migration adds the foreign key constraints after both tables exist
-- Run this AFTER both organizations and users tables have been created

-- Add foreign key constraint from organizations.owner_id to users.id
ALTER TABLE organizations 
ADD CONSTRAINT organizations_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- The users.organization_id foreign key should already be created from the users table migration
-- But let's make sure it exists:
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_organization_id_fkey'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;
