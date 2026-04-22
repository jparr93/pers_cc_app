# Environment Configuration

## Server Configuration

Create a `.env` file in the `server/` directory:

```env
# Azure Storage
STORAGE_ACCOUNT_URL=https://saccwcus001.table.core.windows.net
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Server
PORT=3000
NODE_ENV=production
```

## Frontend Configuration

The frontend is configured via environment variables during build. Create a `.env` file in the `client/` directory:

```env
API_URL=/api
```

Or set it directly in the deployment through Azure App Service Configuration.

## Local Development

For local development without Azure, you can use mock data:

1. In `server/src/index.ts`, replace Azure Table Client initialization with a mock implementation
2. Add mock data for testing

## Azure Credentials

The app uses `@azure/identity` with `DefaultAzureCredential` which attempts to authenticate using:
1. Environment variables
2. Managed Identity (recommended for App Service)
3. Azure CLI credentials
4. Visual Studio credentials

For App Service deployment, enable System Assigned Managed Identity on the App Service and grant it:
- `Storage Table Data Contributor` role on the Storage Account

## GitHub Secrets

Add these to your GitHub repository settings under Secrets:

- `AZURE_WEBAPP_PUBLISH_PROFILE_API` - Publish profile XML from Azure
- `AZURE_WEBAPP_PUBLISH_PROFILE_FE` - Publish profile XML from Azure
