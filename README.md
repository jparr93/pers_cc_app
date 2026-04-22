# Pairing App - Coffee Chat Pairings Generator

A modern web application for generating monthly user pairings (e.g., coffee chats) based on CSV participant data, with Azure Table Storage integration and a sleek, dark-mode frontend.

## Features

- 📋 **CSV-based Participant Management** - Upload participant lists with names and departments
- 🔀 **Smart Pairing Generation** - Avoid repeating the same pairs across months
- 📊 **Exhaustion Tracking** - Monitor how many possible pair combinations have beemn used
- 💾 **Azure Integration** - Store and retrieve pairings from Azure Table Storage
- 📥 **Export Capabilities** - Download pairings as CSV or copy to clipboard
- 🎨 **Modern UI** - Sleek, responsive design with dark mode support
- 🚀 **Automated Deployment** - GitHub Actions CI/CD pipeline to Azure App Services

## Architecture

```
├── client/                 # Frontend (HTML/CSS/JavaScript)
│   ├── public/
│   │   ├── index.html     # Main UI
│   │   ├── styles.css     # Modern styling with dark mode
│   │   └── script.js      # Frontend logic
│   └── package.json
│
├── server/                # Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── index.ts                    # Express server
│   │   ├── services/
│   │   │   └── pairingService.ts      # Pairing logic
│   │   └── utils/
│   │       └── csvParser.ts           # CSV parsing
│   ├── tsconfig.json
│   └── package.json
│
├── .github/workflows/
│   └── build-deploy.yml               # CI/CD pipeline
│
└── examples/
    └── sample_participants.csv        # Template CSV
```

## Prerequisites

- Node.js 24.x
- npm or yarn
- Azure Storage Account (for production)
- Azure App Services (for production deployment)

## Environment Variables

### Server (.env)
```
STORAGE_ACCOUNT_URL=https://saccwcus001.table.core.windows.net
PORT=3000
```

## Development

### Setup

```bash
# Install dependencies for all workspaces
npm install

# Install specific workspace dependencies
npm install --workspace=server
npm install --workspace=client
```

### Build

```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build --workspace=server
npm run build --workspace=client
```

### Run

```bash
# Start the API server (requires Node 24)
npm start --workspace=server

# The frontend is static files served from the server or CDN
```

## CSV Format

The application expects a CSV with the following format:

```csv
Name,Department
Joe Par,Technology
John Smit,Marketing
Jane Doe,Sales
Bob Smith,Engineering
```

## API Endpoints

### GET /health
Health check endpoint

### GET /api/pairings?date=YYYY-MM-DD
Get pairings for a specific date

### POST /api/pairings/generate
Generate new pairings
- Body: `{ "csvPath": "path/to/file.csv", "runDate": "YYYY-MM-DD" }`

### POST /api/pairings/reset
Reset all pairings

### GET /api/exhaustion
Get pairing exhaustion percentage

### GET /api/pairings/export?date=YYYY-MM-DD
Export pairings as CSV

## Deployment

### Azure Setup

1. Create resource group and services:
   ```bash
   # Frontend App Service
   az appservice plan create -n plan-cc-wcus-001 -g rg-cc-wcus-001 --sku B1 --is-linux
   az webapp create -n app-cc-fe-wcus-001 -p plan-cc-wcus-001 -g rg-cc-wcus-001 --runtime "NODE|24"
   
   # API App Service
   az webapp create -n app-cc-api-wcus-001 -p plan-cc-wcus-001 -g rg-cc-wcus-001 --runtime "NODE|24"
   
   # Storage Account
   az storage account create -n saccwcus001 -g rg-cc-wcus-001 -l westcentralus --sku Standard_LRS
   ```

2. Get publish profiles:
   ```bash
   az webapp deployment list-publishing-profiles -n app-cc-api-wcus-001 -g rg-cc-wcus-001 --xml
   az webapp deployment list-publishing-profiles -n app-cc-fe-wcus-001 -g rg-cc-wcus-001 --xml
   ```

3. Add GitHub Secrets:
   - `AZURE_WEBAPP_PUBLISH_PROFILE_API` - API publish profile
   - `AZURE_WEBAPP_PUBLISH_PROFILE_FE` - Frontend publish profile

### GitHub Actions

The workflow automatically:
- Checks out code on push to `main`
- Installs dependencies
- Builds server (TypeScript → JavaScript)
- Deploys API to `app-cc-api-wcus-001`
- Deploys frontend to `app-cc-fe-wcus-001`

## Design

- **Dark Mode** - Toggle between light and dark themes
- **Responsive** - Works on desktop, tablet, and mobile
- **Modern Colors** - Purple primary (#7c3aed), Pink accent (#ec4899)
- **Accessibility** - ARIA labels, semantic HTML

## Monthly Usage

1. Update CSV participant list as needed
2. Navigate to the frontend
3. Select the current date
4. Click "Generate Pairings"
5. Download or copy to clipboard to share with team
6. System automatically prevents repeat pairings

## Status Checks

- **Exhaustion Percentage** - Shows how many possible pairings have been used
- **Empty State** - Guides users to generate pairings if none exist
- **Error Handling** - Graceful error messages with retry options

## Notes

- The application runs monthly with new dates
- Pairings are stored indefinitely to prevent repeats across years
- Use the "Reset" button only after getting approval (irreversible)
- Azure Table Storage ensures data persistence and scalability

## License

Proprietary - Internal Use Only
