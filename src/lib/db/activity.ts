import { getDb } from '../db';

export interface ActivityItem {
  type: string;
  description: string;
  org_name: string;
  org_id: number;
  created_at: string;
}

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  const db = getDb();
  const transResult = await db.execute({
    sql: `SELECT 'stage_change' as type,
      'Moved to ' || st.to_stage as description,
      o.name as org_name,
      o.id as org_id,
      st.transitioned_at as created_at
    FROM stage_transitions st
    JOIN organizations o ON o.id = st.organization_id
    ORDER BY st.transitioned_at DESC
    LIMIT ?`,
    args: [limit],
  });

  const notesResult = await db.execute({
    sql: `SELECT 'note' as type,
      n.type || ' note added' as description,
      o.name as org_name,
      o.id as org_id,
      n.created_at
    FROM notes n
    JOIN organizations o ON o.id = n.organization_id
    ORDER BY n.created_at DESC
    LIMIT ?`,
    args: [limit],
  });

  const transitions = transResult.rows as unknown as ActivityItem[];
  const notes = notesResult.rows as unknown as ActivityItem[];

  return [...transitions, ...notes]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}
