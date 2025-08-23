# Document Activity Logging System

This document describes the comprehensive activity logging system implemented for tracking all user interactions with documents in the document control system.

## Overview

The activity logging system automatically tracks user actions such as:
- Document uploads and downloads
- Document views and edits
- Status changes and approvals
- Version management
- Document sharing and commenting
- And many more actions

## Database Schema

### Table: `document_activity_logs`

```sql
CREATE TABLE document_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  version VARCHAR(20),
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  file_size BIGINT,
  file_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Supported Actions

| Action | Description | Use Case |
|--------|-------------|----------|
| `upload` | Document uploaded | Initial document creation |
| `download` | Document downloaded | User downloads for offline use |
| `view` | Document viewed | User opens document |
| `edit` | Document edited | User modifies document |
| `status_change` | Status changed | Draft → Pending Review → Approved |
| `checkout` | Document checked out | User locks document for editing |
| `checkin` | Document checked in | User releases document lock |
| `approval` | Document approved | Manager approves document |
| `rejection` | Document rejected | Manager rejects document |
| `version_upload` | New version uploaded | User uploads updated version |
| `share` | Document shared | User shares with others |
| `comment` | Comment added | User adds feedback |
| `delete` | Document deleted | User removes document |
| `restore` | Document restored | User recovers deleted document |
| `move` | Document moved | User changes location |
| `copy` | Document copied | User creates duplicate |

## API Endpoints

### GET `/api/documents/[id]/logs`
Retrieves all activity logs for a specific document.

**Response:**
```json
{
  "documentId": "uuid",
  "documentName": "Document Name",
  "logs": [...],
  "totalLogs": 15
}
```

### POST `/api/documents/[id]/logs`
Creates a new activity log entry.

**Request Body:**
```json
{
  "action": "view",
  "description": "Document viewed by user",
  "details": {
    "version": "1.0",
    "reason": "Review purposes"
  },
  "metadata": {
    "sessionId": "abc123",
    "referrer": "project-dashboard"
  }
}
```

## Security Implementation

### API-Level Security
All security checks are implemented in the API layer for better debugging and maintenance:

- **Authentication**: JWT token verification from cookies
- **Authorization**: User access verification through organization membership
- **Document Access Control**: Users can only access logs for documents in their organization's projects
- **Input Validation**: Comprehensive validation of all input parameters
- **IP Tracking**: Automatic IP address and user agent logging for audit purposes

### Access Control Flow
1. **Token Verification**: Validate JWT token from request cookies
2. **User Lookup**: Get user's organization ID from the database
3. **Document Access Check**: Verify user has access to the document through project membership
4. **Operation Execution**: Perform the requested operation only if access is granted

## Usage Examples

### Basic Logging

```typescript
import { documentLogging } from '@/utils/document-logging';

// Log a document view
await documentLogging.logView(documentId, '1.0');

// Log a document download
await documentLogging.logDownload(documentId, '1.0', 'document.pdf', 1024000);

// Log a status change
await documentLogging.logStatusChange(
  documentId, 
  'draft', 
  'pending_review', 
  'Ready for manager review'
);
```

### Custom Logging

```typescript
import { logDocumentActivity } from '@/utils/document-logging';

// Log custom activity
await logDocumentActivity(documentId, {
  action: 'custom_action',
  description: 'Custom activity description',
  details: {
    customField: 'custom value',
    reason: 'Business requirement'
  },
  metadata: {
    businessUnit: 'Engineering',
    projectPhase: 'Design'
  }
});
```

### Automatic Logging with Decorators

```typescript
import { withDocumentLogging } from '@/utils/document-logging';

class DocumentService {
  @withDocumentLogging('view', 'Document viewed via API')
  async viewDocument(documentId: string) {
    // Method implementation
    return { documentId, content: '...' };
  }
}
```

## Integration Points

### 1. Document Upload
```typescript
// Automatically logs when document is uploaded
await documentLogging.logUpload(
  documentId,
  version,
  fileName,
  fileSize
);
```

### 2. Document View
```typescript
// Logs when user opens document
await documentLogging.logView(documentId, version);
```

### 3. Document Download
```typescript
// Logs when user downloads document
await documentLogging.logDownload(
  documentId,
  version,
  fileName,
  fileSize
);
```

### 4. Status Changes
```typescript
// Logs approval workflow changes
await documentLogging.logStatusChange(
  documentId,
  oldStatus,
  newStatus,
  reason
 );
```

## Performance Considerations

### Indexing
- Primary index on `document_id` for fast document-specific queries
- Composite index on `(document_id, action, created_at)` for common queries
- Index on `user_id` for user-specific activity reports

### Query Optimization
- Logs are paginated by default
- Date-based filtering for time-range queries
- Action-based filtering for specific activity types

## Monitoring and Analytics

### Common Queries

```sql
-- Get recent activity for a document
SELECT * FROM document_activity_logs 
WHERE document_id = 'uuid' 
ORDER BY created_at DESC 
LIMIT 50;

-- Get user activity summary
SELECT action, COUNT(*) as count 
FROM document_activity_logs 
WHERE user_id = 'uuid' 
GROUP BY action;

-- Get document access patterns
SELECT DATE(created_at) as date, COUNT(*) as views
FROM document_activity_logs 
WHERE document_id = 'uuid' AND action = 'view'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Metrics to Track
- Document access frequency
- User engagement patterns
- Approval workflow efficiency
- Version control usage
- Security incident detection

## Best Practices

### 1. Consistent Descriptions
Use clear, consistent descriptions that will be meaningful in audit reports:
```typescript
// Good
description: "Document approved by project manager"

// Avoid
description: "OK"
```

### 2. Appropriate Detail Level
Include relevant context without exposing sensitive information:
```typescript
// Good
details: { reason: "Updated technical specifications" }

// Avoid
details: { reason: "User said it was wrong" }
```

### 3. Error Handling
Always handle logging errors gracefully:
```typescript
try {
  await documentLogging.logView(documentId, version);
} catch (error) {
  console.error('Failed to log activity:', error);
  // Don't fail the main operation due to logging issues
}
```

### 4. Performance Monitoring
Monitor logging performance and adjust as needed:
```typescript
const startTime = Date.now();
await documentLogging.logAction(documentId, action, description);
const duration = Date.now() - startTime;

if (duration > 1000) {
  console.warn('Activity logging took longer than expected:', duration);
}
```

## Troubleshooting

### Common Issues

1. **Logs not appearing**
   - Check database connection
   - Verify API authentication
   - Check user permissions and organization access
   - Review API error logs

2. **Performance issues**
   - Review database indexes
   - Check for large metadata objects
   - Monitor API response times
   - Check database query execution plans

3. **Missing actions**
   - Verify action is in allowed list
   - Check action parameter spelling
   - Ensure proper error handling
   - Check API validation logic

### Debug Mode

Enable debug logging for troubleshooting:
```typescript
// Set environment variable
DEBUG_LOGGING=true

// In your code
if (process.env.DEBUG_LOGGING) {
  console.log('Logging activity:', { documentId, action, description });
}
```

### API Debugging
Since all logic is in the API layer, debugging is straightforward:

1. **Check API logs** for detailed error information
2. **Verify authentication** by checking JWT token validity
3. **Test access control** by checking user organization membership
4. **Validate input data** by reviewing request parameters
5. **Monitor database queries** for performance issues

## Future Enhancements

### Planned Features
- Real-time activity notifications
- Advanced analytics dashboard
- Automated compliance reporting
- Integration with external audit systems
- Machine learning for anomaly detection

### Extensibility
The system is designed to be easily extensible:
- New action types can be added to the database CHECK constraint
- Custom metadata schemas supported through JSONB fields
- Plugin architecture for specialized logging
- Webhook support for external integrations

## Support

For questions or issues with the activity logging system:
1. Check this documentation
2. Review API logs and error messages
3. Check database connection and queries
4. Verify user authentication and permissions
5. Contact the development team

---

*Last updated: December 2024*
*Version: 1.0*
