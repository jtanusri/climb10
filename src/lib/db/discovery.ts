import { getDb } from '../db';
import type { DiscoveryRun } from './types';

export function createDiscoveryRun(data: {
  brief_id?: number;
  query: string;
  prompt_used?: string;
  raw_response?: string;
  results_json: string;
  result_count: number;
}): DiscoveryRun {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO discovery_runs (brief_id, query, prompt_used, raw_response, results_json, result_count) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    data.brief_id ?? null,
    data.query,
    data.prompt_used ?? '',
    data.raw_response ?? '',
    data.results_json,
    data.result_count,
  );
  return db.prepare('SELECT * FROM discovery_runs WHERE id = ?').get(result.lastInsertRowid) as DiscoveryRun;
}

export function getDiscoveryRuns(): DiscoveryRun[] {
  const db = getDb();
  return db.prepare('SELECT * FROM discovery_runs ORDER BY created_at DESC').all() as DiscoveryRun[];
}

export function getDiscoveryRunById(id: number): DiscoveryRun | null {
  const db = getDb();
  return db.prepare('SELECT * FROM discovery_runs WHERE id = ?').get(id) as DiscoveryRun | undefined ?? null;
}

export function updateDiscoveryRunPipelineCount(id: number, count: number): void {
  const db = getDb();
  db.prepare('UPDATE discovery_runs SET orgs_added_to_pipeline = ? WHERE id = ?').run(count, id);
}
