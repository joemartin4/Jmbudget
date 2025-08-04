const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Mantener una referencia global del objeto de ventana
let mainWindow;

// Configuración de la aplicación
const isDev = process.argv.includes('--dev');
const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';

function createWindow() {
    // Crear la ventana del navegador
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, '../assets/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false, // No mostrar hasta que esté listo
        titleBarStyle: isMac ? 'hiddenInset' : 'default',
        title: 'JM Budget - Gestión de Presupuesto Familiar'
    });

    // Cargar la aplicación
    if (isDev) {
        // En desarrollo, cargar desde servidor local
        mainWindow.loadURL('http://localhost:8000');
        mainWindow.webContents.openDevTools();
    } else {
        // En producción, cargar archivo local
        mainWindow.loadFile('index.html');
    }

    // Mostrar ventana cuando esté lista
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Verificar actualizaciones automáticamente
        if (!isDev) {
            checkForUpdates();
        }
    });

    // Manejar enlaces externos
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Manejar cierre de ventana
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Crear menú de la aplicación
    createMenu();
}

// Crear menú de la aplicación
function createMenu() {
    const template = [
        ...(isMac ? [{
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : []),
        {
            label: 'Archivo',
            submenu: [
                {
                    label: 'Nueva Transacción',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('new-transaction');
                    }
                },
                {
                    label: 'Importar Datos',
                    accelerator: 'CmdOrCtrl+I',
                    click: () => {
                        mainWindow.webContents.send('import-data');
                    }
                },
                {
                    label: 'Exportar Datos',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        mainWindow.webContents.send('export-data');
                    }
                },
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        {
            label: 'Editar',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectall' }
            ]
        },
        {
            label: 'Ver',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Ventana',
            submenu: [
                { role: 'minimize' },
                { role: 'close' }
            ]
        },
        {
            label: 'Ayuda',
            submenu: [
                {
                    label: 'Acerca de JM Budget',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Acerca de JM Budget',
                            message: 'JM Budget - Gestión de Presupuesto Familiar',
                            detail: `Versión: ${app.getVersion()}\n\nUna aplicación completa para gestionar tu presupuesto familiar con categorías, transacciones, reportes y sincronización en la nube.\n\nDesarrollado por Joel Martin`
                        });
                    }
                },
                {
                    label: 'Documentación',
                    click: () => {
                        shell.openExternal('https://github.com/joemartin4/Jmbudget');
                    }
                },
                {
                    label: 'Reportar Problema',
                    click: () => {
                        shell.openExternal('https://github.com/joemartin4/Jmbudget/issues');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Verificar actualizaciones
function checkForUpdates() {
    // Aquí puedes implementar la lógica de actualizaciones automáticas
    console.log('Verificando actualizaciones...');
}

// Eventos de la aplicación
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Manejar eventos IPC
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('get-app-name', () => {
    return app.getName();
});

ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});

// Prevenir múltiples instancias en Windows
if (isWin) {
    const gotTheLock = app.requestSingleInstanceLock();
    
    if (!gotTheLock) {
        app.quit();
    } else {
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();
            }
        });
    }
} 