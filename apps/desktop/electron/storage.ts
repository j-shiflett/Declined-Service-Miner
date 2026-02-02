import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export type Dealer = {
  id: number
  name: string
  createdAt: string
}

export function sanitizeName(s: string) {
  return s
    .trim()
    .replace(/[\\/<>:"|?*]/g, '-')
    .replace(/\s+/g, ' ')
}

export function getBaseDir() {
  const docs = app.getPath('documents')
  const base = path.join(docs, 'Declined Service Miner')
  fs.mkdirSync(base, { recursive: true })
  fs.mkdirSync(path.join(base, 'runs'), { recursive: true })
  fs.mkdirSync(path.join(base, 'logs'), { recursive: true })
  return base
}

export function openDb() {
  const dbPath = path.join(getBaseDir(), 'db.sqlite')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS dealers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS outcomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dealer_id INTEGER NOT NULL,
      ro_number TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      next_follow_up TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(dealer_id) REFERENCES dealers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_outcomes_dealer_ro ON outcomes(dealer_id, ro_number);
  `)

  return db
}

export function listDealers(db: Database.Database): Dealer[] {
  return db
    .prepare('SELECT id, name, created_at as createdAt FROM dealers ORDER BY name')
    .all() as Dealer[]
}

export function createDealer(db: Database.Database, name: string): Dealer {
  const now = new Date().toISOString()
  const nm = sanitizeName(name)
  const stmt = db.prepare('INSERT INTO dealers (name, created_at) VALUES (?, ?)')
  const info = stmt.run(nm, now)
  return { id: Number(info.lastInsertRowid), name: nm, createdAt: now }
}

export function getDealer(db: Database.Database, dealerId: number): Dealer {
  const row = db
    .prepare('SELECT id, name, created_at as createdAt FROM dealers WHERE id = ?')
    .get(dealerId) as Dealer | undefined
  if (!row) throw new Error('Dealer not found')
  return row
}

export function getDealerDir(db: Database.Database, dealerId: number): string {
  const dealer = getDealer(db, dealerId)
  const base = getBaseDir()
  const dir = path.join(base, 'dealers', `${dealer.id} - ${sanitizeName(dealer.name)}`)
  fs.mkdirSync(dir, { recursive: true })
  fs.mkdirSync(path.join(dir, 'runs'), { recursive: true })
  return dir
}

export type Outcome = {
  dealerId: number
  roNumber: string
  status: string
  notes?: string | null
  nextFollowUp?: string | null
  createdAt: string
  updatedAt: string
}

export function getOutcome(db: Database.Database, dealerId: number, roNumber: string): Outcome | null {
  const row = db
    .prepare(
      'SELECT dealer_id as dealerId, ro_number as roNumber, status, notes, next_follow_up as nextFollowUp, created_at as createdAt, updated_at as updatedAt FROM outcomes WHERE dealer_id = ? AND ro_number = ?'
    )
    .get(dealerId, roNumber) as Outcome | undefined
  return row ?? null
}

export function upsertOutcome(db: Database.Database, o: { dealerId: number; roNumber: string; status: string; notes?: string; nextFollowUp?: string }) {
  const now = new Date().toISOString()
  const existing = getOutcome(db, o.dealerId, o.roNumber)
  if (!existing) {
    db.prepare(
      'INSERT INTO outcomes (dealer_id, ro_number, status, notes, next_follow_up, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(o.dealerId, o.roNumber, o.status, o.notes ?? null, o.nextFollowUp ?? null, now, now)
  } else {
    db.prepare('UPDATE outcomes SET status = ?, notes = ?, next_follow_up = ?, updated_at = ? WHERE dealer_id = ? AND ro_number = ?').run(
      o.status,
      o.notes ?? null,
      o.nextFollowUp ?? null,
      now,
      o.dealerId,
      o.roNumber
    )
  }
  return getOutcome(db, o.dealerId, o.roNumber)
}
