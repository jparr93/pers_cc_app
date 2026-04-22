// mock-azure-credentials.ts
// Use this for local development without Azure credentials

import { TableEntity } from '@azure/data-tables';

export class MockTableClient {
  private entities: Map<string, Map<string, TableEntity>> = new Map();

  async createEntity(entity: TableEntity): Promise<void> {
    const partitionKey = entity.partitionKey as string;
    if (!this.entities.has(partitionKey)) {
      this.entities.set(partitionKey, new Map());
    }
    this.entities.get(partitionKey)!.set(entity.rowKey as string, entity);
  }

  async deleteEntity(partitionKey: string, rowKey: string): Promise<void> {
    if (this.entities.has(partitionKey)) {
      this.entities.get(partitionKey)!.delete(rowKey);
    }
  }

  async *listEntities(): AsyncIterableIterator<TableEntity> {
    for (const partition of this.entities.values()) {
      for (const entity of partition.values()) {
        yield entity;
      }
    }
  }

  async getEntity(partitionKey: string, rowKey: string): Promise<TableEntity> {
    const entity = this.entities.get(partitionKey)?.get(rowKey);
    if (!entity) {
      throw new Error('Entity not found');
    }
    return entity;
  }
}

// Usage in index.ts:
// const tableClient = process.env.NODE_ENV === 'development' 
//   ? new MockTableClient() as any
//   : new TableClient(...)
