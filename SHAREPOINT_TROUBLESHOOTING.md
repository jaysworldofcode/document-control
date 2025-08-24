# SharePoint Integration Troubleshooting

## Authentication Architecture

As of August 2025, the system now uses a centralized authentication approach for SharePoint:

1. **Organization-level Authentication**:
   - Tenant ID, Client ID, and Client Secret are stored in the `sharepoint_configs` table at the organization level.
   - These credentials are used for all authentication with SharePoint across all projects in the organization.

2. **Project-level Site Configuration**:
   - Site URL, document library name, and folder paths are stored in the `project_sharepoint_configs` table.
   - Each project can have multiple site configurations but they all use the organization's credentials.

This centralized approach improves security and makes credential management easier.

## Conditional Access Policy Error

If you're encountering this error when uploading document versions:

```
Error: Failed to get access token: 400 {"error":"invalid_grant","error_description":"AADSTS53003: Access has been blocked by Conditional Access policies. The access policy does not allow token issuance..."}
```

This is happening because your organization's Microsoft Entra ID (formerly Azure AD) has conditional access policies that are blocking the application's access to SharePoint.

## Solutions

### Option 1: Configure Conditional Access Policies (Recommended for Production)

Ask your IT administrator to:

1. Go to the Azure Portal > Microsoft Entra ID > Security > Conditional Access
2. Create an exception for this application or modify existing policies
3. Add the application's client ID to the approved apps list
4. For the application ID: `3d79d567-88b8-4901-ae54-01418818a0e8`

### Option 2: Use Development Fallbacks (For Development Only)

For development and testing, you can:

1. Set environment variables in your `.env.local` file:
   ```
   SHAREPOINT_EMERGENCY_FALLBACK=true
   ```

2. Optionally, if you have a valid token obtained outside the application:
   ```
   SHAREPOINT_DEV_TOKEN=your_valid_token_here
   ```

The application will automatically fall back to using Supabase Storage when SharePoint access is blocked.

### Option 3: Register a New App in Azure

If needed, you can register a new application in Azure:

1. Go to Azure Portal > App Registrations > New Registration
2. Use appropriate permissions for Microsoft Graph API:
   - Files.ReadWrite.All
   - Sites.ReadWrite.All
3. Update the client ID and secret in your project's SharePoint configuration

## Current Implementation

The current implementation handles the conditional access policy error by:

1. Attempting to use a development token if available
2. Falling back to Supabase Storage if SharePoint is inaccessible
3. Providing user-friendly error messages
4. Recording the storage provider in document version metadata

## Testing SharePoint Access

You can test SharePoint access by using the Microsoft Graph Explorer:
https://developer.microsoft.com/en-us/graph/graph-explorer

If Graph Explorer works but the application doesn't, it's likely due to conditional access policies.
