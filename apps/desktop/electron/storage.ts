import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export type Dealer = {
  id: number
  name: string
  createdAt: string
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
  const stmt = db.prepare('INSERT INTO dealers (name, created_at) VALUES (?, ?)')
  const info = stmt.run(name.trim(), now)
  return { id: Number(info.lastInsertRowid), name: name.trim(), createdAt: now }
}
