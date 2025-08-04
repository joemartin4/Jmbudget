const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Información de la aplicación
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppName: () => ipcRenderer.invoke('get-app-name'),
    
    // Diálogos del sistema
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    
    // Eventos del menú
    onNewTransaction: (callback) => ipcRenderer.on('new-transaction', callback),
    onImportData: (callback) => ipcRenderer.on('import-data', callback),
    onExportData: (callback) => ipcRenderer.on('export-data', callback),
    
    // Utilidades
    isElectron: true,
    platform: process.platform
});

// Detectar si estamos en Electron
window.isElectron = true;
window.electronPlatform = process.platform;

// Log de inicialización
console.log('🚀 Electron preload inicializado');
console.log(`📱 Plataforma: ${process.platform}`);
console.log(`🔧 Versión de Node: ${process.versions.node}`);
console.log(`⚡ Versión de Electron: ${process.versions.electron}`); 