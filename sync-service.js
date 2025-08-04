/**
 * Servicio de Sincronización en la Nube para JM Budget
 * Maneja sincronización bidireccional, conflictos y estado de conexión
 */

class SyncService {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        this.lastSyncTime = null;
        this.conflictResolution = 'server-wins'; // 'server-wins', 'client-wins', 'manual'
        this.syncQueue = [];
        this.retryAttempts = 0;
        this.maxRetryAttempts = 3;
        this.syncInterval = null;
        this.db = null;
        this.auth = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('🔄 Inicializando servicio de sincronización...');
            
            // Verificar si estamos en modo desarrollo
            if (typeof window.isDevelopment === 'undefined') {
                window.isDevelopment = window.location.hostname === 'localhost' || 
                                      window.location.hostname === '127.0.0.1';
            }
            
            if (window.isDevelopment) {
                console.log('🔧 Modo desarrollo detectado - Firebase en modo debug');
                // Habilitar logs de Firebase en desarrollo (solo si está disponible)
                if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.setLogLevel) {
                    try {
                        firebase.firestore.setLogLevel('debug');
                    } catch (e) {
                        console.log('⚠️ setLogLevel no disponible en esta versión de Firebase');
                    }
                }
            }
            
            // Esperar a que Firebase esté disponible
            let attempts = 0;
            const maxAttempts = 50;
            
            while ((typeof firebase === 'undefined' || !firebase.apps.length) && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (typeof firebase === 'undefined' || !firebase.apps.length) {
                console.warn('⚠️ Firebase no disponible, sincronización deshabilitada');
                this.updateSyncStatus('offline');
                return;
            }
            
            // Inicializar Firestore
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            
            // Verificar configuración de Firestore
            await this.checkFirestoreConfig();
            
            // Configurar listeners de conectividad
            this.setupConnectivityListeners();
            
            // Configurar listeners de autenticación
            this.setupAuthListeners();
            
            // Configurar sincronización automática
            this.setupAutoSync();
            
            console.log('✅ Servicio de sincronización inicializado');
            
        } catch (error) {
            console.error('❌ Error al inicializar servicio de sincronización:', error);
            this.updateSyncStatus('error');
        }
    }

    setupConnectivityListeners() {
        // Monitorear estado de conexión
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.onConnectionRestored();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.onConnectionLost();
        });
        
        // Verificar conectividad periódicamente
        setInterval(() => {
            this.checkConnectivity();
        }, 30000); // Cada 30 segundos
    }

    setupAuthListeners() {
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('👤 Usuario autenticado');
                
                // Verificar si estamos en modo desarrollo
                if (typeof window.isDevelopment === 'undefined') {
                    window.isDevelopment = window.location.hostname === 'localhost' || 
                                          window.location.hostname === '127.0.0.1';
                }
                
                if (window.isDevelopment) {
                    console.log('🔧 Modo desarrollo - sincronización local habilitada');
                    this.updateSyncStatus('synced');
                } else {
                    console.log('🚀 Modo producción - habilitando sincronización');
                    this.enableSync();
                }
            } else {
                console.log('👤 Usuario desconectado, deshabilitando sincronización');
                this.disableSync();
            }
        });
    }

    setupAutoSync() {
        // Verificar si estamos en modo desarrollo
        if (typeof window.isDevelopment === 'undefined') {
            window.isDevelopment = window.location.hostname === 'localhost' || 
                                  window.location.hostname === '127.0.0.1';
        }
        
        if (window.isDevelopment) {
            console.log('🔧 Modo desarrollo detectado - sincronización automática deshabilitada');
            return;
        }
        
        // Sincronización automática cada 5 minutos
        this.syncInterval = setInterval(() => {
            if (this.isOnline && this.auth.currentUser && !this.syncInProgress) {
                this.syncNow();
            }
        }, 300000); // 5 minutos
    }

    async enableSync() {
        console.log('🔄 Habilitando sincronización automática');
        this.setupAutoSync();
        
        // Verificar si estamos en modo desarrollo
        if (typeof window.isDevelopment === 'undefined') {
            window.isDevelopment = window.location.hostname === 'localhost' || 
                                  window.location.hostname === '127.0.0.1';
        }
        
        if (!window.isDevelopment) {
            // Sincronizar datos existentes solo en producción
            await this.syncNow();
        } else {
            console.log('🔧 Modo desarrollo - sincronización inicial omitida');
        }
    }

    disableSync() {
        console.log('🔄 Deshabilitando sincronización automática');
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    async syncNow() {
        if (this.syncInProgress) {
            console.log('⏳ Sincronización ya en progreso, encolando...');
            this.syncQueue.push('manual');
            return;
        }

        try {
            this.syncInProgress = true;
            this.updateSyncStatus('syncing');
            
            console.log('🔄 Iniciando sincronización...');
            
            // Sincronizar datos del cliente al servidor
            await this.syncToServer();
            
            // Sincronizar datos del servidor al cliente
            await this.syncFromServer();
            
            this.lastSyncTime = new Date();
            this.retryAttempts = 0;
            
            console.log('✅ Sincronización completada exitosamente');
            this.updateSyncStatus('synced');
            
            // Procesar cola de sincronización
            if (this.syncQueue.length > 0) {
                this.syncQueue.shift();
                setTimeout(() => this.syncNow(), 1000);
            }
            
        } catch (error) {
            console.error('❌ Error en sincronización:', error);
            this.handleSyncError(error);
        } finally {
            this.syncInProgress = false;
        }
    }

    async syncToServer() {
        // Verificar si estamos en modo desarrollo
        if (typeof window.isDevelopment === 'undefined') {
            window.isDevelopment = window.location.hostname === 'localhost' || 
                                  window.location.hostname === '127.0.0.1';
        }
        
        if (window.isDevelopment) {
            console.log('🔧 Modo desarrollo - sincronización al servidor deshabilitada');
            return;
        }

        const user = this.auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');

        const userId = user.uid;
        const userRef = this.db.collection('users').doc(userId);
        
        try {
            // Obtener datos locales
            const localData = await this.getLocalData();
            
            // Validar datos antes de sincronizar
            const validatedData = this.validateData(localData);
            
            // Obtener timestamp del servidor
            const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
            
            // Preparar datos para sincronización
            const syncData = {
                ...validatedData,
                userId: userId, // Agregar userId para las reglas de seguridad
                lastModified: serverTimestamp,
                lastSync: serverTimestamp,
                deviceId: this.getDeviceId(),
                version: this.getDataVersion()
            };
            
            // Escribir en Firestore con manejo de conflictos
            await userRef.set(syncData, { merge: true });
            
            console.log('📤 Datos sincronizados al servidor');
            
        } catch (error) {
            console.error('❌ Error al sincronizar al servidor:', error);
            
            // Si es un error de permisos, intentar crear el documento
            if (error.code === 'permission-denied') {
                console.log('🔄 Intentando crear documento de usuario...');
                try {
                    await userRef.set({
                        userId: userId,
                        email: user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastSync: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('✅ Documento de usuario creado');
                } catch (createError) {
                    console.error('❌ Error al crear documento de usuario:', createError);
                    throw createError;
                }
            } else {
                throw error;
            }
        }
    }

    async syncFromServer() {
        // Verificar si estamos en modo desarrollo
        if (typeof window.isDevelopment === 'undefined') {
            window.isDevelopment = window.location.hostname === 'localhost' || 
                                  window.location.hostname === '127.0.0.1';
        }
        
        if (window.isDevelopment) {
            console.log('🔧 Modo desarrollo - sincronización desde servidor deshabilitada');
            return;
        }

        const user = this.auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');

        const userId = user.uid;
        const userRef = this.db.collection('users').doc(userId);
        
        // Obtener datos del servidor
        const serverDoc = await userRef.get();
        
        if (!serverDoc.exists) {
            console.log('📥 No hay datos en el servidor');
            return;
        }
        
        const serverData = serverDoc.data();
        
        // Validar datos del servidor
        const validatedServerData = this.validateData(serverData);
        
        // Obtener datos locales
        const localData = await this.getLocalData();
        
        // Resolver conflictos
        const resolvedData = await this.resolveConflicts(localData, validatedServerData);
        
        // Guardar datos resueltos localmente
        await this.saveLocalData(resolvedData);
        
        console.log('📥 Datos sincronizados desde el servidor');
    }

    async resolveConflicts(localData, serverData) {
        // Estrategia de resolución de conflictos
        switch (this.conflictResolution) {
            case 'server-wins':
                return this.serverWinsStrategy(localData, serverData);
            case 'client-wins':
                return this.clientWinsStrategy(localData, serverData);
            case 'manual':
                return this.manualConflictResolution(localData, serverData);
            default:
                return this.smartMergeStrategy(localData, serverData);
        }
    }

    smartMergeStrategy(localData, serverData) {
        const merged = { ...serverData };
        
        // Para transacciones, combinar y eliminar duplicados
        if (localData.transactions && serverData.transactions) {
            const allTransactions = [...localData.transactions, ...serverData.transactions];
            merged.transactions = this.removeDuplicateTransactions(allTransactions);
        }
        
        // Para categorías, mantener las más recientes
        if (localData.categories && serverData.categories) {
            merged.categories = this.mergeCategories(localData.categories, serverData.categories);
        }
        
        // Para ingresos, mantener los más recientes
        if (localData.incomes && serverData.incomes) {
            merged.incomes = this.mergeIncomes(localData.incomes, serverData.incomes);
        }
        
        return merged;
    }

    removeDuplicateTransactions(transactions) {
        const seen = new Set();
        return transactions.filter(transaction => {
            const key = `${transaction.id}-${transaction.date}-${transaction.amount}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    mergeCategories(localCategories, serverCategories) {
        const merged = [...serverCategories];
        
        localCategories.forEach(localCat => {
            const existingIndex = merged.findIndex(cat => cat.id === localCat.id);
            if (existingIndex === -1) {
                merged.push(localCat);
            } else {
                // Mantener la más reciente
                const localTime = new Date(localCat.lastModified || 0);
                const serverTime = new Date(merged[existingIndex].lastModified || 0);
                if (localTime > serverTime) {
                    merged[existingIndex] = localCat;
                }
            }
        });
        
        return merged;
    }

    mergeIncomes(localIncomes, serverIncomes) {
        const merged = [...serverIncomes];
        
        localIncomes.forEach(localIncome => {
            const existingIndex = merged.findIndex(income => income.id === localIncome.id);
            if (existingIndex === -1) {
                merged.push(localIncome);
            } else {
                // Mantener la más reciente
                const localTime = new Date(localIncome.lastModified || 0);
                const serverTime = new Date(merged[existingIndex].lastModified || 0);
                if (localTime > serverTime) {
                    merged[existingIndex] = localIncome;
                }
            }
        });
        
        return merged;
    }

    validateData(data) {
        const validated = {};
        
        // Validar transacciones
        if (data.transactions) {
            validated.transactions = data.transactions.filter(transaction => 
                transaction.id && 
                transaction.amount && 
                transaction.date &&
                typeof transaction.amount === 'number' &&
                transaction.amount > 0
            );
        }
        
        // Validar categorías
        if (data.categories) {
            validated.categories = data.categories.filter(category => 
                category.id && 
                category.name &&
                category.name.trim().length > 0
            );
        }
        
        // Validar ingresos
        if (data.incomes) {
            validated.incomes = data.incomes.filter(income => 
                income.id && 
                income.name &&
                income.amount &&
                typeof income.amount === 'number' &&
                income.amount > 0
            );
        }
        
        return validated;
    }

    async getLocalData() {
        // Obtener datos del AuthService
        if (window.authService && window.authService.isAuthenticated()) {
            const user = window.authService.getCurrentUser();
            const userId = user.uid;
            
            const categories = await window.authService.loadEncryptedData(`categories_${userId}`) || [];
            const transactions = await window.authService.loadEncryptedData(`transactions_${userId}`) || [];
            const incomes = await window.authService.loadEncryptedData(`incomes_${userId}`) || [];
            const categoryGroups = await window.authService.loadEncryptedData(`categoryGroups_${userId}`) || {};
            const notifications = await window.authService.loadEncryptedData(`notifications_${userId}`) || [];
            
            return {
                categories,
                transactions,
                incomes,
                categoryGroups,
                notifications,
                lastModified: new Date().toISOString()
            };
        }
        
        return {};
    }

    async saveLocalData(data) {
        if (window.authService && window.authService.isAuthenticated()) {
            const user = window.authService.getCurrentUser();
            const userId = user.uid;
            
            await window.authService.saveEncryptedData(`categories_${userId}`, data.categories || []);
            await window.authService.saveEncryptedData(`transactions_${userId}`, data.transactions || []);
            await window.authService.saveEncryptedData(`incomes_${userId}`, data.incomes || []);
            await window.authService.saveEncryptedData(`categoryGroups_${userId}`, data.categoryGroups || {});
            await window.authService.saveEncryptedData(`notifications_${userId}`, data.notifications || []);
        }
    }

    updateSyncStatus(status) {
        // Actualizar UI con estado de sincronización
        const statusElement = document.getElementById('syncStatus');
        if (statusElement) {
            statusElement.textContent = this.getStatusText(status);
            statusElement.className = `sync-status ${status}`;
        }
        
        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('syncStatusChanged', { 
            detail: { status, timestamp: new Date() } 
        }));
    }

    getStatusText(status) {
        const statusTexts = {
            'syncing': '🔄 Sincronizando...',
            'synced': '✅ Sincronizado',
            'error': '❌ Error de sincronización',
            'offline': '📡 Sin conexión',
            'pending': '⏳ Pendiente'
        };
        return statusTexts[status] || '❓ Estado desconocido';
    }

    checkConnectivity() {
        const wasOnline = this.isOnline;
        this.isOnline = navigator.onLine;
        
        if (wasOnline && !this.isOnline) {
            this.onConnectionLost();
        } else if (!wasOnline && this.isOnline) {
            this.onConnectionRestored();
        }
    }

    onConnectionLost() {
        console.log('📡 Conexión perdida');
        this.updateSyncStatus('offline');
    }

    onConnectionRestored() {
        console.log('📡 Conexión restaurada');
        this.updateSyncStatus('pending');
        
        // Intentar sincronizar después de restaurar conexión
        setTimeout(() => {
            if (this.isOnline && this.auth.currentUser) {
                this.syncNow();
            }
        }, 2000);
    }

    handleSyncError(error) {
        console.error('❌ Error de sincronización:', error);
        this.retryAttempts++;
        
        if (this.retryAttempts < this.maxRetryAttempts) {
            console.log(`🔄 Reintentando sincronización (${this.retryAttempts}/${this.maxRetryAttempts})`);
            setTimeout(() => this.syncNow(), 5000 * this.retryAttempts);
        } else {
            this.updateSyncStatus('error');
            this.retryAttempts = 0;
        }
    }

    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    getDataVersion() {
        return '1.0.0';
    }

    async checkFirestoreConfig() {
        try {
            console.log('🔍 Verificando configuración de Firestore...');
            
            // Verificar si estamos en modo desarrollo
            if (typeof window.isDevelopment === 'undefined') {
                window.isDevelopment = window.location.hostname === 'localhost' || 
                                      window.location.hostname === '127.0.0.1';
            }
            
            if (window.isDevelopment) {
                console.log('🔧 Modo desarrollo - Firestore deshabilitado para evitar errores');
                this.updateSyncStatus('offline');
                return;
            }
            
            // Verificar si Firebase está configurado correctamente
            if (!this.db || !this.auth) {
                console.log('⚠️ Firebase no inicializado correctamente');
                this.updateSyncStatus('offline');
                return;
            }
            
            // Solo verificar conectividad, no hacer operaciones de escritura
            console.log('✅ Configuración de Firestore verificada (modo lectura)');
            
        } catch (error) {
            console.error('❌ Error en configuración de Firestore:', error);
            this.updateSyncStatus('offline');
        }
    }

    // Métodos públicos para uso externo
    async forceSync() {
        console.log('🔄 Forzando sincronización manual');
        await this.syncNow();
    }

    setConflictResolution(strategy) {
        this.conflictResolution = strategy;
        console.log(`🔄 Estrategia de resolución de conflictos cambiada a: ${strategy}`);
    }

    updateSyncFrequency(frequency) {
        // Limpiar intervalo anterior si existe
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // Convertir frecuencia de milisegundos a segundos para logging
        const frequencySeconds = Math.round(frequency / 1000);
        console.log(`🔄 Frecuencia de sincronización actualizada a: ${frequencySeconds} segundos`);
        
        // Configurar nuevo intervalo de sincronización
        if (frequency > 0) {
            this.syncInterval = setInterval(() => {
                if (this.isOnline && this.auth.currentUser && !this.syncInProgress) {
                    this.syncNow();
                }
            }, frequency);
        }
    }

    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            syncInProgress: this.syncInProgress,
            lastSyncTime: this.lastSyncTime,
            retryAttempts: this.retryAttempts
        };
    }
}

// Instancia global del servicio de sincronización
const syncService = new SyncService();

// Exportar para uso global
window.syncService = syncService; 