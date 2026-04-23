# Pairing App - Backend API (.NET 10)

REST API backend for the Pairing App, built with ASP.NET Core and .NET 10.

## Prerequisites

- .NET 10.0 SDK (for local development)
- Azure App Services with .NET 10 runtime (for deployment)

## Project Structure

```
server/
├── Controllers/
│   ├── PairingsController.cs    # Main API endpoints
│   └── HealthController.cs      # Health check endpoint
├── Services/
│   └── PairingService.cs        # Business logic
├── Models/
│   ├── Participant.cs
│   ├── Pair.cs
│   ├── PairingsResponse.cs
│   └── GeneratePairingsRequest.cs
├── Utils/
│   └── CsvParser.cs             # CSV parsing
├── PairingApp.csproj            # Project file
├── Program.cs                   # Application startup
├── appsettings.json             # Configuration
├── appsettings.Development.json # Development configuration
├── web.config                   # IIS configuration (Azure App Services)
└── Dockerfile                   # Optional: local development containerization
```

## Environment Variables

### Development

```bash
# Optional - defaults to mock storage if not set
STORAGE_ACCOUNT_URL=https://saccwcus001.table.core.windows.net

# Optional - defaults to 3000
PORT=3000
```

### Production (Azure App Service)

- **Managed Identity**: Authentication handled automatically
- **Environment**: Set via Application Settings in Azure Portal
- **Storage Account**: Must have Managed Identity assigned with "Storage Table Data Contributor" role

## Build

```bash
# Restore dependencies and build
dotnet build PairingApp.csproj -c Release

# Or in the project directory
dotnet build -c Release
```

## Run

### Development

```bash
# Restore and run
dotnet run

# With watch mode for development
dotnet watch run
```

The API will start on `http://localhost:3000`

### Production (Direct Deployment to Azure App Services)

GitHub Actions automatically:
1. Publishes the .NET application
2. Creates a deployment package
3. Deploys to Azure App Services

No Docker or Container Registry needed.

## API Endpoints

### Health Check
```
GET /health
```

### Get Pairings
```
GET /api/pairings?date=2026-04-23
```

### Generate Pairings
```
POST /api/pairings/generate
Content-Type: multipart/form-data

file: <CSV file>
runDate: "2026-04-23"
```

### Reset Pairings
```
POST /api/pairings/reset
```

### Check Exhaustion
```
GET /api/exhaustion
```

### Export Pairings
```
GET /api/pairings/export?date=2026-04-23
```

## CSV Format

Expected format for participant upload:

```csv
Name,Department
John Doe,Engineering
Jane Smith,Marketing
Bob Johnson,Sales
```

## Logging

Logs are output to console. On Azure App Services, logs are visible in:
- Application Insights
- Log Stream in Azure Portal

## Dependencies

- **Azure.Data.Tables** - Azure Table Storage client
- **Azure.Identity** - Managed identity authentication
- **CsvHelper** - CSV parsing and writing
- **Swashbuckle.AspNetCore** - OpenAPI/Swagger documentation

## Deployment

See [.github/workflows/build-deploy.yml](../.github/workflows/build-deploy.yml) for automated deployment.

### Deployment Pipeline

GitHub Actions automatically on push to main:
```
1. Checkout code
2. Setup .NET 10
3. Build and publish
4. Create deployment package (zip)
5. Deploy to app-cc-api-be-wcus-001 using publish profile
```

### Manual Deployment (if needed)

```bash
# Publish locally
dotnet publish PairingApp.csproj -c Release -o ./publish

# Zip the published output
zip -r api-app.zip ./publish

# Deploy via Azure CLI
az webapp deployment source config-zip \
  --resource-group rg-cc-wcus-001 \
  --name app-cc-api-be-wcus-001 \
  --src api-app.zip
```

## Optional: Docker for Local Development

If you want to containerize locally for testing:

```bash
# Build Docker image
docker build -f Dockerfile -t pairing-app-api:latest .

# Run container
docker run -p 3000:3000 \
  -e STORAGE_ACCOUNT_URL=https://your-storage.table.core.windows.net \
  pairing-app-api:latest
```

Note: Docker is optional. The GitHub Actions pipeline deploys directly to Azure App Services.

## Troubleshooting

### Azure Table Storage Connection Issues

1. Verify Managed Identity is enabled on the App Service
2. Check RBAC role assignment: "Storage Table Data Contributor"
3. Ensure storage account URL is correct in Application Settings
4. Verify storage account exists and is accessible

### CSV Parse Errors

- Verify file has "Name" and "Department" columns (case-sensitive)
- Check for empty rows or missing values
- Test locally with `../examples/sample_participants.csv`

### App Service Deployment Issues

- Verify .NET 10 runtime is installed on App Service
- Check publish profile credentials are correct in GitHub Secrets
- View deployment logs in Azure Portal > App Service > Deployment center
- Application Insights shows runtime errors and exceptions
