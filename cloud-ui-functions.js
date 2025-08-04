/**
 * Funciones de interfaz para servicios de nube
 * Maneja la UI y interacciones del modal de sincronización en la nube
 */

// Función para abrir el modal de sincronización en la nube
function openCloudSyncModal() {
    openModal('cloudSyncModal');
    loadCloudServices();
    updateCloudSyncStatus();
}

// Función para cargar los servicios de nube disponibles
function loadCloudServices() {
    const grid = document.getElementById('cloudServicesGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Obtener servicios disponibles del gestor
    const services = window.cloudSyncManager?.supportedServices || {};
    
    Object.entries(services).forEach(([serviceKey, service]) => {
        const card = createCloudServiceCard(serviceKey, service);
        grid.appendChild(card);
    });
}

// Función para crear una tarjeta de servicio de nube
function createCloudServiceCard(serviceKey, service) {
    const card = document.createElement('div');
    card.className = `cloud-service-card ${service.enabled ? 'enabled' : ''}`;
    card.dataset.service = serviceKey;
    
    const status = service.enabled ? 'configured' : 'not-configured';
    const statusText = service.enabled ? 'Configurado' : 'No configurado';
    
    card.innerHTML = `
        <div class="cloud-service-header">
            <div class="cloud-service-icon" style="background-color: ${service.color}">
                <i class="${service.icon}"></i>
            </div>
            <div class="cloud-service-info">
                <h4>${service.name}</h4>
                <p>${service.description}</p>
            </div>
        </div>
        <div class="cloud-service-status ${status}">${statusText}</div>
        <div class="cloud-service-actions">
            ${service.enabled ? 
                `<button class="btn-test" onclick="testCloudService('${serviceKey}')">Probar</button>
                 <button class="btn-disconnect" onclick="disconnectCloudService('${serviceKey}')">Desconectar</button>` :
                `<button class="btn-configure" onclick="configureCloudService('${serviceKey}')">Configurar</button>`
            }
        </div>
    `;
    
    return card;
}

// Función para configurar un servicio de nube
function configureCloudService(serviceKey) {
    const service = window.cloudSyncManager?.supportedServices[serviceKey];
    if (!service) return;
    
    // Mostrar formulario de configuración
    const configContainer = document.getElementById('serviceConfig');
    const configForm = document.getElementById('serviceConfigForm');
    const configTitle = document.getElementById('configServiceName');
    
    if (!configContainer || !configForm || !configTitle) return;
    
    configTitle.textContent = `Configurar ${service.name}`;
    
    // Generar formulario según el servicio
    configForm.innerHTML = generateServiceConfigForm(serviceKey, service);
    
    configContainer.style.display = 'block';
}

// Función para generar el formulario de configuración según el servicio
function generateServiceConfigForm(serviceKey, service) {
    switch (serviceKey) {
        case 'google-drive':
            return `
                <div class="service-config-form">
                    <div class="form-group">
                        <label for="googleClientId">Client ID:</label>
                        <input type="text" id="googleClientId" placeholder="Tu Google Client ID" required>
                    </div>
                    <div class="form-group">
                        <label for="googleApiKey">API Key:</label>
                        <input type="text" id="googleApiKey" placeholder="Tu Google API Key" required>
                    </div>
                    <div class="form-info">
                        <p><strong>Para obtener las credenciales:</strong></p>
                        <ol>
                            <li>Ve a <a href="https://console.developers.google.com" target="_blank">Google Cloud Console</a></li>
                            <li>Crea un nuevo proyecto o selecciona uno existente</li>
                            <li>Habilita la API de Google Drive</li>
                            <li>Crea credenciales OAuth 2.0</li>
                            <li>Copia el Client ID y API Key</li>
                        </ol>
                    </div>
                    <div class="service-config-actions">
                        <button class="btn-save" onclick="saveServiceConfig('${serviceKey}')">Guardar</button>
                        <button class="btn-cancel" onclick="cancelServiceConfig()">Cancelar</button>
                    </div>
                </div>
            `;
            
        case 'dropbox':
            return `
                <div class="service-config-form">
                    <div class="form-group">
                        <label for="dropboxAccessToken">Access Token:</label>
                        <input type="text" id="dropboxAccessToken" placeholder="Tu Dropbox Access Token" required>
                    </div>
                    <div class="form-info">
                        <p><strong>Para obtener el Access Token:</strong></p>
                        <ol>
                            <li>Ve a <a href="https://www.dropbox.com/developers" target="_blank">Dropbox Developers</a></li>
                            <li>Crea una nueva app</li>
                            <li>Configura los permisos necesarios</li>
                            <li>Genera un Access Token</li>
                        </ol>
                    </div>
                    <div class="service-config-actions">
                        <button class="btn-save" onclick="saveServiceConfig('${serviceKey}')">Guardar</button>
                        <button class="btn-cancel" onclick="cancelServiceConfig()">Cancelar</button>
                    </div>
                </div>
            `;
            
        case 'onedrive':
            return `
                <div class="service-config-form">
                    <div class="form-group">
                        <label for="onedriveAccessToken">Access Token:</label>
                        <input type="text" id="onedriveAccessToken" placeholder="Tu OneDrive Access Token" required>
                    </div>
                    <div class="form-info">
                        <p><strong>Para obtener el Access Token:</strong></p>
                        <ol>
                            <li>Ve a <a href="https://portal.azure.com" target="_blank">Azure Portal</a></li>
                            <li>Registra una nueva aplicación</li>
                            <li>Configura los permisos de Microsoft Graph</li>
                            <li>Genera un Access Token</li>
                        </ol>
                    </div>
                    <div class="service-config-actions">
                        <button class="btn-save" onclick="saveServiceConfig('${serviceKey}')">Guardar</button>
                        <button class="btn-cancel" onclick="cancelServiceConfig()">Cancelar</button>
                    </div>
                </div>
            `;
            
        case 'icloud':
            return `
                <div class="service-config-form">
                    <div class="form-group">
                        <label for="icloudUsername">Apple ID:</label>
                        <input type="email" id="icloudUsername" placeholder="tu@appleid.com" required>
                    </div>
                    <div class="form-group">
                        <label for="icloudPassword">Contraseña:</label>
                        <input type="password" id="icloudPassword" placeholder="Tu contraseña de iCloud" required>
                    </div>
                    <div class="form-group">
                        <label for="icloudServerUrl">URL del servidor WebDAV:</label>
                        <select id="icloudServerUrl">
                            <option value="https://www.icloud.com">iCloud.com (Recomendado)</option>
                            <option value="https://p01-webdav.icloud.com">Servidor alternativo 1</option>
                            <option value="https://p02-webdav.icloud.com">Servidor alternativo 2</option>
                        </select>
                    </div>
                    <div class="form-info">
                        <p><strong>Nota:</strong> Necesitas habilitar el acceso WebDAV en tu cuenta de iCloud.</p>
                    </div>
                    <div class="service-config-actions">
                        <button class="btn-save" onclick="saveServiceConfig('${serviceKey}')">Guardar</button>
                        <button class="btn-cancel" onclick="cancelServiceConfig()">Cancelar</button>
                    </div>
                </div>
            `;
            
        case 'firebase':
            return `
                <div class="service-config-form">
                    <div class="form-group">
                        <label for="firebaseApiKey">API Key:</label>
                        <input type="text" id="firebaseApiKey" placeholder="Tu Firebase API Key" required>
                    </div>
                    <div class="form-group">
                        <label for="firebaseProjectId">Project ID:</label>
                        <input type="text" id="firebaseProjectId" placeholder="Tu Firebase Project ID" required>
                    </div>
                    <div class="form-group">
                        <label for="firebaseAuthDomain">Auth Domain:</label>
                        <input type="text" id="firebaseAuthDomain" placeholder="tu-proyecto.firebaseapp.com" required>
                    </div>
                    <div class="form-group">
                        <label for="firebaseStorageBucket">Storage Bucket:</label>
                        <input type="text" id="firebaseStorageBucket" placeholder="tu-proyecto.appspot.com" required>
                    </div>
                    <div class="form-group">
                        <label for="firebaseMessagingSenderId">Messaging Sender ID:</label>
                        <input type="text" id="firebaseMessagingSenderId" placeholder="123456789" required>
                    </div>
                    <div class="form-group">
                        <label for="firebaseAppId">App ID:</label>
                        <input type="text" id="firebaseAppId" placeholder="1:123456789:web:abcdef" required>
                    </div>
                    <div class="form-info">
                        <p><strong>Para obtener las credenciales:</strong></p>
                        <ol>
                            <li>Ve a <a href="https://console.firebase.google.com" target="_blank">Firebase Console</a></li>
                            <li>Crea un nuevo proyecto o selecciona uno existente</li>
                            <li>Agrega una aplicación web</li>
                            <li>Copia la configuración</li>
                        </ol>
                    </div>
                    <div class="service-config-actions">
                        <button class="btn-save" onclick="saveServiceConfig('${serviceKey}')">Guardar</button>
                        <button class="btn-cancel" onclick="cancelServiceConfig()">Cancelar</button>
                    </div>
                </div>
            `;
            
        default:
            return '<p>Configuración no disponible para este servicio.</p>';
    }
}

// Función para guardar la configuración de un servicio
async function saveServiceConfig(serviceKey) {
    try {
        const config = getServiceConfigFromForm(serviceKey);
        if (!config) {
            showNotification('Por favor completa todos los campos requeridos', 'error');
            return;
        }
        
        // Configurar el servicio en el gestor
        window.cloudSyncManager?.configureService(serviceKey, config);
        
        // Recargar la interfaz
        loadCloudServices();
        updateCloudSyncStatus();
        
        // Ocultar formulario de configuración
        document.getElementById('serviceConfig').style.display = 'none';
        
        showNotification(`${window.cloudSyncManager?.supportedServices[serviceKey]?.name} configurado exitosamente`, 'success');
        
    } catch (error) {
        console.error('Error al configurar servicio:', error);
        showNotification('Error al configurar el servicio: ' + error.message, 'error');
    }
}

// Función para obtener la configuración del formulario
function getServiceConfigFromForm(serviceKey) {
    switch (serviceKey) {
        case 'google-drive':
            const clientId = document.getElementById('googleClientId')?.value;
            const apiKey = document.getElementById('googleApiKey')?.value;
            if (!clientId || !apiKey) return null;
            return { clientId, apiKey };
            
        case 'dropbox':
            const accessToken = document.getElementById('dropboxAccessToken')?.value;
            if (!accessToken) return null;
            return { accessToken };
            
        case 'onedrive':
            const onedriveToken = document.getElementById('onedriveAccessToken')?.value;
            if (!onedriveToken) return null;
            return { accessToken: onedriveToken };
            
        case 'icloud':
            const username = document.getElementById('icloudUsername')?.value;
            const password = document.getElementById('icloudPassword')?.value;
            const serverUrl = document.getElementById('icloudServerUrl')?.value;
            if (!username || !password || !serverUrl) return null;
            return { username, password, serverUrl };
            
        case 'firebase':
            const firebaseConfig = {
                apiKey: document.getElementById('firebaseApiKey')?.value,
                projectId: document.getElementById('firebaseProjectId')?.value,
                authDomain: document.getElementById('firebaseAuthDomain')?.value,
                storageBucket: document.getElementById('firebaseStorageBucket')?.value,
                messagingSenderId: document.getElementById('firebaseMessagingSenderId')?.value,
                appId: document.getElementById('firebaseAppId')?.value
            };
            
            // Verificar que todos los campos estén completos
            if (Object.values(firebaseConfig).some(value => !value)) return null;
            return firebaseConfig;
            
        default:
            return null;
    }
}

// Función para cancelar la configuración
function cancelServiceConfig() {
    document.getElementById('serviceConfig').style.display = 'none';
}

// Función para probar un servicio de nube
async function testCloudService(serviceKey) {
    try {
        showNotification('Probando conexión...', 'info');
        
        const result = await window.cloudSyncManager?.testServiceConnection(serviceKey);
        
        if (result?.success) {
            showNotification(`Conexión exitosa con ${window.cloudSyncManager?.supportedServices[serviceKey]?.name}`, 'success');
        } else {
            showNotification(`Error de conexión: ${result?.message}`, 'error');
        }
        
    } catch (error) {
        console.error('Error al probar servicio:', error);
        showNotification('Error al probar el servicio: ' + error.message, 'error');
    }
}

// Función para desconectar un servicio de nube
function disconnectCloudService(serviceKey) {
    if (confirm(`¿Estás seguro de que quieres desconectar ${window.cloudSyncManager?.supportedServices[serviceKey]?.name}?`)) {
        try {
            // Deshabilitar el servicio
            if (window.cloudSyncManager?.supportedServices[serviceKey]) {
                window.cloudSyncManager.supportedServices[serviceKey].enabled = false;
                window.cloudSyncManager.supportedServices[serviceKey].config = null;
                
                // Si era el servicio actual, limpiarlo
                if (window.cloudSyncManager.currentService === serviceKey) {
                    window.cloudSyncManager.currentService = null;
                }
                
                // Guardar configuración
                window.cloudSyncManager.saveConfiguration();
            }
            
            // Recargar la interfaz
            loadCloudServices();
            updateCloudSyncStatus();
            
            showNotification(`${window.cloudSyncManager?.supportedServices[serviceKey]?.name} desconectado`, 'success');
            
        } catch (error) {
            console.error('Error al desconectar servicio:', error);
            showNotification('Error al desconectar el servicio: ' + error.message, 'error');
        }
    }
}

// Función para cambiar entre pestañas del modal de nube
function showCloudTab(tabName) {
    // Ocultar todas las pestañas
    const tabContents = document.querySelectorAll('#cloudSyncModal .tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Desactivar todos los botones
    const tabButtons = document.querySelectorAll('#cloudSyncModal .tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    // Mostrar la pestaña seleccionada
    const selectedTab = document.getElementById(`${tabName}-tab`);
    const selectedButton = document.querySelector(`#cloudSyncModal .tab-button[onclick*="${tabName}"]`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedButton) selectedButton.classList.add('active');
    
    // Actualizar estado según la pestaña
    if (tabName === 'sync') {
        updateCloudSyncStatus();
    } else if (tabName === 'history') {
        loadSyncHistory();
    }
}

// Función para actualizar el estado de sincronización en la nube
function updateCloudSyncStatus() {
    const currentServiceInfo = document.getElementById('currentServiceInfo');
    const syncNowBtn = document.getElementById('syncNowBtn');
    const syncFromBtn = document.getElementById('syncFromBtn');
    const testConnectionBtn = document.getElementById('testConnectionBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    
    if (!window.cloudSyncManager) return;
    
    const currentService = window.cloudSyncManager.getCurrentServiceInfo();
    
    if (currentService) {
        currentServiceInfo.innerHTML = `
            <h4>
                <i class="${currentService.icon}" style="color: ${currentService.color}"></i>
                ${currentService.name}
            </h4>
            <p>Servicio activo - Última sincronización: ${currentService.lastSync ? new Date(currentService.lastSync).toLocaleString() : 'Nunca'}</p>
        `;
        
        // Habilitar botones
        if (syncNowBtn) syncNowBtn.disabled = false;
        if (syncFromBtn) syncFromBtn.disabled = false;
        if (testConnectionBtn) testConnectionBtn.disabled = false;
        if (restoreBtn) restoreBtn.disabled = false;
        
    } else {
        currentServiceInfo.innerHTML = `
            <h4><i class="fas fa-exclamation-triangle" style="color: #ffc107;"></i> No hay servicio configurado</h4>
            <p>Configura un servicio de nube para sincronizar tus datos</p>
        `;
        
        // Deshabilitar botones
        if (syncNowBtn) syncNowBtn.disabled = true;
        if (syncFromBtn) syncFromBtn.disabled = true;
        if (testConnectionBtn) testConnectionBtn.disabled = true;
        if (restoreBtn) restoreBtn.disabled = true;
    }
}

// Función para sincronizar con la nube
async function syncToCloud() {
    if (!window.cloudSyncManager) {
        showNotification('Gestor de sincronización no disponible', 'error');
        return;
    }
    
    try {
        showNotification('Sincronizando con la nube...', 'info');
        
        // Obtener datos actuales de la aplicación
        const currentData = window.cloudSyncManager.getCurrentAppData();
        if (!currentData) {
            showNotification('No hay datos para sincronizar', 'warning');
            return;
        }
        
        // Obtener ID del usuario actual
        const userId = window.cloudSyncManager.getCurrentUserId();
        
        // Sincronizar
        const success = await window.cloudSyncManager.syncToCloud(currentData, userId);
        
        if (success) {
            showNotification('Datos sincronizados exitosamente', 'success');
            updateCloudSyncStatus();
        } else {
            showNotification('Error al sincronizar datos', 'error');
        }
        
    } catch (error) {
        console.error('Error al sincronizar:', error);
        showNotification('Error al sincronizar: ' + error.message, 'error');
    }
}

// Función para sincronizar desde la nube
async function syncFromCloud() {
    if (!window.cloudSyncManager) {
        showNotification('Gestor de sincronización no disponible', 'error');
        return;
    }
    
    try {
        showNotification('Sincronizando desde la nube...', 'info');
        
        // Obtener ID del usuario actual
        const userId = window.cloudSyncManager.getCurrentUserId();
        
        // Sincronizar
        const data = await window.cloudSyncManager.syncFromCloud(userId);
        
        if (data) {
            // Aplicar los datos sincronizados
            applySyncedData(data);
            showNotification('Datos sincronizados desde la nube', 'success');
            updateCloudSyncStatus();
        } else {
            showNotification('No se encontraron datos en la nube', 'warning');
        }
        
    } catch (error) {
        console.error('Error al sincronizar desde la nube:', error);
        showNotification('Error al sincronizar desde la nube: ' + error.message, 'error');
    }
}

// Función para aplicar datos sincronizados
function applySyncedData(data) {
    try {
        // Aplicar cada tipo de dato
        if (data.transactions) {
            transactions = data.transactions;
            localStorage.setItem(getStorageKey('transactions'), JSON.stringify(transactions));
        }
        
        if (data.categories) {
            categories = data.categories;
            localStorage.setItem(getStorageKey('categories'), JSON.stringify(categories));
        }
        
        if (data.budgets) {
            categoryGroups = data.budgets;
            localStorage.setItem(getStorageKey('categoryGroups'), JSON.stringify(categoryGroups));
        }
        
        if (data.goals) {
            goals = data.goals;
            localStorage.setItem(getStorageKey('goals'), JSON.stringify(goals));
        }
        
        if (data.bankAccounts) {
            bankAccounts = data.bankAccounts;
            localStorage.setItem(getStorageKey('bankAccounts'), JSON.stringify(bankAccounts));
        }
        
        if (data.userSettings) {
            // Aplicar configuraciones de usuario
            Object.entries(data.userSettings).forEach(([key, value]) => {
                localStorage.setItem(getStorageKey(key), JSON.stringify(value));
            });
        }
        
        // Actualizar la interfaz
        updateUI(true);
        
    } catch (error) {
        console.error('Error al aplicar datos sincronizados:', error);
        throw error;
    }
}

// Función para restaurar desde la nube
async function restoreFromCloud() {
    if (!window.cloudSyncManager) {
        showNotification('Gestor de sincronización no disponible', 'error');
        return;
    }
    
    const restoreType = document.querySelector('input[name="restoreType"]:checked')?.value;
    
    if (restoreType === 'all') {
        if (confirm('⚠️ ¿Estás seguro de que quieres restaurar todos los datos desde la nube? Esto sobrescribirá todos los datos locales actuales.')) {
            await syncFromCloud();
        }
    } else {
        showNotification('Restauración selectiva no implementada aún', 'info');
    }
}

// Función para probar conexión de nube
async function testCloudConnection() {
    if (!window.cloudSyncManager) {
        showNotification('Gestor de sincronización no disponible', 'error');
        return;
    }
    
    try {
        showNotification('Probando conexión...', 'info');
        
        const result = await window.cloudSyncManager.testServiceConnection();
        
        if (result?.success) {
            showNotification(result.message, 'success');
        } else {
            showNotification(result?.message || 'Error de conexión', 'error');
        }
        
    } catch (error) {
        console.error('Error al probar conexión:', error);
        showNotification('Error al probar conexión: ' + error.message, 'error');
    }
} 