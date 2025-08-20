# Database Migrations Guide

This document provides instructions for setting up and managing database migrations for the Document Control System using Supabase.

## Overview

The migration files in the `migrations/` directory contain SQL scripts that set up the complete database schema for the Document Control System. These migrations are designed to be run manually in the Supabase SQL Editor.

## Migration Files

### 001_initial_setup.sql
**Purpose**: Initial database setup with core tables and security policies

**Tables Created**:
- `profiles` - User profiles extending auth.users
- `projects` - Project management
- `project_members` - Project membership and roles
- `documents` - Document storage and metadata
- `document_revisions` - Document version history
- `document_comments` - Document commenting system
- `chat_messages` - Project-based chat system
- `document_logs` - Audit trail for document activities

**Features**:
- Row Level Security (RLS) policies
- Automatic profile creation on user signup
- Updated timestamp triggers
- Performance indexes
- Proper foreign key relationships

### 002_add_document_fields.sql
**Purpose**: Enhanced document management features

**New Tables**:
- `document_approvals` - Approval workflow management
- `document_tags` - Tagging system
- `document_tag_assignments` - Document-tag relationships
- `document_templates` - Document templates
- `document_shares` - External document sharing
- `document_bookmarks` - User bookmarks

**Enhanced Features**:
- Additional document metadata fields
- Automatic document numbering
- Advanced tagging system
- Document sharing capabilities
- Approval workflows

### 003_add_notifications_system.sql
**Purpose**: Notifications, activity tracking, and system management

**New Tables**:
- `notifications` - User notifications
- `notification_preferences` - User notification settings
- `activity_feed` - System activity tracking
- `system_settings` - Application configuration
- `user_sessions` - Session management
- `audit_log` - Security and compliance logging

**Features**:
- Comprehensive notification system
- Activity tracking and feeds
- System configuration management
- Security audit logging
- Session management

## Setup Instructions

### Prerequisites
1. A Supabase project set up
2. Access to the Supabase SQL Editor
3. Environment variables configured in your Next.js application

### Environment Setup

1. Create a `.env.local` file in your project root:
```bash
cp .env.local.example .env.local
```

2. Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Migration Execution

**Important**: Run migrations in order (001, 002, 003) to ensure proper dependency resolution.

#### Running Migration 001 (Initial Setup)
1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `migrations/001_initial_setup.sql`
3. Paste into SQL Editor and run
4. Verify tables were created in the Table Editor

#### Running Migration 002 (Document Features)
1. Copy the contents of `migrations/002_add_document_fields.sql`
2. Paste into SQL Editor and run
3. Verify new tables and columns were added

#### Running Migration 003 (Notifications System)
1. Copy the contents of `migrations/003_add_notifications_system.sql`
2. Paste into SQL Editor and run
3. Verify notification system tables were created

### Verification

After running all migrations, you should have the following tables:
- profiles
- projects
- project_members
- documents
- document_revisions
- document_comments
- document_approvals
- document_tags
- document_tag_assignments
- document_templates
- document_shares
- document_bookmarks
- chat_messages
- document_logs
- notifications
- notification_preferences
- activity_feed
- system_settings
- user_sessions
- audit_log

## Authentication Setup

The system uses Supabase Auth with the following features:

### Registration Flow
1. User registers via `/register` page
2. Supabase creates auth.users record
3. Trigger automatically creates profiles record
4. User can complete profile information

### Login Flow
1. User logs in via `/login` page
2. Supabase validates credentials
3. Session is established
4. User is redirected to dashboard

### Security Features
- Row Level Security (RLS) enabled on all tables
- Project-based access control
- Role-based permissions (admin, manager, user)
- Secure password reset functionality

## Key Features

### Document Management
- File upload and storage
- Version control
- Approval workflows
- Comment system with reactions
- Document sharing
- Advanced search and filtering

### Project Collaboration
- Project-based organization
- Team member management
- Role-based permissions
- Real-time chat system
- Activity tracking

### User Management
- Profile management
- Role assignment
- Department organization
- Notification preferences

### Security & Compliance
- Audit logging
- Session management
- Access control
- Data encryption

## Development

### Adding New Migrations
1. Create a new migration file: `migrations/004_feature_name.sql`
2. Include appropriate comments and metadata
3. Test in development environment
4. Document changes in this README

### Best Practices
- Always test migrations in development first
- Include rollback instructions when possible
- Use descriptive migration names
- Document breaking changes
- Maintain referential integrity

## Troubleshooting

### Common Issues

**Migration Fails**:
- Check for syntax errors
- Verify dependencies are met
- Ensure proper permissions
- Check Supabase logs

**RLS Policy Issues**:
- Verify user is authenticated
- Check policy conditions
- Test with different user roles
- Review table permissions

**Authentication Problems**:
- Verify environment variables
- Check Supabase project settings
- Confirm redirect URLs
- Review auth policies

### Getting Help
- Check Supabase documentation
- Review migration comments
- Check application logs
- Verify table structure in Supabase dashboard

## Security Considerations

- Never commit `.env.local` to version control
- Regularly review RLS policies
- Monitor audit logs
- Keep dependencies updated
- Use HTTPS in production
- Implement proper error handling
