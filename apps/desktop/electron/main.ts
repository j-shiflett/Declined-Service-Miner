import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { openDb } from './storage'
import { registerIpc } from './ipc'

let db: ReturnType<typeof openDb> | null = null

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
    },
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  db = openDb()
  registerIpc(db)

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  try {
    db?.close()
  } catch {
    // ignore
  }
})
