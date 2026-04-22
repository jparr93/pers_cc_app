# Quick Start Guide

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 24.x
- npm or yarn

### Installation

1. **Clone and setup:**
   ```bash
   cd pers_cc_app
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Start the server (mock mode for development):**
   ```bash
   npm start --workspace=server
   ```
   
   The API will be available at `http://localhost:3000`

4. **Access the frontend:**
   - Open `client/public/index.html` in your browser
   - Or use a local server: `npx http-server client/public`
   - Access at `http://localhost:8080`

## 📋 Testing Locally

### Generate Pairings
1. Navigate to the frontend
2. Select today's date (or any date)
3. Click "Generate Pairings"
4. Review the generated pairs

### Export Options
- **Download CSV** - Downloads as `.csv` file
- **Copy to Clipboard** - Copy formatted text

### Reset
- Click "Reset All Pairings" to clear all data (use with caution!)

## 🔧 Configuration

### For Local Development
No configuration needed! The app uses mock storage in development mode.

### For Azure Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for complete Azure setup instructions.

## 📦 CSV Format

Update `examples/sample_participants.csv`:
```csv
Name,Department
John Doe,Engineering
Jane Smith,Marketing
Bob Johnson,Sales
```

## 🌐 Frontend Features

- ✨ **Dark Mode** - Toggle with button in header
- 📱 **Responsive** - Works on all screen sizes
- 🎨 **Modern UI** - Clean, sleek design
- 📊 **Exhaustion Tracking** - See pairing saturation
- 📥 **Export** - CSV download or clipboard copy

## 📡 API Endpoints

All API calls go to the server. When deployed to Azure, update the API URL in `client/public/script.js` or via environment variables.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Server health check |
| `/api/pairings` | GET | Get pairings for a date |
| `/api/pairings/generate` | POST | Generate new pairings |
| `/api/pairings/reset` | POST | Reset all pairings |
| `/api/exhaustion` | GET | Get exhaustion % |
| `/api/pairings/export` | GET | Export as CSV |

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Change port
PORT=3001 npm start --workspace=server
```

### CORS Errors
The server has CORS enabled for all origins in development. If deploying to Azure, verify frontend URL is correct.

### CSV Not Parsing
- Verify file path is correct
- Check CSV format matches template (Name, Department headers)
- Ensure UTF-8 encoding

## 📚 File Structure

```
project/
├── client/              # Frontend (HTML/CSS/JS)
├── server/              # Backend API (Node.js/Express/TypeScript)
├── examples/            # Sample CSV
├── .github/workflows/   # GitHub Actions CI/CD
├── README.md            # Full documentation
├── DEPLOYMENT.md        # Azure deployment guide
└── ENV_SETUP.md         # Environment setup
```

## 🚢 Deployment

### GitHub Push to Azure
1. Ensure all GitHub Secrets are configured (see DEPLOYMENT.md)
2. Push code to `main` branch
3. GitHub Actions automatically builds and deploys to Azure

### Manual Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for manual Azure CLI commands.

## 📞 Quick Reference

```bash
# Install all dependencies
npm install

# Build all workspaces
npm run build

# Start server on port 3000
npm start --workspace=server

# Format & lint (when configured)
npm run lint --workspace=server

# Run in development mode
npm run dev --workspace=server
```

## 💡 Tips

- **Backup data** - Download current pairings before resetting
- **Version history** - Git commits track all changes
- **Monitoring** - Check Azure App Service logs in production
- **Performance** - Exhaustion percentage helps plan future runs

Enjoy managing your team's pairings! 🎯
