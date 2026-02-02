import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import path from 'path'

import { createDealer, getBaseDir, getDealer, getDealerDir, getOutcome, listDealers, upsertOutcome } from './storage'
import { writeRunFiles, type Opportunity } from './export'

export function registerIpc(db: Database.Database) {
  ipcMain.handle('app:getBaseDir', async () => {
    return getBaseDir()
  })

  ipcMain.handle('dealers:list', async () => {
    return listDealers(db)
  })

  ipcMain.handle('dealers:create', async (_evt, name: string) => {
    if (!name?.trim()) throw new Error('Dealer name is required')
    return createDealer(db, name)
  })

  ipcMain.handle('runs:save', async (_evt, args: { dealerId: number; rows: Opportunity[] }) => {
    const dealer = getDealer(db, args.dealerId)
    const dealerDir = getDealerDir(db, args.dealerId)
    const runId = new Date().toISOString().replace(/[:.]/g, '-')
    const runDir = path.join(dealerDir, 'runs', runId)

    writeRunFiles({ dir: runDir, rows: args.rows, dealerName: dealer.name })

    return {
      runDir,
      callbackCsv: path.join(runDir, 'callback_list.csv'),
      reportHtml: path.join(runDir, 'report.html'),
    }
  })

  ipcMain.handle('outcomes:get', async (_evt, args: { dealerId: number; roNumber: string }) => {
    return getOutcome(db, args.dealerId, args.roNumber)
  })

  ipcMain.handle(
    'outcomes:set',
    async (_evt, args: { dealerId: number; roNumber: string; status: string; notes?: string; nextFollowUp?: string }) => {
      return upsertOutcome(db, args)
    }
  )
}
