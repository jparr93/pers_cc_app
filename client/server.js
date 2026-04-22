import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Config endpoint - returns API_URL
app.get('/config', (req, res) => {
  const apiUrl = process.env.API_URL || 'https://app-cc-api-wcus-001.azurewebsites.net/api';
  console.log('Config requested. API_URL:', apiUrl);
  res.json({ API_URL: apiUrl });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// SPA fallback - serve index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Frontend server listening on port ${port}`);
  console.log(`API_URL env var:`, process.env.API_URL || 'not set');
});
