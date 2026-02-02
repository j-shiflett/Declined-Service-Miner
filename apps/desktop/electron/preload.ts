import { contextBridge, ipcRenderer } from 'electron'

export type Dealer = {
  id: number
  name: string
  createdAt: string
}

contextBridge.exposeInMainWorld('dsm', {
  getBaseDir: () => ipcRenderer.invoke('app:getBaseDir') as Promise<string>,
  listDealers: () => ipcRenderer.invoke('dealers:list') as Promise<Dealer[]>,
  createDealer: (name: string) => ipcRenderer.invoke('dealers:create', name) as Promise<Dealer>,

  saveRun: (dealerId: number, rows: any[]) => ipcRenderer.invoke('runs:save', { dealerId, rows }) as Promise<any>,

  getOutcome: (dealerId: number, roNumber: string) =>
    ipcRenderer.invoke('outcomes:get', { dealerId, roNumber }) as Promise<any>,
  setOutcome: (dealerId: number, roNumber: string, status: string, notes?: string, nextFollowUp?: string) =>
    ipcRenderer.invoke('outcomes:set', { dealerId, roNumber, status, notes, nextFollowUp }) as Promise<any>,

  getMapping: (dealerId: number, kind: 'ro' | 'lines' | 'combined') =>
    ipcRenderer.invoke('mappings:get', { dealerId, kind }) as Promise<Record<string, string> | null>,
  setMapping: (dealerId: number, kind: 'ro' | 'lines' | 'combined', mapping: Record<string, string>) =>
    ipcRenderer.invoke('mappings:set', { dealerId, kind, mapping }) as Promise<Record<string, string> | null>,
})
