import type Database from 'better-sqlite3'

export type MappingKind = 'ro' | 'lines' | 'combined'

export function getMapping(db: Database.Database, dealerId: number, kind: MappingKind): Record<string, string> | null {
  const row = db
    .prepare('SELECT mapping_json as mappingJson FROM mappings WHERE dealer_id = ? AND kind = ?')
    .get(dealerId, kind) as { mappingJson: string } | undefined
  if (!row) return null
  try {
    return JSON.parse(row.mappingJson)
  } catch {
    return null
  }
}

export function setMapping(db: Database.Database, args: { dealerId: number; kind: MappingKind; mapping: Record<string, string> }) {
  const now = new Date().toISOString()
  const existing = getMapping(db, args.dealerId, args.kind)
  const json = JSON.stringify(args.mapping)

  if (!existing) {
    db.prepare('INSERT INTO mappings (dealer_id, kind, mapping_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
      args.dealerId,
      args.kind,
      json,
      now,
      now
    )
  } else {
    db.prepare('UPDATE mappings SET mapping_json = ?, updated_at = ? WHERE dealer_id = ? AND kind = ?').run(
      json,
      now,
      args.dealerId,
      args.kind
    )
  }

  return getMapping(db, args.dealerId, args.kind)
}
