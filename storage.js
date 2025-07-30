/**
 * Sistema de Almacenamiento Profesional para JM Budget
 * Combina múltiples métodos de almacenamiento para mayor seguridad y sincronización
 */

class ProfessionalStorage {
    constructor() {
        this.storageMethods = {
            localStorage: 'localStorage',
            sessionStorage: 'sessionStorage',
            indexedDB: 'indexedDB',
            cloudSync: 'cloudSync'
        };
        
        this.currentMethod = this.storageMethods.localStorage;
        this.backupInterval = 5 * 60 * 1000; // 5 minutos
        this.syncInterval = 2 * 60 * 1000; // 2 minutos
        this.encryptionKey = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando sistema de almacenamiento profesional...');
        
        // Verificar métodos disponibles
        await this.checkStorageAvailability();
        
        // Inicializar IndexedDB
        await this.initIndexedDB();
        
        // Configurar encriptación
        await this.setupEncryption();
        
        // Iniciar sincronización automática
        this.startAutoSync();
        
        // Iniciar backup automático
        this.startAutoBackup();
        
        console.log('✅ Sistema de almacenamiento inicializado');
    }

    async checkStorageAvailability() {
        const availability = {
            localStorage: this.isLocalStorageAvailable(),
            sessionStorage: this.isSessionStorageAvailable(),
            indexedDB: this.isIndexedDBAvailable(),
            cloudSync: await this.isCloudSyncAvailable()
        };

        console.log('📊 Métodos de almacenamiento disponibles:', availability);
        return availability;
    }

    isLocalStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    isSessionStorageAvailable() {
        try {
            const test = '__storage_test__';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    isIndexedDBAvailable() {
        return 'indexedDB' in window;
    }

    async isCloudSyncAvailable() {
        // Verificar si hay conexión a internet y servicios disponibles
        try {
            const response = await fetch('https://httpbin.org/get', { 
                method: 'HEAD',
                timeout: 3000 
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    }

    async initIndexedDB() {
        if (!this.isIndexedDBAvailable()) {
            console.warn('⚠️ IndexedDB no disponible');
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open('JMBudgetDB', 1);

            request.onerror = () => {
                console.error('❌ Error al abrir IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB inicializado');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Crear object stores
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'username' });
                    userStore.createIndex('email', 'email', { unique: false });
                }

                if (!db.objectStoreNames.contains('transactions')) {
                    const transactionStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
                    transactionStore.createIndex('userId', 'userId', { unique: false });
                    transactionStore.createIndex('date', 'date', { unique: false });
                    transactionStore.createIndex('category', 'category', { unique: false });
                }

                if (!db.objectStoreNames.contains('categories')) {
                    const categoryStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
                    categoryStore.createIndex('userId', 'userId', { unique: false });
                }

                if (!db.objectStoreNames.contains('backups')) {
                    const backupStore = db.createObjectStore('backups', { keyPath: 'id', autoIncrement: true });
                    backupStore.createIndex('timestamp', 'timestamp', { unique: false });
                    backupStore.createIndex('userId', 'userId', { unique: false });
                }

                console.log('✅ Estructura de IndexedDB creada');
            };
        });
    }

    async setupEncryption() {
        // Generar o recuperar clave de encriptación
        let storedKey = localStorage.getItem('encryptionKey');
        
        if (!storedKey) {
            // Generar nueva clave usando Web Crypto API
            const key = await crypto.subtle.generateKey(
                {
                    name: 'AES-GCM',
                    length: 256
                },
                true,
                ['encrypt', 'decrypt']
            );
            
            // Exportar clave para almacenamiento
            const exportedKey = await crypto.subtle.exportKey('raw', key);
            storedKey = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
            localStorage.setItem('encryptionKey', storedKey);
        }

        this.encryptionKey = storedKey;
        console.log('🔐 Encriptación configurada');
    }

    async encrypt(data) {
        if (!this.encryptionKey) return data;

        try {
            const keyData = Uint8Array.from(atob(this.encryptionKey), c => c.charCodeAt(0));
            const key = await crypto.subtle.importKey('raw', keyData, 'AES-GCM', false, ['encrypt']);
            
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encodedData = new TextEncoder().encode(JSON.stringify(data));
            
            const encryptedData = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encodedData
            );

            return {
                data: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
                iv: btoa(String.fromCharCode(...iv))
            };
        } catch (error) {
            console.error('Error al encriptar:', error);
            return data;
        }
    }

    async decrypt(encryptedData) {
        if (!this.encryptionKey || !encryptedData.iv) return encryptedData;

        try {
            const keyData = Uint8Array.from(atob(this.encryptionKey), c => c.charCodeAt(0));
            const key = await crypto.subtle.importKey('raw', keyData, 'AES-GCM', false, ['decrypt']);
            
            const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
            const data = Uint8Array.from(atob(encryptedData.data), c => c.charCodeAt(0));
            
            const decryptedData = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                data
            );

            return JSON.parse(new TextDecoder().decode(decryptedData));
        } catch (error) {
            console.error('Error al desencriptar:', error);
            return encryptedData;
        }
    }

    // Métodos de almacenamiento principal
    async saveData(key, data, userId = null) {
        const timestamp = new Date().toISOString();
        const dataToSave = {
            data: data,
            timestamp: timestamp,
            userId: userId,
            version: '1.0'
        };

        // Encriptar datos
        const encryptedData = await this.encrypt(dataToSave);

        // Guardar en múltiples ubicaciones
        const promises = [];

        // 1. localStorage (copia de seguridad rápida)
        if (this.isLocalStorageAvailable()) {
            promises.push(this.saveToLocalStorage(key, encryptedData));
        }

        // 2. IndexedDB (almacenamiento principal)
        if (this.db) {
            promises.push(this.saveToIndexedDB(key, encryptedData, userId));
        }

        // 3. sessionStorage (sesión actual)
        if (this.isSessionStorageAvailable()) {
            promises.push(this.saveToSessionStorage(key, encryptedData));
        }

        // 4. Sincronización en la nube (si está disponible)
        if (await this.isCloudSyncAvailable()) {
            promises.push(this.saveToCloud(key, encryptedData, userId));
        }

        try {
            await Promise.allSettled(promises);
            console.log(`✅ Datos guardados exitosamente: ${key}`);
            return true;
        } catch (error) {
            console.error(`❌ Error al guardar datos: ${key}`, error);
            return false;
        }
    }

    async loadData(key, userId = null) {
        const sources = [];

        // 1. Intentar cargar desde IndexedDB (más confiable)
        if (this.db) {
            sources.push(this.loadFromIndexedDB(key, userId));
        }

        // 2. Intentar cargar desde localStorage
        if (this.isLocalStorageAvailable()) {
            sources.push(this.loadFromLocalStorage(key));
        }

        // 3. Intentar cargar desde sessionStorage
        if (this.isSessionStorageAvailable()) {
            sources.push(this.loadFromSessionStorage(key));
        }

        // 4. Intentar cargar desde la nube
        if (await this.isCloudSyncAvailable()) {
            sources.push(this.loadFromCloud(key, userId));
        }

        // Probar todas las fuentes y usar la más reciente
        const results = await Promise.allSettled(sources);
        const validResults = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value);

        if (validResults.length === 0) {
            console.log(`📭 No se encontraron datos para: ${key}`);
            return null;
        }

        // Usar el dato más reciente
        const mostRecent = validResults.reduce((latest, current) => {
            return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
        });

        console.log(`📥 Datos cargados desde: ${key}`);
        return mostRecent.data;
    }

    // Métodos específicos para cada tipo de almacenamiento
    async saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(`jmbudget_${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
            return false;
        }
    }

    async loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(`jmbudget_${key}`);
            if (!data) return null;
            
            const parsed = JSON.parse(data);
            return await this.decrypt(parsed);
        } catch (error) {
            console.error('Error al cargar desde localStorage:', error);
            return null;
        }
    }

    async saveToSessionStorage(key, data) {
        try {
            sessionStorage.setItem(`jmbudget_${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error al guardar en sessionStorage:', error);
            return false;
        }
    }

    async loadFromSessionStorage(key) {
        try {
            const data = sessionStorage.getItem(`jmbudget_${key}`);
            if (!data) return null;
            
            const parsed = JSON.parse(data);
            return await this.decrypt(parsed);
        } catch (error) {
            console.error('Error al cargar desde sessionStorage:', error);
            return null;
        }
    }

    async saveToIndexedDB(key, data, userId) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB no disponible'));
                return;
            }

            const transaction = this.db.transaction(['backups'], 'readwrite');
            const store = transaction.objectStore('backups');

            const backupData = {
                key: key,
                data: data,
                userId: userId,
                timestamp: new Date().toISOString()
            };

            const request = store.add(backupData);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async loadFromIndexedDB(key, userId) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(null);
                return;
            }

            const transaction = this.db.transaction(['backups'], 'readonly');
            const store = transaction.objectStore('backups');
            const index = store.index('timestamp');

            const request = index.openCursor(null, 'prev');

            request.onsuccess = async (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const backup = cursor.value;
                    if (backup.key === key && (!userId || backup.userId === userId)) {
                        const decrypted = await this.decrypt(backup.data);
                        resolve(decrypted);
                        return;
                    }
                    cursor.continue();
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async saveToCloud(key, data, userId) {
        // Implementación básica usando localStorage como "nube"
        // En una implementación real, aquí iría la lógica para sincronizar con un servidor
        try {
            const cloudData = {
                key: key,
                data: data,
                userId: userId,
                timestamp: new Date().toISOString(),
                device: navigator.userAgent
            };

            // Simular sincronización en la nube
            localStorage.setItem(`cloud_${key}_${userId}`, JSON.stringify(cloudData));
            return true;
        } catch (error) {
            console.error('Error al sincronizar con la nube:', error);
            return false;
        }
    }

    async loadFromCloud(key, userId) {
        try {
            const cloudData = localStorage.getItem(`cloud_${key}_${userId}`);
            if (!cloudData) return null;

            const parsed = JSON.parse(cloudData);
            return await this.decrypt(parsed.data);
        } catch (error) {
            console.error('Error al cargar desde la nube:', error);
            return null;
        }
    }

    // Sincronización automática
    startAutoSync() {
        setInterval(async () => {
            if (await this.isCloudSyncAvailable()) {
                console.log('🔄 Sincronización automática...');
                await this.syncAllData();
            }
        }, this.syncInterval);
    }

    async syncAllData() {
        // Sincronizar todos los datos entre dispositivos
        try {
            const keys = this.getAllDataKeys();
            for (const key of keys) {
                await this.syncData(key);
            }
            console.log('✅ Sincronización completada');
        } catch (error) {
            console.error('❌ Error en sincronización:', error);
        }
    }

    async syncData(key) {
        // Sincronizar datos específicos
        const localData = await this.loadFromLocalStorage(key);
        const cloudData = await this.loadFromCloud(key, currentUser);

        if (localData && cloudData) {
            // Comparar timestamps y usar el más reciente
            const localTime = new Date(localData.timestamp);
            const cloudTime = new Date(cloudData.timestamp);

            if (localTime > cloudTime) {
                await this.saveToCloud(key, localData, currentUser);
            } else if (cloudTime > localTime) {
                await this.saveToLocalStorage(key, cloudData);
            }
        }
    }

    getAllDataKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('jmbudget_')) {
                keys.push(key.replace('jmbudget_', ''));
            }
        }
        return keys;
    }

    // Backup automático
    startAutoBackup() {
        setInterval(async () => {
            console.log('💾 Creando backup automático...');
            await this.createBackup();
        }, this.backupInterval);
    }

    async createBackup() {
        try {
            const allData = {};
            const keys = this.getAllDataKeys();

            for (const key of keys) {
                const data = await this.loadData(key);
                if (data) {
                    allData[key] = data;
                }
            }

            const backup = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                data: allData,
                device: navigator.userAgent
            };

            // Guardar backup en IndexedDB
            if (this.db) {
                const transaction = this.db.transaction(['backups'], 'readwrite');
                const store = transaction.objectStore('backups');
                await store.add({
                    key: 'auto_backup',
                    data: await this.encrypt(backup),
                    userId: currentUser,
                    timestamp: new Date().toISOString()
                });
            }

            console.log('✅ Backup automático creado');
        } catch (error) {
            console.error('❌ Error al crear backup:', error);
        }
    }

    // Métodos de utilidad
    async clearAllData() {
        try {
            // Limpiar localStorage
            const keys = this.getAllDataKeys();
            keys.forEach(key => {
                localStorage.removeItem(`jmbudget_${key}`);
                sessionStorage.removeItem(`jmbudget_${key}`);
            });

            // Limpiar IndexedDB
            if (this.db) {
                const transaction = this.db.transaction(['backups'], 'readwrite');
                const store = transaction.objectStore('backups');
                await store.clear();
            }

            console.log('🗑️ Todos los datos eliminados');
            return true;
        } catch (error) {
            console.error('❌ Error al limpiar datos:', error);
            return false;
        }
    }

    async getStorageStats() {
        const stats = {
            localStorage: {
                available: this.isLocalStorageAvailable(),
                used: 0,
                total: 0
            },
            sessionStorage: {
                available: this.isSessionStorageAvailable(),
                used: 0,
                total: 0
            },
            indexedDB: {
                available: this.isIndexedDBAvailable(),
                used: 0
            },
            cloudSync: {
                available: await this.isCloudSyncAvailable()
            }
        };

        // Calcular uso de localStorage
        if (stats.localStorage.available) {
            let used = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('jmbudget_')) {
                    used += localStorage.getItem(key).length;
                }
            }
            stats.localStorage.used = used;
            stats.localStorage.total = 5 * 1024 * 1024; // 5MB aproximado
        }

        return stats;
    }

    // Métodos específicos para la aplicación
    async saveUserData(userId, userData) {
        return await this.saveData(`user_${userId}`, userData, userId);
    }

    async loadUserData(userId) {
        return await this.loadData(`user_${userId}`, userId);
    }

    async saveTransactions(userId, transactions) {
        return await this.saveData(`transactions_${userId}`, transactions, userId);
    }

    async loadTransactions(userId) {
        return await this.loadData(`transactions_${userId}`, userId);
    }

    async saveCategories(userId, categories) {
        return await this.saveData(`categories_${userId}`, categories, userId);
    }

    async loadCategories(userId) {
        return await this.loadData(`categories_${userId}`, userId);
    }
}

// Instancia global del sistema de almacenamiento
const professionalStorage = new ProfessionalStorage();

// Exportar para uso en otros archivos
window.professionalStorage = professionalStorage; 