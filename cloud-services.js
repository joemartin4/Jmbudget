/**
 * Servicios en la Nube para JM Budget
 * Configuración para sincronización real con servicios externos
 */

class CloudServices {
    constructor() {
        this.services = {
            firebase: {
                enabled: false,
                config: null,
                auth: null,
                db: null
            },
            supabase: {
                enabled: false,
                config: null,
                client: null
            },
            dropbox: {
                enabled: false,
                accessToken: null,
                client: null
            },
            googleDrive: {
                enabled: false,
                accessToken: null,
                client: null
            }
        };
        
        this.currentService = null;
        this.init();
    }

    async init() {
        console.log('☁️ Inicializando servicios en la nube...');
        
        // Cargar configuración desde localStorage
        this.loadConfiguration();
        
        // Intentar conectar a servicios disponibles
        await this.connectToAvailableServices();
        
        console.log('✅ Servicios en la nube inicializados');
    }

    loadConfiguration() {
        try {
            const config = localStorage.getItem('cloudServicesConfig');
            if (config) {
                const parsedConfig = JSON.parse(config);
                this.services = { ...this.services, ...parsedConfig };
            }
        } catch (error) {
            console.error('Error al cargar configuración de servicios en la nube:', error);
        }
    }

    saveConfiguration() {
        try {
            localStorage.setItem('cloudServicesConfig', JSON.stringify(this.services));
        } catch (error) {
            console.error('Error al guardar configuración de servicios en la nube:', error);
        }
    }

    async connectToAvailableServices() {
        // Firebase - Intentar inicializar automáticamente si hay configuración global
        if (typeof window.isFirebaseConfigComplete === 'function' && window.isFirebaseConfigComplete()) {
            console.log('🔧 Configuración global de Firebase detectada, inicializando automáticamente...');
            await this.initFirebase();
        } else if (this.services.firebase.enabled && this.services.firebase.config) {
            await this.initFirebase();
        }

        // Supabase
        if (this.services.supabase.enabled && this.services.supabase.config) {
            await this.initSupabase();
        }

        // Dropbox
        if (this.services.dropbox.enabled && this.services.dropbox.accessToken) {
            await this.initDropbox();
        }

        // Google Drive
        if (this.services.googleDrive.enabled && this.services.googleDrive.accessToken) {
            await this.initGoogleDrive();
        }
    }

    // Firebase Configuration
    async initFirebase() {
        try {
            // Verificar si Firebase está disponible
            if (typeof firebase === 'undefined') {
                console.warn('Firebase no está cargado');
                return;
            }

            // Usar configuración global si está disponible
            let config = this.services.firebase.config;
            if (!config && typeof window.getFirebaseConfig === 'function') {
                config = window.getFirebaseConfig();
                this.services.firebase.config = config;
            }

            // Verificar si la configuración está completa
            if (!config || !config.apiKey || config.apiKey === 'TU_API_KEY_AQUI') {
                console.warn('Configuración de Firebase no disponible o incompleta');
                return;
            }

            // Inicializar Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(config);
            }

            // Solo inicializar Firestore, no necesitamos auth para sincronización básica
            this.services.firebase.db = firebase.firestore();

            console.log('✅ Firebase inicializado con configuración global');
            this.currentService = 'firebase';
            this.services.firebase.enabled = true;
        } catch (error) {
            console.error('Error al inicializar Firebase:', error);
        }
    }

    async initSupabase() {
        try {
            // Verificar si Supabase está disponible
            if (typeof createClient === 'undefined') {
                console.warn('Supabase no está cargado');
                return;
            }

            // Inicializar Supabase
            this.services.supabase.client = createClient(
                this.services.supabase.config.url,
                this.services.supabase.config.anonKey
            );

            console.log('✅ Supabase inicializado');
            this.currentService = 'supabase';
        } catch (error) {
            console.error('Error al inicializar Supabase:', error);
        }
    }

    async initDropbox() {
        try {
            // Inicializar Dropbox API
            this.services.dropbox.client = {
                accessToken: this.services.dropbox.accessToken,
                upload: this.uploadToDropbox.bind(this),
                download: this.downloadFromDropbox.bind(this)
            };

            console.log('✅ Dropbox inicializado');
            this.currentService = 'dropbox';
        } catch (error) {
            console.error('Error al inicializar Dropbox:', error);
        }
    }

    async initGoogleDrive() {
        try {
            // Inicializar Google Drive API
            this.services.googleDrive.client = {
                accessToken: this.services.googleDrive.accessToken,
                upload: this.uploadToGoogleDrive.bind(this),
                download: this.downloadFromGoogleDrive.bind(this)
            };

            console.log('✅ Google Drive inicializado');
            this.currentService = 'googleDrive';
        } catch (error) {
            console.error('Error al inicializar Google Drive:', error);
        }
    }

    // Métodos de sincronización
    async syncToCloud(data, userId) {
        // En modo desarrollo, simular éxito sin hacer nada
        if (window.isDevelopment) {
            console.log('🏠 Modo desarrollo - Simulando sincronización exitosa');
            return true;
        }
        
        if (!this.currentService) {
            console.warn('No hay servicio en la nube configurado');
            return false;
        }

        try {
            switch (this.currentService) {
                case 'firebase':
                    return await this.syncToFirebase(data, userId);
                case 'supabase':
                    return await this.syncToSupabase(data, userId);
                case 'dropbox':
                    return await this.syncToDropbox(data, userId);
                case 'googleDrive':
                    return await this.syncToGoogleDrive(data, userId);
                default:
                    return false;
            }
        } catch (error) {
            console.error('Error al sincronizar con la nube:', error);
            return false;
        }
    }

    async syncFromCloud(userId) {
        // En modo desarrollo, simular que no hay datos
        if (window.isDevelopment) {
            console.log('🏠 Modo desarrollo - Simulando que no hay datos en la nube');
            return null;
        }
        
        if (!this.currentService) {
            console.warn('No hay servicio en la nube configurado');
            return null;
        }

        try {
            switch (this.currentService) {
                case 'firebase':
                    return await this.syncFromFirebase(userId);
                case 'supabase':
                    return await this.syncFromSupabase(userId);
                case 'dropbox':
                    return await this.syncFromDropbox(userId);
                case 'googleDrive':
                    return await this.syncFromGoogleDrive(userId);
                default:
                    return null;
            }
        } catch (error) {
            console.error('Error al sincronizar desde la nube:', error);
            return null;
        }
    }

    // Firebase Methods
    async syncToFirebase(data, userId) {
        try {
            // Verificar si Firebase está disponible
            if (!this.services.firebase.db || typeof this.services.firebase.db.collection !== 'function') {
                console.warn('Firebase Firestore no está disponible');
                return false;
            }
            
            const docRef = this.services.firebase.db.collection('users').doc(userId);
            await docRef.set({
                data: data,
                lastSync: new Date().toISOString(),
                device: navigator.userAgent
            }, { merge: true });

            console.log('✅ Datos sincronizados con Firebase');
            return true;
        } catch (error) {
            console.error('Error al sincronizar con Firebase:', error);
            return false;
        }
    }

    async syncFromFirebase(userId) {
        try {
            // Verificar si Firebase está disponible
            if (!this.services.firebase.db || typeof this.services.firebase.db.collection !== 'function') {
                console.warn('Firebase Firestore no está disponible');
                return null;
            }
            
            const docRef = this.services.firebase.db.collection('users').doc(userId);
            const doc = await docRef.get();

            if (doc.exists) {
                console.log('✅ Datos cargados desde Firebase');
                return doc.data().data;
            } else {
                console.log('No se encontraron datos en Firebase');
                return null;
            }
        } catch (error) {
            console.error('Error al cargar desde Firebase:', error);
            return null;
        }
    }

    // Supabase Methods
    async syncToSupabase(data, userId) {
        try {
            const { error } = await this.services.supabase.client
                .from('user_data')
                .upsert({
                    user_id: userId,
                    data: data,
                    last_sync: new Date().toISOString(),
                    device: navigator.userAgent
                });

            if (error) throw error;

            console.log('✅ Datos sincronizados con Supabase');
            return true;
        } catch (error) {
            console.error('Error al sincronizar con Supabase:', error);
            return false;
        }
    }

    async syncFromSupabase(userId) {
        try {
            const { data, error } = await this.services.supabase.client
                .from('user_data')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;

            if (data) {
                console.log('✅ Datos cargados desde Supabase');
                return data.data;
            } else {
                console.log('No se encontraron datos en Supabase');
                return null;
            }
        } catch (error) {
            console.error('Error al cargar desde Supabase:', error);
            return null;
        }
    }

    // Dropbox Methods
    async syncToDropbox(data, userId) {
        try {
            const filename = `jmbudget_${userId}_${Date.now()}.json`;
            const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.services.dropbox.accessToken}`,
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

            if (response.ok) {
                console.log('✅ Datos sincronizados con Dropbox');
                return true;
            } else {
                throw new Error('Error en la respuesta de Dropbox');
            }
        } catch (error) {
            console.error('Error al sincronizar con Dropbox:', error);
            return false;
        }
    }

    async syncFromDropbox(userId) {
        try {
            // Buscar el archivo más reciente del usuario
            const response = await fetch('https://api.dropboxapi.com/2/files/search_v2', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.services.dropbox.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: `jmbudget_${userId}`,
                    path: '/jmbudget',
                    max_results: 1,
                    file_status: 'active'
                })
            });

            if (!response.ok) throw new Error('Error al buscar archivos');

            const searchResult = await response.json();
            if (searchResult.matches && searchResult.matches.length > 0) {
                const file = searchResult.matches[0].metadata;
                
                // Descargar el archivo
                const downloadResponse = await fetch('https://content.dropboxapi.com/2/files/download', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.services.dropbox.accessToken}`,
                        'Dropbox-API-Arg': JSON.stringify({
                            path: file.path_display
                        })
                    }
                });

                if (downloadResponse.ok) {
                    const data = await downloadResponse.json();
                    console.log('✅ Datos cargados desde Dropbox');
                    return data;
                }
            }

            console.log('No se encontraron datos en Dropbox');
            return null;
        } catch (error) {
            console.error('Error al cargar desde Dropbox:', error);
            return null;
        }
    }

    // Google Drive Methods
    async syncToGoogleDrive(data, userId) {
        try {
            const filename = `jmbudget_${userId}_${Date.now()}.json`;
            const metadata = {
                name: filename,
                parents: ['root'] // Carpeta raíz
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.services.googleDrive.accessToken}`
                },
                body: form
            });

            if (response.ok) {
                console.log('✅ Datos sincronizados con Google Drive');
                return true;
            } else {
                throw new Error('Error en la respuesta de Google Drive');
            }
        } catch (error) {
            console.error('Error al sincronizar con Google Drive:', error);
            return false;
        }
    }

    async syncFromGoogleDrive(userId) {
        try {
            // Buscar archivos del usuario
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name contains 'jmbudget_${userId}'&orderBy=createdTime desc&pageSize=1`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.services.googleDrive.accessToken}`
                    }
                }
            );

            if (!response.ok) throw new Error('Error al buscar archivos');

            const files = await response.json();
            if (files.files && files.files.length > 0) {
                const file = files.files[0];
                
                // Descargar el archivo
                const downloadResponse = await fetch(
                    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.services.googleDrive.accessToken}`
                        }
                    }
                );

                if (downloadResponse.ok) {
                    const data = await downloadResponse.json();
                    console.log('✅ Datos cargados desde Google Drive');
                    return data;
                }
            }

            console.log('No se encontraron datos en Google Drive');
            return null;
        } catch (error) {
            console.error('Error al cargar desde Google Drive:', error);
            return null;
        }
    }

    // Configuration Methods
    configureFirebase(config) {
        // Guardar en configuración global
        if (typeof window.updateFirebaseConfig === 'function') {
            window.updateFirebaseConfig(config);
        }
        
        this.services.firebase.config = config;
        this.services.firebase.enabled = true;
        this.currentService = 'firebase';
        this.saveConfiguration();
        this.initFirebase();
    }

    configureSupabase(url, anonKey) {
        this.services.supabase.config = { url, anonKey };
        this.services.supabase.enabled = true;
        this.currentService = 'supabase';
        this.saveConfiguration();
        this.initSupabase();
    }

    configureDropbox(accessToken) {
        this.services.dropbox.accessToken = accessToken;
        this.services.dropbox.enabled = true;
        this.currentService = 'dropbox';
        this.saveConfiguration();
        this.initDropbox();
    }

    configureGoogleDrive(accessToken) {
        this.services.googleDrive.accessToken = accessToken;
        this.services.googleDrive.enabled = true;
        this.currentService = 'googleDrive';
        this.saveConfiguration();
        this.initGoogleDrive();
    }

    // Utility Methods
    getAvailableServices() {
        return Object.keys(this.services).filter(service => 
            this.services[service].enabled
        );
    }

    getCurrentService() {
        return this.currentService;
    }

    async testConnection() {
        console.log('🔍 Iniciando testConnection...');
        
        // En modo desarrollo, no ejecutar tests de Firebase
        if (window.isDevelopment) {
            console.log('🏠 Modo desarrollo detectado - Saltando test de conexión');
            return { success: true, message: 'Modo desarrollo - No se requiere conexión' };
        }
        
        console.log('Estado actual:', {
            currentService: this.currentService,
            services: this.services
        });
        
        // Verificar si hay algún servicio habilitado
        const availableServices = this.getAvailableServices();
        console.log('Servicios disponibles:', availableServices);
        
        if (availableServices.length === 0) {
            console.log('❌ No hay servicios habilitados');
            return { success: false, message: 'No hay servicio configurado' };
        }

        // Si no hay servicio actual, usar el primero disponible
        if (!this.currentService && availableServices.length > 0) {
            this.currentService = availableServices[0];
            console.log('🔄 Estableciendo servicio actual:', this.currentService);
        }

        if (!this.currentService) {
            console.log('❌ No hay servicio actual');
            return { success: false, message: 'No hay servicio configurado' };
        }

        console.log('✅ Servicio actual:', this.currentService);

        try {
            const testData = { test: true, timestamp: new Date().toISOString() };
            console.log('📤 Enviando datos de prueba:', testData);
            
            const result = await this.syncToCloud(testData, 'test_user');
            console.log('📥 Resultado de sincronización:', result);
            
            if (result) {
                return { success: true, message: `Conexión exitosa con ${this.currentService}` };
            } else {
                return { success: false, message: `Error al conectar con ${this.currentService}` };
            }
        } catch (error) {
            console.error('❌ Error en testConnection:', error);
            return { success: false, message: `Error: ${error.message}` };
        }
    }
}

// Instancia global de servicios en la nube
const cloudServices = new CloudServices();

// Exportar para uso en otros archivos
window.cloudServices = cloudServices; 