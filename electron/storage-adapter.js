const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Adaptador de Almacenamiento para Electron
 * Maneja el almacenamiento local de manera compatible con la aplicación web
 */
class ElectronStorageAdapter {
    constructor() {
        this.dataDir = path.join(os.homedir(), '.jm-budget');
        this.ensureDataDirectory();
        this.isElectron = true;
    }

    ensureDataDirectory() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    getFilePath(key) {
        return path.join(this.dataDir, `${key}.json`);
    }

    // Simular localStorage para compatibilidad
    setItem(key, value) {
        try {
            const filePath = this.getFilePath(key);
            const data = {
                value: value,
                timestamp: Date.now(),
                version: '2.0.21'
            };
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error al guardar en Electron storage:', error);
            return false;
        }
    }

    getItem(key) {
        try {
            const filePath = this.getFilePath(key);
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                return data.value;
            }
            return null;
        } catch (error) {
            console.error('Error al leer de Electron storage:', error);
            return null;
        }
    }

    removeItem(key) {
        try {
            const filePath = this.getFilePath(key);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return true;
        } catch (error) {
            console.error('Error al eliminar de Electron storage:', error);
            return false;
        }
    }

    clear() {
        try {
            const files = fs.readdirSync(this.dataDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    fs.unlinkSync(path.join(this.dataDir, file));
                }
            });
            return true;
        } catch (error) {
            console.error('Error al limpiar Electron storage:', error);
            return false;
        }
    }

    key(index) {
        try {
            const files = fs.readdirSync(this.dataDir);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            if (index >= 0 && index < jsonFiles.length) {
                return jsonFiles[index].replace('.json', '');
            }
            return null;
        } catch (error) {
            console.error('Error al obtener key de Electron storage:', error);
            return null;
        }
    }

    get length() {
        try {
            const files = fs.readdirSync(this.dataDir);
            return files.filter(file => file.endsWith('.json')).length;
        } catch (error) {
            console.error('Error al obtener length de Electron storage:', error);
            return 0;
        }
    }

    // Métodos adicionales para backup y restauración
    async createBackup() {
        try {
            const backupDir = path.join(this.dataDir, 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
            
            const allData = {};
            const files = fs.readdirSync(this.dataDir);
            
            files.forEach(file => {
                if (file.endsWith('.json') && !file.includes('backup-')) {
                    const key = file.replace('.json', '');
                    allData[key] = this.getItem(key);
                }
            });

            const backupData = {
                timestamp: Date.now(),
                version: '2.0.21',
                data: allData
            };

            fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
            console.log('✅ Backup creado en Electron:', backupPath);
            return backupPath;
        } catch (error) {
            console.error('Error al crear backup en Electron:', error);
            return null;
        }
    }

    async restoreBackup(backupPath) {
        try {
            if (!fs.existsSync(backupPath)) {
                throw new Error('Archivo de backup no encontrado');
            }

            const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
            
            // Limpiar datos actuales
            this.clear();
            
            // Restaurar datos del backup
            Object.keys(backupData.data).forEach(key => {
                this.setItem(key, backupData.data[key]);
            });

            console.log('✅ Backup restaurado en Electron desde:', backupPath);
            return true;
        } catch (error) {
            console.error('Error al restaurar backup en Electron:', error);
            return false;
        }
    }

    getBackups() {
        try {
            const backupDir = path.join(this.dataDir, 'backups');
            if (!fs.existsSync(backupDir)) {
                return [];
            }

            const files = fs.readdirSync(backupDir);
            return files
                .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
                .map(file => {
                    const filePath = path.join(backupDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        path: filePath,
                        size: stats.size,
                        date: stats.mtime
                    };
                })
                .sort((a, b) => b.date - a.date);
        } catch (error) {
            console.error('Error al obtener backups en Electron:', error);
            return [];
        }
    }

    // Método para migrar datos del navegador web
    async migrateFromWebStorage() {
        try {
            // Intentar leer datos del localStorage del navegador
            const webData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    webData[key] = localStorage.getItem(key);
                }
            }

            if (Object.keys(webData).length > 0) {
                // Guardar en Electron storage
                Object.keys(webData).forEach(key => {
                    this.setItem(key, webData[key]);
                });
                console.log('✅ Datos migrados desde navegador web');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al migrar datos del navegador:', error);
            return false;
        }
    }
}

// Exportar para uso en preload
module.exports = ElectronStorageAdapter; 