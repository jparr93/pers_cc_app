import { TableClient, TableEntity } from '@azure/data-tables';

export interface Pair {
  person1: string;
  person2: string;
  department1: string;
  department2: string;
}

export interface Participant {
  name: string;
  department: string;
}

export class PairingService {
  private tableClient: TableClient | null;
  private pairingHistory: Map<string, Set<string>> = new Map();
  private mockStorage: Map<string, TableEntity[]> = new Map();

  constructor(tableClient: TableClient | null) {
    this.tableClient = tableClient;
  }

  async generatePairings(participants: Participant[], runDate: string): Promise<Pair[]> {
    // Shuffle participants
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const pairs: Pair[] = [];

    // Load existing pairs to avoid duplicates
    await this.loadPairingHistory();

    // Generate pairs ensuring no repeats
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const p1 = shuffled[i];
      const p2 = shuffled[i + 1];

      const pairKey = this.getPairKey(p1.name, p2.name);

      // Check if this pair already exists
      if (!this.pairingHistory.has(pairKey)) {
        pairs.push({
          person1: p1.name,
          person2: p2.name,
          department1: p1.department,
          department2: p2.department,
        });

        this.pairingHistory.set(pairKey, new Set([p1.name, p2.name]));
      }
    }

    // Store in Azure Table Storage
    await this.storePairings(pairs, runDate);

    return pairs;
  }

  async getPairings(runDate: string): Promise<Pair[]> {
    const pairs: Pair[] = [];
    try {
      if (this.tableClient) {
        const listEntitiesIterator = this.tableClient.listEntities<TableEntity>({
          queryOptions: { filter: `runDate eq '${runDate}'` }
        });

        for await (const entity of listEntitiesIterator) {
          pairs.push({
            person1: entity.person1 as string,
            person2: entity.person2 as string,
            department1: entity.department1 as string,
            department2: entity.department2 as string,
          });
        }
      } else {
        // Use mock storage
        const entities = this.mockStorage.get(runDate) || [];
        entities.forEach(entity => {
          pairs.push({
            person1: entity.person1 as string,
            person2: entity.person2 as string,
            department1: entity.department1 as string,
            department2: entity.department2 as string,
          });
        });
      }
    } catch (error) {
      console.error('Error retrieving pairings:', error);
    }
    return pairs;
  }

  async resetPairings(): Promise<void> {
    try {
      if (this.tableClient) {
        const listEntitiesIterator = this.tableClient.listEntities<TableEntity>();
        for await (const entity of listEntitiesIterator) {
          await this.tableClient.deleteEntity(entity.partitionKey as string, entity.rowKey as string);
        }
      }
      this.mockStorage.clear();
      this.pairingHistory.clear();
    } catch (error) {
      console.error('Error resetting pairings:', error);
      throw error;
    }
  }

  async getExhaustionPercentageAsync(): Promise<number> {
    try {
      let count = 0;
      if (this.tableClient) {
        const listEntitiesIterator = this.tableClient.listEntities<TableEntity>();
        for await (const entity of listEntitiesIterator) {
          count++;
        }
      } else {
        // Use mock storage
        for (const entities of this.mockStorage.values()) {
          count += entities.length;
        }
      }
      // Simple calculation: count / (estimated max possible pairs)
      return Math.min((count / 100) * 100, 100);
    } catch (error) {
      console.error('Error calculating exhaustion:', error);
      return 0;
    }
  }

  getExhaustionPercentage(): number {
    // Sync version for quick calculation
    const maxPossiblePairs = 100; // Estimated
    const usedPairs = this.pairingHistory.size;
    return Math.min((usedPairs / maxPossiblePairs) * 100, 100);
  }

  async exportPairingsCsv(runDate: string): Promise<string> {
    const pairs = await this.getPairings(runDate);
    let csv = 'Person 1,Department 1,Person 2,Department 2\n';
    for (const pair of pairs) {
      csv += `"${pair.person1}","${pair.department1}","${pair.person2}","${pair.department2}"\n`;
    }
    return csv;
  }

  private getPairKey(name1: string, name2: string): string {
    const names = [name1, name2].sort();
    return `${names[0]}|${names[1]}`;
  }

  private async storePairings(pairs: Pair[], runDate: string): Promise<void> {
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const entity: TableEntity = {
        partitionKey: runDate,
        rowKey: `pair-${i}`,
        person1: pair.person1,
        person2: pair.person2,
        department1: pair.department1,
        department2: pair.department2,
        runDate: runDate,
        timestamp: new Date(),
      };
      
      if (this.tableClient) {
        try {
          await this.tableClient.createEntity(entity);
        } catch (error) {
          console.error('Error storing pair:', error);
          // Fall back to mock storage
          this.storeMockEntity(entity);
        }
      } else {
        this.storeMockEntity(entity);
      }
    }
  }

  private storeMockEntity(entity: TableEntity): void {
    const key = `${entity.partitionKey}|${entity.rowKey}`;
    if (!this.mockStorage.has(entity.partitionKey as string)) {
      this.mockStorage.set(entity.partitionKey as string, []);
    }
    this.mockStorage.get(entity.partitionKey as string)!.push(entity);
  }

  private async loadPairingHistory(): Promise<void> {
    try {
      if (this.tableClient) {
        const listEntitiesIterator = this.tableClient.listEntities<TableEntity>();
        for await (const entity of listEntitiesIterator) {
          const pairKey = this.getPairKey(entity.person1 as string, entity.person2 as string);
          this.pairingHistory.set(pairKey, new Set([entity.person1 as string, entity.person2 as string]));
        }
      } else {
        // Use mock storage
        for (const entities of this.mockStorage.values()) {
          entities.forEach(entity => {
            const pairKey = this.getPairKey(entity.person1 as string, entity.person2 as string);
            this.pairingHistory.set(pairKey, new Set([entity.person1 as string, entity.person2 as string]));
          });
        }
      }
    } catch (error) {
      console.log('No existing pairings found or table does not exist yet');
    }
  }
}
