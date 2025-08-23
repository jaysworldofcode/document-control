# Document Control System

A comprehensive document management system with SharePoint integration, real-time collaboration, and approval workflows.

## Features

### Document Management
- Upload and organize documents by project
- Version control and revision history
- Document approval workflows
- Real-time collaboration and chat
- Advanced search and filtering

### SharePoint Integration
- **Multiple SharePoint Configurations**: Documents are automatically uploaded to ALL configured SharePoint locations for each project
- Support for different document libraries and folder structures per project
- Excel logging for document metadata
- Secure authentication with Microsoft Graph API

### Project Management
- Project creation and management
- Team member assignments
- Custom field definitions
- Role-based access control

### Real-time Features
- Live chat for project teams
- Real-time document updates
- Collaborative editing support

## Multiple SharePoint Configuration Feature

The system now supports configuring multiple SharePoint locations per project. When you upload a document:

1. **Automatic Multi-Location Upload**: Documents are automatically uploaded to ALL configured SharePoint locations
2. **Visual Feedback**: The upload modal shows exactly where your document will be stored
3. **Upload Results**: After upload, you'll see a summary of successful uploads and any failures
4. **Fallback Support**: Projects with single SharePoint configurations continue to work as before

### How It Works

1. **Configure Multiple Locations**: In project settings, add multiple SharePoint configurations with different:
   - Site URLs
   - Document libraries
   - Folder paths
   - Excel logging settings

2. **Upload Documents**: When uploading, the system shows all configured locations and uploads to each one

3. **Track Results**: View upload success/failure for each location with direct links to SharePoint

4. **Database Storage**: The primary document record is stored with references to all upload locations

This ensures your documents are available in all the places your team needs them, while maintaining a single source of truth in the database.

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Microsoft 365 account with SharePoint access
- Azure App registration for Graph API access

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npm run db:migrate`
5. Start the development server: `npm run dev`

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Microsoft Graph API
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT_ID=...

# JWT
JWT_SECRET=...
```

## API Endpoints

### Documents
- `POST /api/documents/upload` - Upload document to multiple SharePoint locations
- `GET /api/documents` - List documents
- `GET /api/documents/[id]` - Get document details

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `PUT /api/projects/[id]` - Update project

### SharePoint
- `GET /api/sharepoint/config` - Get SharePoint configurations
- `POST /api/sharepoint/config` - Save SharePoint configuration
- `POST /api/sharepoint/test-connection` - Test SharePoint connection

## Database Schema

The system uses PostgreSQL with the following key tables:

- `projects` - Project information and metadata
- `project_sharepoint_configs` - Multiple SharePoint configurations per project
- `documents` - Document records with SharePoint references
- `users` - User accounts and permissions
- `organizations` - Multi-tenant organization support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
