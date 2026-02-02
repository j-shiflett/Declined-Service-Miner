import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('dsm', {
  // placeholder for future IPC
})
