/**
 * Google Drive Simple - Sincronización directa con cuenta personal
 * No requiere API keys ni cuentas de desarrollador
 */

class GoogleDriveSimple {
    constructor() {
        this.isAuthenticated = false;
        this.userEmail = null;
        this.folderId = null;
        this.folderName = 'JM Budget';
    }

    async init() {
        try {
            console.log('🔍 Inicializando Google Drive Simple...');
            
            // Verificar si Google Drive está disponible
            if (typeof gapi === 'undefined') {
                await this.loadGoogleAPI();
            }
            
            // Inicializar Google API
            await gapi.load('auth2', async () => {
                await gapi.auth2.init({
                    client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
                });
            });
            
            console.log('✅ Google Drive Simple inicializado');
            return true;
        } catch (error) {
            console.error('❌ Error al inicializar Google Drive Simple:', error);
            return false;
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

    async authenticate() {
        try {
            console.log('🔐 Autenticando con Google Drive...');
            
            const auth2 = gapi.auth2.getAuthInstance();
            const user = await auth2.signIn();
            
            this.userEmail = user.getBasicProfile().getEmail();
            this.isAuthenticated = true;
            
            console.log('✅ Autenticado como:', this.userEmail);
            return true;
        } catch (error) {
            console.error('❌ Error de autenticación:', error);
            return false;
        }
    }

    async createOrFindFolder() {
        try {
            console.log('📁 Buscando carpeta JM Budget...');
            
            // Buscar carpeta existente
            const response = await gapi.client.drive.files.list({
                q: `name='${this.folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                spaces: 'drive'
            });
            
            if (response.result.files && response.result.files.length > 0) {
                this.folderId = response.result.files[0].id;
                console.log('✅ Carpeta encontrada:', this.folderId);
            } else {
                // Crear nueva carpeta
                const folder = await gapi.client.drive.files.create({
                    resource: {
                        name: this.folderName,
                        mimeType: 'application/vnd.google-apps.folder'
                    }
                });
                
                this.folderId = folder.result.id;
                console.log('✅ Nueva carpeta creada:', this.folderId);
            }
            
            return this.folderId;
        } catch (error) {
            console.error('❌ Error al crear/buscar carpeta:', error);
            throw error;
        }
    }

    async uploadFile(filename, data) {
        try {
            if (!this.isAuthenticated) {
                await this.authenticate();
            }
            
            if (!this.folderId) {
                await this.createOrFindFolder();
            }
            
            console.log('📤 Subiendo archivo:', filename);
            
            const file = await gapi.client.drive.files.create({
                resource: {
                    name: filename,
                    parents: [this.folderId]
                },
                media: {
                    mimeType: 'application/json',
                    body: JSON.stringify(data)
                }
            });
            
            console.log('✅ Archivo subido:', file.result.id);
            return file.result.id;
        } catch (error) {
            console.error('❌ Error al subir archivo:', error);
            throw error;
        }
    }

    async downloadFile(filename) {
        try {
            if (!this.isAuthenticated) {
                await this.authenticate();
            }
            
            if (!this.folderId) {
                await this.createOrFindFolder();
            }
            
            console.log('📥 Descargando archivo:', filename);
            
            // Buscar archivo
            const response = await gapi.client.drive.files.list({
                q: `name='${filename}' and '${this.folderId}' in parents and trashed=false`,
                spaces: 'drive'
            });
            
            if (response.result.files && response.result.files.length > 0) {
                const fileId = response.result.files[0].id;
                
                // Descargar contenido
                const downloadResponse = await gapi.client.drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                });
                
                console.log('✅ Archivo descargado');
                return JSON.parse(downloadResponse.body);
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error al descargar archivo:', error);
            return null;
        }
    }

    async listFiles() {
        try {
            if (!this.isAuthenticated) {
                await this.authenticate();
            }
            
            if (!this.folderId) {
                await this.createOrFindFolder();
            }
            
            const response = await gapi.client.drive.files.list({
                q: `'${this.folderId}' in parents and trashed=false`,
                spaces: 'drive',
                fields: 'files(id,name,createdTime,modifiedTime)'
            });
            
            return response.result.files || [];
        } catch (error) {
            console.error('❌ Error al listar archivos:', error);
            return [];
        }
    }

    async deleteFile(filename) {
        try {
            if (!this.isAuthenticated) {
                await this.authenticate();
            }
            
            const files = await this.listFiles();
            const file = files.find(f => f.name === filename);
            
            if (file) {
                await gapi.client.drive.files.delete({
                    fileId: file.id
                });
                
                console.log('✅ Archivo eliminado:', filename);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Error al eliminar archivo:', error);
            return false;
        }
    }

    getStatus() {
        return {
            isAuthenticated: this.isAuthenticated,
            userEmail: this.userEmail,
            folderId: this.folderId,
            folderName: this.folderName
        };
    }
}

// Instancia global
window.googleDriveSimple = new GoogleDriveSimple(); 