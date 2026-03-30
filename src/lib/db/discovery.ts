import { getDb } from '../db';
import type { DiscoveryRun } from './types';

export async function createDiscoveryRun(data: {
  brief_id?: number;
  query: string;
  prompt_used?: string;
  raw_response?: string;
  results_json: string;
  result_count: number;
}): Promise<DiscoveryRun> {
  const db = getDb();
  const result = await db.execute({
    sql: 'INSERT INTO discovery_runs (brief_id, query, prompt_used, raw_response, results_json, result_count) VALUES (?, ?, ?, ?, ?, ?)',
    args: [
      data.brief_id ?? null, data.query,
      data.prompt_used ?? '', data.raw_response ?? '',
      data.results_json, data.result_count,
    ],
  });
  const row = await db.execute({ sql: 'SELECT * FROM discovery_runs WHERE id = ?', args: [result.lastInsertRowid!] });
  return row.rows[0] as unknown as DiscoveryRun;
}

export async function getDiscoveryRuns(): Promise<DiscoveryRun[]> {
  const db = getDb();
  const result = await db.execute('SELECT * FROM discovery_runs ORDER BY created_at DESC');
  return result.rows as unknown as DiscoveryRun[];
}

export async function getDiscoveryRunById(id: number): Promise<DiscoveryRun | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM discovery_runs WHERE id = ?', args: [id] });
  return (result.rows[0] as unknown as DiscoveryRun) ?? null;
}

export async function updateDiscoveryRunPipelineCount(id: number, count: number): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'UPDATE discovery_runs SET orgs_added_to_pipeline = ? WHERE id = ?', args: [count, id] });
}
