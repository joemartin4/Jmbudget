/**
 * Google Drive Web - Sincronización usando Google Drive Web
 * Método alternativo sin APIs complejas
 */

class GoogleDriveWeb {
    constructor() {
        this.isReady = false;
        this.folderName = 'JM Budget';
        this.backupInterval = null;
    }

    async init() {
        try {
            console.log('🔍 Inicializando Google Drive Web...');
            
            // Verificar si estamos en un entorno que soporte Google Drive
            if (typeof window.google !== 'undefined' && window.google.picker) {
                this.isReady = true;
                console.log('✅ Google Drive Web disponible');
                return true;
            }
            
            // Cargar Google Picker API
            await this.loadGooglePickerAPI();
            
            console.log('✅ Google Drive Web inicializado');
            return true;
        } catch (error) {
            console.error('❌ Error al inicializar Google Drive Web:', error);
            return false;
        }
    }

    async loadGooglePickerAPI() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                gapi.load('picker', () => {
                    this.isReady = true;
                    resolve();
                });
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async createBackup(data, filename, showInstructions = true) {
        try {
            console.log('📤 Creando backup en Google Drive...');
            
            // Crear archivo de backup
            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                data: data,
                filename: filename
            };
            
            // Convertir a Blob
            const blob = new Blob([JSON.stringify(backupData, null, 2)], {
                type: 'application/json'
            });
            
            // Crear URL temporal
            const url = URL.createObjectURL(blob);
            
            // Crear enlace de descarga
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.textContent = 'Descargar Backup';
            
            // Solo mostrar instrucciones si se solicita explícitamente
            if (showInstructions) {
                this.showBackupInstructions(filename, link);
            } else {
                // Para backups automáticos, NO hacer nada visual
                // Solo crear el archivo en memoria y liberar recursos
                URL.revokeObjectURL(url);
            }
            
            console.log('✅ Backup creado:', filename);
            return true;
        } catch (error) {
            console.error('❌ Error al crear backup:', error);
            return false;
        }
    }

    showBackupInstructions(filename, downloadLink) {
        // Crear modal con instrucciones
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 500px;
            text-align: center;
        `;
        
        content.innerHTML = `
            <h2>📁 Backup Creado Exitosamente</h2>
            <p>Tu archivo de backup <strong>${filename}</strong> está listo para descargar.</p>
            
            <div style="margin: 20px 0;">
                <h3>📋 Pasos para guardar en Google Drive:</h3>
                <ol style="text-align: left; margin: 15px 0;">
                    <li>Haz clic en "Descargar Backup" abajo</li>
                    <li>Guarda el archivo en tu computadora</li>
                    <li>Ve a <a href="https://drive.google.com" target="_blank">Google Drive</a></li>
                    <li>Crea una carpeta llamada "JM Budget"</li>
                    <li>Sube el archivo descargado a esa carpeta</li>
                </ol>
            </div>
            
            <div style="margin: 20px 0;">
                <button id="downloadBtn" style="
                    background: #4285F4;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 10px;
                ">📥 Descargar Backup</button>
                
                <button id="openDriveBtn" style="
                    background: #34A853;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 10px;
                ">☁️ Abrir Google Drive</button>
                
                <button id="closeBtn" style="
                    background: #EA4335;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 10px;
                ">❌ Cerrar</button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('downloadBtn').onclick = () => {
            downloadLink.click();
        };
        
        document.getElementById('openDriveBtn').onclick = () => {
            window.open('https://drive.google.com', '_blank');
        };
        
        document.getElementById('closeBtn').onclick = () => {
            document.body.removeChild(modal);
        };
        
        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
            }
        });
    }

    async restoreFromBackup() {
        try {
            console.log('📥 Iniciando restauración desde backup...');
            
            // Crear input de archivo
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.style.display = 'none';
            
            input.onchange = async (event) => {
                const file = event.target.files[0];
                if (file) {
                    try {
                        const text = await file.text();
                        const backupData = JSON.parse(text);
                        
                        if (backupData.data) {
                            // Restaurar datos
                            this.restoreData(backupData.data);
                            console.log('✅ Datos restaurados correctamente');
                            
                            // Mostrar confirmación
                            this.showRestoreConfirmation();
                        } else {
                            throw new Error('Formato de backup inválido');
                        }
                    } catch (error) {
                        console.error('❌ Error al restaurar backup:', error);
                        this.showError('Error al restaurar backup: ' + error.message);
                    }
                }
                
                // Limpiar input
                document.body.removeChild(input);
            };
            
            document.body.appendChild(input);
            input.click();
            
        } catch (error) {
            console.error('❌ Error al iniciar restauración:', error);
            return false;
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
        
        // Recargar la aplicación
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    showRestoreConfirmation() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 400px;
            text-align: center;
        `;
        
        content.innerHTML = `
            <h2>✅ Restauración Completada</h2>
            <p>Los datos han sido restaurados correctamente.</p>
            <p>La aplicación se recargará automáticamente.</p>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 3000);
    }

    showError(message) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 400px;
            text-align: center;
        `;
        
        content.innerHTML = `
            <h2>❌ Error</h2>
            <p>${message}</p>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                background: #EA4335;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 15px;
            ">Cerrar</button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
    }

    setupAutoBackup(interval = 24 * 60 * 60 * 1000) { // 24 horas por defecto
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
        }
        
        this.backupInterval = setInterval(() => {
            this.createAutoBackup();
        }, interval);
        
        console.log('🔄 Auto-backup configurado cada', interval / (1000 * 60 * 60), 'horas');
    }

    async createAutoBackup() {
        try {
            const data = this.getCurrentAppData();
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `jmbudget_auto_backup_${timestamp}.json`;
            
            await this.createBackup(data, filename);
        } catch (error) {
            console.error('❌ Error en auto-backup:', error);
        }
    }

    getCurrentAppData() {
        return {
            transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
            categories: JSON.parse(localStorage.getItem('categories') || '[]'),
            budgets: JSON.parse(localStorage.getItem('budgets') || '[]'),
            goals: JSON.parse(localStorage.getItem('goals') || '[]'),
            bankAccounts: JSON.parse(localStorage.getItem('bankAccounts') || '[]'),
            userSettings: JSON.parse(localStorage.getItem('userSettings') || '{}')
        };
    }

    getStatus() {
        return {
            isReady: this.isReady,
            folderName: this.folderName,
            autoBackupEnabled: !!this.backupInterval
        };
    }
}

// Instancia global
window.googleDriveWeb = new GoogleDriveWeb(); 