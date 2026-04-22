# Deployment Checklist

## Pre-Deployment

- [ ] Update participant CSV in `examples/sample_participants.csv`
- [ ] Verify Node.js version is 24.x in build environment
- [ ] Set all required GitHub Secrets
- [ ] Verify Azure Resource Group exists
- [ ] Confirm App Service names match pipeline
- [ ] Enable Managed Identity on both App Services

## Azure Setup Commands

```bash
# Create resource group
az group create -n rg-cc-wcus-001 -l westcentralus

# Create App Service Plan (Linux, Node 24)
az appservice plan create \
  -n plan-cc-wcus-001 \
  -g rg-cc-wcus-001 \
  --sku B1 \
  --is-linux

# Create Frontend App Service
az webapp create \
  -n app-cc-fe-wcus-001 \
  -p plan-cc-wcus-001 \
  -g rg-cc-wcus-001 \
  --runtime "NODE|24"

# Create API App Service
az webapp create \
  -n app-cc-api-wcus-001 \
  -p plan-cc-wcus-001 \
  -g rg-cc-wcus-001 \
  --runtime "NODE|24"

# Create Storage Account
az storage account create \
  -n saccwcus001 \
  -g rg-cc-wcus-001 \
  -l westcentralus \
  --sku Standard_LRS

# Create Table Storage for pairings
az storage table create \
  -n pairings \
  --account-name saccwcus001

# Get App Service Publish Profiles
az webapp deployment list-publishing-profiles \
  -n app-cc-api-wcus-001 \
  -g rg-cc-wcus-001 \
  --xml > api-publish.xml

az webapp deployment list-publishing-profiles \
  -n app-cc-fe-wcus-001 \
  -g rg-cc-wcus-001 \
  --xml > fe-publish.xml
```

## GitHub Configuration

1. Go to repository Settings → Secrets and Variables → Actions
2. Add the following secrets:
   - `AZURE_WEBAPP_PUBLISH_PROFILE_API` - Content of `api-publish.xml`
   - `AZURE_WEBAPP_PUBLISH_PROFILE_FE` - Content of `fe-publish.xml`

## App Service Configuration

### API App Service (app-cc-api-wcus-001)

**Environment Variables:**
- `STORAGE_ACCOUNT_URL` = `https://saccwcus001.table.core.windows.net`
- `PORT` = `80`
- `NODE_ENV` = `production`

**Startup Command:**
```
pm2 start /home/site/wwwroot/dist/index.js --name "pairing-api"
```

### Frontend App Service (app-cc-fe-wcus-001)

**Configuration:**
- Default documents: `index.html`
- Start up script (if needed): `npx http-server /home/site/wwwroot -p 80 --cors`

## Post-Deployment Verification

- [ ] Frontend loads at `https://app-cc-fe-wcus-001.azurewebsites.net`
- [ ] API health check: `https://app-cc-api-wcus-001.azurewebsites.net/health`
- [ ] Can generate pairings via UI
- [ ] Pairings save to Azure Table Storage
- [ ] CSV export works
- [ ] Dark mode toggle works
- [ ] Responsive design on mobile

## Monitoring

### Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  -g rg-cc-wcus-001 \
  -a pairing-app-insights

# Link to App Services
az webapp config appsettings set \
  -n app-cc-api-wcus-001 \
  -g rg-cc-wcus-001 \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=<KEY>
```

### Logs

```bash
# Stream logs
az webapp log tail -n app-cc-api-wcus-001 -g rg-cc-wcus-001
az webapp log tail -n app-cc-fe-wcus-001 -g rg-cc-wcus-001
```

## Rollback

To rollback to a previous deployment:

```bash
# List deployment slots
az webapp deployment slot list -n app-cc-api-wcus-001 -g rg-cc-wcus-001

# Swap slots (if using deployment slots)
az webapp deployment slot swap \
  -n app-cc-api-wcus-001 \
  -g rg-cc-wcus-001 \
  -s staging
```

## Troubleshooting

**500 Errors:**
- Check App Service logs: `az webapp log tail ...`
- Verify environment variables are set
- Ensure Managed Identity is enabled and has proper permissions

**CORS Errors:**
- Frontend URL must be in API CORS whitelist
- Check `.cors()` middleware in Express

**CSV Parse Errors:**
- Verify CSV format matches template
- Check file encoding (UTF-8)

**Azure Authentication Errors:**
- Enable Managed Identity on App Service
- Grant `Storage Table Data Contributor` role
- Check Service Principal has correct permissions
