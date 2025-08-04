/**
 * Cross Browser Sync - Sincronización entre navegadores
 * Usa Google Drive como fuente central de datos
 */

class CrossBrowserSync {
    constructor() {
        this.isEnabled = false;
        this.syncInterval = null;
        this.lastSyncTime = null;
        this.syncDelay = 60000; // 1 minuto
        this.lastLocalData = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🔄 Inicializando Cross Browser Sync...');
            
            // Cargar configuración
            this.loadSettings();
            
            // Verificar si Google Drive Web está disponible
            if (window.googleDriveWeb) {
                await window.googleDriveWeb.init();
                this.isEnabled = true;
                console.log('✅ Cross Browser Sync inicializado');
                
                // Iniciar sincronización
                this.startSync();
                
                // Sincronización inicial
                await this.performInitialSync();
            } else {
                console.log('⚠️ Google Drive Web no disponible para sincronización');
            }
        } catch (error) {
            console.error('❌ Error al inicializar Cross Browser Sync:', error);
        }
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('crossBrowserSyncSettings') || '{}');
            this.isEnabled = settings.isEnabled !== false; // Habilitado por defecto
            this.syncDelay = settings.syncDelay || 60000;
        } catch (error) {
            console.error('❌ Error al cargar configuración:', error);
        }
    }

    saveSettings() {
        try {
            const settings = {
                isEnabled: this.isEnabled,
                syncDelay: this.syncDelay,
                lastSyncTime: this.lastSyncTime
            };
            localStorage.setItem('crossBrowserSyncSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('❌ Error al guardar configuración:', error);
        }
    }

    startSync() {
        if (!this.isEnabled) return;
        
        console.log('🔄 Iniciando sincronización entre navegadores...');
        
        // Sincronización periódica
        this.syncInterval = setInterval(() => {
            this.performSync();
        }, this.syncDelay);
        
        // Monitorear cambios locales
        this.monitorLocalChanges();
    }

    monitorLocalChanges() {
        // Interceptar cambios en localStorage
        const originalSetItem = localStorage.setItem;
        const self = this;
        
        localStorage.setItem = function(key, value) {
            // Llamar al método original
            originalSetItem.call(this, key, value);
            
            // Programar sincronización si es un cambio relevante
            if (self.isRelevantChange(key)) {
                self.scheduleSync();
            }
        };
    }

    isRelevantChange(key) {
        const relevantKeys = [
            'transactions',
            'categories', 
            'budgets',
            'goals',
            'bankAccounts',
            'userSettings'
        ];
        
        return relevantKeys.includes(key);
    }

    scheduleSync() {
        if (!this.isEnabled) return;
        
        // Cancelar sincronización anterior si existe
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // Programar nueva sincronización
        setTimeout(() => {
            this.performSync();
            // Reiniciar intervalo
            this.startSync();
        }, 5000); // 5 segundos después del cambio
        
        console.log('⏰ Sincronización programada en 5 segundos');
    }

    async performInitialSync() {
        try {
            console.log('🔄 Sincronización inicial...');
            
            // Buscar el backup más reciente
            const latestBackup = await this.getLatestBackup();
            
            if (latestBackup) {
                console.log('📥 Encontrado backup reciente, restaurando...');
                await this.restoreFromBackup(latestBackup);
            } else {
                console.log('📤 No hay backups, creando backup inicial...');
                await this.createInitialBackup();
            }
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Error en sincronización inicial:', error);
        }
    }

    async performSync() {
        try {
            if (!this.isEnabled || !window.googleDriveWeb) {
                return;
            }
            
            console.log('🔄 Iniciando sincronización...');
            
            // Obtener datos locales actuales
            const localData = window.googleDriveWeb.getCurrentAppData();
            const localDataHash = this.getDataHash(localData);
            
            // Si los datos no han cambiado, no sincronizar
            if (this.lastLocalData === localDataHash) {
                console.log('📊 Datos locales sin cambios, omitiendo sincronización');
                return;
            }
            
            // Buscar el backup más reciente
            const latestBackup = await this.getLatestBackup();
            
            if (latestBackup) {
                // Comparar con datos locales
                const shouldUpdate = await this.shouldUpdateLocalData(latestBackup, localData);
                
                if (shouldUpdate) {
                    console.log('📥 Actualizando datos locales desde Google Drive...');
                    await this.restoreFromBackup(latestBackup);
                } else {
                    console.log('📤 Actualizando Google Drive con datos locales...');
                    await this.updateGoogleDrive(localData);
                }
            } else {
                console.log('📤 Creando primer backup en Google Drive...');
                await this.updateGoogleDrive(localData);
            }
            
            // Actualizar hash de datos locales
            this.lastLocalData = localDataHash;
            this.lastSyncTime = new Date();
            this.saveSettings();
            
            console.log('✅ Sincronización completada');
            
        } catch (error) {
            console.error('❌ Error en sincronización:', error);
        }
    }

    async getLatestBackup() {
        try {
            const files = await window.googleDriveWeb.listFiles();
            const backupFiles = files.filter(file => 
                file.name.startsWith('jmbudget_auto_') || 
                file.name.startsWith('jmbudget_backup_')
            );
            
            if (backupFiles.length === 0) {
                return null;
            }
            
            // Ordenar por fecha de modificación (más reciente primero)
            backupFiles.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));
            
            return backupFiles[0];
        } catch (error) {
            console.error('❌ Error al obtener backup más reciente:', error);
            return null;
        }
    }

    async shouldUpdateLocalData(backup, localData) {
        try {
            // Descargar datos del backup
            const backupData = await window.googleDriveWeb.downloadFile(backup.name);
            
            if (!backupData || !backupData.data) {
                return false;
            }
            
            // Comparar timestamps
            const backupTimestamp = new Date(backup.modifiedTime);
            const localTimestamp = this.getLastLocalChangeTime();
            
            return backupTimestamp > localTimestamp;
            
        } catch (error) {
            console.error('❌ Error al comparar datos:', error);
            return false;
        }
    }

    getLastLocalChangeTime() {
        // Obtener la fecha del último cambio local
        const lastChange = localStorage.getItem('lastLocalChange');
        return lastChange ? new Date(lastChange) : new Date(0);
    }

    async restoreFromBackup(backup) {
        try {
            console.log('📥 Restaurando desde backup:', backup.name);
            
            const backupData = await window.googleDriveWeb.downloadFile(backup.name);
            
            if (backupData && backupData.data) {
                // Restaurar datos
                this.restoreData(backupData.data);
                console.log('✅ Datos restaurados correctamente');
                
                // Mostrar notificación
                this.showSyncNotification('Datos sincronizados desde Google Drive');
            }
        } catch (error) {
            console.error('❌ Error al restaurar desde backup:', error);
        }
    }

    async updateGoogleDrive(localData) {
        try {
            console.log('📤 Actualizando Google Drive...');
            
            const timestamp = new Date().toISOString();
            const filename = `jmbudget_sync_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
            
            await window.googleDriveWeb.createBackup(localData, filename);
            
            console.log('✅ Google Drive actualizado');
            
            // Mostrar notificación
            this.showSyncNotification('Datos sincronizados a Google Drive');
            
        } catch (error) {
            console.error('❌ Error al actualizar Google Drive:', error);
        }
    }

    async createInitialBackup() {
        try {
            console.log('📤 Creando backup inicial...');
            
            const localData = window.googleDriveWeb.getCurrentAppData();
            const timestamp = new Date().toISOString();
            const filename = `jmbudget_initial_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
            
            await window.googleDriveWeb.createBackup(localData, filename);
            
            console.log('✅ Backup inicial creado');
            
        } catch (error) {
            console.error('❌ Error al crear backup inicial:', error);
        }
    }

    restoreData(data) {
        // Restaurar datos en localStorage
        if (data.transactions) {
            localStorage.setItem('transactions', JSON.stringify(data.transactions));
        }
        if (data.categories) {
            localStorage.setItem('categories', JSON.stringify(data.categories));
        }
        if (data.budgets) {
            localStorage.setItem('budgets', JSON.stringify(data.budgets));
        }
        if (data.goals) {
            localStorage.setItem('goals', JSON.stringify(data.goals));
        }
        if (data.bankAccounts) {
            localStorage.setItem('bankAccounts', JSON.stringify(data.bankAccounts));
        }
        if (data.userSettings) {
            localStorage.setItem('userSettings', JSON.stringify(data.userSettings));
        }
        
        // Actualizar timestamp de último cambio local
        localStorage.setItem('lastLocalChange', new Date().toISOString());
        
        // Recargar la aplicación
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    getDataHash(data) {
        // Crear hash simple de los datos
        return JSON.stringify(data).length.toString();
    }

    showSyncNotification(message) {
        // Solo mostrar notificación en consola para desarrollo
        if (window.isDevelopment) {
            console.log(`🔄 ${message} (silencioso)`);
        }
        // No mostrar notificación visual para no interrumpir al usuario
    }

    enable() {
        this.isEnabled = true;
        this.saveSettings();
        this.startSync();
        console.log('✅ Cross Browser Sync habilitado');
    }

    disable() {
        this.isEnabled = false;
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        this.saveSettings();
        console.log('❌ Cross Browser Sync deshabilitado');
    }

    setSyncDelay(delay) {
        this.syncDelay = delay;
        this.saveSettings();
        console.log('⏰ Delay de sincronización actualizado:', delay / 1000, 'segundos');
    }

    getStatus() {
        return {
            isEnabled: this.isEnabled,
            lastSyncTime: this.lastSyncTime,
            syncDelay: this.syncDelay,
            isInitialized: this.isInitialized
        };
    }

    async forceSync() {
        console.log('🔄 Forzando sincronización manual...');
        await this.performSync();
    }
}

// Instancia global
window.crossBrowserSync = new CrossBrowserSync(); 