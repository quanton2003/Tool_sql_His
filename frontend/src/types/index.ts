export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface KnowledgeItem {
  id: string;
  tableName: string;
  columnName: string;
  meaning: string;
  status: 'unknown' | 'suggested' | 'confirmed' | 'rejected';
}

export interface SqlHistoryItem {
  id: string;
  request: string;
  sql: string;
  status: string;
  createdAt: string;
}
