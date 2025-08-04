/**
 * Gestor de Sincronización en la Nube para JM Budget
 * Permite a los usuarios elegir entre diferentes servicios de nube:
 * - Google Drive
 * - iCloud (WebDAV)
 * - Dropbox
 * - OneDrive
 * - Firebase (actual)
 */

class CloudSyncManager {
    constructor() {
        this.supportedServices = {
            'google-drive': {
                name: 'Google Drive',
                icon: 'fab fa-google-drive',
                color: '#4285F4',
                description: 'Sincroniza con tu cuenta de Google Drive',
                enabled: false,
                config: null
            },
            'dropbox': {
                name: 'Dropbox',
                icon: 'fab fa-dropbox',
                color: '#0061FF',
                description: 'Sincroniza con tu cuenta de Dropbox',
                enabled: false,
                config: null
            },
            'onedrive': {
                name: 'OneDrive',
                icon: 'fab fa-microsoft',
                color: '#0078D4',
                description: 'Sincroniza con tu cuenta de Microsoft OneDrive',
                enabled: false,
                config: null
            },
            'icloud': {
                name: 'iCloud',
                icon: 'fab fa-apple',
                color: '#000000',
                description: 'Sincroniza con tu cuenta de iCloud (WebDAV)',
                enabled: false,
                config: null
            },
            'firebase': {
                name: 'Firebase',
                icon: 'fas fa-fire',
                color: '#FFCA28',
                description: 'Sincronización con Firebase (actual)',
                enabled: false,
                config: null
            }
        };
        
        this.currentService = null;
        this.syncInterval = null;
        this.lastSyncTime = null;
        this.syncInProgress = false;
        
        this.init();
    }

    async init() {
        console.log('☁️ Inicializando gestor de sincronización en la nube...');
        
        // Cargar configuración guardada
        this.loadConfiguration();
        
        // Inicializar servicios configurados
        await this.initializeConfiguredServices();
        
        // Configurar sincronización automática si está habilitada
        this.setupAutoSync();
        
        console.log('✅ Gestor de sincronización inicializado');
    }

    loadConfiguration() {
        try {
            const config = localStorage.getItem('cloudSyncConfig');
            if (config) {
                const parsedConfig = JSON.parse(config);
                
                // Actualizar configuración de servicios
                Object.keys(parsedConfig.services || {}).forEach(serviceKey => {
                    if (this.supportedServices[serviceKey]) {
                        this.supportedServices[serviceKey] = {
                            ...this.supportedServices[serviceKey],
                            ...parsedConfig.services[serviceKey]
                        };
                    }
                });
                
                this.currentService = parsedConfig.currentService || null;
                this.lastSyncTime = parsedConfig.lastSyncTime || null;
            }
        } catch (error) {
            console.error('Error al cargar configuración de sincronización:', error);
        }
    }

    saveConfiguration() {
        try {
            const config = {
                services: {},
                currentService: this.currentService,
                lastSyncTime: this.lastSyncTime
            };
            
            // Guardar configuración de cada servicio
            Object.keys(this.supportedServices).forEach(serviceKey => {
                config.services[serviceKey] = {
                    enabled: this.supportedServices[serviceKey].enabled,
                    config: this.supportedServices[serviceKey].config
                };
            });
            
            localStorage.setItem('cloudSyncConfig', JSON.stringify(config));
        } catch (error) {
            console.error('Error al guardar configuración de sincronización:', error);
        }
    }

    async initializeConfiguredServices() {
        for (const [serviceKey, service] of Object.entries(this.supportedServices)) {
            if (service.enabled && service.config) {
                try {
                    await this.initializeService(serviceKey);
                } catch (error) {
                    console.error(`Error al inicializar ${service.name}:`, error);
                    // Deshabilitar servicio si falla la inicialización
                    this.supportedServices[serviceKey].enabled = false;
                }
            }
        }
    }

    async initializeService(serviceKey) {
        const service = this.supportedServices[serviceKey];
        
        switch (serviceKey) {
            case 'google-drive':
                await this.initializeGoogleDrive(service.config);
                break;
            case 'dropbox':
                await this.initializeDropbox(service.config);
                break;
            case 'onedrive':
                await this.initializeOneDrive(service.config);
                break;
            case 'icloud':
                await this.initializeICloud(service.config);
                break;
            case 'firebase':
                await this.initializeFirebase(service.config);
                break;
        }
    }

    // Google Drive Implementation
    async initializeGoogleDrive(config) {
        try {
            // Verificar si Google API está disponible
            if (typeof gapi === 'undefined') {
                await this.loadGoogleAPI();
            }
            
            await gapi.load('client:auth2', async () => {
                await gapi.client.init({
                    apiKey: config.apiKey,
                    clientId: config.clientId,
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                    scope: 'https://www.googleapis.com/auth/drive.file'
                });
                
                console.log('✅ Google Drive inicializado');
            });
        } catch (error) {
            console.error('Error al inicializar Google Drive:', error);
            throw error;
        }
    }

    async loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Dropbox Implementation
    async initializeDropbox(config) {
        try {
            // Verificar token de acceso
            if (!config.accessToken) {
                throw new Error('Token de acceso requerido para Dropbox');
            }
            
            // Probar conexión
            const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Token de Dropbox inválido');
            }
            
            console.log('✅ Dropbox inicializado');
        } catch (error) {
            console.error('Error al inicializar Dropbox:', error);
            throw error;
        }
    }

    // OneDrive Implementation
    async initializeOneDrive(config) {
        try {
            // Verificar token de acceso
            if (!config.accessToken) {
                throw new Error('Token de acceso requerido para OneDrive');
            }
            
            // Probar conexión
            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Token de OneDrive inválido');
            }
            
            console.log('✅ OneDrive inicializado');
        } catch (error) {
            console.error('Error al inicializar OneDrive:', error);
            throw error;
        }
    }

    // iCloud Implementation (WebDAV)
    async initializeICloud(config) {
        try {
            // Verificar credenciales
            if (!config.username || !config.password || !config.serverUrl) {
                throw new Error('Credenciales de iCloud requeridas');
            }
            
            console.log('🔍 Probando conexión con iCloud WebDAV...');
            console.log('URL del servidor:', config.serverUrl);
            
            // Probar conexión WebDAV con mejor manejo de errores
            const response = await fetch(`${config.serverUrl}/`, {
                method: 'PROPFIND',
                headers: {
                    'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}`,
                    'Depth': '0',
                    'Content-Type': 'application/xml'
                },
                mode: 'cors'
            });
            
            console.log('Respuesta del servidor:', response.status, response.statusText);
            
            if (response.status === 401) {
                throw new Error('Credenciales de iCloud incorrectas. Verifica tu usuario y contraseña.');
            } else if (response.status === 403) {
                throw new Error('Acceso denegado. Verifica que tu cuenta de iCloud tenga permisos de WebDAV.');
            } else if (response.status === 404) {
                throw new Error('URL del servidor iCloud incorrecta. Verifica la URL del servidor WebDAV.');
            } else if (!response.ok) {
                throw new Error(`Error de conexión con iCloud: ${response.status} ${response.statusText}`);
            }
            
            console.log('✅ iCloud inicializado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error al inicializar iCloud:', error);
            
            // Proporcionar información específica sobre el error
            if (error.message.includes('CORS')) {
                throw new Error('Error de CORS: iCloud WebDAV no permite conexiones directas desde navegadores. Considera usar otro servicio como Google Drive o Dropbox.');
            } else if (error.message.includes('fetch')) {
                throw new Error('Error de red: No se puede conectar al servidor iCloud. Verifica tu conexión a internet y la URL del servidor.');
            }
            
            throw error;
        }
    }

    // Firebase Implementation
    async initializeFirebase(config) {
        try {
            // Usar la implementación existente de Firebase
            if (window.cloudServices && window.cloudServices.services.firebase) {
                window.cloudServices.configureFirebase(config);
                console.log('✅ Firebase inicializado');
            } else {
                throw new Error('Servicio de Firebase no disponible');
            }
        } catch (error) {
            console.error('Error al inicializar Firebase:', error);
            throw error;
        }
    }

    // Métodos de sincronización
    async syncToCloud(data, userId) {
        if (!this.currentService) {
            throw new Error('No hay servicio de nube configurado');
        }

        if (this.syncInProgress) {
            throw new Error('Sincronización en progreso');
        }

        this.syncInProgress = true;
        
        try {
            const service = this.supportedServices[this.currentService];
            const filename = `jmbudget_${userId}_${Date.now()}.json`;
            
            let success = false;
            
            switch (this.currentService) {
                case 'google-drive':
                    success = await this.syncToGoogleDrive(data, filename);
                    break;
                case 'dropbox':
                    success = await this.syncToDropbox(data, filename);
                    break;
                case 'onedrive':
                    success = await this.syncToOneDrive(data, filename);
                    break;
                case 'icloud':
                    success = await this.syncToICloud(data, filename);
                    break;
                case 'firebase':
                    success = await this.syncToFirebase(data, userId);
                    break;
            }
            
            if (success) {
                this.lastSyncTime = new Date().toISOString();
                this.saveConfiguration();
                console.log(`✅ Datos sincronizados con ${service.name}`);
            }
            
            return success;
        } catch (error) {
            console.error('Error al sincronizar con la nube:', error);
            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }

    async syncFromCloud(userId) {
        if (!this.currentService) {
            throw new Error('No hay servicio de nube configurado');
        }

        try {
            switch (this.currentService) {
                case 'google-drive':
                    return await this.syncFromGoogleDrive(userId);
                case 'dropbox':
                    return await this.syncFromDropbox(userId);
                case 'onedrive':
                    return await this.syncFromOneDrive(userId);
                case 'icloud':
                    return await this.syncFromICloud(userId);
                case 'firebase':
                    return await this.syncFromFirebase(userId);
                default:
                    return null;
            }
        } catch (error) {
            console.error('Error al sincronizar desde la nube:', error);
            throw error;
        }
    }

    // Implementaciones específicas de sincronización
    async syncToGoogleDrive(data, filename) {
        const service = this.supportedServices['google-drive'];
        
        try {
            // Autenticar si es necesario
            if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
                await gapi.auth2.getAuthInstance().signIn();
            }
            
            // Crear archivo
            const metadata = {
                name: filename,
                parents: ['root']
            };
            
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));
            
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${gapi.auth.getToken().access_token}`
                },
                body: form
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error al sincronizar con Google Drive:', error);
            return false;
        }
    }

    async syncToDropbox(data, filename) {
        const service = this.supportedServices['dropbox'];
        
        try {
            const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${service.config.accessToken}`,
                    'Content-Type': 'application/octet-stream',
                    'Dropbox-API-Arg': JSON.stringify({
                        path: `/jmbudget/${filename}`,
                        mode: 'overwrite',
                        autorename: false,
                        mute: false
                    })
                },
                body: JSON.stringify(data)
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error al sincronizar con Dropbox:', error);
            return false;
        }
    }

    async syncToOneDrive(data, filename) {
        const service = this.supportedServices['onedrive'];
        
        try {
            const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/jmbudget/${filename}:/content`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${service.config.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error al sincronizar con OneDrive:', error);
            return false;
        }
    }

    async syncToICloud(data, filename) {
        const service = this.supportedServices['icloud'];
        
        try {
            console.log('📤 Sincronizando datos con iCloud...');
            console.log('Archivo:', filename);
            
            const response = await fetch(`${service.config.serverUrl}/jmbudget/${filename}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Basic ${btoa(`${service.config.username}:${service.config.password}`)}`,
                    'Content-Type': 'application/json',
                    'Content-Length': JSON.stringify(data).length.toString()
                },
                body: JSON.stringify(data),
                mode: 'cors'
            });
            
            console.log('Respuesta de sincronización:', response.status, response.statusText);
            
            if (response.status === 401) {
                throw new Error('Credenciales de iCloud expiradas o incorrectas');
            } else if (response.status === 403) {
                throw new Error('Sin permisos para escribir en iCloud WebDAV');
            } else if (response.status === 404) {
                throw new Error('Carpeta jmbudget no encontrada en iCloud');
            } else if (!response.ok) {
                throw new Error(`Error al sincronizar: ${response.status} ${response.statusText}`);
            }
            
            console.log('✅ Datos sincronizados con iCloud correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error al sincronizar con iCloud:', error);
            
            if (error.message.includes('CORS')) {
                throw new Error('Error de CORS: iCloud WebDAV no permite sincronización directa desde navegadores');
            }
            
            return false;
        }
    }

    async syncToFirebase(data, userId) {
        try {
            if (window.cloudServices) {
                return await window.cloudServices.syncToCloud(data, userId);
            }
            return false;
        } catch (error) {
            console.error('Error al sincronizar con Firebase:', error);
            return false;
        }
    }

    // Métodos de descarga
    async syncFromGoogleDrive(userId) {
        try {
            // Buscar archivo más reciente
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name contains 'jmbudget_${userId}'&orderBy=createdTime desc&pageSize=1`,
                {
                    headers: {
                        'Authorization': `Bearer ${gapi.auth.getToken().access_token}`
                    }
                }
            );
            
            if (!response.ok) return null;
            
            const files = await response.json();
            if (files.files && files.files.length > 0) {
                const file = files.files[0];
                
                const downloadResponse = await fetch(
                    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
                    {
                        headers: {
                            'Authorization': `Bearer ${gapi.auth.getToken().access_token}`
                        }
                    }
                );
                
                if (downloadResponse.ok) {
                    return await downloadResponse.json();
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error al descargar desde Google Drive:', error);
            return null;
        }
    }

    async syncFromDropbox(userId) {
        const service = this.supportedServices['dropbox'];
        
        try {
            // Buscar archivo más reciente
            const searchResponse = await fetch('https://api.dropboxapi.com/2/files/search_v2', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${service.config.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: `jmbudget_${userId}`,
                    path: '/jmbudget',
                    max_results: 1,
                    file_status: 'active'
                })
            });
            
            if (!searchResponse.ok) return null;
            
            const searchResult = await searchResponse.json();
            if (searchResult.matches && searchResult.matches.length > 0) {
                const file = searchResult.matches[0].metadata;
                
                const downloadResponse = await fetch('https://content.dropboxapi.com/2/files/download', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${service.config.accessToken}`,
                        'Dropbox-API-Arg': JSON.stringify({
                            path: file.path_display
                        })
                    }
                });
                
                if (downloadResponse.ok) {
                    return await downloadResponse.json();
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error al descargar desde Dropbox:', error);
            return null;
        }
    }

    async syncFromOneDrive(userId) {
        const service = this.supportedServices['onedrive'];
        
        try {
            // Buscar archivo más reciente
            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/root:/jmbudget:/children?$filter=name contains 'jmbudget_${userId}'&$orderby=createdDateTime desc&$top=1`,
                {
                    headers: {
                        'Authorization': `Bearer ${service.config.accessToken}`
                    }
                }
            );
            
            if (!response.ok) return null;
            
            const files = await response.json();
            if (files.value && files.value.length > 0) {
                const file = files.value[0];
                
                const downloadResponse = await fetch(
                    `https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/content`,
                    {
                        headers: {
                            'Authorization': `Bearer ${service.config.accessToken}`
                        }
                    }
                );
                
                if (downloadResponse.ok) {
                    return await downloadResponse.json();
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error al descargar desde OneDrive:', error);
            return null;
        }
    }

    async syncFromICloud(userId) {
        const service = this.supportedServices['icloud'];
        
        try {
            // Listar archivos en la carpeta jmbudget
            const response = await fetch(`${service.config.serverUrl}/jmbudget/`, {
                method: 'PROPFIND',
                headers: {
                    'Authorization': `Basic ${btoa(`${service.config.username}:${service.config.password}`)}`,
                    'Depth': '1'
                }
            });
            
            if (!response.ok) return null;
            
            // Parsear respuesta XML y encontrar archivo más reciente
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // Buscar archivo más reciente del usuario
            const files = xmlDoc.querySelectorAll('d\\:response, response');
            let latestFile = null;
            let latestDate = null;
            
            files.forEach(file => {
                const name = file.querySelector('d\\:displayname, displayname')?.textContent;
                if (name && name.includes(`jmbudget_${userId}`)) {
                    const lastModified = file.querySelector('d\\:getlastmodified, getlastmodified')?.textContent;
                    if (lastModified && (!latestDate || new Date(lastModified) > new Date(latestDate))) {
                        latestDate = lastModified;
                        latestFile = name;
                    }
                }
            });
            
            if (latestFile) {
                const downloadResponse = await fetch(`${service.config.serverUrl}/jmbudget/${latestFile}`, {
                    headers: {
                        'Authorization': `Basic ${btoa(`${service.config.username}:${service.config.password}`)}`
                    }
                });
                
                if (downloadResponse.ok) {
                    return await downloadResponse.json();
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error al descargar desde iCloud:', error);
            return null;
        }
    }

    async syncFromFirebase(userId) {
        try {
            if (window.cloudServices) {
                return await window.cloudServices.syncFromCloud(userId);
            }
            return null;
        } catch (error) {
            console.error('Error al descargar desde Firebase:', error);
            return null;
        }
    }

    // Configuración de servicios
    configureService(serviceKey, config) {
        if (!this.supportedServices[serviceKey]) {
            throw new Error(`Servicio no soportado: ${serviceKey}`);
        }
        
        this.supportedServices[serviceKey].enabled = true;
        this.supportedServices[serviceKey].config = config;
        this.currentService = serviceKey;
        
        this.saveConfiguration();
        
        // Inicializar el servicio
        this.initializeService(serviceKey);
    }

    // Configuración automática de sincronización
    setupAutoSync() {
        const autoSyncEnabled = localStorage.getItem('autoSyncEnabled') === 'true';
        const syncInterval = parseInt(localStorage.getItem('syncInterval') || '300000'); // 5 minutos por defecto
        
        if (autoSyncEnabled && this.currentService) {
            this.startAutoSync(syncInterval);
        }
    }

    startAutoSync(interval = 300000) {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(async () => {
            if (!this.syncInProgress && this.currentService) {
                try {
                    // Obtener datos actuales de la aplicación
                    const currentData = this.getCurrentAppData();
                    if (currentData) {
                        await this.syncToCloud(currentData, this.getCurrentUserId());
                    }
                } catch (error) {
                    console.error('Error en sincronización automática:', error);
                }
            }
        }, interval);
        
        console.log(`🔄 Sincronización automática iniciada cada ${interval / 1000} segundos`);
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏹️ Sincronización automática detenida');
        }
    }

    // Métodos de utilidad
    getCurrentAppData() {
        try {
            // Obtener todos los datos de la aplicación desde localStorage
            const data = {};
            const keys = [
                'transactions',
                'categories',
                'budgets',
                'goals',
                'bankAccounts',
                'userSettings'
            ];
            
            keys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) {
                    data[key] = JSON.parse(value);
                }
            });
            
            return Object.keys(data).length > 0 ? data : null;
        } catch (error) {
            console.error('Error al obtener datos de la aplicación:', error);
            return null;
        }
    }

    getCurrentUserId() {
        // Obtener ID del usuario actual
        return localStorage.getItem('currentUserId') || 'default_user';
    }

    getAvailableServices() {
        return Object.entries(this.supportedServices)
            .filter(([key, service]) => service.enabled)
            .map(([key, service]) => ({
                key,
                name: service.name,
                icon: service.icon,
                color: service.color,
                description: service.description
            }));
    }

    getCurrentServiceInfo() {
        if (!this.currentService) return null;
        
        const service = this.supportedServices[this.currentService];
        return {
            key: this.currentService,
            name: service.name,
            icon: service.icon,
            color: service.color,
            lastSync: this.lastSyncTime
        };
    }

    // Métodos de prueba de conexión
    async testServiceConnection(serviceKey) {
        if (!this.supportedServices[serviceKey] || !this.supportedServices[serviceKey].enabled) {
            return { success: false, message: 'Servicio no configurado' };
        }
        
        try {
            const testData = { test: true, timestamp: new Date().toISOString() };
            const success = await this.syncToCloud(testData, 'test_user');
            
            return {
                success,
                message: success ? 'Conexión exitosa' : 'Error en la conexión'
            };
        } catch (error) {
            return {
                success: false,
                message: `Error: ${error.message}`
            };
        }
    }
}

// Instancia global del gestor de sincronización
const cloudSyncManager = new CloudSyncManager();

// Exportar para uso en otros archivos
window.cloudSyncManager = cloudSyncManager; 