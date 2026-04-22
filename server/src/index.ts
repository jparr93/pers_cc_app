import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { TableClient } from '@azure/data-tables';
import { DefaultAzureCredential } from '@azure/identity';
import { PairingService } from './services/pairingService.js';
import { parseCsvString } from './utils/csvParser.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Azure Table Storage
let tableClient: any;
try {
  const storageUrl = process.env.STORAGE_ACCOUNT_URL || 'https://saccwcus001.table.core.windows.net';
  const credential = new DefaultAzureCredential();
  tableClient = new TableClient(storageUrl, 'pairings', credential);
} catch (error) {
  console.error('Failed to initialize Azure Table Client:', error);
  // For development, you can use a mock client
  console.warn('Using mock table storage for development');
  tableClient = null;
}

const pairingService = new PairingService(tableClient);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get current pairings
app.get('/api/pairings', async (req: Request, res: Response) => {
  try {
    const runDate = req.query.date as string || new Date().toISOString().split('T')[0];
    const pairings = await pairingService.getPairings(runDate);
    res.json({ pairings, runDate, exhaustionPercentage: pairingService.getExhaustionPercentage() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve pairings' });
  }
});

// Generate new pairings
app.post('/api/pairings/generate', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'CSV file is required' });
      return;
    }

    const { runDate } = req.body;
    if (!runDate) {
      res.status(400).json({ error: 'runDate is required' });
      return;
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const participants = await parseCsvString(csvContent);

    if (participants.length === 0) {
      res.status(400).json({ error: 'CSV file is empty or invalid' });
      return;
    }

    const newPairings = await pairingService.generatePairings(participants, runDate);
    res.json({ pairings: newPairings, count: newPairings.length });
  } catch (error) {
    console.error('Error generating pairings:', error);
    res.status(500).json({ error: 'Failed to generate pairings' });
  }
});

// Reset pairings
app.post('/api/pairings/reset', async (req: Request, res: Response) => {
  try {
    await pairingService.resetPairings();
    res.json({ message: 'Pairings reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset pairings' });
  }
});

// Check exhaustion
app.get('/api/exhaustion', async (req: Request, res: Response) => {
  try {
    const exhaustionPercentage = await pairingService.getExhaustionPercentageAsync();
    res.json({ exhaustionPercentage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check exhaustion' });
  }
});

// Export pairings as CSV
app.get('/api/pairings/export', async (req: Request, res: Response) => {
  try {
    const runDate = req.query.date as string || new Date().toISOString().split('T')[0];
    const csv = await pairingService.exportPairingsCsv(runDate);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="pairings-${runDate}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export pairings' });
  }
});

app.listen(port, () => {
  console.log(`Pairing API server listening on port ${port}`);
});
