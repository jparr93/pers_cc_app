import fs from 'fs/promises';
import csv from 'csv-parser';
import { Readable } from 'stream';

export interface Participant {
  name: string;
  department: string;
}

export async function parseCsvFile(filePath: string): Promise<Participant[]> {
  const participants: Participant[] = [];
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return parseCsvString(fileContent);
}

export async function parseCsvString(csvContent: string): Promise<Participant[]> {
  const participants: Participant[] = [];
  
  return new Promise((resolve, reject) => {
    Readable.from([csvContent])
      .pipe(csv())
      .on('data', (row) => {
        participants.push({
          name: row.Name || row.name || '',
          department: row.Department || row.department || '',
        });
      })
      .on('end', () => resolve(participants))
      .on('error', reject);
  });
}
