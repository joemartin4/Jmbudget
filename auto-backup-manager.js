/**
 * Auto Backup Manager - Backup automático a Google Drive
 * Guarda automáticamente cada vez que el usuario hace cambios
 */

class AutoBackupManager {
    constructor() {
        this.isEnabled = false;
        this.backupInterval = null;
        this.lastBackupTime = null;
        this.backupDelay = 30000; // 30 segundos después del último cambio
        this.maxBackups = 10; // Máximo 10 backups por día
        this.todayBackups = 0;
        this.lastBackupDate = null;
        
        // Inicializar
        this.init();
    }

    async init() {
        try {
            console.log('🔄 Inicializando Auto Backup Manager...');
            
            // Cargar configuración guardada
            this.loadSettings();
            
            // Verificar si Google Drive Web está disponible
            if (window.googleDriveWeb) {
                await window.googleDriveWeb.init();
                this.isEnabled = true;
                console.log('✅ Auto Backup Manager inicializado');
                
                // Iniciar monitoreo de cambios
                this.startMonitoring();
            } else {
                console.log('⚠️ Google Drive Web no disponible');
            }
        } catch (error) {
            console.error('❌ Error al inicializar Auto Backup Manager:', error);
        }
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('autoBackupSettings') || '{}');
            this.isEnabled = settings.isEnabled !== false; // Habilitado por defecto
            this.backupDelay = settings.backupDelay || 30000;
            this.maxBackups = settings.maxBackups || 10;
            
            // Verificar fecha de último backup
            const today = new Date().toDateString();
            if (this.lastBackupDate !== today) {
                this.todayBackups = 0;
                this.lastBackupDate = today;
            } else {
                this.todayBackups = settings.todayBackups || 0;
            }
        } catch (error) {
            console.error('❌ Error al cargar configuración:', error);
        }
    }

    saveSettings() {
        try {
            const settings = {
                isEnabled: this.isEnabled,
                backupDelay: this.backupDelay,
                maxBackups: this.maxBackups,
                todayBackups: this.todayBackups,
                lastBackupDate: this.lastBackupDate
            };
            localStorage.setItem('autoBackupSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('❌ Error al guardar configuración:', error);
        }
    }

    startMonitoring() {
        if (!this.isEnabled) return;
        
        console.log('👀 Iniciando monitoreo de cambios...');
        
        // Monitorear cambios en localStorage
        this.monitorLocalStorage();
        
        // Monitorear eventos de la aplicación
        this.monitorAppEvents();
        
        // Backup inicial si no existe
        this.scheduleInitialBackup();
    }

    monitorLocalStorage() {
        // Interceptar cambios en localStorage
        const originalSetItem = localStorage.setItem;
        const self = this;
        
        localStorage.setItem = function(key, value) {
            // Llamar al método original
            originalSetItem.call(this, key, value);
            
            // Programar backup si es un cambio relevante
            if (self.isRelevantChange(key)) {
                self.scheduleBackup();
            }
        };
    }

    monitorAppEvents() {
        // Escuchar eventos de la aplicación
        const events = [
            'transactionAdded',
            'transactionUpdated', 
            'transactionDeleted',
            'categoryAdded',
            'categoryUpdated',
            'categoryDeleted',
            'budgetAdded',
            'budgetUpdated',
            'budgetDeleted',
            'goalAdded',
            'goalUpdated',
            'goalDeleted',
            'bankAccountAdded',
            'bankAccountUpdated',
            'bankAccountDeleted'
        ];
        
        events.forEach(eventName => {
            document.addEventListener(eventName, () => {
                this.scheduleBackup();
            });
        });
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

    scheduleBackup() {
        if (!this.isEnabled) return;
        
        // Cancelar backup anterior si existe
        if (this.backupInterval) {
            clearTimeout(this.backupInterval);
        }
        
        // Programar nuevo backup
        this.backupInterval = setTimeout(() => {
            this.performBackup();
        }, this.backupDelay);
        
        console.log('⏰ Backup programado en', this.backupDelay / 1000, 'segundos');
    }

    scheduleInitialBackup() {
        // Hacer backup inicial si no se ha hecho hoy
        const today = new Date().toDateString();
        if (this.lastBackupDate !== today) {
            setTimeout(() => {
                this.performBackup();
            }, 5000); // 5 segundos después de cargar
        }
    }

    async performBackup() {
        try {
            if (!this.isEnabled || !window.googleDriveWeb) {
                return;
            }
            
            console.log('📤 Iniciando backup automático...');
            
            // Obtener datos actuales
            const data = window.googleDriveWeb.getCurrentAppData();
            const timestamp = new Date().toISOString();
            const filename = `jmbudget_auto_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
            
            // Crear backup sin mostrar instrucciones
            await window.googleDriveWeb.createBackup(data, filename, false);
            
            // Limpiar backups antiguos (mantener solo los más recientes)
            await this.cleanOldBackups();
            
            // Actualizar contadores
            this.lastBackupTime = new Date();
            this.saveSettings();
            
            console.log('✅ Backup automático completado:', filename);
            
            // Mostrar notificación sutil
            this.showBackupNotification();
            
        } catch (error) {
            console.error('❌ Error en backup automático:', error);
        }
    }

    async cleanOldBackups() {
        try {
            console.log('🧹 Limpiando backups antiguos...');
            
            // Obtener lista de backups
            const backups = await this.getBackupList();
            
            if (backups.length > this.maxBackups) {
                // Ordenar por fecha (más antiguos primero)
                backups.sort((a, b) => new Date(a.createdTime) - new Date(b.createdTime));
                
                // Eliminar los más antiguos
                const toDelete = backups.slice(0, backups.length - this.maxBackups);
                
                console.log(`🗑️ Eliminando ${toDelete.length} backups antiguos...`);
                
                for (const backup of toDelete) {
                    try {
                        await window.googleDriveWeb.deleteFile(backup.name);
                        console.log(`✅ Eliminado: ${backup.name}`);
                    } catch (error) {
                        console.error(`❌ Error al eliminar ${backup.name}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error al limpiar backups antiguos:', error);
        }
    }

    async getBackupList() {
        try {
            const files = await window.googleDriveWeb.listFiles();
            return files.filter(file => file.name.startsWith('jmbudget_auto_'));
        } catch (error) {
            console.error('❌ Error al obtener lista de backups:', error);
            return [];
        }
    }

    showBackupNotification() {
        // Solo mostrar notificación en consola para desarrollo
        if (window.isDevelopment) {
            console.log('✅ Backup automático completado (silencioso)');
        }
        // No mostrar notificación visual para no interrumpir al usuario
    }

    enable() {
        this.isEnabled = true;
        this.saveSettings();
        this.startMonitoring();
        console.log('✅ Auto backup habilitado');
    }

    disable() {
        this.isEnabled = false;
        if (this.backupInterval) {
            clearTimeout(this.backupInterval);
        }
        this.saveSettings();
        console.log('❌ Auto backup deshabilitado');
    }

    setBackupDelay(delay) {
        this.backupDelay = delay;
        this.saveSettings();
        console.log('⏰ Delay de backup actualizado:', delay / 1000, 'segundos');
    }

    setMaxBackups(max) {
        this.maxBackups = max;
        this.saveSettings();
        console.log('📊 Máximo de backups actualizado:', max);
    }

    getStatus() {
        return {
            isEnabled: this.isEnabled,
            lastBackupTime: this.lastBackupTime,
            todayBackups: this.todayBackups,
            maxBackups: this.maxBackups,
            backupDelay: this.backupDelay,
            lastBackupDate: this.lastBackupDate
        };
    }

    async forceBackup() {
        console.log('🔄 Forzando backup manual...');
        await this.performBackup();
    }
}

// Instancia global
window.autoBackupManager = new AutoBackupManager(); 