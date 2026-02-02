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
})
