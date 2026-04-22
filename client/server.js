import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Inject API_URL into index.html
app.get('/', (req, res) => {
  const apiUrl = process.env.API_URL || 'https://app-cc-api-wcus-001.azurewebsites.net/api';
  let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf-8');
  
  // Inject API_URL as a script variable before other scripts load
  html = html.replace(
    '</head>',
    `<script>window.API_URL = '${apiUrl}';</script>\n</head>`
  );
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// SPA fallback - serve index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Frontend server listening on port ${port}`);
  console.log(`API_URL configured as: ${process.env.API_URL || 'not set (using default)'}`);
});
