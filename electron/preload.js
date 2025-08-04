const { contextBridge, ipcRenderer } = require('electron');
const ElectronStorageAdapter = require('./storage-adapter');

// Crear instancia del adaptador de almacenamiento
const electronStorage = new ElectronStorageAdapter();

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
    
    // Almacenamiento específico de Electron
    storage: {
        setItem: (key, value) => electronStorage.setItem(key, value),
        getItem: (key) => electronStorage.getItem(key),
        removeItem: (key) => electronStorage.removeItem(key),
        clear: () => electronStorage.clear(),
        key: (index) => electronStorage.key(index),
        get length() { return electronStorage.length; },
        createBackup: () => electronStorage.createBackup(),
        restoreBackup: (path) => electronStorage.restoreBackup(path),
        getBackups: () => electronStorage.getBackups(),
        migrateFromWebStorage: () => electronStorage.migrateFromWebStorage()
    },
    
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