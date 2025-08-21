# Document Control System - Backend Setup

This document describes the Supabase backend setup for the document control system.

## Overview

The backend uses:
- **Supabase** for database and authentication
- **Next.js API Routes** for secure server-side operations
- **JWT tokens** for session management
- **bcrypt** for password hashing
- **Direct database queries** (no RLS) for easier debugging

## Environment Setup

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Set up your Supabase project at [supabase.com](https://supabase.com)

3. Fill in your `.env.local` file:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # JWT Secret (generate a secure random string)
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

## Database Setup

### Option 1: Quick Setup (Recommended)

Run the complete setup script in your Supabase SQL editor:
```sql
-- Copy and paste the entire contents of migrations/complete_setup.sql
```

This single script handles the circular dependency and creates everything in the correct order.

### Option 2: Step-by-Step Setup

If you prefer to run migrations individually, follow this exact order:

1. **First**: `migrations/002_organizations_table.sql` (creates organizations without foreign keys)
2. **Second**: `migrations/001_users_table.sql` (creates users with org foreign key)  
3. **Third**: `migrations/003_fix_foreign_keys.sql` (adds the reverse foreign key)

### Important Notes

- **Circular Dependency Solution**: Organizations table is created first without the `owner_id` foreign key, then users table is created, then the foreign key is added back to organizations
- **Order Matters**: You must run the migrations in the exact order specified above
- **One-Time Setup**: After running once, your database will be fully configured

### 2. Database Schema

**Organizations Table:**
- `id` (UUID, primary key)
- `name` (varchar, required)
- `industry` (varchar, optional)
- `size` (enum: startup/small/medium/large/enterprise)
- `owner_id` (UUID, references users.id)
- `settings` (jsonb)
- `created_at`, `updated_at` (timestamps)

**Users Table:**
- `id` (UUID, primary key)
- `email` (varchar, unique)
- `password_hash` (text)
- `first_name`, `last_name` (varchar)
- `organization_id` (UUID, references organizations.id)
- `role` (enum: owner/admin/member)
- `email_verified` (boolean)
- `created_at`, `updated_at` (timestamps)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration with organization creation
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Organizations
- `GET /api/organizations` - Get organization details and members (owner only)
- `PUT /api/organizations` - Update organization info (owner only)

## Security Features

1. **Password Hashing**: Uses bcrypt with 12 salt rounds
2. **JWT Tokens**: 7-day expiration with HTTP-only cookies
3. **Role-based Access**: Owner/admin/member permissions
4. **Input Validation**: Zod schemas for all API inputs
5. **Error Handling**: Consistent error responses

## Authentication Flow

1. User registers → Creates organization → Becomes owner
2. JWT token stored in HTTP-only cookie
3. Frontend auth context manages user state
4. Protected routes check authentication status

## Organization Management

- **Registration**: Creates new organization with user as owner
- **Ownership**: Only owners can modify organization settings
- **Multi-tenant**: Each organization is isolated
- **Team Management**: View and manage organization members

## Development Notes

- No Supabase RLS (Row Level Security) - easier debugging
- No Supabase Auth functions - custom JWT implementation
- Direct database queries for transparency
- Separate migration files for tracking changes
- TypeScript throughout for type safety

## Testing the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/register` and create a new account

3. The system will:
   - Create a new organization
   - Set you as the owner
   - Log you in automatically
   - Redirect to the dashboard

4. Check your Supabase dashboard to see the created records

## Troubleshooting

- **Environment variables**: Ensure all required vars are set
- **Database connection**: Check Supabase project status
- **Migrations**: Run them in the correct order
- **JWT Secret**: Must be set for authentication to work
- **CORS issues**: Ensure your domain is allowed in Supabase settings

## Next Steps

- Add email verification flow
- Implement forgot password functionality
- Add team member invitation system
- Set up database backups
- Add monitoring and logging
