import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { createDealer, getBaseDir, listDealers } from './storage'

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
}
