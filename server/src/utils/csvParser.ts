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
  
  return new Promise((resolve, reject) => {
    Readable.from([fileContent])
      .pipe(csv())
      .on('data', (row) => {
        participants.push({
          name: row.Name,
          department: row.Department,
        });
      })
      .on('end', () => resolve(participants))
      .on('error', reject);
  });
}
