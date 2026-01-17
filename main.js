const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 580,
    height: 750,
    frame: false, // Çerçevesiz tasarım
    transparent: true, // Şeffaf arka plan desteği
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')

  // Geliştirme konsolunu açmak için (gerekirse yorumu kaldırın)
  // win.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Pencere kontrol olayları
ipcMain.on('close-app', () => {
  app.quit()
})

ipcMain.on('minimize-app', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win) win.minimize()
})
