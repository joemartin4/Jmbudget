// Datos de la aplicación
let categories = [];
let transactions = [];
let categoryGroups = {};
let currentUser = null;

let collaborations = {};
let invitations = {};
let changeHistory = {};
let importData = {
    file: null,
    parsedData: [],
    validRows: [],
    invalidRows: []
};

// Variables globales para ingresos recurrentes
let incomes = [];

// Variables globales para metas
let goals = [];

// Variables globales para notificaciones
let notifications = [];

// Variables globales para cuentas bancarias
let bankAccounts = [];
let bankTransactions = [];
let reconciliationData = {};

// Función para cargar datos de forma segura
// Función para obtener la clave de almacenamiento basada en el usuario
function getStorageKey(key) {
    const userEmail = currentUser || 'anonymous';
    const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
    return `jmBudget_${sanitizedEmail}_${key}`;
}

// Función para migrar datos antiguos si es necesario
function migrateOldData() {
    console.log('🔄 Iniciando migración de datos...');
    
    // Datos principales
    const oldKeys = ['budgetCategories', 'budgetTransactions', 'budgetCategoryGroups'];
    const newKeys = ['categories', 'transactions', 'categoryGroups'];
    
    oldKeys.forEach((oldKey, index) => {
        const oldData = localStorage.getItem(oldKey);
        if (oldData) {
            const newKey = getStorageKey(newKeys[index]);
            localStorage.setItem(newKey, oldData);
            localStorage.removeItem(oldKey); // Limpiar datos antiguos
            console.log(`✅ Migrado: ${oldKey} → ${newKey}`);
        }
    });
    
    // Datos adicionales que también necesitan migración
    const additionalData = [
        'incomes', 'notifications', 'goals', 'bankAccounts', 
        'bankTransactions', 'reconciliationData'
    ];
    
    additionalData.forEach(dataKey => {
        const oldData = localStorage.getItem(dataKey);
        if (oldData) {
            const newKey = getStorageKey(dataKey);
            localStorage.setItem(newKey, oldData);
            localStorage.removeItem(dataKey);
            console.log(`✅ Migrado: ${dataKey} → ${newKey}`);
        }
    });
    
    console.log('✅ Migración de datos completada');
}

function loadDataSafely() {
    try {
        console.log('🔄 Cargando datos de forma segura...');
        
        // Migrar datos antiguos si es necesario
        migrateOldData();
        
        // Cargar datos principales
        const categoriesData = localStorage.getItem(getStorageKey('categories'));
        const transactionsData = localStorage.getItem(getStorageKey('transactions'));
        const categoryGroupsData = localStorage.getItem(getStorageKey('categoryGroups'));
        
        categories = categoriesData ? JSON.parse(categoriesData) : [];
        transactions = transactionsData ? JSON.parse(transactionsData) : [];
        categoryGroups = categoryGroupsData ? JSON.parse(categoryGroupsData) : {};
        
        // Validar que los datos sean arrays/objetos válidos
        if (!Array.isArray(categories)) categories = [];
        if (!Array.isArray(transactions)) transactions = [];
        if (typeof categoryGroups !== 'object' || categoryGroups === null) categoryGroups = {};
        
        // Cargar datos adicionales
        const incomesData = localStorage.getItem(getStorageKey('incomes'));
        const notificationsData = localStorage.getItem(getStorageKey('notifications'));
        const goalsData = localStorage.getItem(getStorageKey('goals'));
        
        incomes = incomesData ? JSON.parse(incomesData) : [];
        notifications = notificationsData ? JSON.parse(notificationsData) : [];
        goals = goalsData ? JSON.parse(goalsData) : [];
        
        // Validar datos adicionales
        if (!Array.isArray(incomes)) incomes = [];
        if (!Array.isArray(notifications)) notifications = [];
        if (!Array.isArray(goals)) goals = [];
        
        console.log('📊 Datos cargados correctamente:', {
            categories: categories.length,
            transactions: transactions.length,
            categoryGroups: Object.keys(categoryGroups).length,
            incomes: incomes.length,
            notifications: notifications.length,
            goals: goals.length
        });
        
    } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        categories = [];
        transactions = [];
        categoryGroups = {};
        incomes = [];
        notifications = [];
        goals = [];
    }
}

// Cargar datos al inicio
loadDataSafely();

// Sistema de Login con Autenticación Real
function initializeLogin() {
    // Esperar a que el servicio de autenticación esté inicializado
    if (!window.authService || !window.authService.isInitialized) {
        setTimeout(initializeLogin, 100);
        return;
    }
    
    // Configurar eventos de autenticación
    setupAuthEventListeners();
    
    // Verificar si hay una sesión activa
    if (window.authService.isAuthenticated()) {
        const user = window.authService.getCurrentUser();
        loginUser(user.email);
        return;
    }
    
    // Mostrar pantalla de login
    showLoginScreen();
}

function showLoginScreen() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('currentUser').textContent = currentUser;
}

async function loginUser(email) {
    currentUser = email;
    
    // Cargar datos del usuario
    await loadUserData();
    
    // Mostrar aplicación principal
    showMainApp();
    
    // Inicializar aplicación
    await initializeApp();
}

function setupAuthEventListeners() {
    // Eventos de autenticación
    window.addEventListener('userLoggedIn', (event) => {
        const user = event.detail;
        loginUser(user.email);
    });
    
    window.addEventListener('userLoggedOut', () => {
        logoutUser();
    });
}

function setupSyncEventListeners() {
    console.log('🔄 Configurando eventos de sincronización...');
    
    const forceSyncBtn = document.getElementById('forceSyncBtn');
    if (forceSyncBtn) {
        forceSyncBtn.addEventListener('click', async () => {
            console.log('🔄 Botón de sincronización forzada clickeado');
            if (window.syncService) {
                await window.syncService.forceSync();
            }
        });
    }
    
    // Escuchar cambios de estado de sincronización
    window.addEventListener('syncStatusChanged', (event) => {
        const { status, timestamp } = event.detail;
        console.log(`🔄 Estado de sincronización cambiado: ${status} a las ${timestamp.toLocaleTimeString()}`);
        
        // Actualizar UI según el estado
        updateSyncUI(status);
    });
}

function updateSyncUI(status) {
    const forceSyncBtn = document.getElementById('forceSyncBtn');
    if (forceSyncBtn) {
        const icon = forceSyncBtn.querySelector('i');
        
        switch (status) {
            case 'syncing':
                icon.className = 'fas fa-sync-alt fa-spin';
                forceSyncBtn.disabled = true;
                break;
            case 'synced':
                icon.className = 'fas fa-check';
                forceSyncBtn.disabled = false;
                setTimeout(() => {
                    icon.className = 'fas fa-sync-alt';
                }, 2000);
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-triangle';
                forceSyncBtn.disabled = false;
                break;
            case 'offline':
                icon.className = 'fas fa-wifi-slash';
                forceSyncBtn.disabled = true;
                break;
            default:
                icon.className = 'fas fa-sync-alt';
                forceSyncBtn.disabled = false;
        }
    }
}

function openSyncConfig() {
    const modal = document.getElementById('syncConfigModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Cargar configuración actual
        if (window.syncService) {
            const conflictResolution = document.getElementById('conflictResolution');
            if (conflictResolution) {
                conflictResolution.value = window.syncService.conflictResolution || 'smart-merge';
            }
        }
    }
}

function saveSyncConfig() {
    const conflictResolution = document.getElementById('conflictResolution');
    const syncFrequency = document.getElementById('syncFrequency');
    
    if (!conflictResolution || !syncFrequency) {
        console.error('❌ Elementos de configuración no encontrados');
        showNotification('Error al guardar la configuración', 'error');
        return;
    }
    
    // Guardar configuración en localStorage
    const config = {
        conflictResolution: conflictResolution.value,
        syncFrequency: parseInt(syncFrequency.value)
    };
    
    try {
        localStorage.setItem('syncConfig', JSON.stringify(config));
        
        // Aplicar configuración al servicio de sincronización si está disponible
        if (window.syncService) {
            window.syncService.setConflictResolution(config.conflictResolution);
            window.syncService.updateSyncFrequency(config.syncFrequency);
        }
        
        showNotification('Configuración de sincronización guardada', 'success');
        closeModal('syncConfigModal');
        console.log('✅ Configuración de sincronización guardada:', config);
    } catch (error) {
        console.error('❌ Error al guardar configuración:', error);
        showNotification('Error al guardar la configuración', 'error');
    }
}

function loadSyncConfig() {
    const config = localStorage.getItem('syncConfig');
    if (config) {
        try {
            const parsedConfig = JSON.parse(config);
            
            if (window.syncService) {
                window.syncService.setConflictResolution(parsedConfig.conflictResolution);
                if (parsedConfig.syncFrequency) {
                    window.syncService.updateSyncFrequency(parsedConfig.syncFrequency);
                }
            }
            
            console.log('✅ Configuración de sincronización cargada');
        } catch (error) {
            console.error('❌ Error al cargar configuración de sincronización:', error);
        }
    }
}

function restoreDefaultSyncConfig() {
    try {
        // Configuración por defecto
        const defaultConfig = {
            conflictResolution: 'smart-merge',
            syncFrequency: 300000 // 5 minutos
        };
        
        // Guardar configuración por defecto
        localStorage.setItem('syncConfig', JSON.stringify(defaultConfig));
        
        // Actualizar los campos del formulario
        const conflictResolution = document.getElementById('conflictResolution');
        const syncFrequency = document.getElementById('syncFrequency');
        
        if (conflictResolution) {
            conflictResolution.value = defaultConfig.conflictResolution;
        }
        
        if (syncFrequency) {
            syncFrequency.value = defaultConfig.syncFrequency.toString();
        }
        
        // Aplicar al servicio de sincronización si está disponible
        if (window.syncService) {
            window.syncService.setConflictResolution(defaultConfig.conflictResolution);
            window.syncService.updateSyncFrequency(defaultConfig.syncFrequency);
        }
        
        showNotification('Configuración restaurada a valores por defecto', 'success');
        console.log('✅ Configuración de sincronización restaurada a valores por defecto');
    } catch (error) {
        console.error('❌ Error al restaurar configuración:', error);
        showNotification('Error al restaurar la configuración', 'error');
    }
}

function loadSyncConfigToForm() {
    const config = localStorage.getItem('syncConfig');
    if (config) {
        try {
            const parsedConfig = JSON.parse(config);
            
            const conflictResolution = document.getElementById('conflictResolution');
            const syncFrequency = document.getElementById('syncFrequency');
            
            if (conflictResolution && parsedConfig.conflictResolution) {
                conflictResolution.value = parsedConfig.conflictResolution;
            }
            
            if (syncFrequency && parsedConfig.syncFrequency) {
                syncFrequency.value = parsedConfig.syncFrequency.toString();
            }
            
            console.log('✅ Configuración cargada en el formulario');
        } catch (error) {
            console.error('❌ Error al cargar configuración en el formulario:', error);
        }
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Agregar al historial
    addToHistory('Tema cambiado', `Cambió a modo ${newTheme === 'dark' ? 'oscuro' : 'claro'}`, 'theme');
}

// Escuchar cambios de tema
window.addEventListener('themeChanged', (event) => {
    const { theme } = event.detail;
    console.log(`🎨 Tema cambiado a: ${theme}`);
    updateThemeButton();
    
    // Actualizar gráficos si existen
    if (window.charts && window.charts.length > 0) {
        window.charts.forEach(chart => {
            if (chart && typeof chart.update === 'function') {
                chart.update();
            }
        });
    }
});

function setupLoginFormEvents() {
    console.log('🔧 Configurando eventos del formulario de login...');
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const displayNameInput = document.getElementById('displayName');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    const toggleModeBtn = document.getElementById('toggleModeBtn');
    const passwordToggle = document.getElementById('passwordToggle');
    
    console.log('Elementos encontrados:', {
        emailInput: !!emailInput,
        passwordInput: !!passwordInput,
        displayNameInput: !!displayNameInput,
        loginBtn: !!loginBtn,
        registerBtn: !!registerBtn,
        forgotPasswordBtn: !!forgotPasswordBtn,
        toggleModeBtn: !!toggleModeBtn,
        passwordToggle: !!passwordToggle
    });
    
    let isRegisterMode = false;
    
    // Toggle de contraseña
    if (passwordToggle) {
        passwordToggle.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            passwordToggle.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Validación de email en tiempo real
    if (emailInput) {
        emailInput.addEventListener('input', () => {
            validateEmail(emailInput.value);
        });
    }
    
    // Validación de contraseña en tiempo real
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            validatePassword(passwordInput.value);
        });
    }
    
    // Toggle entre login y registro
    if (toggleModeBtn) {
        console.log('✅ Configurando evento para toggleModeBtn');
        toggleModeBtn.addEventListener('click', () => {
            console.log('🔄 Botón toggle clickeado, cambiando modo...');
            isRegisterMode = !isRegisterMode;
            console.log('Modo actual:', isRegisterMode ? 'registro' : 'login');
            toggleLoginMode(isRegisterMode);
        });
    } else {
        console.error('❌ No se encontró el botón toggleModeBtn');
    }
    
    // Login
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            await handleLogin();
        });
    }
    
    // Registro
    if (registerBtn) {
        console.log('✅ Configurando evento para registerBtn');
        registerBtn.addEventListener('click', async () => {
            console.log('🔄 Botón registro clickeado...');
            await handleRegister();
        });
    } else {
        console.error('❌ No se encontró el botón registerBtn');
    }
    
    // Recuperar contraseña
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', async () => {
            await handleForgotPassword();
        });
    }
}

function toggleLoginMode(isRegister) {
    console.log('🔄 Cambiando modo de login a:', isRegister ? 'registro' : 'login');
    
    const displayNameGroup = document.getElementById('displayNameGroup');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const toggleModeBtn = document.getElementById('toggleModeBtn');
    
    console.log('Elementos para toggle:', {
        displayNameGroup: !!displayNameGroup,
        loginBtn: !!loginBtn,
        registerBtn: !!registerBtn,
        toggleModeBtn: !!toggleModeBtn
    });
    
    if (isRegister) {
        if (displayNameGroup) displayNameGroup.style.display = 'block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'block';
        if (toggleModeBtn) toggleModeBtn.textContent = '¿Ya tienes cuenta? Inicia sesión';
        console.log('✅ Modo registro activado');
    } else {
        if (displayNameGroup) displayNameGroup.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'none';
        if (toggleModeBtn) toggleModeBtn.textContent = '¿No tienes cuenta? Regístrate';
        console.log('✅ Modo login activado');
    }
}

function validateEmail(email) {
    const emailValidation = document.getElementById('emailValidation');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
        showValidationMessage(emailValidation, '', '');
        return false;
    }
    
    if (!emailRegex.test(email)) {
        showValidationMessage(emailValidation, 'error', 'Formato de email inválido');
        return false;
    }
    
    showValidationMessage(emailValidation, 'success', 'Email válido');
    return true;
}

function validatePassword(password) {
    const passwordValidation = document.getElementById('passwordValidation');
    const passwordStrength = document.getElementById('passwordStrength');
    
    if (!password) {
        showValidationMessage(passwordValidation, '', '');
        updatePasswordStrength(passwordStrength, '', 0);
        return false;
    }
    
    // Validar fortaleza de contraseña
    const strength = calculatePasswordStrength(password);
    const isValid = strength.score >= 3;
    
    if (isValid) {
        showValidationMessage(passwordValidation, 'success', 'Contraseña válida');
    } else {
        showValidationMessage(passwordValidation, 'error', 'La contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas, números y caracteres especiales');
    }
    
    updatePasswordStrength(passwordStrength, strength.level, strength.score);
    return isValid;
}

function calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    const levels = ['', 'weak', 'fair', 'good', 'strong'];
    const level = levels[Math.min(score, 4)];
    
    return { score, level };
}

function updatePasswordStrength(container, level, score) {
    if (!container) return;
    
    const maxScore = 5;
    const percentage = (score / maxScore) * 100;
    
    container.innerHTML = `
        <div class="password-strength-bar">
            <div class="password-strength-fill ${level}" style="width: ${percentage}%"></div>
        </div>
        <span class="password-strength-text">${level.charAt(0).toUpperCase() + level.slice(1)}</span>
    `;
}

function showValidationMessage(container, type, message) {
    if (!container) return;
    
    container.className = `validation-message ${type}`;
    container.innerHTML = message ? `<i class="fas fa-${type === 'error' ? 'times-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>${message}` : '';
}

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!validateEmail(email) || !validatePassword(password)) {
        showNotification('Por favor, corrige los errores en el formulario', 'error');
        return;
    }
    
    try {
        const result = await window.authService.login(email, password);
        
        if (result.success) {
            showNotification('Inicio de sesión exitoso', 'success');
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Error al iniciar sesión', 'error');
    }
}

async function handleRegister() {
    console.log('🚀 Función handleRegister ejecutada');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const displayName = document.getElementById('displayName').value;
    
    console.log('Datos del formulario:', { email, password: '***', displayName });
    
    if (!validateEmail(email) || !validatePassword(password)) {
        console.log('❌ Validación fallida');
        showNotification('Por favor, corrige los errores en el formulario', 'error');
        return;
    }
    
    try {
        console.log('🔐 Intentando registrar usuario con Firebase Auth...');
        
        // Verificar que el servicio de autenticación esté disponible
        if (!window.authService) {
            console.error('❌ Servicio de autenticación no disponible');
            showNotification('Error: Servicio de autenticación no disponible', 'error');
            return;
        }
        
        console.log('✅ Servicio de autenticación disponible');
        const result = await window.authService.register(email, password, displayName || null);
        
        console.log('Resultado del registro:', result);
        
        if (result.success) {
            console.log('✅ Registro exitoso');
            showNotification('Registro exitoso. Verifica tu email para confirmar tu cuenta.', 'success');
            // Cambiar a modo login
            toggleLoginMode(false);
        } else {
            console.log('❌ Error en registro:', result.error);
            showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('❌ Excepción en registro:', error);
        showNotification('Error al registrar usuario', 'error');
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('email').value;
    
    if (!validateEmail(email)) {
        showNotification('Por favor, ingresa un email válido', 'error');
        return;
    }
    
    try {
        const result = await window.authService.resetPassword(email);
        
        if (result.success) {
            showNotification('Se ha enviado un email para restablecer tu contraseña', 'success');
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Error al enviar email de recuperación', 'error');
    }
}

function logoutUser() {
    // Cerrar sesión en Firebase
    if (window.authService) {
        window.authService.logout();
    }
    
    currentUser = null;
    categories = [];
    transactions = [];
    categoryGroups = {};
    incomes = [];
    
    // Limpiar UI
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    
    // Limpiar campos de login
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const displayNameInput = document.getElementById('displayName');
    
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (displayNameInput) displayNameInput.value = '';
    
    // Limpiar validaciones
    const emailValidation = document.getElementById('emailValidation');
    const passwordValidation = document.getElementById('passwordValidation');
    const passwordStrength = document.getElementById('passwordStrength');
    
    if (emailValidation) emailValidation.innerHTML = '';
    if (passwordValidation) passwordValidation.innerHTML = '';
    if (passwordStrength) passwordStrength.innerHTML = '';
    
    showNotification('Sesión cerrada exitosamente', 'info');
}

async function loadUserData() {
    try {
        // Cargar desde localStorage (independiente del puerto)
        const categoriesData = localStorage.getItem(getStorageKey('categories'));
        const transactionsData = localStorage.getItem(getStorageKey('transactions'));
        const categoryGroupsData = localStorage.getItem(getStorageKey('categoryGroups'));
        const incomesData = localStorage.getItem(getStorageKey('incomes'));
        const notificationsData = localStorage.getItem(getStorageKey('notifications'));
        const goalsData = localStorage.getItem(getStorageKey('goals'));
        const bankAccountsData = localStorage.getItem(getStorageKey('bankAccounts'));
        
        // Parsear datos o usar valores por defecto
        categories = categoriesData ? JSON.parse(categoriesData) : [];
        transactions = transactionsData ? JSON.parse(transactionsData) : [];
        categoryGroups = categoryGroupsData ? JSON.parse(categoryGroupsData) : {};
        incomes = incomesData ? JSON.parse(incomesData) : [];
        notifications = notificationsData ? JSON.parse(notificationsData) : [];
        goals = goalsData ? JSON.parse(goalsData) : [];
        bankAccounts = bankAccountsData ? JSON.parse(bankAccountsData) : [];
        
        console.log('📥 Datos cargados desde localStorage para usuario:', currentUser);
        console.log('📊 Resumen de datos cargados:');
        console.log('  - Categorías:', categories.length);
        console.log('  - Transacciones:', transactions.length);
        console.log('  - Ingresos:', incomes.length);
        console.log('  - Notificaciones:', notifications.length);
        console.log('  - Metas:', goals.length);
        console.log('  - Cuentas bancarias:', bankAccounts.length);
        
        // Si hay servicio de autenticación, intentar cargar datos encriptados como respaldo
        if (window.authService && window.authService.isAuthenticated()) {
            try {
                const user = window.authService.getCurrentUser();
                const userId = user.uid;
                
                // Solo cargar datos encriptados si no hay datos en localStorage
                if (categories.length === 0) {
                    const encryptedCategories = await window.authService.loadEncryptedData(`categories_${userId}`);
                    if (encryptedCategories) categories = encryptedCategories;
                }
                if (transactions.length === 0) {
                    const encryptedTransactions = await window.authService.loadEncryptedData(`transactions_${userId}`);
                    if (encryptedTransactions) transactions = encryptedTransactions;
                }
                if (Object.keys(categoryGroups).length === 0) {
                    const encryptedCategoryGroups = await window.authService.loadEncryptedData(`categoryGroups_${userId}`);
                    if (encryptedCategoryGroups) categoryGroups = encryptedCategoryGroups;
                }
                if (incomes.length === 0) {
                    const encryptedIncomes = await window.authService.loadEncryptedData(`incomes_${userId}`);
                    if (encryptedIncomes) incomes = encryptedIncomes;
                }
                if (notifications.length === 0) {
                    const encryptedNotifications = await window.authService.loadEncryptedData(`notifications_${userId}`);
                    if (encryptedNotifications) notifications = encryptedNotifications;
                }
                if (goals.length === 0) {
                    const encryptedGoals = await window.authService.loadEncryptedData(`goals_${userId}`);
                    if (encryptedGoals) goals = encryptedGoals;
                }
                
                console.log('📥 Datos encriptados cargados como respaldo para usuario:', user.email);
            } catch (encryptedError) {
                console.warn('⚠️ No se pudieron cargar datos encriptados:', encryptedError);
            }
        }
        
    } catch (error) {
        console.error('❌ Error al cargar datos del usuario:', error);
        // Usar datos por defecto en caso de error
        categories = [];
        transactions = [];
        categoryGroups = {};
        incomes = [];
        notifications = [];
        goals = [];
        bankAccounts = [];
    }
}

async function saveUserData() {
    try {
        // Guardar en localStorage como respaldo (independiente del puerto)
        localStorage.setItem(getStorageKey('categories'), JSON.stringify(categories));
        localStorage.setItem(getStorageKey('transactions'), JSON.stringify(transactions));
        localStorage.setItem(getStorageKey('categoryGroups'), JSON.stringify(categoryGroups));
        localStorage.setItem(getStorageKey('incomes'), JSON.stringify(incomes));
        localStorage.setItem(getStorageKey('notifications'), JSON.stringify(notifications));
        localStorage.setItem(getStorageKey('goals'), JSON.stringify(goals));
        localStorage.setItem(getStorageKey('bankAccounts'), JSON.stringify(bankAccounts));
        
        console.log('✅ Datos guardados en localStorage para usuario:', currentUser);
        
        // Si hay servicio de autenticación, también guardar encriptado
        if (window.authService && window.authService.isAuthenticated()) {
            const user = window.authService.getCurrentUser();
            const userId = user.uid;
            
            // Guardar datos encriptados
            await window.authService.saveEncryptedData(`categories_${userId}`, categories);
            await window.authService.saveEncryptedData(`transactions_${userId}`, transactions);
            await window.authService.saveEncryptedData(`categoryGroups_${userId}`, categoryGroups);
            await window.authService.saveEncryptedData(`incomes_${userId}`, incomes);
            await window.authService.saveEncryptedData(`notifications_${userId}`, notifications);
            await window.authService.saveEncryptedData(`goals_${userId}`, goals);
            
            console.log('✅ Datos encriptados guardados exitosamente para usuario:', user.email);
        }
        
        console.log('📊 Resumen de datos guardados:');
        console.log('  - Categorías:', categories.length);
        console.log('  - Transacciones:', transactions.length);
        console.log('  - Ingresos:', incomes.length);
        console.log('  - Notificaciones:', notifications.length);
        console.log('  - Metas:', goals.length);
        console.log('  - Cuentas bancarias:', bankAccounts.length);
        
    } catch (error) {
        console.error('❌ Error al guardar datos:', error);
        showNotification('Error al guardar los datos. Verifica el espacio disponible en tu navegador.', 'error');
    }
}





// Sistema de Colaboración
function initializeCollaboration() {
    collaborations = JSON.parse(localStorage.getItem('budgetCollaborations')) || {};
    invitations = JSON.parse(localStorage.getItem('budgetInvitations')) || {};
}

function openCollaborationModal() {
    openModal('collaborationModal');
    loadCollaborationData();
}

function loadCollaborationData() {
    loadMembersList();
    loadRequestsList();
    updateHistoryFilters();
}

function loadMembersList() {
    const membersList = document.getElementById('membersList');
    const userCollaborations = collaborations[currentUser] || [];
    
    if (userCollaborations.length === 0) {
        membersList.innerHTML = '<p class="no-members">No hay miembros colaborando aún.</p>';
        return;
    }
    
    let html = '';
    userCollaborations.forEach(member => {
        html += `
            <div class="member-item">
                <div class="member-info">
                    <div class="member-name">${member.username}</div>
                    <div class="member-role">${member.role === 'collaborator' ? 'Colaborador' : 'Solo lectura'}</div>
                </div>
                <div class="member-actions">
                    <button class="btn-remove" onclick="removeCollaborator('${member.username}')">
                        <i class="fas fa-user-times"></i> Remover
                    </button>
                </div>
            </div>
        `;
    });
    
    membersList.innerHTML = html;
}

function loadRequestsList() {
    const requestsList = document.getElementById('requestsList');
    const userInvitations = invitations[currentUser] || [];
    
    if (userInvitations.length === 0) {
        requestsList.innerHTML = '<p class="no-requests">No hay solicitudes pendientes.</p>';
        return;
    }
    
    let html = '';
    userInvitations.forEach(invitation => {
        html += `
            <div class="request-item">
                <div class="request-info">
                    <div class="request-name">${invitation.fromUser}</div>
                    <div class="request-email">${invitation.email}</div>
                    <div class="request-role">${invitation.role === 'collaborator' ? 'Colaborador' : 'Solo lectura'}</div>
                </div>
                <div class="request-actions">
                    <button class="btn-accept" onclick="acceptInvitation('${invitation.id}')">
                        <i class="fas fa-check"></i> Aceptar
                    </button>
                    <button class="btn-decline" onclick="declineInvitation('${invitation.id}')">
                        <i class="fas fa-times"></i> Rechazar
                    </button>
                </div>
            </div>
        `;
    });
    
    requestsList.innerHTML = html;
}

function sendInvitation() {
    const email = document.getElementById('inviteEmail').value.trim();
    const role = document.getElementById('inviteRole').value;
    const message = document.getElementById('inviteMessage').value.trim();
    
    if (!email) {
        alert('Por favor, ingresa un email válido.');
        return;
    }
    
    // Simular envío de invitación
    const invitationId = Date.now().toString();
    const invitation = {
        id: invitationId,
        fromUser: currentUser,
        email: email,
        role: role,
        message: message,
        date: new Date().toISOString(),
        status: 'pending'
    };
    
    // Guardar invitación
    if (!invitations[email]) {
        invitations[email] = [];
    }
    invitations[email].push(invitation);
    localStorage.setItem('budgetInvitations', JSON.stringify(invitations));
    
    // Limpiar formulario
    document.getElementById('inviteEmail').value = '';
    document.getElementById('inviteMessage').value = '';
    
    alert('Invitación enviada exitosamente. El usuario recibirá una notificación cuando se registre.');
    closeModal('collaborationModal');
}

function acceptInvitation(invitationId) {
    const userInvitations = invitations[currentUser] || [];
    const invitation = userInvitations.find(inv => inv.id === invitationId);
    
    if (!invitation) return;
    
    // Agregar colaboración
    if (!collaborations[invitation.fromUser]) {
        collaborations[invitation.fromUser] = [];
    }
    
    collaborations[invitation.fromUser].push({
        username: currentUser,
        role: invitation.role,
        date: new Date().toISOString()
    });
    
    // Remover invitación
    invitations[currentUser] = userInvitations.filter(inv => inv.id !== invitationId);
    
    // Guardar cambios
    localStorage.setItem('budgetCollaborations', JSON.stringify(collaborations));
    localStorage.setItem('budgetInvitations', JSON.stringify(invitations));
    
    alert('Has aceptado la invitación. Ahora puedes colaborar en el presupuesto.');
    loadCollaborationData();
}

function declineInvitation(invitationId) {
    const userInvitations = invitations[currentUser] || [];
    invitations[currentUser] = userInvitations.filter(inv => inv.id !== invitationId);
    
    localStorage.setItem('budgetInvitations', JSON.stringify(invitations));
    
    alert('Has rechazado la invitación.');
    loadCollaborationData();
}

function removeCollaborator(username) {
    if (!confirm(`¿Estás seguro de que quieres remover a ${username} del presupuesto?`)) {
        return;
    }
    
    const userCollaborations = collaborations[currentUser] || [];
    collaborations[currentUser] = userCollaborations.filter(member => member.username !== username);
    
    localStorage.setItem('budgetCollaborations', JSON.stringify(collaborations));
    
    alert(`${username} ha sido removido del presupuesto.`);
    loadCollaborationData();
}

function setupCollaborationTabs() {
    const tabButtons = document.querySelectorAll('.collab-tab-btn');
    const tabContents = document.querySelectorAll('.collab-tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Remover clase active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Agregar clase active al botón y contenido seleccionado
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Cargar datos específicos de la pestaña
            if (tabName === 'history') {
                loadHistoryData();
            }
        });
    });
}

// Sistema de Historial y Comentarios
function initializeHistory() {
    changeHistory = JSON.parse(localStorage.getItem('budgetChangeHistory')) || {};
}

function addToHistory(action, details, type = 'general') {
    if (!currentUser) return;
    
    const historyEntry = {
        id: Date.now().toString(),
        user: currentUser,
        action: action,
        details: details,
        type: type,
        timestamp: new Date().toISOString()
    };
    
    if (!changeHistory[currentUser]) {
        changeHistory[currentUser] = [];
    }
    
    changeHistory[currentUser].unshift(historyEntry);
    
    // Mantener solo los últimos 100 cambios
    if (changeHistory[currentUser].length > 100) {
        changeHistory[currentUser] = changeHistory[currentUser].slice(0, 100);
    }
    
    localStorage.setItem('budgetChangeHistory', JSON.stringify(changeHistory));
}

function loadHistoryData() {
    const historyList = document.getElementById('historyList');
    const typeFilter = document.getElementById('historyTypeFilter').value;
    const userFilter = document.getElementById('historyUserFilter').value;
    
    let allHistory = [];
    
    // Obtener historial de todos los usuarios colaborando
    const userCollaborations = collaborations[currentUser] || [];
    const allUsers = [currentUser, ...userCollaborations.map(member => member.username)];
    
    allUsers.forEach(user => {
        const userHistory = changeHistory[user] || [];
        allHistory = allHistory.concat(userHistory.map(entry => ({ ...entry, originalUser: user })));
    });
    
    // Filtrar por tipo
    if (typeFilter) {
        allHistory = allHistory.filter(entry => entry.type === typeFilter);
    }
    
    // Filtrar por usuario
    if (userFilter) {
        allHistory = allHistory.filter(entry => entry.originalUser === userFilter);
    }
    
    // Ordenar por timestamp (más reciente primero)
    allHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (allHistory.length === 0) {
        historyList.innerHTML = '<p class="no-history">No hay cambios registrados aún.</p>';
        return;
    }
    
    let html = '';
    allHistory.forEach(entry => {
        const timeAgo = getTimeAgo(new Date(entry.timestamp));
        const isOwnEntry = entry.originalUser === currentUser;
        
        html += `
            <div class="history-item ${entry.type}">
                <div class="history-info">
                    <div class="history-action">${entry.action}</div>
                    <div class="history-details">${entry.details}</div>
                    <div class="history-user">${isOwnEntry ? 'Tú' : entry.originalUser}</div>
                </div>
                <div class="history-time">${timeAgo}</div>
            </div>
        `;
    });
    
    historyList.innerHTML = html;
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Hace un momento';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
}

function updateHistoryFilters() {
    const userFilter = document.getElementById('historyUserFilter');
    const userCollaborations = collaborations[currentUser] || [];
    
    let html = '<option value="">Todos los usuarios</option>';
    html += `<option value="${currentUser}">Tú</option>`;
    
    userCollaborations.forEach(member => {
        html += `<option value="${member.username}">${member.username}</option>`;
    });
    
    userFilter.innerHTML = html;
}

// Sistema de Importación
function initializeImport() {
    setupImportTabs();
    setupFileUpload();
}

function setupImportTabs() {
    const tabButtons = document.querySelectorAll('.import-tab-btn');
    const tabContents = document.querySelectorAll('.import-tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Remover clase active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Agregar clase active al botón y contenido seleccionado
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

function setupFileUpload() {
    const dropZone = document.getElementById('fileDropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const processFileBtn = document.getElementById('processFileBtn');
    
    // Click en drop zone
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    // Process file button
    processFileBtn.addEventListener('click', processFile);
}

function handleFileSelect(file) {
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    
    // Validar tipo de archivo
    const validTypes = ['.csv', '.xlsx', '.xls', '.json'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
        alert('Por favor selecciona un archivo CSV, XLSX, XLS o JSON válido.');
        return;
    }
    
    // Si es un archivo JSON, procesarlo como backup
    if (fileExtension === '.json') {
        importUserData(file);
        return;
    }
    
    // Mostrar información del archivo
    fileName.textContent = file.name;
    fileSize.textContent = `(${formatFileSize(file.size)})`;
    fileInfo.style.display = 'flex';
    
    // Guardar archivo
    importData.file = file;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function processFile() {
    if (!importData.file) {
        alert('Por favor selecciona un archivo primero.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            parseFileContent(content);
        } catch (error) {
            alert('Error al procesar el archivo: ' + error.message);
        }
    };
    
    reader.readAsText(importData.file);
}

function parseFileContent(content) {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validar headers requeridos
    const requiredHeaders = ['descripción', 'monto', 'tipo', 'categoría', 'fecha'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
        alert(`Faltan las siguientes columnas: ${missingHeaders.join(', ')}`);
        return;
    }
    
    // Procesar filas
    importData.parsedData = [];
    importData.validRows = [];
    importData.invalidRows = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        const validation = validateRow(row, i);
        if (validation.isValid) {
            importData.validRows.push(row);
        } else {
            row.errors = validation.errors;
            importData.invalidRows.push(row);
        }
        
        importData.parsedData.push(row);
    }
    
    showPreview();
}

function validateRow(row, rowNumber) {
    const errors = [];
    
    // Validar descripción
    if (!row.descripción || row.descripción.trim() === '') {
        errors.push('Descripción requerida');
    }
    
    // Validar monto
    const amount = parseFloat(row.monto);
    if (isNaN(amount)) {
        errors.push('Monto debe ser un número válido');
    }
    
    // Validar tipo
    if (!row.tipo || !['ingreso', 'gasto'].includes(row.tipo.toLowerCase())) {
        errors.push('Tipo debe ser "ingreso" o "gasto"');
    }
    
    // Validar categoría
    if (!row.categoría || row.categoría.trim() === '') {
        errors.push('Categoría requerida');
    }
    
    // Validar fecha
    const date = new Date(row.fecha);
    if (isNaN(date.getTime())) {
        errors.push('Fecha debe estar en formato YYYY-MM-DD');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function showPreview() {
    const totalRows = document.getElementById('totalRows');
    const validRows = document.getElementById('validRows');
    const invalidRows = document.getElementById('invalidRows');
    const importDataBtn = document.getElementById('importDataBtn');
    const previewContent = document.getElementById('previewContent');
    
    // Actualizar estadísticas
    totalRows.textContent = `Total: ${importData.parsedData.length} filas`;
    validRows.textContent = `Válidas: ${importData.validRows.length}`;
    invalidRows.textContent = `Con errores: ${importData.invalidRows.length}`;
    
    // Habilitar botón de importación si hay filas válidas
    importDataBtn.disabled = importData.validRows.length === 0;
    
    // Mostrar vista previa
    if (importData.parsedData.length === 0) {
        previewContent.innerHTML = '<p class="no-preview">No se encontraron datos en el archivo</p>';
        return;
    }
    
    let html = '<table><thead><tr>';
    const headers = Object.keys(importData.parsedData[0]);
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    importData.parsedData.forEach((row, index) => {
        const isValid = importData.validRows.includes(row);
        const rowClass = isValid ? 'valid-row' : 'invalid-row';
        
        html += `<tr class="${rowClass}">`;
        headers.forEach(header => {
            const value = row[header] || '';
            const isError = !isValid && row.errors && row.errors.includes(header);
            const cellClass = isError ? 'error-cell' : '';
            html += `<td class="${cellClass}">${value}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    previewContent.innerHTML = html;
    
    // Cambiar a pestaña de vista previa
    document.querySelector('[data-tab="preview"]').click();
}

function importValidData() {
    if (importData.validRows.length === 0) {
        alert('No hay datos válidos para importar.');
        return;
    }
    
    let importedCount = 0;
    let categoriesCreated = 0;
    
    importData.validRows.forEach(row => {
        // Crear transacción
        const transaction = {
            id: Date.now() + Math.random(),
            description: row.descripción,
            amount: Math.abs(parseFloat(row.monto)),
            type: row.tipo.toLowerCase(),
            category: row.categoría,
            date: row.fecha,
            comment: row.comentario || null,
            createdBy: currentUser,
            createdAt: new Date().toISOString(),
            lastModifiedBy: currentUser,
            lastModifiedAt: new Date().toISOString()
        };
        
        transactions.push(transaction);
        
        // Crear categoría si no existe
        if (!categoryGroups[row.categoría]) {
            categoryGroups[row.categoría] = [];
            categoriesCreated++;
        }
        
        // Crear subcategoría si existe y no está en la categoría
        if (row.subcategoría && !categoryGroups[row.categoría].includes(row.subcategoría)) {
            categoryGroups[row.categoría].push(row.subcategoría);
        }
        
        // Actualizar spent si es gasto
        if (transaction.type === 'gasto') {
            const category = categories.find(c => c.name === transaction.category);
            if (category) {
                category.spent += transaction.amount;
            }
        }
        
        importedCount++;
    });
    
    // Registrar en historial
    addToHistory(
        'Importó datos',
        `${importedCount} transacciones importadas, ${categoriesCreated} categorías creadas`,
        'transaction'
    );
    
    // Guardar datos
    saveData();
    saveCategoryGroups();
    updateUI();
    
    // Mostrar resumen
    alert(`Importación completada:\n- ${importedCount} transacciones importadas\n- ${categoriesCreated} categorías creadas`);
    
    // Limpiar datos de importación
    importData = {
        file: null,
        parsedData: [],
        validRows: [],
        invalidRows: []
    };
    
    // Cerrar modal
    closeModal('importModal');
    
    // Limpiar vista previa
    document.getElementById('previewContent').innerHTML = '<p class="no-preview">Sube un archivo para ver la vista previa</p>';
    document.getElementById('fileInfo').style.display = 'none';
}

function resetToDefaultCategories() {
    if (!confirm('¿Estás seguro de que quieres restablecer todas las categorías por defecto? Esto eliminará las categorías personalizadas que hayas creado.')) {
        return;
    }
    
    // Restablecer categoryGroups a las categorías por defecto
    categoryGroups = { ...defaultCategoryGroups };
    saveCategoryGroups();
    
    // Limpiar categorías del presupuesto (mantener solo las básicas)
    categories = [
        {
            id: Date.now() + 1,
            name: 'Alimentación y Bebidas',
            subcategory: 'Supermercado',
            budget: 12000,
            recurringDate: new Date().toISOString().split('T')[0],
            color: defaultColors['Alimentación y Bebidas'],
            spent: 0
        },
        {
            id: Date.now() + 2,
            name: 'Vivienda y Servicios',
            subcategory: 'Renta o hipoteca',
            budget: 18000,
            recurringDate: new Date().toISOString().split('T')[0],
            color: defaultColors['Vivienda y Servicios'],
            spent: 0
        },
        {
            id: Date.now() + 3,
            name: 'Transporte',
            subcategory: 'Gasolina',
            budget: 4000,
            recurringDate: new Date().toISOString().split('T')[0],
            color: defaultColors['Transporte'],
            spent: 0
        }
    ];
    
    saveData();
    clearCaches();
    updateUI(true);
    
    // Registrar en historial
    addToHistory(
        'Restableció categorías por defecto',
        'Categorías personalizadas eliminadas, restauradas categorías por defecto',
        'category'
    );
    
    alert('Categorías restablecidas por defecto. Se han eliminado las categorías personalizadas.');
}



// Colores por defecto para las categorías principales
const defaultColors = {
    'Alimentación y Bebidas': '#34c759',      // Verde
    'Vivienda y Servicios': '#ff9500',        // Naranja
    'Transporte': '#007aff',                  // Azul
    'Salud y Bienestar': '#ff3b30',          // Rojo
    'Educación': '#5856d6',                  // Índigo
    'Ropa y Calzado': '#ff2d92',            // Rosa
    'Entretenimiento y Ocio': '#af52de',     // Púrpura
    'Tecnología y Comunicación': '#5ac8fa',  // Cian
    'Servicios Financieros': '#30d158',      // Verde claro
    'Mascotas': '#8e8e93',                  // Gris
    'Regalos y Celebraciones': '#ffcc02',    // Amarillo
    'Gastos Varios': '#8e8e93'              // Gris
};

// Iconos por defecto para las categorías principales
const defaultIcons = {
    'Alimentación y Bebidas': 'fas fa-utensils',
    'Vivienda y Servicios': 'fas fa-home',
    'Transporte': 'fas fa-car',
    'Salud y Bienestar': 'fas fa-heartbeat',
    'Educación': 'fas fa-graduation-cap',
    'Ropa y Calzado': 'fas fa-tshirt',
    'Entretenimiento y Ocio': 'fas fa-gamepad',
    'Tecnología y Comunicación': 'fas fa-mobile-alt',
    'Servicios Financieros': 'fas fa-piggy-bank',
    'Mascotas': 'fas fa-paw',
    'Regalos y Celebraciones': 'fas fa-gift',
    'Gastos Varios': 'fas fa-ellipsis-h'
};

// Categorías por defecto si no existen datos
const defaultCategoryGroups = {
    'Alimentación y Bebidas': [
        'Supermercado semanal',
        'Frutas y verduras',
        'Carnes y pescados',
        'Lácteos y huevos',
        'Pan y cereales',
        'Bebidas y jugos',
        'Snacks y dulces',
        'Restaurantes',
        'Delivery y comida rápida',
        'Café y bebidas fuera',
        'Especias y condimentos',
        'Productos de limpieza'
    ],
    'Transporte': [
        'Gasolina',
        'Transporte público',
        'Uber/Taxi',
        'Mantenimiento del auto',
        'Seguro del auto',
        'Estacionamiento',
        'Peajes',
        'Bicicleta',
        'Reparaciones',
        'Licencias y permisos'
    ],
    'Vivienda': [
        'Renta',
        'Hipoteca',
        'Servicios básicos',
        'Mantenimiento',
        'Seguro de hogar',
        'Muebles y decoración',
        'Jardinería',
        'Limpieza',
        'Reparaciones menores',
        'Mejoras del hogar'
    ],
    'Salud': [
        'Consultas médicas',
        'Medicamentos',
        'Seguro médico',
        'Dentista',
        'Óptica',
        'Gimnasio',
        'Vitaminas',
        'Emergencias médicas',
        'Terapias',
        'Exámenes médicos'
    ],
    'Educación': [
        'Colegiatura',
        'Libros y materiales',
        'Cursos y talleres',
        'Transporte escolar',
        'Uniformes',
        'Actividades extracurriculares',
        'Tecnología educativa',
        'Tutorías',
        'Eventos escolares',
        'Becas y ayudas'
    ],
    'Entretenimiento': [
        'Cine y teatro',
        'Conciertos',
        'Deportes',
        'Videojuegos',
        'Libros y revistas',
        'Música y streaming',
        'Hobbies',
        'Viajes y vacaciones',
        'Restaurantes',
        'Actividades sociales'
    ],
    'Tecnología y Comunicación': [
        'Celulares y tablets',
        'Computadoras',
        'Accesorios tecnológicos',
        'Software y apps',
        'Servicios en la nube',
        'Reparaciones',
        'Cables y cargadores',
        'Impresión y fotos',
        'Gadgets y wearables',
        'Consolas de videojuegos',
        'Audio y video',
        'Equipos de oficina'
    ],
    'Servicios Financieros': [
        'Cuenta de ahorros',
        'Inversiones',
        'Fondo de emergencia',
        'Seguros varios',
        'Pensiones',
        'Tarjetas de crédito',
        'Préstamos',
        'Gastos bancarios',
        'Impuestos',
        'Metas financieras',
        'Criptomonedas',
        'Planes de retiro'
    ],
    'Mascotas': [
        'Alimento para mascotas',
        'Veterinario',
        'Vacunas',
        'Juguetes y accesorios',
        'Pelaje y limpieza',
        'Seguro de mascotas',
        'Adiestramiento',
        'Pensión y cuidado',
        'Medicamentos',
        'Camas y casas',
        'Collares y correas',
        'Servicios de grooming'
    ],
    'Regalos y Celebraciones': [
        'Cumpleaños',
        'Navidad',
        'Día de la madre/padre',
        'Bodas y aniversarios',
        'Graduaciones',
        'Baby showers',
        'Regalos de empresa',
        'Donaciones',
        'Flores y plantas',
        'Tarjetas y envoltorios',
        'Celebraciones especiales',
        'Regalos de último minuto'
    ],
    'Gastos Varios': [
        'Regalos inesperados',
        'Multas y sanciones',
        'Gastos bancarios',
        'Imprevistos',
        'Propinas',
        'Pequeñas reparaciones',
        'Artículos de papelería',
        'Gastos de oficina',
        'Servicios de mensajería',
        'Almacenamiento',
        'Gastos de mudanza',
        'Otros gastos menores'
    ]
};

// Categorías específicas para ingresos
const defaultIncomeCategories = {
    'Ingresos Laborales': [
        'Salario fijo',
        'Comisiones',
        'Bonos',
        'Horas extra',
        'Propinas',
        'Freelance',
        'Consultoría',
        'Trabajo temporal'
    ],
    'Ingresos por Inversiones': [
        'Intereses bancarios',
        'Dividendos',
        'Ganancias de capital',
        'Rendimientos de fondos',
        'Criptomonedas',
        'Bienes raíces',
        'Préstamos personales',
        'Inversiones en negocios'
    ],
    'Ingresos Pasivos': [
        'Alquiler de propiedades',
        'Royalties',
        'Licencias',
        'Afiliados',
        'Publicidad',
        'Venta de productos digitales',
        'Membresías',
        'Suscripciones'
    ],
    'Ingresos Extraordinarios': [
        'Herencia',
        'Premios y lotería',
        'Reembolsos',
        'Compensaciones',
        'Venta de bienes',
        'Donaciones recibidas',
        'Seguros',
        'Indemnizaciones'
    ],
    'Otros Ingresos': [
        'Ventas ocasionales',
        'Trabajos de temporada',
        'Ingresos por hobbies',
        'Ayudas gubernamentales',
        'Becas',
        'Subvenciones',
        'Ingresos por eventos',
        'Otros ingresos varios'
    ]
};

// Elementos del DOM
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const addTransactionBtn = document.getElementById('addTransactionBtn');
const categoryModal = document.getElementById('categoryModal');
const transactionModal = document.getElementById('transactionModal');
const categoryForm = document.getElementById('categoryForm');
const transactionForm = document.getElementById('transactionForm');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando aplicación...');
    
    try {
        // Inicializar optimizaciones primero
        initializeOptimizations();
        
        loadDataSafely();
        initializeLogin();
        
        // En modo desarrollo, forzar actualización del Service Worker
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.update();
                    });
                });
            }
            
            // Atajo de teclado para limpiar cache (Ctrl+Shift+R o Cmd+Shift+R)
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
                    e.preventDefault();
                    console.log('Limpiando cache con atajo de teclado...');
                    if (window.clearAppCache) {
                        window.clearAppCache();
                    } else {
                        window.location.reload();
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error durante la inicialización:', error);
    }
    
    // Event listeners para login (removidos - se manejan en setupLoginFormEvents)
    console.log('✅ Event listeners de login se configuran en setupLoginFormEvents');
    
    // Configurar eventos del formulario de login mejorado
    setTimeout(() => {
        setupLoginFormEvents();
    }, 100);
    
    // Configurar eventos de sincronización
    setupSyncEventListeners();
    
    // Cargar configuración de sincronización
    setTimeout(() => {
        loadSyncConfig();
    }, 2000);
});



// Función handleRegister eliminada - se usa la versión async con Firebase Auth

async function initializeApp() {
    // Solo inicializar si hay un usuario logueado
    if (!currentUser) return;
    
    console.log('Inicializando aplicación para usuario:', currentUser);
    
    // Verificar elementos críticos del DOM
    const criticalElements = [
        'addCategoryBtn',
        'categoryForm',
        'transactionForm',
        'addGastoBtn',
        'addIngresoBtn',
        'gastosContainer',
        'ingresosContainer'
    ];
    
    const missingElements = criticalElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
        console.warn('⚠️ Elementos faltantes del DOM:', missingElements);
    } else {
        console.log('✅ Todos los elementos críticos del DOM están presentes');
    }
    
    // Inicializar sistemas
    initializeCollaboration();
    initializeHistory();
    initializeImport();
    
    // Cargar metas
    loadGoals();
    
    // Cargar cuentas bancarias
    loadBankAccounts();
    
    // Inicializar notificaciones después de cargar datos
    setTimeout(() => {
        initializeNotifications();
    }, 100);
    
    // Inicializar tema y PWA
    initializeTheme();
    checkPWAInstallation();
    
    // Configurar guardado automático
    setupAutoSave();
    
    // Inicializar categorías por defecto si no existen
    initializeDefaultCategories();
    
    // Asegurar que las categorías de ingresos estén disponibles
    if (Object.keys(categoryGroups).length === 0) {
        console.log('Inicializando categorías de ingresos...');
        Object.keys(defaultIncomeCategories).forEach(categoryName => {
            categoryGroups[categoryName] = [...defaultIncomeCategories[categoryName]];
        });
        saveCategoryGroups();
    }
    
    // Establecer fecha actual en el formulario de transacciones
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    
    // Establecer fecha actual en el formulario de categorías
    document.getElementById('categoryRecurringDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('selectCategoryRecurringDate').value = new Date().toISOString().split('T')[0];
    
    // Configurar event listeners
    setupEventListeners();
    
    // Configurar event delegation para botones de cuentas
    setupBankAccountEventDelegation();
    
    // Verificar y actualizar fechas de tarjetas de crédito
    checkAndUpdateCreditCardDates();
    
    // Configurar manejo inteligente de fechas
    setupSmartDateHandling();
    
    // Actualizar dropdowns de categorías
    updateCategoryDropdowns();
    updateCategorySelect();
    updateCategoryFilters();
    
    // Actualizar la interfaz con force update para asegurar que todo se cargue correctamente
    updateUI(true);
}

function setupEventListeners() {
    console.log('🔧 Configurando event listeners...');
    console.log('🔍 Verificando elementos del DOM...');
    
    // Declarar todas las variables al inicio
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryForm = document.getElementById('categoryForm');
    const transactionForm = document.getElementById('transactionForm');
    const addGastoBtn = document.getElementById('addGastoBtn');
    const addIngresoBtn = document.getElementById('addIngresoBtn');
    const addTransferenciaBtn = document.getElementById('addTransferenciaBtn');
    const addPagoTarjetaBtn = document.getElementById('addPagoTarjetaBtn');
    
    // Navegación de pestañas
    if (tabButtons && tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                switchTab(button.dataset.tab);
            });
        });
    } else {
        console.error('No se encontraron los botones de pestañas');
    }

    // Botones de modales
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => openModal('categoryModal'));
    } else {
        console.error('No se encontró el elemento addCategoryBtn');
    }
    
    // El botón addTransactionBtn no existe en el HTML, se usan addGastoBtn y addIngresoBtn en su lugar
    
    // Botones de nuevo gasto e ingreso
    if (addGastoBtn) {
        addGastoBtn.addEventListener('click', () => openTransactionModal('gasto'));
    } else {
        console.error('No se encontró el elemento addGastoBtn');
    }
    
    if (addIngresoBtn) {
        addIngresoBtn.addEventListener('click', () => openTransactionModal('ingreso'));
    } else {
        console.error('No se encontró el elemento addIngresoBtn');
    }
    
    // Botón de nueva transferencia
    if (addTransferenciaBtn) {
        addTransferenciaBtn.addEventListener('click', () => openTransactionModal('transferencia'));
    } else {
        console.error('No se encontró el elemento addTransferenciaBtn');
    }
    
    // Botón de nuevo pago de tarjeta
    if (addPagoTarjetaBtn) {
        addPagoTarjetaBtn.addEventListener('click', () => openPagoTarjetaModal());
    } else {
        console.error('No se encontró el elemento addPagoTarjetaBtn');
    }
    
    const selectCategoryBtn = document.getElementById('selectCategoryBtn');
    if (selectCategoryBtn) {
        selectCategoryBtn.addEventListener('click', () => openModal('selectCategoryModal'));
    } else {
        console.error('No se encontró el elemento selectCategoryBtn');
    }

    // Botón de colaboración
    const collaborationBtn = document.getElementById('collaborationBtn');
    if (collaborationBtn) {
        collaborationBtn.addEventListener('click', openCollaborationModal);
    }
    
    // Botón de importación
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            openModal('importModal');
        });
    }

    // Cerrar modales
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Formularios
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
    } else {
        console.error('No se encontró el formulario categoryForm');
    }
    
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    } else {
        console.error('No se encontró el formulario transactionForm');
    }
    
    // Formulario de pago de tarjetas
    const pagoTarjetaForm = document.getElementById('pagoTarjetaForm');
    if (pagoTarjetaForm) {
        pagoTarjetaForm.addEventListener('submit', handlePagoTarjetaSubmit);
    } else {
        console.error('No se encontró el formulario pagoTarjetaForm');
    }
    
    // Event listeners para subpestañas de transacciones
    const subtabBtns = document.querySelectorAll('.subtab-btn');
    const gastosContainer = document.getElementById('gastosContainer');
    const ingresosContainer = document.getElementById('ingresosContainer');
    const transferenciasContainer = document.getElementById('transferenciasContainer');
    const pagosTarjetasContainer = document.getElementById('pagosTarjetasContainer');
    
    if (subtabBtns.length > 0) {
        subtabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remover clase active de todos los botones
                subtabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Ocultar todos los contenedores
                if (gastosContainer) gastosContainer.classList.remove('active');
                if (ingresosContainer) ingresosContainer.classList.remove('active');
                if (transferenciasContainer) transferenciasContainer.classList.remove('active');
                if (pagosTarjetasContainer) pagosTarjetasContainer.classList.remove('active');
                
                // Ocultar todos los botones
                if (addGastoBtn) addGastoBtn.style.display = 'none';
                if (addIngresoBtn) addIngresoBtn.style.display = 'none';
                if (addTransferenciaBtn) addTransferenciaBtn.style.display = 'none';
                if (addPagoTarjetaBtn) addPagoTarjetaBtn.style.display = 'none';
                
                // Mostrar contenedor y botón correspondiente según la subpestaña
                if (btn.dataset.subtab === 'gastos') {
                    if (gastosContainer) gastosContainer.classList.add('active');
                    if (addGastoBtn) addGastoBtn.style.display = '';
                } else if (btn.dataset.subtab === 'ingresos') {
                    if (ingresosContainer) ingresosContainer.classList.add('active');
                    if (addIngresoBtn) addIngresoBtn.style.display = '';
                } else if (btn.dataset.subtab === 'transferencias') {
                    if (transferenciasContainer) transferenciasContainer.classList.add('active');
                    if (addTransferenciaBtn) addTransferenciaBtn.style.display = '';
                } else if (btn.dataset.subtab === 'pagos-tarjetas') {
                    if (pagosTarjetasContainer) pagosTarjetasContainer.classList.add('active');
                    if (addPagoTarjetaBtn) addPagoTarjetaBtn.style.display = '';
                }
            });
        });
        
        // Mostrar por defecto la pestaña de gastos
        const gastosTab = document.querySelector('[data-subtab="gastos"]');
        if (gastosTab) {
            gastosTab.click();
        }
    }

    // Botones de agregar categoría y subcategoría
    const addSubcategoryBtn = document.getElementById('addSubcategoryBtn');
    const selectCategoryForm = document.getElementById('selectCategoryForm');
    
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', showAddCategoryInput);
    } else {
        console.error('No se encontró el elemento addCategoryBtn');
    }
    
    if (addSubcategoryBtn) {
        addSubcategoryBtn.addEventListener('click', showAddSubcategoryInput);
    } else {
        console.error('No se encontró el elemento addSubcategoryBtn');
    }
    
    if (selectCategoryForm) {
        selectCategoryForm.addEventListener('submit', addSelectedCategoryToBudget);
    } else {
        console.error('No se encontró el formulario selectCategoryForm');
    }
    
    // Event listeners para manejo de frecuencias
    const categoryFrequencySelect = document.getElementById('categoryRecurringFrequency');
    const selectCategoryFrequencySelect = document.getElementById('selectCategoryRecurringFrequency');
    
    if (categoryFrequencySelect) {
        categoryFrequencySelect.addEventListener('change', handleFrequencyChange);
    }
    
    if (selectCategoryFrequencySelect) {
        selectCategoryFrequencySelect.addEventListener('change', handleSelectFrequencyChange);
    }
    
    // Event listeners para cambios de categoría
    const categoryNameSelect = document.getElementById('categoryName');
    const selectCategoryNameSelect = document.getElementById('selectCategoryName');
    
    if (categoryNameSelect) {
        categoryNameSelect.addEventListener('change', updateSubcategoryDropdown);
        console.log('Event listener agregado a categoryName');
    } else {
        console.error('No se encontró el elemento categoryName');
    }
    
    if (selectCategoryNameSelect) {
        selectCategoryNameSelect.addEventListener('change', updateSelectSubcategoryDropdown);
        console.log('Event listener agregado a selectCategoryName');
    } else {
        console.error('No se encontró el elemento selectCategoryName');
    }

    // Filtros de transacciones
    const monthFilter = document.getElementById('monthFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (monthFilter) {
        monthFilter.addEventListener('change', filterTransactions);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterTransactions);
    }
    
    // Configurar pestañas de colaboración
    setupCollaborationTabs();
    
    // Filtros del historial
    const historyTypeFilter = document.getElementById('historyTypeFilter');
    const historyUserFilter = document.getElementById('historyUserFilter');
    
    if (historyTypeFilter) {
        historyTypeFilter.addEventListener('change', loadHistoryData);
    }
    
    if (historyUserFilter) {
        historyUserFilter.addEventListener('change', loadHistoryData);
    }
    
    // Botones de importación
    const importDataBtn = document.getElementById('importDataBtn');
    const cancelImportBtn = document.getElementById('cancelImportBtn');
    
    if (importDataBtn) {
        importDataBtn.addEventListener('click', importValidData);
    }
    
    if (cancelImportBtn) {
        cancelImportBtn.addEventListener('click', () => {
            closeModal('importModal');
            // Limpiar datos de importación
            importData = {
                file: null,
                parsedData: [],
                validRows: [],
                invalidRows: []
            };
            document.getElementById('previewContent').innerHTML = '<p class="no-preview">Sube un archivo para ver la vista previa</p>';
            document.getElementById('fileInfo').style.display = 'none';
        });
    }
    
    // Botón de reset de categorías
    const resetCategoriesBtn = document.getElementById('resetCategoriesBtn');
    if (resetCategoriesBtn) {
        resetCategoriesBtn.addEventListener('click', resetToDefaultCategories);
    }
    
    // Botones de depuración (solo para desarrollo)
    const debugTransactionsBtn = document.getElementById('debugTransactionsBtn');
    const resetTransactionsBtn = document.getElementById('resetTransactionsBtn');
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    
    if (debugTransactionsBtn) {
        debugTransactionsBtn.addEventListener('click', debugTransactions);
    }
    
    if (resetTransactionsBtn) {
        resetTransactionsBtn.addEventListener('click', resetTransactionData);
    }
    
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
            if (window.clearAppCache) {
                window.clearAppCache();
            } else {
                console.log('Función clearAppCache no disponible');
                // Fallback: recargar la página
                window.location.reload();
            }
        });
    }
    
    // Botón para arreglar cuentas duplicadas
    const fixDuplicateAccountsBtn = document.getElementById('fixDuplicateAccountsBtn');
    if (fixDuplicateAccountsBtn) {
        fixDuplicateAccountsBtn.addEventListener('click', () => {
            const beforeCount = bankAccounts.length;
            const removedCount = removeDuplicateAccounts();
            
            if (removedCount > 0) {
                updateBankAccountsDisplay();
                updateAccountSummary();
                showNotification(`${removedCount} cuentas duplicadas eliminadas`, 'success');
            } else {
                showNotification('No se encontraron cuentas duplicadas', 'info');
            }
        });
    }
    
    // Botón de sincronización en la nube
    const cloudSyncBtn = document.getElementById('cloudSyncBtn');
    console.log('🔍 Buscando botón de sincronización en la nube:', cloudSyncBtn);
    if (cloudSyncBtn) {
        console.log('✅ Botón de sincronización encontrado, agregando event listener');
        cloudSyncBtn.addEventListener('click', () => {
            console.log('🔄 Abriendo modal de sincronización en la nube');
            openModal('cloudSyncModal');
            setupCloudSyncTabs();
            updateSyncStatus();
        });
    } else {
        console.error('❌ Botón de sincronización en la nube NO encontrado');
        // Verificar si el elemento existe en el DOM
        setTimeout(() => {
            const retryCloudSyncBtn = document.getElementById('cloudSyncBtn');
            console.log('🔄 Reintentando buscar botón de sincronización:', retryCloudSyncBtn);
            if (retryCloudSyncBtn) {
                console.log('✅ Botón encontrado en segundo intento');
                retryCloudSyncBtn.addEventListener('click', () => {
                    openModal('cloudSyncModal');
                    setupCloudSyncTabs();
                    updateSyncStatus();
                });
            }
        }, 1000);
    }
    
    // Botón de backup
    const backupBtn = document.getElementById('backupBtn');
    if (backupBtn) {
        backupBtn.addEventListener('click', createBackup);
    }
    
    // Menú desplegable
    const menuBtn = document.getElementById('menuBtn');
    const menuDropdown = document.getElementById('menuDropdown');
    
    console.log('🔍 Buscando elementos del menú:');
    console.log('Menu button:', menuBtn);
    console.log('Menu dropdown:', menuDropdown);
    
    if (menuBtn && menuDropdown) {
        console.log('✅ Elementos del menú encontrados, configurando event listener');
        menuBtn.addEventListener('click', (e) => {
            console.log('🔄 Clic en botón de menú');
            e.stopPropagation();
            menuDropdown.classList.toggle('show');
            console.log('🔄 Clase show toggleada:', menuDropdown.classList.contains('show'));
        });
    } else {
        console.error('❌ Elementos del menú NO encontrados');
    }
    
    // Cerrar menú al hacer clic fuera (solo si los elementos existen)
    if (menuBtn && menuDropdown) {
        document.addEventListener('click', (e) => {
            if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
                menuDropdown.classList.remove('show');
            }
        });
        
        // Cerrar menú al hacer clic en cualquier elemento del menú
        menuDropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('menu-item')) {
                menuDropdown.classList.remove('show');
            }
        });
    }
    
    // Event listener para ingresos recurrentes
    const incomeForm = document.getElementById('incomeForm');
    const incomeFrequencySelect = document.getElementById('incomeFrequency');
    
    if (incomeForm) {
        incomeForm.addEventListener('submit', handleIncomeSubmit);
    }
    
    if (incomeFrequencySelect) {
        incomeFrequencySelect.addEventListener('change', handleIncomeFrequencyChange);
    }
    
    // Event listener para botón de nuevo ingreso
    const addIncomeBtn = document.getElementById('addIncomeBtn');
    if (addIncomeBtn) {
        addIncomeBtn.addEventListener('click', () => {
            // Limpiar formulario
            document.getElementById('incomeForm').reset();
            document.getElementById('incomeModalTitle').textContent = 'Nuevo Ingreso Recurrente';
            delete document.getElementById('incomeForm').dataset.editId;
            
            // Inicializar fecha de inicio
            const today = new Date().toISOString().split('T')[0];
            const incomeStartDate = document.getElementById('incomeStartDate');
            if (incomeStartDate) {
                incomeStartDate.value = today;
            }
            
            openModal('incomeModal');
        });
    }
    
    // Event listeners para cuentas bancarias
    const addBankAccountBtn = document.getElementById('addBankAccountBtn');
    const bankAccountForm = document.getElementById('bankAccountForm');
    const importBankTransactionsBtn = document.getElementById('importBankTransactionsBtn');
    const reconcileAccountsBtn = document.getElementById('reconcileAccountsBtn');
    
    if (addBankAccountBtn) {
        addBankAccountBtn.addEventListener('click', () => {
            // Limpiar formulario
            if (bankAccountForm) {
                bankAccountForm.reset();
                document.getElementById('bankAccountModalTitle').textContent = 'Nueva Cuenta Bancaria';
                delete bankAccountForm.dataset.editId;
            }
            openModal('bankAccountModal');
        });
        console.log('✅ Event listener agregado a addBankAccountBtn');
    } else {
        console.error('No se encontró el elemento addBankAccountBtn');
    }
    
    if (bankAccountForm) {
        bankAccountForm.addEventListener('submit', handleBankAccountSubmit);
        console.log('✅ Event listener agregado a bankAccountForm');
    } else {
        console.error('No se encontró el formulario bankAccountForm');
    }
    
    if (importBankTransactionsBtn) {
        importBankTransactionsBtn.addEventListener('click', () => {
            openModal('importBankTransactionsModal');
            // Actualizar dropdown de cuentas cuando se abra el modal
            setTimeout(() => {
                updateImportAccountDropdown();
            }, 100);
        });
        console.log('✅ Event listener agregado a importBankTransactionsBtn');
    } else {
        console.error('No se encontró el elemento importBankTransactionsBtn');
    }
    
    if (reconcileAccountsBtn) {
        reconcileAccountsBtn.addEventListener('click', () => {
            // Implementar lógica de conciliación
            showNotification('Función de conciliación en desarrollo', 'info');
        });
        console.log('✅ Event listener agregado a reconcileAccountsBtn');
    } else {
        console.error('No se encontró el elemento reconcileAccountsBtn');
    }
    
    // Event listeners para reportes avanzados
    const reportMonthAdvanced = document.getElementById('reportMonth');
    const reportType = document.getElementById('reportType');
    const exportReportBtn = document.getElementById('exportReportBtn');
    
    if (reportMonthAdvanced) {
        reportMonthAdvanced.addEventListener('change', updateAdvancedReports);
    }
    
    if (reportType) {
        reportType.addEventListener('change', updateAdvancedReports);
    }
    
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', exportReport);
    }
    
    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
        console.log('✅ Event listener agregado al botón de logout');
    } else {
        console.error('❌ Botón de logout no encontrado');
    }
    
    // Botón de guardar configuración de sincronización
    const saveSyncConfigBtn = document.querySelector('#syncConfigModal .btn-primary');
    if (saveSyncConfigBtn) {
        saveSyncConfigBtn.addEventListener('click', saveSyncConfig);
        console.log('✅ Event listener agregado al botón de guardar configuración de sincronización');
    } else {
        console.error('❌ Botón de guardar configuración de sincronización no encontrado');
    }
    
    // Botón de solicitar permisos de notificación
    const requestNotificationPermissionBtn = document.getElementById('requestNotificationPermissionBtn');
    if (requestNotificationPermissionBtn) {
        requestNotificationPermissionBtn.addEventListener('click', () => {
            if (window.notificationService) {
                window.notificationService.requestNotificationPermission().then(permission => {
                    if (permission === 'granted') {
                        console.log('✅ Permisos de notificación concedidos');
                        window.notificationService.show('Notificaciones activadas correctamente', 'success', { duration: 3000 });
                        // Ocultar el botón después de activar
                        requestNotificationPermissionBtn.style.display = 'none';
                    } else if (permission === 'denied') {
                        console.log('❌ Permisos de notificación denegados');
                        window.notificationService.show('Los permisos de notificación fueron denegados. Puedes habilitarlos en la configuración del navegador.', 'warning', { duration: 5000 });
                    }
                });
            }
        });
        console.log('✅ Event listener agregado al botón de solicitar permisos de notificación');
    } else {
        console.error('❌ Botón de solicitar permisos de notificación no encontrado');
    }
    
    // Botón de cambio de tema en el menú
    const menuThemeToggleBtn = document.getElementById('menuThemeToggleBtn');
    if (menuThemeToggleBtn) {
        menuThemeToggleBtn.addEventListener('click', toggleTheme);
        console.log('✅ Event listener agregado al botón de cambio de tema');
    } else {
        console.error('❌ Botón de cambio de tema no encontrado');
    }
    
    // Botones de metas
    const addGoalBtn = document.getElementById('addGoalBtn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', showAddGoalModal);
        console.log('✅ Event listener agregado al botón de nueva meta');
    } else {
        console.error('❌ Botón de nueva meta no encontrado');
    }
    
    // Formulario de metas
    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', handleGoalSubmit);
        console.log('✅ Event listener agregado al formulario de metas');
    } else {
        console.error('❌ Formulario de metas no encontrado');
    }
}

function switchTab(tabName) {
    // Remover clase active de todos los botones y contenidos
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Agregar clase active al botón y contenido seleccionado
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    // Actualizar contenido específico de la pestaña
    if (tabName === 'reportes') {
        updateReports();
    }
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    
    // Actualizar dropdowns cuando se abre un modal que los usa
    if (modalId === 'categoryModal' || modalId === 'transactionModal' || modalId === 'selectCategoryModal') {
        updateCategoryDropdowns();
        updateCategorySelect();
        updateCategoryFilters();
        
        // Forzar actualización de subcategorías después de un pequeño delay
        setTimeout(() => {
            updateSubcategoryDropdown();
            updateSelectSubcategoryDropdown();
        }, 100);
    }
    
    // Cargar configuración cuando se abre el modal de sincronización
    if (modalId === 'syncConfigModal') {
        setTimeout(() => {
            loadSyncConfigToForm();
        }, 100);
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Limpiar formularios
    if (modalId === 'categoryModal') {
        categoryForm.reset();
        // Resetear el formulario a modo creación
        delete categoryForm.dataset.editId;
        document.getElementById('categoryModalTitle').textContent = 'Nueva Categoría';
        const submitBtn = document.querySelector('#categoryForm .btn-primary');
        submitBtn.textContent = 'Guardar';
        // Establecer fecha actual en el campo de fecha recurrente
        document.getElementById('categoryRecurringDate').value = new Date().toISOString().split('T')[0];
        // Resetear dropdowns
        document.getElementById('categoryName').value = '';
        document.getElementById('categorySubcategory').value = '';
        updateSubcategoryDropdown();
    } else if (modalId === 'selectCategoryModal') {
        // Resetear formulario de selección de categorías
        document.getElementById('selectCategoryName').value = '';
        document.getElementById('selectSubcategoryName').value = '';
        document.getElementById('selectCategoryBudget').value = '';
        document.getElementById('selectCategoryRecurringDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('selectCategoryColor').value = '#007bff';
        updateSelectSubcategoryDropdown();
    } else if (modalId === 'transactionModal') {
        transactionForm.reset();
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        // Resetear el formulario a modo creación
        delete transactionForm.dataset.editId;
        document.getElementById('transactionModalTitle').textContent = 'Nueva Transacción';
        const submitBtn = document.querySelector('#transactionForm .btn-primary');
        submitBtn.textContent = 'Guardar';
    }
}

function handleCategorySubmit(e) {
    e.preventDefault();
    
    const categoryId = document.getElementById('categoryForm').dataset.editId;
    
    if (categoryId) {
        // Editar categoría existente
        const categoryIndex = categories.findIndex(cat => cat.id === parseInt(categoryId));
        if (categoryIndex !== -1) {
            const categoryName = document.getElementById('categoryName').value;
            const frequency = document.getElementById('categoryRecurringFrequency').value;
            const customDays = frequency === 'custom' ? parseInt(document.getElementById('categoryCustomDays').value) : null;
            
            categories[categoryIndex] = {
                ...categories[categoryIndex],
                name: categoryName,
                subcategory: document.getElementById('categorySubcategory').value || null,
                budget: parseFloat(document.getElementById('categoryBudget').value),
                recurringDate: document.getElementById('categoryRecurringDate').value,
                frequency: frequency,
                customDays: customDays,
                color: getCategoryColor(categoryName)
            };
        }
        delete document.getElementById('categoryForm').dataset.editId;
    } else {
        // Crear nueva categoría
        const categoryName = document.getElementById('categoryName').value;
        const subcategoryName = document.getElementById('categorySubcategory').value || null;
        const frequency = document.getElementById('categoryRecurringFrequency').value;
        const customDays = frequency === 'custom' ? parseInt(document.getElementById('categoryCustomDays').value) : null;
        
        // Usar el color de la categoría principal
        const categoryColor = getCategoryColor(categoryName);
        
        const categoryData = {
            id: Date.now(),
            name: categoryName,
            subcategory: subcategoryName,
            budget: parseFloat(document.getElementById('categoryBudget').value),
            recurringDate: document.getElementById('categoryRecurringDate').value,
            frequency: frequency,
            customDays: customDays,
            color: categoryColor,
            spent: 0
        };
        categories.push(categoryData);
        
        // Agregar a los grupos si no existe
        if (!categoryGroups[categoryData.name]) {
            categoryGroups[categoryData.name] = [];
        }
        if (categoryData.subcategory && !categoryGroups[categoryData.name].includes(categoryData.subcategory)) {
            categoryGroups[categoryData.name].push(categoryData.subcategory);
        }
        saveCategoryGroups();
    }

    saveData();
    addToHistory('Categoría', categoryId ? `Editó categoría: ${document.getElementById('categoryName').value}` : `Agregó categoría: ${document.getElementById('categoryName').value}`, 'category');
    clearCaches(); // Limpiar caches cuando se actualicen datos
    updateUI();
    closeModal('categoryModal');
    
    // Mostrar confirmación
    const categoryName = document.getElementById('categoryName').value;
    showVisualNotification(
        categoryId ? 'Categoría actualizada' : 'Categoría agregada',
        `La categoría "${categoryName}" se ha ${categoryId ? 'actualizado' : 'agregado'} correctamente.`,
        'budget'
    );
}

function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const description = document.getElementById('transactionDescription').value.trim();
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const type = document.getElementById('transactionType').value;
    const category = document.getElementById('transactionCategory').value;
    const accountId = document.getElementById('transactionAccount').value;
    const transferToAccountId = document.getElementById('transferToAccount').value;
    const date = document.getElementById('transactionDate').value;
    const comment = document.getElementById('transactionComment').value.trim();
    const editId = transactionForm.dataset.editId;
    
    if (!description || !amount || !category || !date) {
        showNotification('Por favor completa todos los campos requeridos', 'error');
        return;
    }
    
    // Validar cuenta bancaria
    if (!accountId) {
        showNotification('Por favor selecciona una cuenta bancaria', 'error');
        return;
    }
    
    if (editId) {
        // Editar transacción existente
        const transactionIndex = transactions.findIndex(t => t.id === parseInt(editId));
        if (transactionIndex !== -1) {
            const oldTransaction = transactions[transactionIndex];
            
            // Ajustar spent en categorías
            if (oldTransaction.type === 'gasto') {
                const oldCategory = categories.find(c => c.name === oldTransaction.category);
                if (oldCategory) {
                    oldCategory.spent -= oldTransaction.amount;
                }
            }
            
            // Actualizar transacción
            transactions[transactionIndex] = {
                ...oldTransaction,
                description,
                amount,
                type,
                category,
                accountId,
                date,
                comment: comment || null,
                lastModifiedBy: currentUser,
                lastModifiedAt: new Date().toISOString()
            };
            
            // Ajustar spent en nueva categoría si es gasto
            if (type === 'gasto') {
                const newCategory = categories.find(c => c.name === category);
                if (newCategory) {
                    newCategory.spent += amount;
                }
            }
            
            // Registrar en historial
            addToHistory(
                'Editó transacción',
                `${description} - ${formatCurrency(amount)} (${type})`,
                'transaction'
            );
            
            // Limpiar modo edición
            transactionForm.removeAttribute('data-edit-id');
            document.getElementById('transactionModalTitle').textContent = 'Nueva Transacción';
            const submitBtn = transactionForm.querySelector('.btn-primary');
            submitBtn.textContent = 'Guardar';
        }
    } else {
        // Crear nueva transacción
        const newTransaction = {
            id: Date.now(),
            description,
            amount,
            type,
            category,
            accountId,
            date,
            comment: comment || null,
            createdBy: currentUser,
            createdAt: new Date().toISOString(),
            lastModifiedBy: currentUser,
            lastModifiedAt: new Date().toISOString()
        };
        
        // Si es una transferencia
        if (transferToAccountId && transferToAccountId !== accountId) {
            newTransaction.type = 'transferencia';
            newTransaction.transferToAccountId = transferToAccountId;
            
            // Crear transacción de salida
            const outgoingTransaction = {
                ...newTransaction,
                id: Date.now() + 1,
                description: `Transferencia a ${getAccountName(transferToAccountId)}`,
                amount: -Math.abs(amount)
            };
            
            // Crear transacción de entrada
            const incomingTransaction = {
                ...newTransaction,
                id: Date.now() + 2,
                description: `Transferencia desde ${getAccountName(accountId)}`,
                amount: Math.abs(amount),
                accountId: transferToAccountId,
                transferFromAccountId: accountId
            };
            
            transactions.push(outgoingTransaction, incomingTransaction);
            
            // Actualizar balances de ambas cuentas
            updateAccountBalance(accountId, -Math.abs(amount), `Transferencia a ${getAccountName(transferToAccountId)}`);
            updateAccountBalance(transferToAccountId, Math.abs(amount), `Transferencia desde ${getAccountName(accountId)}`);
            
            showNotification('Transferencia realizada exitosamente', 'success');
        } else {
            // Transacción normal (gasto o ingreso)
            transactions.push(newTransaction);
            
            // Actualizar balance de la cuenta
            const balanceChange = newTransaction.amount;
            updateAccountBalance(accountId, balanceChange, description);
            
            showNotification('Transacción agregada exitosamente', 'success');
        }
        
        // Ajustar spent en categoría si es gasto
        if (type === 'gasto') {
            const category = categories.find(c => c.name === newTransaction.category);
            if (category) {
                category.spent += amount;
            }
        }
        
        // Registrar en historial
        addToHistory(
            'Agregó transacción',
            `${description} - ${formatCurrency(amount)} (${type})`,
            'transaction'
        );
    }
    
    saveData();
    clearCaches();
    
    // Mostrar confirmación visual
    showVisualNotification(
        editId ? 'Transacción actualizada' : 'Transacción agregada',
        `La transacción "${description}" se ha ${editId ? 'actualizado' : 'agregado'} correctamente.`,
        'budget'
    );
    
    // Cerrar modal y limpiar formulario
    closeModal('transactionModal');
    transactionForm.reset();
    
    // Actualizar UI completa
    updateUI(true);
    
    // Forzar actualización específica de transacciones
    setTimeout(() => {
        console.log('Forzando actualización de transacciones...');
        updateGastosIngresosDisplay();
        filterTransactions(); // Aplicar filtros actuales
    }, 200);
}

function updateCategoryDropdowns() {
    console.log('Actualizando dropdowns de categorías...');
    console.log('Categorías disponibles:', Object.keys(categoryGroups));
    
    // Actualizar dropdown de categorías
    const categorySelect = document.getElementById('categoryName');
    if (!categorySelect) {
        console.error('No se encontró el elemento categoryName');
        return;
    }
    
    categorySelect.innerHTML = '<option value="">Seleccionar o crear categoría</option>';
    
    Object.keys(categoryGroups).forEach(categoryName => {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        categorySelect.appendChild(option);
    });
    
    console.log(`Dropdown de categorías actualizado con ${Object.keys(categoryGroups).length} categorías`);
    
    // Actualizar dropdown de subcategorías
    updateSubcategoryDropdown();
    
    // Actualizar dropdown de selección de categorías
    updateSelectCategoryDropdown();
}

function updateSubcategoryDropdown() {
    console.log('Actualizando dropdown de subcategorías...');
    
    const subcategorySelect = document.getElementById('categorySubcategory');
    const selectedCategory = document.getElementById('categoryName').value;
    
    console.log('Categoría seleccionada:', selectedCategory);
    console.log('Subcategorías disponibles:', selectedCategory ? categoryGroups[selectedCategory] : 'Ninguna');
    
    if (!subcategorySelect) {
        console.error('No se encontró el elemento categorySubcategory');
        return;
    }
    
    subcategorySelect.innerHTML = '<option value="">Seleccionar o crear subcategoría</option>';
    
    if (selectedCategory && categoryGroups[selectedCategory]) {
        categoryGroups[selectedCategory].forEach(subcategory => {
            const option = document.createElement('option');
            option.value = subcategory;
            option.textContent = subcategory;
            subcategorySelect.appendChild(option);
        });
        console.log(`Dropdown de subcategorías actualizado con ${categoryGroups[selectedCategory].length} opciones`);
    } else {
        console.log('No hay subcategorías para mostrar');
    }
}

function updateSelectCategoryDropdown() {
    const selectCategorySelect = document.getElementById('selectCategoryName');
    selectCategorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
    
    Object.keys(categoryGroups).forEach(categoryName => {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        selectCategorySelect.appendChild(option);
    });
}

function updateSelectSubcategoryDropdown() {
    console.log('Actualizando dropdown de subcategorías para selección...');
    
    const subcategorySelect = document.getElementById('selectSubcategoryName');
    const selectedCategory = document.getElementById('selectCategoryName').value;
    
    console.log('Categoría seleccionada en select:', selectedCategory);
    console.log('Subcategorías disponibles:', selectedCategory ? categoryGroups[selectedCategory] : 'Ninguna');
    
    if (!subcategorySelect) {
        console.error('No se encontró el elemento selectSubcategoryName');
        return;
    }
    
    subcategorySelect.innerHTML = '<option value="">Seleccionar subcategoría</option>';
    
    if (selectedCategory && categoryGroups[selectedCategory]) {
        categoryGroups[selectedCategory].forEach(subcategory => {
            const option = document.createElement('option');
            option.value = subcategory;
            option.textContent = subcategory;
            subcategorySelect.appendChild(option);
        });
        console.log(`Dropdown de subcategorías de selección actualizado con ${categoryGroups[selectedCategory].length} opciones`);
    } else {
        console.log('No hay subcategorías para mostrar en selección');
    }
}

function updateCategorySelect() {
    console.log('Actualizando dropdown de categorías para transacciones...');
    
    const categorySelect = document.getElementById('transactionCategory');
    if (!categorySelect) {
        console.error('No se encontró el elemento transactionCategory');
        return;
    }
    
    // Limpiar opciones existentes
    categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';
    
    // Obtener el tipo de transacción actual
    const transactionType = document.getElementById('transactionType').value;
    
    // Mostrar categorías según el tipo
    if (transactionType === 'ingreso') {
        // Mostrar categorías de ingresos
        Object.keys(defaultIncomeCategories).forEach(categoryName => {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName;
            categorySelect.appendChild(option);
        });
        console.log(`Categorías de ingresos cargadas: ${categorySelect.options.length - 1}`);
    } else {
        // Mostrar categorías de gastos (excluyendo las de ingresos)
        Object.keys(categoryGroups).forEach(categoryName => {
            // Excluir categorías de ingresos del dropdown de gastos
            if (!defaultIncomeCategories[categoryName]) {
                const option = document.createElement('option');
                option.value = categoryName;
                option.textContent = categoryName;
                categorySelect.appendChild(option);
            }
        });
        console.log(`Categorías de gastos cargadas: ${categorySelect.options.length - 1}`);
    }
    
    console.log(`Categorías cargadas para ${transactionType}:`, categorySelect.options.length - 1);
}

function updateCategoryFilters() {
    console.log('Actualizando filtros de categorías...');
    
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) {
        console.error('No se encontró el elemento categoryFilter');
        return;
    }
    
    categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    
    // Mostrar todas las categorías disponibles para el filtro
    Object.keys(categoryGroups).forEach(categoryName => {
        // Para categorías principales, mostrar solo el nombre
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        categoryFilter.appendChild(option);
        
        // Para subcategorías, mostrar con formato "Categoría - Subcategoría"
        if (categoryGroups[categoryName] && Array.isArray(categoryGroups[categoryName])) {
            categoryGroups[categoryName].forEach(subcategory => {
                const subOption = document.createElement('option');
                subOption.value = `${categoryName} - ${subcategory}`;
                subOption.textContent = `${categoryName} - ${subcategory}`;
                categoryFilter.appendChild(subOption);
            });
        }
    });
    
    console.log(`Filtros de categorías actualizados: ${categoryFilter.options.length - 1} opciones`);
}

function getDefaultColor(categoryName) {
    return defaultColors[categoryName] || '#007aff';
}

// Cache para colores de categorías
const colorCache = new Map();

// Función para limpiar caches cuando sea necesario
function clearCaches() {
    currencyCache.clear();
    colorCache.clear();
}

// Función para obtener el color de una categoría basado en su nombre principal
function getCategoryColor(categoryName) {
    // Verificar cache primero
    if (colorCache.has(categoryName)) {
        return colorCache.get(categoryName);
    }
    
    let color = '#007aff'; // Color por defecto
    
    // Si es una categoría principal, usar su color por defecto
    if (defaultColors[categoryName]) {
        color = defaultColors[categoryName];
    } else {
        // Si es una subcategoría, buscar la categoría principal a la que pertenece
        for (const [mainCategory, subcategories] of Object.entries(categoryGroups)) {
            if (subcategories.includes(categoryName)) {
                color = defaultColors[mainCategory] || '#007aff';
                break;
            }
        }
    }
    
    // Guardar en cache
    colorCache.set(categoryName, color);
    return color;
}

function getCategoryIcon(categoryName) {
    return defaultIcons[categoryName] || 'fas fa-tag';
}

function showAddCategoryInput() {
    const categorySelect = document.getElementById('categoryName');
    const newCategory = prompt('Ingresa el nombre de la nueva categoría:');
    
    if (newCategory && newCategory.trim()) {
        const trimmedCategory = newCategory.trim();
        
        if (!categoryGroups[trimmedCategory]) {
            categoryGroups[trimmedCategory] = [];
            saveCategoryGroups();
            updateCategoryDropdowns();
            categorySelect.value = trimmedCategory;
            updateSubcategoryDropdown();
        } else {
            alert('Esta categoría ya existe.');
        }
    }
}

function showAddSubcategoryInput() {
    const categorySelect = document.getElementById('categoryName');
    const subcategorySelect = document.getElementById('categorySubcategory');
    
    if (!categorySelect.value) {
        alert('Primero selecciona una categoría.');
        return;
    }
    
    const newSubcategory = prompt('Ingresa el nombre de la nueva subcategoría:');
    
    if (newSubcategory && newSubcategory.trim()) {
        const trimmedSubcategory = newSubcategory.trim();
        const categoryName = categorySelect.value;
        
        if (!categoryGroups[categoryName].includes(trimmedSubcategory)) {
            categoryGroups[categoryName].push(trimmedSubcategory);
            saveCategoryGroups();
            updateSubcategoryDropdown();
            subcategorySelect.value = trimmedSubcategory;
        } else {
            alert('Esta subcategoría ya existe en esta categoría.');
        }
    }
}

function updateMonthFilters() {
    const months = [...new Set(transactions.map(t => t.date.substring(0, 7)))].sort().reverse();
    const monthFilter = document.getElementById('monthFilter');
    const reportMonth = document.getElementById('reportMonth');
    const budgetMonth = document.getElementById('budgetMonth');
    
    monthFilter.innerHTML = '<option value="">Todos los meses</option>';
    reportMonth.innerHTML = '<option value="">Todos los meses</option>';
    budgetMonth.innerHTML = '<option value="">Mes actual</option>';
    
    months.forEach(month => {
        const monthName = new Date(month + '-01').toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long' 
        });
        
        const option1 = document.createElement('option');
        option1.value = month;
        option1.textContent = monthName;
        monthFilter.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = month;
        option2.textContent = monthName;
        reportMonth.appendChild(option2);
        
        const option3 = document.createElement('option');
        option3.value = month;
        option3.textContent = monthName;
        budgetMonth.appendChild(option3);
    });
}

// Cache para evitar actualizaciones innecesarias
let lastUpdateTime = 0;
let updateTimeout = null;

function updateUI(forceUpdate = false) {
    if (forceUpdate) {
        clearCaches();
    }
    
    updateBudgetSummary();
    updateIncomesDisplay();
    updateGastosIngresosDisplay();
    updateReports();
    updateGoalsDisplay();
    // Limpiar cuentas duplicadas existentes al cargar
    removeDuplicateAccounts();
    
    // Normalizar IDs de cuentas existentes
    normalizeAllAccountIds();
    
    // Actualizar cuentas bancarias
    updateBankAccountsDisplay();
    updateAccountSummary();
    
    // Configurar event delegation para botones de cuentas
    setupBankAccountEventDelegation();
    
    // Actualizar dropdowns solo si es necesario
    if (forceUpdate || !document.getElementById('categoryName').options.length) {
        updateCategorySelect();
        updateCategoryDropdowns();
        updateCategoryFilters();
    }
    
    // Actualizar filtros solo si es necesario
    if (forceUpdate || !document.getElementById('monthFilter').options.length) {
        updateMonthFilters();
        updateCategoryFilters();
    }
}

function updateBudgetSummary() {
    const selectedMonth = document.getElementById('budgetMonth').value;
    
    // Si no hay mes seleccionado, usar todas las categorías
    let categoriesToShow = categories;
    let totalBudget = categories.reduce((sum, cat) => {
        // Calcular el presupuesto ajustado según la frecuencia
        const adjustedBudget = calculateAdjustedBudget(cat.budget, cat.frequency || 'monthly', cat.customDays);
        return sum + adjustedBudget;
    }, 0);
    let totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
    
    // Calcular ingresos totales
    const totalIncomes = calculateTotalIncomes();
    const balance = totalIncomes - totalSpent;
    
    if (selectedMonth) {
        // Filtrar transacciones por mes seleccionado
        const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
        
        // Calcular gastos por categoría para el mes seleccionado
        const spentByCategory = {};
        monthTransactions.forEach(transaction => {
            if (transaction.type === 'gasto') {
                const categoryName = transaction.category;
                if (!spentByCategory[categoryName]) {
                    spentByCategory[categoryName] = 0;
                }
                spentByCategory[categoryName] += transaction.amount;
            }
        });
        
        // Actualizar spent en las categorías para mostrar
        categoriesToShow = categories.map(category => ({
            ...category,
            spent: spentByCategory[category.name] || 0
        }));
        
        // Recalcular totales con presupuesto ajustado
        totalBudget = categoriesToShow.reduce((sum, cat) => {
            const adjustedBudget = calculateAdjustedBudget(cat.budget, cat.frequency || 'monthly', cat.customDays);
            return sum + adjustedBudget;
        }, 0);
        totalSpent = categoriesToShow.reduce((sum, cat) => sum + cat.spent, 0);
        
        // Recalcular balance
        const balance = totalIncomes - totalSpent;
    }
    
    const totalRemaining = totalBudget - totalSpent;

    document.getElementById('totalBudget').textContent = formatCurrency(totalBudget);
    document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);
    document.getElementById('totalRemaining').textContent = formatCurrency(totalRemaining);
    document.getElementById('totalIncomes').textContent = formatCurrency(totalIncomes);
    document.getElementById('totalBalance').textContent = formatCurrency(balance);
    
    // Actualizar la visualización de categorías con los datos filtrados
    updateCategoriesDisplayForMonth(categoriesToShow);
    
    // Actualizar el título para mostrar el mes seleccionado
    const budgetTitle = document.querySelector('#presupuesto .section-header h2');
    if (budgetTitle) {
        if (selectedMonth) {
            const monthName = new Date(selectedMonth + '-01').toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long' 
            });
            budgetTitle.textContent = `Presupuesto - ${monthName}`;
        } else {
            budgetTitle.textContent = 'Presupuesto Mensual';
        }
    }
    
    // ALERTA VISUAL EN TARJETA DE GASTADO
    const spentCard = document.querySelector('.summary-card:nth-child(2)');
    if (spentCard) {
        spentCard.classList.remove('alert', 'critical');
        if (totalBudget > 0) {
            const percent = totalSpent / totalBudget;
            if (percent >= 1) {
                spentCard.classList.add('critical');
            } else if (percent >= 0.9) {
                spentCard.classList.add('alert');
            }
        }
    }
    
    // Verificar alertas de presupuesto
    checkBudgetAlerts();
}

// Función para actualizar el presupuesto cuando cambie el mes
function updateBudgetForMonth() {
    updateBudgetSummary();
}

// Función para actualizar la visualización de categorías con datos del mes seleccionado
function updateCategoriesDisplayForMonth(categoriesToShow) {
    updateCategoriesDisplay(categoriesToShow);
}

function updateCategoriesDisplay(categoriesToShow = null) {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';

    // Usar categorías proporcionadas o todas las categorías
    const categoriesToDisplay = categoriesToShow || categories;

    if (categoriesToDisplay.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No hay categorías configuradas. Agrega una nueva categoría para comenzar.</p>';
        return;
    }

    // Agrupar categorías por nombre principal
    const groupedCategories = {};
    categoriesToDisplay.forEach(category => {
        if (!groupedCategories[category.name]) {
            groupedCategories[category.name] = [];
        }
        groupedCategories[category.name].push(category);
    });

    // Crear lista elegante de categorías principales
    Object.keys(groupedCategories).forEach(categoryName => {
        const categoryGroup = groupedCategories[categoryName];
        const totalBudget = categoryGroup.reduce((sum, cat) => {
            const adjustedBudget = calculateAdjustedBudget(cat.budget, cat.frequency || 'monthly', cat.customDays);
            return sum + adjustedBudget;
        }, 0);
        const totalSpent = categoryGroup.reduce((sum, cat) => sum + cat.spent, 0);
        const totalRemaining = totalBudget - totalSpent;
        const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        
        // Usar el color de la categoría principal
        const groupColor = getCategoryColor(categoryName);
        
        // Crear elemento de lista elegante
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-list-item';
        categoryItem.style.cssText = `
            margin-bottom: 8px;
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 12px;
            background: var(--card-bg, #fff);
            cursor: pointer;
            transition: all 0.3s ease;
            overflow: hidden;
        `;
        
        // Crear header principal con información resumida
        const itemHeader = document.createElement('div');
        itemHeader.style.cssText = `
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--bg-color, #f8f9fa);
            border-bottom: 1px solid transparent;
            transition: all 0.3s ease;
        `;
        
        // Lado izquierdo: Nombre y progreso
        const leftSide = document.createElement('div');
        leftSide.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
        `;
        
        const chevron = document.createElement('i');
        chevron.className = 'fas fa-chevron-right';
        chevron.id = `chevron-${categoryName.replace(/\s+/g, '-')}`;
        chevron.style.cssText = `
            color: var(--text-muted, #666);
            transition: transform 0.3s ease;
            font-size: 14px;
        `;
        
        const categoryInfo = document.createElement('div');
        categoryInfo.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
        `;
        
        const categoryIcon = document.createElement('i');
        categoryIcon.className = getCategoryIcon(categoryName);
        categoryIcon.style.cssText = `
            color: ${groupColor};
            font-size: 18px;
            margin-right: 8px;
        `;
        
        const categoryTitle = document.createElement('span');
        categoryTitle.textContent = categoryName;
        categoryTitle.style.cssText = `
            font-weight: 600;
            font-size: 16px;
            color: var(--text-color, #333);
        `;
        
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            width: 120px;
            height: 6px;
            background: var(--border-color, #e0e0e0);
            border-radius: 3px;
            overflow: hidden;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.style.cssText = `
            width: ${Math.min(percentage, 100)}%;
            height: 100%;
            background: ${groupColor};
            transition: width 0.3s ease;
        `;
        
        progressBar.appendChild(progressFill);
        categoryInfo.appendChild(categoryTitle);
        categoryInfo.appendChild(progressBar);
        
        // Crear contenedor para icono y título
        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = `
            display: flex;
            align-items: center;
        `;
        titleContainer.appendChild(categoryIcon);
        titleContainer.appendChild(categoryTitle);
        
        categoryInfo.innerHTML = '';
        categoryInfo.appendChild(titleContainer);
        categoryInfo.appendChild(progressBar);
        leftSide.appendChild(chevron);
        leftSide.appendChild(categoryInfo);
        
        // Lado derecho: Resumen financiero
        const rightSide = document.createElement('div');
        rightSide.style.cssText = `
            display: flex;
            align-items: center;
            gap: 20px;
            text-align: right;
        `;
        
        const budgetInfo = document.createElement('div');
        budgetInfo.innerHTML = `
            <div style="font-size: 12px; color: var(--text-muted, #666); margin-bottom: 2px;">Presupuesto</div>
            <div style="font-weight: 600; color: var(--text-color, #333);">${formatCurrency(totalBudget)}</div>
        `;
        
        const spentInfo = document.createElement('div');
        spentInfo.innerHTML = `
            <div style="font-size: 12px; color: var(--text-muted, #666); margin-bottom: 2px;">Gastado</div>
            <div style="font-weight: 600; color: ${totalSpent > totalBudget ? 'var(--danger-color, #ff3b30)' : 'var(--success-color, #34c759)'}">${formatCurrency(totalSpent)}</div>
        `;
        
        const remainingInfo = document.createElement('div');
        remainingInfo.innerHTML = `
            <div style="font-size: 12px; color: var(--text-muted, #666); margin-bottom: 2px;">Restante</div>
            <div style="font-weight: 600; color: ${totalRemaining < 0 ? 'var(--danger-color, #ff3b30)' : 'var(--text-color, #333)'}">${formatCurrency(totalRemaining)}</div>
        `;
        
        const percentageInfo = document.createElement('div');
        percentageInfo.innerHTML = `
            <div style="font-size: 12px; color: var(--text-muted, #666); margin-bottom: 2px;">Progreso</div>
            <div style="font-weight: 600; color: var(--text-color, #333);">${Math.round(percentage)}%</div>
        `;
        
        rightSide.appendChild(budgetInfo);
        rightSide.appendChild(spentInfo);
        rightSide.appendChild(remainingInfo);
        rightSide.appendChild(percentageInfo);
        
        itemHeader.appendChild(leftSide);
        itemHeader.appendChild(rightSide);
        categoryItem.appendChild(itemHeader);
        
        // Crear contenedor para las subcategorías (inicialmente oculto)
        const subcategoriesContainer = document.createElement('div');
        subcategoriesContainer.style.cssText = `
            display: none;
            padding: 0;
            background: var(--card-bg, #fff);
            border-top: 1px solid var(--border-color, #e0e0e0);
        `;
        
        // Agregar cada subcategoría del grupo
        categoryGroup.forEach(category => {
            const adjustedBudget = calculateAdjustedBudget(category.budget, category.frequency || 'monthly', category.customDays);
            const subcategoryPercentage = adjustedBudget > 0 ? (category.spent / adjustedBudget) * 100 : 0;
            const subcategoryRemaining = adjustedBudget - category.spent;
            const frequencyText = category.frequency ? getFrequencyText(category.frequency, category.customDays) : 'Mensual';
            const nextRecurrence = category.recurringDate && category.frequency ? 
                getNextRecurrenceDate(category.recurringDate, category.frequency, category.customDays) : null;
            
            const subcategoryItem = document.createElement('div');
            subcategoryItem.style.cssText = `
                padding: 16px 20px;
                border-bottom: 1px solid var(--border-color, #e0e0e0);
                background: var(--card-bg, #fff);
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            const subcategoryLeft = document.createElement('div');
            subcategoryLeft.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 8px;
                flex: 1;
            `;
            
            const subcategoryName = document.createElement('span');
            subcategoryName.textContent = category.subcategory || 'Sin subcategoría';
            subcategoryName.style.cssText = `
                font-weight: 500;
                color: var(--text-color, #333);
                font-size: 14px;
            `;
            
            const subcategoryDetails = document.createElement('div');
            subcategoryDetails.style.cssText = `
                display: flex;
                gap: 16px;
                font-size: 12px;
                color: var(--text-muted, #666);
            `;
            
            const budgetDisplay = category.frequency && category.frequency !== 'monthly' ? 
                `${formatCurrency(category.budget)} → ${formatCurrency(adjustedBudget)}` : 
                formatCurrency(category.budget);
            
            subcategoryDetails.innerHTML = `
                <span>Presupuesto: ${budgetDisplay}</span>
                <span>Frecuencia: ${frequencyText}</span>
                ${category.recurringDate ? `<span>Próximo: ${formatDate(nextRecurrence || category.recurringDate)}</span>` : ''}
            `;
            
            const subcategoryProgress = document.createElement('div');
            subcategoryProgress.style.cssText = `
                width: 100px;
                height: 4px;
                background: var(--border-color, #e0e0e0);
                border-radius: 2px;
                overflow: hidden;
            `;
            
            const subcategoryProgressFill = document.createElement('div');
            subcategoryProgressFill.style.cssText = `
                width: ${Math.min(subcategoryPercentage, 100)}%;
                height: 100%;
                background: ${groupColor};
                transition: width 0.3s ease;
            `;
            
            subcategoryProgress.appendChild(subcategoryProgressFill);
            
            subcategoryLeft.appendChild(subcategoryName);
            subcategoryLeft.appendChild(subcategoryDetails);
            subcategoryLeft.appendChild(subcategoryProgress);
            
            const subcategoryRight = document.createElement('div');
            subcategoryRight.style.cssText = `
                display: flex;
                align-items: center;
                gap: 16px;
                text-align: right;
            `;
            
            subcategoryRight.innerHTML = `
                <div>
                    <div style="font-size: 11px; color: var(--text-muted, #666);">Gastado</div>
                    <div style="font-weight: 600; color: ${category.spent > adjustedBudget ? 'var(--danger-color, #ff3b30)' : 'var(--success-color, #34c759)'}; font-size: 13px;">${formatCurrency(category.spent)}</div>
                </div>
                <div>
                    <div style="font-size: 11px; color: var(--text-muted, #666);">Restante</div>
                    <div style="font-weight: 600; color: ${subcategoryRemaining < 0 ? 'var(--danger-color, #ff3b30)' : 'var(--text-color, #333)'}; font-size: 13px;">${formatCurrency(subcategoryRemaining)}</div>
                </div>
                <div>
                    <div style="font-size: 11px; color: var(--text-muted, #666);">%</div>
                    <div style="font-weight: 600; color: var(--text-color, #333); font-size: 13px;">${Math.round(subcategoryPercentage)}%</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-icon edit-category" data-id="${category.id}" title="Editar categoría" style="padding: 6px; border-radius: 6px; border: 1px solid var(--border-color, #e0e0e0); background: var(--card-bg, #fff); color: var(--text-muted, #666); cursor: pointer;">
                        <i class="fas fa-edit" style="font-size: 12px;"></i>
                    </button>
                    <button class="btn-icon delete-category" data-id="${category.id}" title="Eliminar categoría" style="padding: 6px; border-radius: 6px; border: 1px solid var(--border-color, #e0e0e0); background: var(--card-bg, #fff); color: var(--danger-color, #ff3b30); cursor: pointer;">
                        <i class="fas fa-trash" style="font-size: 12px;"></i>
                    </button>
                </div>
            `;
            
            subcategoryItem.appendChild(subcategoryLeft);
            subcategoryItem.appendChild(subcategoryRight);
            subcategoriesContainer.appendChild(subcategoryItem);
        });
        
        categoryItem.appendChild(subcategoriesContainer);
        container.appendChild(categoryItem);
        
        // Agregar event listener para expandir/colapsar
        itemHeader.addEventListener('click', () => {
            const isExpanded = subcategoriesContainer.style.display === 'block';
            
            if (isExpanded) {
                subcategoriesContainer.style.display = 'none';
                chevron.style.transform = 'rotate(0deg)';
                itemHeader.style.borderBottomColor = 'transparent';
                categoryItem.style.background = 'var(--bg-color, #f8f9fa)';
            } else {
                subcategoriesContainer.style.display = 'block';
                chevron.style.transform = 'rotate(90deg)';
                itemHeader.style.borderBottomColor = 'var(--border-color, #e0e0e0)';
                categoryItem.style.background = 'var(--card-bg, #fff)';
            }
        });
    });
    
    // Agregar event listeners para los botones de editar y eliminar
    document.querySelectorAll('.edit-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que se expanda/colapse al editar
            const categoryId = parseInt(e.currentTarget.dataset.id);
            editCategory(categoryId);
        });
    });
    
    document.querySelectorAll('.delete-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que se expanda/colapse al eliminar
            const categoryId = parseInt(e.currentTarget.dataset.id);
            deleteCategory(categoryId);
        });
    });
}

function updateGastosIngresosDisplay(transactionsToShow = null) {
    console.log('Actualizando visualización de transacciones...');
    console.log('Transacciones totales:', transactions.length);
    
    const gastosContainer = document.getElementById('gastosContainer');
    const ingresosContainer = document.getElementById('ingresosContainer');
    const transferenciasContainer = document.getElementById('transferenciasContainer');
    const pagosTarjetasContainer = document.getElementById('pagosTarjetasContainer');
    
    if (!gastosContainer || !ingresosContainer || !transferenciasContainer || !pagosTarjetasContainer) {
        console.error('No se encontraron los contenedores de transacciones');
        return;
    }
    
    // Limpiar contenedores
    gastosContainer.innerHTML = '';
    ingresosContainer.innerHTML = '';
    transferenciasContainer.innerHTML = '';
    pagosTarjetasContainer.innerHTML = '';
    
    const transactionsToDisplay = transactionsToShow || transactions;
    console.log('Transacciones a mostrar:', transactionsToDisplay.length);
    
    // Filtrar transacciones por tipo
    const gastos = transactionsToDisplay.filter(t => t.type === 'gasto');
    const ingresos = transactionsToDisplay.filter(t => t.type === 'ingreso');
    const transferencias = transactionsToDisplay.filter(t => t.type === 'transferencia');
    const pagosTarjetas = transactionsToDisplay.filter(t => t.type === 'pago-tarjeta');
    
    console.log('Gastos encontrados:', gastos.length);
    console.log('Ingresos encontrados:', ingresos.length);
    console.log('Transferencias encontradas:', transferencias.length);
    console.log('Pagos de tarjetas encontrados:', pagosTarjetas.length);
    
    // Mostrar gastos
    if (gastos.length === 0) {
        gastosContainer.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No hay gastos registrados.</p>';
    } else {
        gastos.forEach(transaction => {
            const transactionItem = createTransactionItem(transaction);
            gastosContainer.appendChild(transactionItem);
        });
    }
    
    // Mostrar ingresos
    if (ingresos.length === 0) {
        ingresosContainer.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No hay ingresos registrados.</p>';
    } else {
        ingresos.forEach(transaction => {
            const transactionItem = createTransactionItem(transaction);
            ingresosContainer.appendChild(transactionItem);
        });
    }
    
    // Mostrar transferencias
    if (transferencias.length === 0) {
        transferenciasContainer.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No hay transferencias registradas.</p>';
    } else {
        transferencias.forEach(transaction => {
            const transactionItem = createTransactionItem(transaction);
            transferenciasContainer.appendChild(transactionItem);
        });
    }
    
    // Mostrar pagos de tarjetas
    if (pagosTarjetas.length === 0) {
        pagosTarjetasContainer.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No hay pagos de tarjetas registrados.</p>';
    } else {
        pagosTarjetas.forEach(transaction => {
            const transactionItem = createTransactionItem(transaction);
            pagosTarjetasContainer.appendChild(transactionItem);
        });
    }
    
    console.log('Visualización de transacciones actualizada');
}

function createTransactionItem(transaction) {
    const transactionItem = document.createElement('div');
    transactionItem.className = 'transaction-item';
    const date = new Date(transaction.date).toLocaleDateString('es-ES');
    const amountClass = transaction.type === 'ingreso' ? 'income' : 'expense';
    const amountPrefix = transaction.type === 'ingreso' ? '+' : '-';
    const authorInfo = transaction.lastModifiedBy ? `<div class="transaction-author">por ${transaction.lastModifiedBy}</div>` : '';
    const commentHtml = transaction.comment ? `<div class="transaction-comment"><div class="transaction-comment-author">${transaction.lastModifiedBy || 'Usuario'}</div>${transaction.comment}</div>` : '';
    
    // Información de cuenta bancaria
    let accountInfo = '';
    if (transaction.accountId) {
        const accountName = getAccountName(transaction.accountId);
        accountInfo = `<div class="transaction-account"><i class="fas fa-university"></i> ${accountName}</div>`;
    }
    
    // Información de transferencia
    let transferInfo = '';
    if (transaction.type === 'transferencia') {
        if (transaction.transferToAccountId) {
            const toAccountName = getAccountName(transaction.transferToAccountId);
            transferInfo = `<div class="transaction-transfer"><i class="fas fa-exchange-alt"></i> → ${toAccountName}</div>`;
        } else if (transaction.transferFromAccountId) {
            const fromAccountName = getAccountName(transaction.transferFromAccountId);
            transferInfo = `<div class="transaction-transfer"><i class="fas fa-exchange-alt"></i> ← ${fromAccountName}</div>`;
        }
    }
    
    // Información de pago de tarjeta
    let pagoTarjetaInfo = '';
    if (transaction.type === 'pago-tarjeta') {
        if (transaction.tarjetaDestinoId) {
            const tarjetaName = getAccountName(transaction.tarjetaDestinoId);
            pagoTarjetaInfo = `<div class="transaction-pago-tarjeta"><i class="fas fa-credit-card"></i> → ${tarjetaName}</div>`;
        } else if (transaction.cuentaOrigenId) {
            const cuentaName = getAccountName(transaction.cuentaOrigenId);
            pagoTarjetaInfo = `<div class="transaction-pago-tarjeta"><i class="fas fa-credit-card"></i> ← ${cuentaName}</div>`;
        }
    }
    
    transactionItem.innerHTML = `
        <div class="transaction-description">
            <h4>${transaction.description}</h4>
            <div class="transaction-details">
                ${transaction.category} • ${date}
            </div>
            ${accountInfo}
            ${transferInfo}
            ${pagoTarjetaInfo}
            ${authorInfo}
            ${commentHtml}
        </div>
        <div class="transaction-buttons">
            <div class="transaction-amount ${amountClass}">
                ${amountPrefix}${formatCurrency(transaction.amount)}
            </div>
            <div class="transaction-actions">
                <button class="btn-icon edit-transaction" data-id="${transaction.id}" title="Editar transacción">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-transaction" data-id="${transaction.id}" title="Eliminar transacción">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    // Event listeners para editar/eliminar
    transactionItem.querySelector('.edit-transaction').addEventListener('click', (e) => {
        const transactionId = parseInt(e.currentTarget.dataset.id);
        editTransaction(transactionId);
    });
    transactionItem.querySelector('.delete-transaction').addEventListener('click', (e) => {
        const transactionId = parseInt(e.currentTarget.dataset.id);
        deleteTransaction(transactionId);
    });
    return transactionItem;
}

// Cache para transacciones filtradas
let filteredTransactionsCache = null;
let lastFilterState = '';

function filterTransactions() {
    console.log('Aplicando filtros de transacciones...');
    
    const monthFilter = document.getElementById('monthFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    const currentFilterState = `${monthFilter}-${categoryFilter}`;
    
    if (currentFilterState === lastFilterState && filteredTransactionsCache) {
        console.log('Usando cache de filtros');
        return;
    }
    
    lastFilterState = currentFilterState;
    
    let filtered = [...transactions]; // Crear copia para no modificar el original
    
    console.log('Transacciones antes de filtrar:', filtered.length);
    
    if (monthFilter) {
        filtered = filtered.filter(t => t.date.startsWith(monthFilter));
        console.log('Transacciones después de filtro de mes:', filtered.length);
    }
    
    if (categoryFilter) {
        filtered = filtered.filter(t => t.category === categoryFilter);
        console.log('Transacciones después de filtro de categoría:', filtered.length);
    }
    
    // Ordenar por fecha (más reciente primero)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    filteredTransactionsCache = filtered;
    console.log('Transacciones filtradas finales:', filtered.length);
    
    updateGastosIngresosDisplay(filtered);
}

function updateReports() {
    console.log('=== ACTUALIZANDO REPORTES ===');
    console.log('Transacciones disponibles:', transactions);
    console.log('Formato de fechas de ejemplo:', transactions.slice(0, 3).map(t => t.date));
    
    updateMonthlySummary();
    updateCharts();
    updateAdvancedReports();
}

function updateMonthlySummary() {
    const selectedMonth = document.getElementById('reportMonth').value;
    let filteredTransactions = transactions;
    
    console.log('Mes seleccionado en reportes:', selectedMonth);
    console.log('Total de transacciones:', transactions.length);
    
    if (selectedMonth) {
        // Verificar que el formato de fecha sea correcto
        const monthPattern = new RegExp(`^${selectedMonth.replace('-', '-')}`);
        filteredTransactions = transactions.filter(t => {
            const matches = monthPattern.test(t.date);
            console.log(`Transacción ${t.date} - Patrón ${monthPattern} - Coincide: ${matches}`);
            return matches;
        });
        console.log('Transacciones filtradas por mes:', filteredTransactions.length);
        console.log('Transacciones del mes:', filteredTransactions);
    } else {
        console.log('No hay mes seleccionado, mostrando todas las transacciones');
    }

    const income = filteredTransactions
        .filter(t => t.type === 'ingreso')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
        .filter(t => t.type === 'gasto')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;

    console.log('Resumen calculado:', { income, expenses, balance });

    document.getElementById('monthlyIncome').textContent = formatCurrency(income);
    document.getElementById('monthlyExpenses').textContent = formatCurrency(expenses);
    document.getElementById('monthlyBalance').textContent = formatCurrency(balance);
    document.getElementById('monthlyBalance').className = `value ${balance >= 0 ? 'income' : 'expense'}`;
}

function updateCharts() {
    updateCategoryChart();
    updateMonthlyChart();
}

function updateCategoryChart() {
    const selectedMonth = document.getElementById('reportMonth').value;
    let filteredTransactions = transactions.filter(t => t.type === 'gasto');
    
    console.log('Mes seleccionado para gráfico de categorías:', selectedMonth);
    console.log('Transacciones de gastos totales:', filteredTransactions.length);
    
    if (selectedMonth) {
        filteredTransactions = filteredTransactions.filter(t => t.date.startsWith(selectedMonth));
        console.log('Transacciones de gastos filtradas por mes:', filteredTransactions.length);
    }

    const categoryData = {};
    filteredTransactions.forEach(transaction => {
        if (categoryData[transaction.category]) {
            categoryData[transaction.category] += transaction.amount;
        } else {
            categoryData[transaction.category] = transaction.amount;
        }
    });

    const ctx = document.getElementById('categoryChart');
    if (window.categoryChart && typeof window.categoryChart.destroy === 'function') {
        window.categoryChart.destroy();
    }

    if (Object.keys(categoryData).length === 0) {
        ctx.style.display = 'none';
        return;
    }

    ctx.style.display = 'block';
    
    const colors = categories.map(cat => cat.color);
    
    window.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: colors,
                borderWidth: 0,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

function updateMonthlyChart() {
    const months = [...new Set(transactions.map(t => t.date.substring(0, 7)))].sort();
    const monthlyData = {
        income: [],
        expenses: []
    };

    console.log('Meses disponibles para gráfico:', months);
    console.log('Total de transacciones:', transactions.length);

    months.forEach(month => {
        const monthTransactions = transactions.filter(t => t.date.startsWith(month));
        const income = monthTransactions
            .filter(t => t.type === 'ingreso')
            .reduce((sum, t) => sum + t.amount, 0);
        const expenses = monthTransactions
            .filter(t => t.type === 'gasto')
            .reduce((sum, t) => sum + t.amount, 0);
        
        console.log(`Mes ${month}:`, { income, expenses, transactions: monthTransactions.length });
        
        monthlyData.income.push(income);
        monthlyData.expenses.push(expenses);
    });

    const ctx = document.getElementById('monthlyChart');
    if (window.monthlyChart && typeof window.monthlyChart.destroy === 'function') {
        window.monthlyChart.destroy();
    }

    if (months.length === 0) {
        ctx.style.display = 'none';
        return;
    }

    ctx.style.display = 'block';
    
    const monthLabels = months.map(month => {
        return new Date(month + '-01').toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short' 
        });
    });

    window.monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: monthlyData.income,
                    backgroundColor: '#34c759',
                    borderColor: '#34c759',
                    borderWidth: 0,
                    borderRadius: 4
                },
                {
                    label: 'Gastos',
                    data: monthlyData.expenses,
                    backgroundColor: '#ff3b30',
                    borderColor: '#ff3b30',
                    borderWidth: 0,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        },
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: '#e5e5e7'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Cache para formateo de moneda
const currencyCache = new Map();

function formatCurrency(amount) {
    const key = amount.toString();
    if (currencyCache.has(key)) {
        return currencyCache.get(key);
    }
    
    const formatted = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
    
    currencyCache.set(key, formatted);
    return formatted;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
    });
}

// Función para calcular la próxima fecha de recurrencia
function getNextRecurrenceDate(startDate, frequency, customDays = null) {
    const start = new Date(startDate);
    const now = new Date();
    let nextDate = new Date(start);
    
    // Calcular días según la frecuencia
    let daysToAdd = 0;
    switch (frequency) {
        case 'weekly':
            daysToAdd = 7;
            break;
        case 'biweekly':
            daysToAdd = 15;
            break;
        case 'monthly':
            daysToAdd = 30;
            break;
        case 'quarterly':
            daysToAdd = 90;
            break;
        case 'semiannual':
            daysToAdd = 180;
            break;
        case 'annual':
            daysToAdd = 365;
            break;
        case 'custom':
            daysToAdd = customDays || 30;
            break;
        default:
            daysToAdd = 30;
    }
    
    // Encontrar la próxima fecha después de hoy
    while (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + daysToAdd);
    }
    
    return nextDate.toISOString().split('T')[0];
}

// Función para obtener el texto de frecuencia
function getFrequencyText(frequency, customDays = null) {
    switch (frequency) {
        case 'weekly':
            return 'Semanal';
        case 'biweekly':
            return 'Quincenal';
        case 'monthly':
            return 'Mensual';
        case 'quarterly':
            return 'Trimestral';
        case 'semiannual':
            return 'Semestral';
        case 'annual':
            return 'Anual';
        case 'custom':
            return `Cada ${customDays || 30} días`;
        default:
            return 'Mensual';
    }
}

// Función para calcular el presupuesto ajustado según la frecuencia
function calculateAdjustedBudget(baseBudget, frequency, customDays = null) {
    const baseAmount = parseFloat(baseBudget);
    let multiplier = 1;
    
    switch (frequency) {
        case 'weekly':
            multiplier = 4.33; // Promedio de semanas por mes (52 semanas / 12 meses)
            break;
        case 'biweekly':
            multiplier = 2; // 2 veces por mes
            break;
        case 'monthly':
            multiplier = 1; // 1 vez por mes
            break;
        case 'quarterly':
            multiplier = 0.33; // 1 vez cada 3 meses (1/3 por mes)
            break;
        case 'semiannual':
            multiplier = 0.17; // 1 vez cada 6 meses (1/6 por mes)
            break;
        case 'annual':
            multiplier = 0.08; // 1 vez al año (1/12 por mes)
            break;
        case 'custom':
            const days = customDays || 30;
            multiplier = 30 / days; // Proporción de días por mes
            break;
        default:
            multiplier = 1;
    }
    
    return baseAmount * multiplier;
}

// Función para manejar cambios de frecuencia en el modal principal
function handleFrequencyChange() {
    const frequency = document.getElementById('categoryRecurringFrequency').value;
    const customGroup = document.getElementById('customFrequencyGroup');
    const customDaysInput = document.getElementById('categoryCustomDays');
    
    if (frequency === 'custom') {
        customGroup.style.display = 'block';
        customDaysInput.required = true;
    } else {
        customGroup.style.display = 'none';
        customDaysInput.required = false;
        customDaysInput.value = '';
    }
}

// Función para manejar cambios de frecuencia en el modal de selección
function handleSelectFrequencyChange() {
    const frequency = document.getElementById('selectCategoryRecurringFrequency').value;
    const customGroup = document.getElementById('selectCustomFrequencyGroup');
    const customDaysInput = document.getElementById('selectCategoryCustomDays');
    
    if (frequency === 'custom') {
        customGroup.style.display = 'block';
        customDaysInput.required = true;
    } else {
        customGroup.style.display = 'none';
        customDaysInput.required = false;
        customDaysInput.value = '';
    }
}

async function saveData() {
    try {
        await saveUserData();
        
        // Sincronizar automáticamente después de guardar
        if (window.syncService && window.syncService.isOnline) {
            console.log('🔄 Sincronizando datos después de guardar...');
            setTimeout(() => {
                window.syncService.syncNow();
            }, 1000);
        }
    } catch (error) {
        console.error('Error al guardar datos:', error);
        showNotification('Error al guardar los datos. Verifica el espacio disponible en tu navegador.', 'error');
    }
}

async function saveCategoryGroups() {
    try {
        await saveUserData();
    } catch (error) {
        console.error('Error al guardar grupos de categorías:', error);
    }
}

function initializeDefaultCategories() {
    console.log('Inicializando categorías por defecto...');
    console.log('Categorías actuales:', Object.keys(categoryGroups));
    
    // Siempre cargar las categorías por defecto para que estén disponibles
    // Si no existen en categoryGroups, las agregamos
    Object.keys(defaultCategoryGroups).forEach(categoryName => {
        if (!categoryGroups[categoryName]) {
            categoryGroups[categoryName] = [...defaultCategoryGroups[categoryName]];
            console.log(`Agregada categoría: ${categoryName} con ${defaultCategoryGroups[categoryName].length} subcategorías`);
        } else {
            // Agregar subcategorías que no existan
            defaultCategoryGroups[categoryName].forEach(subcategory => {
                if (!categoryGroups[categoryName].includes(subcategory)) {
                    categoryGroups[categoryName].push(subcategory);
                    console.log(`Agregada subcategoría: ${subcategory} a ${categoryName}`);
                }
            });
        }
    });
    
    // Agregar categorías de ingresos al sistema de categorías
    Object.keys(defaultIncomeCategories).forEach(categoryName => {
        if (!categoryGroups[categoryName]) {
            categoryGroups[categoryName] = [...defaultIncomeCategories[categoryName]];
            console.log(`Agregada categoría de ingreso: ${categoryName} con ${defaultIncomeCategories[categoryName].length} subcategorías`);
        } else {
            // Agregar subcategorías que no existan
            defaultIncomeCategories[categoryName].forEach(subcategory => {
                if (!categoryGroups[categoryName].includes(subcategory)) {
                    categoryGroups[categoryName].push(subcategory);
                    console.log(`Agregada subcategoría de ingreso: ${subcategory} a ${categoryName}`);
                }
            });
        }
    });
    
    saveCategoryGroups();
    console.log('Categorías después de inicializar:', Object.keys(categoryGroups));
    
    // Solo crear categorías de presupuesto si no hay ninguna
    if (categories.length === 0) {
        console.log('Creando categorías de presupuesto por defecto...');
        // Crear algunas categorías de ejemplo con presupuestos
        const defaultCategories = [
            {
                id: Date.now() + 1,
                name: 'Alimentación y Bebidas',
                subcategory: 'Supermercado',
                budget: 12000,
                recurringDate: new Date().toISOString().split('T')[0],
                frequency: 'monthly',
                customDays: null,
                color: defaultColors['Alimentación y Bebidas'],
                spent: 0
            },
            {
                id: Date.now() + 2,
                name: 'Vivienda y Servicios',
                subcategory: 'Renta o hipoteca',
                budget: 18000,
                recurringDate: new Date().toISOString().split('T')[0],
                frequency: 'monthly',
                customDays: null,
                color: defaultColors['Vivienda y Servicios'],
                spent: 0
            },
            {
                id: Date.now() + 3,
                name: 'Transporte',
                subcategory: 'Gasolina',
                budget: 4000,
                recurringDate: new Date().toISOString().split('T')[0],
                frequency: 'biweekly',
                customDays: null,
                color: defaultColors['Transporte'],
                spent: 0
            },
            {
                id: Date.now() + 4,
                name: 'Salud y Bienestar',
                subcategory: 'Seguro médico',
                budget: 2500,
                recurringDate: new Date().toISOString().split('T')[0],
                frequency: 'monthly',
                customDays: null,
                color: defaultColors['Salud y Bienestar'],
                spent: 0
            },
            {
                id: Date.now() + 5,
                name: 'Educación',
                subcategory: 'Colegiatura',
                budget: 8000,
                recurringDate: new Date().toISOString().split('T')[0],
                frequency: 'monthly',
                customDays: null,
                color: defaultColors['Educación'],
                spent: 0
            },
            {
                id: Date.now() + 6,
                name: 'Servicios Financieros',
                subcategory: 'Cuenta de ahorros',
                budget: 6000,
                recurringDate: new Date().toISOString().split('T')[0],
                color: defaultColors['Servicios Financieros'],
                spent: 0
            }
        ];
        
        categories = defaultCategories;
        saveData();
        console.log('Categorías de presupuesto creadas:', categories.length);
    }
}

function loadData() {
    loadDataSafely();
    loadIncomes();
    
    // Inicializar fecha de inicio para ingresos
    const today = new Date().toISOString().split('T')[0];
    const incomeStartDate = document.getElementById('incomeStartDate');
    if (incomeStartDate) {
        incomeStartDate.value = today;
    }
}



function editCategory(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;
    
    // Llenar el formulario con los datos de la categoría
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categorySubcategory').value = category.subcategory || '';
    document.getElementById('categoryBudget').value = category.budget;
    document.getElementById('categoryRecurringDate').value = category.recurringDate || new Date().toISOString().split('T')[0];
    // Mantener el color de la categoría principal
    document.getElementById('categoryColor').value = getCategoryColor(category.name);
    
    // Llenar los campos de frecuencia
    const frequency = category.frequency || 'monthly';
    document.getElementById('categoryRecurringFrequency').value = frequency;
    
    // Mostrar/ocultar campo personalizado según la frecuencia
    const customGroup = document.getElementById('customFrequencyGroup');
    const customDaysInput = document.getElementById('categoryCustomDays');
    if (frequency === 'custom') {
        customGroup.style.display = 'block';
        customDaysInput.value = category.customDays || 30;
    } else {
        customGroup.style.display = 'none';
        customDaysInput.value = '';
    }
    
    // Actualizar dropdown de subcategorías
    updateSubcategoryDropdown();
    
    // Marcar el formulario como modo edición
    document.getElementById('categoryForm').dataset.editId = categoryId;
    
    // Cambiar el título del modal
    document.getElementById('categoryModalTitle').textContent = 'Editar Categoría';
    
    // Cambiar el texto del botón
    const submitBtn = document.querySelector('#categoryForm .btn-primary');
    submitBtn.textContent = 'Actualizar';
    
    openModal('categoryModal');
}

function deleteCategory(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;
    
    // Verificar si hay transacciones asociadas
    const hasTransactions = transactions.some(t => t.category === category.name);
    
    if (hasTransactions) {
        if (!confirm(`La categoría "${category.name}" tiene transacciones asociadas. ¿Estás seguro de que quieres eliminarla? Esto también eliminará todas las transacciones relacionadas.`)) {
            return;
        }
        // Eliminar transacciones asociadas
        transactions = transactions.filter(t => t.category !== category.name);
    } else {
        if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`)) {
            return;
        }
    }
    
    // Eliminar la categoría
    categories = categories.filter(cat => cat.id !== categoryId);
    
    saveData();
    updateUI();
}

function editTransaction(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    document.getElementById('transactionDescription').value = transaction.description;
    document.getElementById('transactionAmount').value = transaction.amount;
    document.getElementById('transactionType').value = transaction.type;
    document.getElementById('transactionCategory').value = transaction.category;
    document.getElementById('transactionDate').value = transaction.date;
    document.getElementById('transactionComment').value = transaction.comment || '';
    transactionForm.dataset.editId = transactionId;
    document.getElementById('transactionModalTitle').textContent = transaction.type === 'gasto' ? 'Editar Gasto' : 'Editar Ingreso';
    const submitBtn = transactionForm.querySelector('.btn-primary');
    submitBtn.textContent = 'Actualizar';
    openModal('transactionModal');
}

function addSelectedCategoryToBudget() {
    const categoryName = document.getElementById('selectCategoryName').value;
    const subcategoryName = document.getElementById('selectSubcategoryName').value;
    const budget = parseFloat(document.getElementById('selectCategoryBudget').value);
    const recurringDate = document.getElementById('selectCategoryRecurringDate').value;
    const frequency = document.getElementById('selectCategoryRecurringFrequency').value;
    const customDays = frequency === 'custom' ? parseInt(document.getElementById('selectCategoryCustomDays').value) : null;
    const color = document.getElementById('selectCategoryColor').value;
    
    if (!categoryName || !budget || !recurringDate) {
        alert('Por favor completa todos los campos requeridos.');
        return;
    }
    
    // Verificar si ya existe esta categoría en el presupuesto
    const existingCategory = categories.find(cat => 
        cat.name === categoryName && cat.subcategory === subcategoryName
    );
    
    if (existingCategory) {
        alert('Esta categoría ya existe en tu presupuesto. Puedes editarla desde la lista de categorías.');
        return;
    }
    
    // Crear nueva categoría para el presupuesto
    const categoryData = {
        id: Date.now(),
        name: categoryName,
        subcategory: subcategoryName || null,
        budget: budget,
        recurringDate: recurringDate,
        frequency: frequency,
        customDays: customDays,
        color: getCategoryColor(categoryName),
        spent: 0
    };
    
    categories.push(categoryData);
    saveData();
    clearCaches(); // Limpiar caches cuando se actualicen datos
    updateUI();
    closeModal('selectCategoryModal');
}

function deleteTransaction(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar la transacción "${transaction.description}"?`)) {
        return;
    }
    
    // Restar el gasto de la categoría si es un gasto
    if (transaction.type === 'gasto') {
        const category = categories.find(cat => cat.name === transaction.category);
        if (category) {
            category.spent -= transaction.amount;
        }
    }
    
    // Eliminar la transacción
    transactions = transactions.filter(t => t.id !== transactionId);
    
    saveData();
    updateUI();
}

// Función global para cerrar modales (usada en HTML)
window.closeModal = closeModal;

// Optimizaciones implementadas:
// 1. Cache para formateo de moneda (currencyCache)
// 2. Cache para colores de categorías (colorCache)
// 3. Debouncing en updateUI() para evitar actualizaciones excesivas
// 4. Cache para transacciones filtradas (filteredTransactionsCache)
// 5. Manejo de errores mejorado en localStorage
// 6. Validación de datos al cargar
// 7. Delegación de eventos para mejor rendimiento
// 8. Fragmentos DOM para actualizaciones más eficientes



// Función para mostrar información del usuario
function showUserInfo() {
    if (currentUser) {
        const totalCategories = categories.length;
        const totalTransactions = transactions.length;
        const totalIncomes = incomes.length;
        const totalGoals = goals.length;
        
        console.log(`Usuario: ${currentUser}`);
        console.log(`Categorías: ${totalCategories}`);
        console.log(`Transacciones: ${totalTransactions}`);
        console.log(`Ingresos: ${totalIncomes}`);
        console.log(`Metas: ${totalGoals}`);
    }
}

// Función para exportar datos del usuario
function exportUserData() {
    if (!currentUser) return;
    
    const userData = {
        categories: categories,
        transactions: transactions,
        categoryGroups: categoryGroups,
        incomes: incomes,
        goals: goals,
        notifications: notifications,
        bankAccounts: bankAccounts,
        bankTransactions: bankTransactions,
        reconciliationData: reconciliationData
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `jm_budget_${currentUser}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Función para importar datos del usuario
function importUserData(file) {
    if (!currentUser) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validar estructura del backup
            const validation = validateBackupStructure(importedData);
            if (!validation.isValid) {
                alert('Error en el archivo de backup:\n\n' + validation.errors.join('\n'));
                return;
            }
            
            // Verificar si es un backup completo o datos simples
            let dataToImport;
            let isBackup = false;
            
            if (importedData.data && importedData.user && importedData.timestamp) {
                // Es un backup completo
                dataToImport = importedData.data;
                isBackup = true;
                
                // Verificar que el backup sea del usuario actual
                if (importedData.user !== currentUser) {
                    if (!confirm(`Este backup pertenece al usuario "${importedData.user}". ¿Quieres restaurarlo de todas formas?`)) {
                        return;
                    }
                }
            } else if (importedData.categories && importedData.transactions && importedData.categoryGroups) {
                // Son datos simples de importación
                dataToImport = importedData;
            } else if (importedData.categories || importedData.transactions || importedData.incomes) {
                // Datos parciales - intentar restaurar lo que esté disponible
                dataToImport = importedData;
                isBackup = true;
            } else {
                alert('El archivo JSON no contiene datos válidos de JM Budget.\n\nAsegúrate de que sea un backup creado por la aplicación.');
                return;
            }
            
            // Mostrar información del backup si es uno
            let confirmMessage = '¿Estás seguro de que quieres importar estos datos? Esto sobrescribirá tus datos actuales.';
            if (isBackup) {
                const backupDate = new Date(importedData.timestamp).toLocaleString('es-ES');
                const dataInfo = [];
                
                if (dataToImport.categories) dataInfo.push(`${dataToImport.categories.length} categorías`);
                if (dataToImport.transactions) dataInfo.push(`${dataToImport.transactions.length} transacciones`);
                if (dataToImport.incomes) dataInfo.push(`${dataToImport.incomes.length} ingresos`);
                
                confirmMessage = `Backup del ${backupDate}\nUsuario: ${importedData.user}\nDatos: ${dataInfo.join(', ')}\n\n¿Estás seguro de que quieres restaurar este backup? Esto sobrescribirá tus datos actuales.`;
            }
            
            // Confirmar importación
            if (confirm(confirmMessage)) {
                // Restaurar datos
                if (isBackup) {
                    // Restaurar desde backup completo
                    categories = dataToImport.categories || [];
                    transactions = dataToImport.transactions || [];
                    categoryGroups = dataToImport.categoryGroups || {};
                    incomes = dataToImport.incomes || [];
                    
                    // Restaurar datos adicionales si existen
                    if (dataToImport.goals) goals = dataToImport.goals;
                    if (dataToImport.notifications) notifications = dataToImport.notifications;
                    if (dataToImport.bankAccounts) bankAccounts = dataToImport.bankAccounts;
                    if (dataToImport.bankTransactions) bankTransactions = dataToImport.bankTransactions;
                    if (dataToImport.reconciliationData) reconciliationData = dataToImport.reconciliationData;
                    
                    // Guardar todo
                    saveData();
                    saveCategoryGroups();
                    saveIncomes();
                    saveGoals();
                    saveBankAccounts();
                    saveUserData();
                } else {
                    // Importación simple - aplicar datos directamente
                    if (dataToImport.categories) categories = dataToImport.categories;
                    if (dataToImport.transactions) transactions = dataToImport.transactions;
                    if (dataToImport.categoryGroups) categoryGroups = dataToImport.categoryGroups;
                    if (dataToImport.incomes) incomes = dataToImport.incomes;
                    if (dataToImport.goals) goals = dataToImport.goals;
                    if (dataToImport.notifications) notifications = dataToImport.notifications;
                    if (dataToImport.bankAccounts) bankAccounts = dataToImport.bankAccounts;
                    if (dataToImport.bankTransactions) bankTransactions = dataToImport.bankTransactions;
                    if (dataToImport.reconciliationData) reconciliationData = dataToImport.reconciliationData;
                    
                    // Guardar todo
                    saveData();
                    saveCategoryGroups();
                    saveIncomes();
                    saveGoals();
                    saveBankAccounts();
                }
                
                clearCaches();
                updateUI(true);
                
                const successMessage = isBackup ? 'Backup restaurado exitosamente.' : 'Datos importados exitosamente.';
                alert(successMessage);
                
                // Agregar al historial
                const action = isBackup ? 'Backup restaurado' : 'Datos importados';
                const details = isBackup ? `Se restauró un backup del ${new Date(importedData.timestamp).toLocaleDateString('es-ES')}` : 'Se importaron datos externos';
                addToHistory(action, details, 'import');
            }
        } catch (error) {
            console.error('Error al importar datos:', error);
            alert('Error al importar datos:\n\n' + error.message + '\n\nAsegúrate de que el archivo sea un backup válido de JM Budget.');
        }
    };
    reader.readAsText(file);
}

// Función para cargar ingresos recurrentes
function loadIncomes() {
    try {
        // Los ingresos ya se cargan en loadUserData()
        // Esta función se mantiene por compatibilidad
        console.log('📥 Ingresos cargados:', incomes.length);
    } catch (error) {
        console.error('❌ Error al cargar ingresos recurrentes:', error);
        incomes = [];
    }
}

// Función para guardar ingresos recurrentes
async function saveIncomes() {
    try {
        // Guardar en el sistema centralizado
        await saveUserData();
        console.log('✅ Ingresos guardados exitosamente');
    } catch (error) {
        console.error('❌ Error al guardar ingresos recurrentes:', error);
        showNotification('Error al guardar los ingresos. Verifica el espacio disponible en tu navegador.', 'error');
    }
}

// Función para manejar el envío del formulario de ingresos recurrentes
async function handleIncomeSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('incomeName').value.trim();
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const frequency = document.getElementById('incomeFrequency').value;
    const startDate = document.getElementById('incomeStartDate').value;
    const customDays = frequency === 'custom' ? parseInt(document.getElementById('incomeCustomDays').value) : null;
    const editId = incomeForm.dataset.editId;
    
    if (!name || !amount || !startDate) {
        alert('Por favor completa todos los campos requeridos.');
        return;
    }
    
    if (editId) {
        // Editar ingreso existente
        const incomeIndex = incomes.findIndex(inc => inc.id === parseInt(editId));
        if (incomeIndex !== -1) {
            incomes[incomeIndex] = {
                ...incomes[incomeIndex],
                name: name,
                amount: amount,
                frequency: frequency,
                startDate: startDate,
                customDays: customDays
            };
        }
        delete incomeForm.dataset.editId;
    } else {
        // Crear nuevo ingreso
        const incomeData = {
            id: Date.now(),
            name: name,
            amount: amount,
            frequency: frequency,
            startDate: startDate,
            customDays: customDays
        };
        incomes.push(incomeData);
    }
    
    await saveIncomes();
    addToHistory('Ingreso recurrente', editId ? `Editó ingreso: ${name}` : `Agregó ingreso: ${name}`, 'income');
    clearCaches();
    updateUI();
    closeModal('incomeModal');
    
    // Mostrar confirmación
    showVisualNotification(
        editId ? 'Ingreso actualizado' : 'Ingreso agregado',
        `El ingreso "${name}" se ha ${editId ? 'actualizado' : 'agregado'} correctamente.`,
        'recurring'
    );
}

// Función para calcular el total de ingresos ajustados
function calculateTotalIncomes() {
    return incomes.reduce((sum, income) => {
        const adjustedAmount = calculateAdjustedBudget(income.amount, income.frequency, income.customDays);
        return sum + adjustedAmount;
    }, 0);
}

// Función para manejar cambios de frecuencia en el modal de ingresos
function handleIncomeFrequencyChange() {
    const frequency = document.getElementById('incomeFrequency').value;
    const customGroup = document.getElementById('incomeCustomFrequencyGroup');
    const customDaysInput = document.getElementById('incomeCustomDays');
    
    if (frequency === 'custom') {
        customGroup.style.display = 'block';
        customDaysInput.required = true;
    } else {
        customGroup.style.display = 'none';
        customDaysInput.required = false;
        customDaysInput.value = '';
    }
}

// Función para mostrar la lista de ingresos recurrentes
function updateIncomesDisplay() {
    const container = document.getElementById('incomesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (incomes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; font-style: italic; margin: 20px 0;">No hay ingresos recurrentes configurados. Agrega un nuevo ingreso para comenzar.</p>';
        return;
    }
    
    // Crear contenedor para ingresos con el mismo estilo que las categorías
    const incomesSection = document.createElement('div');
    incomesSection.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 15px;
        max-width: 800px;
        margin: 0 auto 30px auto;
    `;
    
    // Título de la sección
    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = 'Ingresos Recurrentes';
    sectionTitle.style.cssText = `
        margin-bottom: 20px;
        color: var(--text-color, #333);
        font-size: 18px;
        font-weight: 600;
    `;
    container.appendChild(sectionTitle);
    
    // Crear tarjetas compactas para cada ingreso
    incomes.forEach(income => {
        const adjustedAmount = calculateAdjustedBudget(income.amount, income.frequency, income.customDays);
        const frequencyText = getFrequencyText(income.frequency, income.customDays);
        const nextIncome = income.startDate && income.frequency ? 
            getNextRecurrenceDate(income.startDate, income.frequency, income.customDays) : null;
        
        // Mostrar el monto base y el ajustado
        const amountDisplay = income.frequency && income.frequency !== 'monthly' ? 
            `${formatCurrency(income.amount)} → ${formatCurrency(adjustedAmount)}` : 
            formatCurrency(income.amount);
        
        const incomeCard = document.createElement('div');
        incomeCard.className = 'category-card income-card';
        incomeCard.style.cssText = `
            background: var(--card-bg, white);
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
            position: relative;
            border-left: 6px solid #34c759;
            border: 1px solid rgba(0, 0, 0, 0.08);
            margin-bottom: 15px;
            width: 100%;
            cursor: pointer;
        `;
        
        incomeCard.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <i class="fas fa-money-bill-wave" style="font-size: 20px; color: #34c759;"></i>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-color, #222); font-size: 16px; margin-bottom: 4px;">${income.name}</div>
                        <div style="color: var(--text-muted, #666); font-size: 14px; margin-bottom: 2px;">${amountDisplay}</div>
                        <div style="color: var(--text-muted, #8e8e93); font-size: 12px;">${frequencyText} - Próximo: ${formatDate(nextIncome || income.startDate)}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="btn-icon edit-income" data-id="${income.id}" title="Editar ingreso" style="
                        background: var(--card-bg, white);
                        border: 1px solid var(--border-color, #e0e0e0);
                        border-radius: 8px;
                        padding: 8px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        color: var(--text-muted, #666);
                    ">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-income" data-id="${income.id}" title="Eliminar ingreso" style="
                        background: var(--card-bg, white);
                        border: 1px solid var(--border-color, #e0e0e0);
                        border-radius: 8px;
                        padding: 8px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        color: var(--danger-color, #ff3b30);
                    ">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        incomesSection.appendChild(incomeCard);
    });
    
    container.appendChild(incomesSection);
    
    // Agregar event listeners para los botones
    document.querySelectorAll('.edit-income').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const incomeId = parseInt(e.currentTarget.dataset.id);
            editIncome(incomeId);
        });
    });
    
    document.querySelectorAll('.delete-income').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const incomeId = parseInt(e.currentTarget.dataset.id);
            deleteIncome(incomeId);
        });
    });
}

// Función para editar un ingreso
function editIncome(incomeId) {
    const income = incomes.find(inc => inc.id === incomeId);
    if (!income) return;
    
    // Llenar el formulario con los datos del ingreso
    document.getElementById('incomeName').value = income.name;
    document.getElementById('incomeAmount').value = income.amount;
    document.getElementById('incomeFrequency').value = income.frequency;
    document.getElementById('incomeStartDate').value = income.startDate;
    
    // Mostrar/ocultar campo personalizado según la frecuencia
    const customGroup = document.getElementById('incomeCustomFrequencyGroup');
    const customDaysInput = document.getElementById('incomeCustomDays');
    if (income.frequency === 'custom') {
        customGroup.style.display = 'block';
        customDaysInput.value = income.customDays || 30;
    } else {
        customGroup.style.display = 'none';
        customDaysInput.value = '';
    }
    
    // Marcar que estamos editando
    document.getElementById('incomeForm').dataset.editId = incomeId;
    document.getElementById('incomeModalTitle').textContent = 'Editar Ingreso Recurrente';
    
    openModal('incomeModal');
}

// Función para eliminar un ingreso
function deleteIncome(incomeId) {
    const income = incomes.find(inc => inc.id === incomeId);
    if (!income) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el ingreso "${income.name}"?`)) {
        return;
    }
    
    // Eliminar el ingreso
    incomes = incomes.filter(inc => inc.id !== incomeId);
    
    saveIncomes();
    clearCaches();
    updateUI();
}

// ===== FUNCIONES PARA METAS =====

// Función para cargar metas
function loadGoals() {
    try {
        const goalsData = localStorage.getItem(`budgetGoals_${currentUser}`);
        goals = goalsData ? JSON.parse(goalsData) : [];
        
        // Validar que los datos sean un array válido
        if (!Array.isArray(goals)) goals = [];
        
    } catch (error) {
        console.error('Error al cargar metas:', error);
        goals = [];
    }
}

// Función para guardar metas
async function saveGoals() {
    try {
        if (currentUser) {
            localStorage.setItem(`budgetGoals_${currentUser}`, JSON.stringify(goals));
            
            // Sincronizar con Firebase si está disponible
            if (window.syncService && window.syncService.isEnabled()) {
                await window.syncService.syncGoals(goals);
            }
        }
    } catch (error) {
        console.error('Error al guardar metas:', error);
    }
}

// Función para mostrar el modal de nueva meta
function showAddGoalModal() {
    // Limpiar formulario
    document.getElementById('goalForm').reset();
    document.getElementById('goalModalTitle').textContent = 'Nueva Meta Financiera';
    delete document.getElementById('goalForm').dataset.editId;
    
    // Inicializar fecha objetivo (por defecto 1 año desde hoy)
    const today = new Date();
    const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    const goalDeadline = document.getElementById('goalDeadline');
    if (goalDeadline) {
        goalDeadline.value = oneYearFromNow.toISOString().split('T')[0];
    }
    
    // Establecer valor mínimo para la fecha (hoy)
    if (goalDeadline) {
        goalDeadline.min = today.toISOString().split('T')[0];
    }
    
    openModal('goalModal');
}

// Función para manejar el envío del formulario de metas
async function handleGoalSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Obtener datos del formulario
    const goalName = formData.get('goalName') || document.getElementById('goalName').value;
    const goalTarget = parseFloat(formData.get('goalTarget') || document.getElementById('goalTarget').value);
    const goalCurrent = parseFloat(formData.get('goalCurrent') || document.getElementById('goalCurrent').value);
    const goalDeadline = formData.get('goalDeadline') || document.getElementById('goalDeadline').value;
    const goalCategory = formData.get('goalCategory') || document.getElementById('goalCategory').value;
    const goalColor = formData.get('goalColor') || document.getElementById('goalColor').value;
    const goalDescription = formData.get('goalDescription') || document.getElementById('goalDescription').value;
    
    // Validaciones
    if (!goalName || !goalTarget || !goalDeadline || !goalCategory) {
        alert('Por favor completa todos los campos obligatorios.');
        return;
    }
    
    if (goalTarget <= 0) {
        alert('La meta debe ser mayor a 0.');
        return;
    }
    
    if (goalCurrent < 0) {
        alert('El ahorro actual no puede ser negativo.');
        return;
    }
    
    if (goalCurrent > goalTarget) {
        alert('El ahorro actual no puede ser mayor que la meta.');
        return;
    }
    
    const editId = form.dataset.editId;
    
    if (editId) {
        // Editar meta existente
        const goalIndex = goals.findIndex(g => g.id === editId);
        if (goalIndex !== -1) {
            goals[goalIndex] = {
                ...goals[goalIndex],
                name: goalName,
                target: goalTarget,
                current: goalCurrent,
                deadline: goalDeadline,
                category: goalCategory,
                color: goalColor,
                description: goalDescription,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Crear nueva meta
        const newGoal = {
            id: Date.now().toString(),
            name: goalName,
            target: goalTarget,
            current: goalCurrent,
            deadline: goalDeadline,
            category: goalCategory,
            color: goalColor,
            description: goalDescription,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completed: false
        };
        
        goals.push(newGoal);
    }
    
    // Guardar y actualizar
    await saveGoals();
    closeModal('goalModal');
    updateGoalsDisplay();
    updateUI();
    
    // Mostrar notificación
    const action = editId ? 'actualizada' : 'creada';
    showNotification(`Meta ${action} exitosamente`, 'success');
    
    // Agregar al historial
    addToHistory(
        editId ? 'Meta actualizada' : 'Meta creada',
        `Meta: ${goalName} - Objetivo: $${formatCurrency(goalTarget)}`,
        'goal'
    );
}

// Función para actualizar la visualización de metas
function updateGoalsDisplay() {
    const goalsContainer = document.getElementById('goalsContainer');
    if (!goalsContainer) return;
    
    // Actualizar estadísticas
    updateGoalsStats();
    
    if (goals.length === 0) {
        goalsContainer.innerHTML = `
            <div class="no-goals-message">
                <i class="fas fa-bullseye"></i>
                <h3>No tienes metas configuradas</h3>
                <p>Crea tu primera meta financiera para empezar a ahorrar</p>
                <button class="btn-primary" onclick="showAddGoalModal()">
                    <i class="fas fa-plus"></i> Crear Primera Meta
                </button>
            </div>
        `;
        return;
    }
    
    // Ordenar metas por fecha de vencimiento
    const sortedGoals = [...goals].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    goalsContainer.innerHTML = sortedGoals.map(goal => {
        const progress = (goal.current / goal.target) * 100;
        const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysLeft < 0;
        const isCompleted = goal.completed || progress >= 100;
        
        return `
            <div class="goal-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-goal-id="${goal.id}">
                <div class="goal-header">
                    <div class="goal-info">
                        <h3 class="goal-name" style="color: ${goal.color}">${goal.name}</h3>
                        <p class="goal-category">${goal.category}</p>
                    </div>
                    <div class="goal-actions">
                        <button class="btn-icon" onclick="editGoal('${goal.id}')" title="Editar meta">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="deleteGoal('${goal.id}')" title="Eliminar meta">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="goal-progress">
                    <div class="goal-amounts">
                        <span class="goal-current">$${formatCurrency(goal.current)}</span>
                        <span class="goal-separator">/</span>
                        <span class="goal-target">$${formatCurrency(goal.target)}</span>
                    </div>
                    <div class="goal-progress-bar">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(progress, 100)}%; background-color: ${goal.color}"></div>
                        </div>
                        <span class="goal-percentage">${Math.round(progress)}%</span>
                    </div>
                </div>
                
                <div class="goal-details">
                    <div class="goal-deadline">
                        <i class="fas fa-calendar-alt"></i>
                        <span class="${isOverdue ? 'overdue' : ''}">
                            ${isOverdue ? 'Vencida' : daysLeft === 0 ? 'Vence hoy' : `Vence en ${daysLeft} días`}
                        </span>
                    </div>
                    ${goal.description ? `<p class="goal-description">${goal.description}</p>` : ''}
                </div>
                
                ${isCompleted ? '<div class="goal-completed-badge"><i class="fas fa-check-circle"></i> Completada</div>' : ''}
            </div>
        `;
    }).join('');
}

// Función para actualizar estadísticas de metas
function updateGoalsStats() {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.completed || (g.current / g.target) >= 1).length;
    const totalSaved = goals.reduce((sum, goal) => sum + goal.current, 0);
    
    // Actualizar elementos en el DOM
    const totalGoalsElement = document.getElementById('totalGoals');
    const completedGoalsElement = document.getElementById('completedGoals');
    const totalSavedElement = document.getElementById('totalSaved');
    
    if (totalGoalsElement) totalGoalsElement.textContent = totalGoals;
    if (completedGoalsElement) completedGoalsElement.textContent = completedGoals;
    if (totalSavedElement) totalSavedElement.textContent = formatCurrency(totalSaved);
}

// Función para editar una meta
function editGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    // Llenar formulario con datos de la meta
    document.getElementById('goalName').value = goal.name;
    document.getElementById('goalTarget').value = goal.target;
    document.getElementById('goalCurrent').value = goal.current;
    document.getElementById('goalDeadline').value = goal.deadline;
    document.getElementById('goalCategory').value = goal.category;
    document.getElementById('goalColor').value = goal.color;
    document.getElementById('goalDescription').value = goal.description || '';
    
    // Marcar que estamos editando
    document.getElementById('goalForm').dataset.editId = goalId;
    document.getElementById('goalModalTitle').textContent = 'Editar Meta Financiera';
    
    openModal('goalModal');
}

// Función para eliminar una meta
function deleteGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar la meta "${goal.name}"?`)) {
        return;
    }
    
    // Eliminar la meta
    goals = goals.filter(g => g.id !== goalId);
    
    saveGoals();
    updateGoalsDisplay();
    updateUI();
    
    // Mostrar notificación
    showNotification('Meta eliminada exitosamente', 'success');
    
    // Agregar al historial
    addToHistory('Meta eliminada', `Meta: ${goal.name}`, 'goal');
}

// Función para crear backup de los datos del usuario
function createBackup() {
    if (!currentUser) {
        alert('Debes estar logueado para crear un backup.');
        return;
    }
    
    try {
        // Recopilar todos los datos del usuario
        const backupData = {
            user: currentUser,
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {
                categories: categories,
                transactions: transactions,
                categoryGroups: categoryGroups,
                incomes: incomes,
                goals: goals,
                notifications: notifications,
                bankAccounts: bankAccounts,
                bankTransactions: bankTransactions,
                reconciliationData: reconciliationData
            }
        };
        
        // Convertir a JSON
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Crear nombre de archivo con fecha y hora
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const fileName = `jm_budget_backup_${currentUser}_${dateStr}_${timeStr}.json`;
        
        // Crear enlace de descarga
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        
        // Simular clic para descargar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL
        URL.revokeObjectURL(url);
        
        // Mostrar mensaje de éxito
        alert(`Backup creado exitosamente: ${fileName}`);
        
        // Agregar al historial
        addToHistory('Backup creado', `Se creó un backup completo de los datos`, 'backup');
        
    } catch (error) {
        console.error('Error al crear backup:', error);
        alert('Error al crear el backup: ' + error.message);
    }
}

// Funciones para reportes avanzados
function updateAdvancedReports() {
    updateTrendAnalysis();
    updateTopCategories();
    updateMonthComparison();
    updateDetailedCategoryChart();
}

function updateTrendAnalysis() {
    const selectedMonth = document.getElementById('reportMonth').value;
    const months = getAvailableMonths();
    
    if (months.length < 2) {
        document.getElementById('monthlyTrend').textContent = 'N/A';
        return;
    }
    
    // Calcular tendencia de los últimos 3 meses
    const recentMonths = months.slice(-3);
    const monthlyData = recentMonths.map(month => {
        const monthTransactions = transactions.filter(t => t.date.startsWith(month));
        const expenses = monthTransactions
            .filter(t => t.type === 'gasto')
            .reduce((sum, t) => sum + t.amount, 0);
        return { month, expenses };
    });
    
    // Calcular tendencia
    if (monthlyData.length >= 2) {
        const current = monthlyData[monthlyData.length - 1].expenses;
        const previous = monthlyData[monthlyData.length - 2].expenses;
        const change = current - previous;
        const percentage = previous > 0 ? (change / previous) * 100 : 0;
        
        const trendText = `${change >= 0 ? '+' : ''}${formatCurrency(change)} (${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%)`;
        document.getElementById('monthlyTrend').textContent = trendText;
        document.getElementById('monthlyTrend').className = `amount ${change >= 0 ? 'expense' : 'income'}`;
    }
    
    // Actualizar gráfico de tendencias
    updateTrendChart(monthlyData);
}

function updateTrendChart(monthlyData) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    if (window.trendChart && typeof window.trendChart.destroy === 'function') {
        window.trendChart.destroy();
    }
    
    const labels = monthlyData.map(d => new Date(d.month + '-01').toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short' 
    }));
    
    const data = monthlyData.map(d => d.expenses);
    
    window.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gastos Mensuales',
                data: data,
                borderColor: '#ff3b30',
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function updateTopCategories() {
    const selectedMonth = document.getElementById('reportMonth').value;
    const monthTransactions = selectedMonth 
        ? transactions.filter(t => t.date.startsWith(selectedMonth))
        : transactions;
    
    // Agrupar gastos por categoría
    const categoryTotals = {};
    monthTransactions
        .filter(t => t.type === 'gasto')
        .forEach(t => {
            const category = t.category;
            if (!categoryTotals[category]) {
                categoryTotals[category] = 0;
            }
            categoryTotals[category] += t.amount;
        });
    
    // Ordenar por total y tomar top 5
    const topCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    
    // Generar HTML
    const container = document.getElementById('topCategoriesList');
    if (!container) return;
    
    if (topCategories.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; font-style: italic;">No hay datos de gastos para mostrar</p>';
        return;
    }
    
    container.innerHTML = topCategories.map(([category, amount]) => {
        const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
        const color = getCategoryColor(category);
        
        return `
            <div class="category-item">
                <div class="category-info">
                    <div class="category-color" style="background-color: ${color}"></div>
                    <div class="category-name">${category}</div>
                </div>
                <div style="text-align: right;">
                    <div class="category-amount">${formatCurrency(amount)}</div>
                    <div class="category-percentage">${percentage.toFixed(1)}% del total</div>
                </div>
            </div>
        `;
    }).join('');
}

function updateMonthComparison() {
    const selectedMonth = document.getElementById('reportMonth').value;
    if (!selectedMonth) {
        document.getElementById('monthComparison').innerHTML = '<p style="color: #666; text-align: center; font-style: italic;">Selecciona un mes para comparar</p>';
        return;
    }
    
    // Obtener mes anterior
    const currentDate = new Date(selectedMonth + '-01');
    const previousDate = new Date(currentDate);
    previousDate.setMonth(previousDate.getMonth() - 1);
    const previousMonth = previousDate.toISOString().slice(0, 7);
    
    // Calcular datos para ambos meses
    const currentData = calculateMonthData(selectedMonth);
    const previousData = calculateMonthData(previousMonth);
    
    // Generar comparaciones
    const comparisons = [
        { label: 'Gastos', current: currentData.expenses, previous: previousData.expenses },
        { label: 'Ingresos', current: currentData.income, previous: previousData.income },
        { label: 'Balance', current: currentData.balance, previous: previousData.balance }
    ];
    
    const container = document.getElementById('monthComparison');
    container.innerHTML = comparisons.map(comp => {
        const change = comp.current - comp.previous;
        const percentage = comp.previous > 0 ? (change / comp.previous) * 100 : 0;
        
        let changeClass = 'neutral';
        let changeIcon = '';
        if (change > 0) {
            changeClass = comp.label === 'Gastos' ? 'negative' : 'positive';
            changeIcon = '↗';
        } else if (change < 0) {
            changeClass = comp.label === 'Gastos' ? 'positive' : 'negative';
            changeIcon = '↘';
        }
        
        return `
            <div class="comparison-item">
                <div class="comparison-label">${comp.label}</div>
                <div class="comparison-values">
                    <div class="comparison-current">${formatCurrency(comp.current)}</div>
                    <div class="comparison-previous">vs ${formatCurrency(comp.previous)}</div>
                    <div class="comparison-change ${changeClass}">
                        ${changeIcon} ${change >= 0 ? '+' : ''}${percentage.toFixed(1)}%
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function calculateMonthData(month) {
    const monthTransactions = transactions.filter(t => t.date.startsWith(month));
    const income = monthTransactions
        .filter(t => t.type === 'ingreso')
        .reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthTransactions
        .filter(t => t.type === 'gasto')
        .reduce((sum, t) => sum + t.amount, 0);
    
    return {
        income,
        expenses,
        balance: income - expenses
    };
}

function updateDetailedCategoryChart() {
    const selectedMonth = document.getElementById('reportMonth').value;
    const monthTransactions = selectedMonth 
        ? transactions.filter(t => t.date.startsWith(selectedMonth))
        : transactions;
    
    // Agrupar por categoría y subcategoría
    const categoryData = {};
    monthTransactions
        .filter(t => t.type === 'gasto')
        .forEach(t => {
            const category = t.category;
            const subcategory = t.subcategory;
            const key = `${category} - ${subcategory}`;
            
            if (!categoryData[key]) {
                categoryData[key] = {
                    amount: 0,
                    category: category,
                    subcategory: subcategory,
                    color: getCategoryColor(category)
                };
            }
            categoryData[key].amount += t.amount;
        });
    
    // Ordenar por cantidad
    const sortedData = Object.values(categoryData)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10); // Top 10
    
    const ctx = document.getElementById('detailedCategoryChart');
    if (!ctx) return;
    
    if (window.detailedCategoryChart && typeof window.detailedCategoryChart.destroy === 'function') {
        window.detailedCategoryChart.destroy();
    }
    
    window.detailedCategoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(d => d.subcategory),
            datasets: [{
                label: 'Gastos por Subcategoría',
                data: sortedData.map(d => d.amount),
                backgroundColor: sortedData.map(d => d.color),
                borderColor: sortedData.map(d => d.color),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function exportReport() {
    const selectedMonth = document.getElementById('reportMonth').value;
    const reportType = document.getElementById('reportType').value;
    
    // Generar datos del reporte
    const reportData = generateReportData(selectedMonth, reportType);
    
    // Crear archivo CSV
    const csvContent = generateCSV(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Descargar archivo
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_${selectedMonth || 'todos'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateReportData(selectedMonth, reportType) {
    const monthTransactions = selectedMonth 
        ? transactions.filter(t => t.date.startsWith(selectedMonth))
        : transactions;
    
    switch (reportType) {
        case 'trends':
            return generateTrendsData(monthTransactions);
        case 'categories':
            return generateCategoriesData(monthTransactions);
        case 'comparison':
            return generateComparisonData(selectedMonth);
        default:
            return generateOverviewData(monthTransactions);
    }
}

function generateOverviewData(transactions) {
    const income = transactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + t.amount, 0);
    
    return [
        ['Concepto', 'Monto'],
        ['Ingresos', formatCurrency(income)],
        ['Gastos', formatCurrency(expenses)],
        ['Balance', formatCurrency(income - expenses)]
    ];
}

function generateTrendsData(transactions) {
    // Agrupar por mes
    const monthlyData = {};
    transactions.forEach(t => {
        const month = t.date.substring(0, 7);
        if (!monthlyData[month]) {
            monthlyData[month] = { income: 0, expenses: 0 };
        }
        if (t.type === 'ingreso') {
            monthlyData[month].income += t.amount;
        } else {
            monthlyData[month].expenses += t.amount;
        }
    });
    
    const data = [['Mes', 'Ingresos', 'Gastos', 'Balance']];
    Object.entries(monthlyData).forEach(([month, data]) => {
        data.push([
            new Date(month + '-01').toLocaleDateString('es-ES', { year: 'numeric', month: 'short' }),
            formatCurrency(data.income),
            formatCurrency(data.expenses),
            formatCurrency(data.income - data.expenses)
        ]);
    });
    
    return data;
}

function generateCategoriesData(transactions) {
    const categoryTotals = {};
    transactions.filter(t => t.type === 'gasto').forEach(t => {
        const key = `${t.category} - ${t.subcategory}`;
        categoryTotals[key] = (categoryTotals[key] || 0) + t.amount;
    });
    
    const data = [['Categoría', 'Subcategoría', 'Monto']];
    Object.entries(categoryTotals).forEach(([key, amount]) => {
        const [category, subcategory] = key.split(' - ');
        data.push([category, subcategory, formatCurrency(amount)]);
    });
    
    return data;
}

function generateComparisonData(selectedMonth) {
    if (!selectedMonth) return [['Error', 'Selecciona un mes para comparar']];
    
    const currentData = calculateMonthData(selectedMonth);
    const previousDate = new Date(selectedMonth + '-01');
    previousDate.setMonth(previousDate.getMonth() - 1);
    const previousMonth = previousDate.toISOString().slice(0, 7);
    const previousData = calculateMonthData(previousMonth);
    
    return [
        ['Concepto', 'Mes Actual', 'Mes Anterior', 'Diferencia', 'Cambio %'],
        ['Ingresos', formatCurrency(currentData.income), formatCurrency(previousData.income), 
         formatCurrency(currentData.income - previousData.income),
         `${((currentData.income - previousData.income) / previousData.income * 100).toFixed(1)}%`],
        ['Gastos', formatCurrency(currentData.expenses), formatCurrency(previousData.expenses),
         formatCurrency(currentData.expenses - previousData.expenses),
         `${((currentData.expenses - previousData.expenses) / previousData.expenses * 100).toFixed(1)}%`],
        ['Balance', formatCurrency(currentData.balance), formatCurrency(previousData.balance),
         formatCurrency(currentData.balance - previousData.balance),
         `${((currentData.balance - previousData.balance) / previousData.balance * 100).toFixed(1)}%`]
    ];
}

function generateCSV(data) {
    return data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

// Sistema de notificaciones y recordatorios
let recurringReminders = [];

function initializeNotifications() {
    try {
        console.log('Inicializando sistema de notificaciones...');
        loadNotifications();
        
        // Limpiar notificaciones antiguas al inicializar
        clearOldNotifications();
        
        setupNotificationEventListeners();
        checkForNotifications();
        setupRecurringReminders();
        console.log('Sistema de notificaciones inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar notificaciones:', error);
    }
}

function loadNotifications() {
    try {
        const savedNotifications = localStorage.getItem(`notifications_${currentUser}`);
        notifications = savedNotifications ? JSON.parse(savedNotifications) : [];
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        notifications = [];
    }
}

function saveNotifications() {
    try {
        localStorage.setItem(`notifications_${currentUser}`, JSON.stringify(notifications));
    } catch (error) {
        console.error('Error al guardar notificaciones:', error);
    }
}

function addNotification(title, message, type = 'general', priority = 'normal') {
    // Verificar si ya existe una notificación similar no leída
    const existingNotification = notifications.find(n => 
        n.title === title && 
        n.type === type && 
        !n.read &&
        new Date().getTime() - new Date(n.timestamp).getTime() < 24 * 60 * 60 * 1000 // 24 horas
    );
    
    if (existingNotification) {
        console.log('Notificación similar ya existe, no se agrega duplicado:', title);
        return;
    }
    
    const notification = {
        id: Date.now() + Math.random(),
        title: title,
        message: message,
        type: type,
        priority: priority,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(notification);
    
    // Mantener solo las últimas 30 notificaciones y limpiar las muy antiguas
    if (notifications.length > 30) {
        notifications = notifications.slice(0, 30);
    }
    
    // Limpiar notificaciones muy antiguas (más de 7 días)
    const weekAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
    notifications = notifications.filter(n => new Date(n.timestamp).getTime() > weekAgo);
    
    saveNotifications();
    updateNotificationsDisplay();
    
    // Mostrar notificación visual si es de alta prioridad
    if (priority === 'high') {
        showVisualNotification(title, message, type);
    }
}

function showVisualNotification(title, message, type) {
    // Crear notificación visual temporal
    const notification = document.createElement('div');
    notification.className = `visual-notification ${type}`;
    notification.innerHTML = `
        <div class="visual-notification-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

function updateNotificationsDisplay() {
    try {
        const container = document.getElementById('notificationsList');
        const countElement = document.getElementById('notificationsCount');
        
        if (!container || !countElement) {
            console.log('Elementos de notificaciones no encontrados');
            return;
        }
    
    const unreadCount = notifications.filter(n => !n.read).length;
    countElement.textContent = unreadCount;
    
    if (unreadCount > 0) {
        countElement.style.display = 'flex';
    } else {
        countElement.style.display = 'none';
    }
    
    if (notifications.length === 0) {
        container.innerHTML = '<div class="no-notifications">No hay notificaciones</div>';
        return;
    }
    
    // Agregar botón para marcar todas como leídas si hay notificaciones no leídas
    let headerHtml = '';
    if (unreadCount > 0) {
        headerHtml = `
            <div class="notifications-header">
                <span>${unreadCount} no leída${unreadCount > 1 ? 's' : ''}</span>
                <button class="btn-mark-all-read" onclick="markAllNotificationsAsRead()">
                    <i class="fas fa-check-double"></i> Marcar todas como leídas
                </button>
            </div>
        `;
    }
    
    container.innerHTML = headerHtml + notifications.map(notification => `
        <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
            <div class="notification-header">
                <h4 class="notification-title">${notification.title}</h4>
                <div class="notification-actions">
                    <span class="notification-time">${getTimeAgo(notification.timestamp)}</span>
                    <button class="btn-delete-notification" onclick="deleteNotification('${notification.id}')" title="Eliminar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <p class="notification-message">${notification.message}</p>
            <div class="notification-footer">
                <span class="notification-type ${notification.type}">${getNotificationTypeText(notification.type)}</span>
                ${!notification.read ? '<span class="unread-indicator"><i class="fas fa-circle"></i></span>' : ''}
            </div>
        </div>
    `).join('');
    
    // Agregar event listeners para marcar como leídas
    container.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const notificationId = item.dataset.id;
            console.log('Clic en notificación, ID:', notificationId);
            markNotificationAsRead(notificationId);
        });
    });
    } catch (error) {
        console.error('Error al actualizar notificaciones:', error);
    }
}

function markNotificationAsRead(notificationId) {
    console.log('Marcando notificación como leída:', notificationId, 'Tipo:', typeof notificationId);
    console.log('Notificaciones disponibles:', notifications.map(n => ({ id: n.id, title: n.title, read: n.read })));
    
    // Convertir a número si es string
    const id = typeof notificationId === 'string' ? parseFloat(notificationId) : notificationId;
    
    const notification = notifications.find(n => n.id === id);
    if (notification) {
        console.log('Notificación encontrada, marcando como leída:', notification.title);
        notification.read = true;
        saveNotifications();
        updateNotificationsDisplay();
    } else {
        console.log('No se encontró la notificación con ID:', id);
    }
}

function getNotificationTypeText(type) {
    const types = {
        'budget': 'Presupuesto',
        'recurring': 'Recurrente',
        'reminder': 'Recordatorio',
        'warning': 'Advertencia',
        'general': 'General'
    };
    return types[type] || 'General';
}

function setupNotificationEventListeners() {
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsList = document.getElementById('notificationsList');
    
    if (notificationsBtn && notificationsList) {
        notificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Solicitar permisos de notificación cuando el usuario haga clic
            if (window.notificationService) {
                window.notificationService.requestNotificationPermission().then(permission => {
                    if (permission === 'granted') {
                        console.log('✅ Permisos de notificación concedidos');
                        // Mostrar una notificación de prueba
                        window.notificationService.showSystemNotification('Notificaciones activadas correctamente', 'success');
                    } else if (permission === 'denied') {
                        console.log('❌ Permisos de notificación denegados');
                        // Mostrar mensaje al usuario
                        window.notificationService.show('Los permisos de notificación fueron denegados. Puedes habilitarlos en la configuración del navegador.', 'warning', { duration: 5000 });
                    }
                });
            }
            
            notificationsList.classList.toggle('show');
        });
        
        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!notificationsBtn.contains(e.target) && !notificationsList.contains(e.target)) {
                notificationsList.classList.remove('show');
            }
        });
    }
}

function checkForNotifications() {
    try {
        checkBudgetAlerts();
        checkRecurringExpenses();
        checkUpcomingReminders();
        
        // Verificar cada 5 minutos
        setTimeout(checkForNotifications, 5 * 60 * 1000);
    } catch (error) {
        console.error('Error al verificar notificaciones:', error);
    }
}

function checkBudgetAlerts() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Obtener transacciones del mes actual
    const currentMonthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear &&
               t.type === 'gasto';
    });
    
    // Calcular totales del mes actual
    const totalBudget = categories.reduce((sum, cat) => sum + cat.adjustedBudget, 0);
    const totalSpent = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    // === ALERTAS BÁSICAS DE PRESUPUESTO ===
    
    // Alerta al 80% del presupuesto
    if (percentage >= 80 && percentage < 100) {
        const existingAlert = notifications.find(n => 
            n.type === 'budget' && 
            n.title.includes('80%') && 
            !n.read
        );
        
        if (!existingAlert) {
            addNotification(
                'Alerta de Presupuesto - 80%',
                `Has gastado el ${percentage.toFixed(1)}% de tu presupuesto mensual. Considera revisar tus gastos.`,
                'budget',
                'high'
            );
        }
    }
    
    // Alerta crítica al 100% o más
    if (percentage >= 100) {
        const existingAlert = notifications.find(n => 
            n.type === 'budget' && 
            n.title.includes('100%') && 
            !n.read
        );
        
        if (!existingAlert) {
            addNotification(
                'Alerta Crítica - Presupuesto Excedido',
                `Has excedido tu presupuesto mensual en ${formatCurrency(totalSpent - totalBudget)}.`,
                'warning',
                'high'
            );
        }
    }
    
    // === ALERTAS INTELIGENTES BASADAS EN PROMEDIOS ===
    
    // Calcular promedio de gastos de los últimos 3 meses
    const last3Months = [];
    for (let i = 1; i <= 3; i++) {
        const month = (currentMonth - i + 12) % 12;
        const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
        
        const monthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === month && 
                   transactionDate.getFullYear() === year &&
                   t.type === 'gasto';
        });
        
        const monthTotal = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
        last3Months.push(monthTotal);
    }
    
    const averageSpending = last3Months.reduce((sum, amount) => sum + amount, 0) / last3Months.length;
    const currentSpending = totalSpent;
    
    // Alerta si el gasto actual supera el promedio en más del 20%
    if (averageSpending > 0 && currentSpending > averageSpending * 1.2) {
        const increasePercentage = ((currentSpending - averageSpending) / averageSpending) * 100;
        
        const existingAlert = notifications.find(n => 
            n.type === 'intelligent' && 
            n.title.includes('Gasto Superior al Promedio') && 
            !n.read
        );
        
        if (!existingAlert) {
            addNotification(
                '🚨 Gasto Superior al Promedio',
                `Tu gasto actual (${formatCurrency(currentSpending)}) está ${increasePercentage.toFixed(1)}% por encima del promedio de los últimos 3 meses (${formatCurrency(averageSpending)}).`,
                'intelligent',
                'high'
            );
        }
    }
    
    // === ALERTAS POR CATEGORÍA ===
    
    categories.forEach(category => {
        const categoryTransactions = currentMonthTransactions.filter(t => 
            t.category === category.name || t.category === category.subcategory
        );
        
        const categorySpent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
        const categoryBudget = category.adjustedBudget;
        const categoryPercentage = categoryBudget > 0 ? (categorySpent / categoryBudget) * 100 : 0;
        
        // Alerta si una categoría específica supera el 90%
        if (categoryPercentage >= 90 && categoryPercentage < 100) {
            const existingAlert = notifications.find(n => 
                n.type === 'category' && 
                n.title.includes(category.name) && 
                !n.read
            );
            
            if (!existingAlert) {
                addNotification(
                    `⚠️ ${category.name} - 90% del Presupuesto`,
                    `Has gastado ${categoryPercentage.toFixed(1)}% del presupuesto en ${category.name}. Restante: ${formatCurrency(categoryBudget - categorySpent)}.`,
                    'category',
                    'normal'
                );
            }
        }
        
        // Alerta crítica si una categoría específica se excede
        if (categoryPercentage >= 100) {
            const existingAlert = notifications.find(n => 
                n.type === 'category' && 
                n.title.includes(`${category.name} - Excedido`) && 
                !n.read
            );
            
            if (!existingAlert) {
                addNotification(
                    `🚨 ${category.name} - Presupuesto Excedido`,
                    `Has excedido el presupuesto de ${category.name} en ${formatCurrency(categorySpent - categoryBudget)}.`,
                    'category',
                    'high'
                );
            }
        }
    });
    
    // === ALERTAS DE TENDENCIAS ===
    
    // Detectar si hay un patrón de gastos crecientes
    if (last3Months.length >= 2) {
        const trend = last3Months[0] - last3Months[1]; // Comparar últimos dos meses
        const trendPercentage = last3Months[1] > 0 ? (trend / last3Months[1]) * 100 : 0;
        
        if (trendPercentage > 15) { // Si el gasto aumentó más del 15%
            const existingAlert = notifications.find(n => 
                n.type === 'trend' && 
                n.title.includes('Tendencia Creciente') && 
                !n.read
            );
            
            if (!existingAlert) {
                addNotification(
                    '📈 Tendencia de Gastos Creciente',
                    `Tu gasto ha aumentado ${trendPercentage.toFixed(1)}% comparado con el mes anterior. Considera revisar tus hábitos de gasto.`,
                    'trend',
                    'normal'
                );
            }
        }
    }
    
    // === ALERTAS DE GASTOS INUSUALES ===
    
    // Detectar gastos inusualmente altos (más del doble del promedio diario)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const averageDailySpending = totalSpent / daysInMonth;
    
    currentMonthTransactions.forEach(transaction => {
        if (transaction.amount > averageDailySpending * 2) {
            const existingAlert = notifications.find(n => 
                n.type === 'unusual' && 
                n.title.includes('Gasto Inusual') && 
                n.message.includes(transaction.description) && 
                !n.read
            );
            
            if (!existingAlert) {
                addNotification(
                    '💡 Gasto Inusual Detectado',
                    `El gasto "${transaction.description}" (${formatCurrency(transaction.amount)}) es significativamente mayor al promedio diario (${formatCurrency(averageDailySpending)}).`,
                    'unusual',
                    'normal'
                );
            }
        }
    });
}

function checkRecurringExpenses() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    categories.forEach(category => {
        if (category.recurringDate) {
            const recurringDate = new Date(category.recurringDate);
            const nextRecurrence = getNextRecurrenceDate(
                category.recurringDate,
                category.frequency,
                category.customDays
            );
            
            if (nextRecurrence) {
                const daysUntil = Math.ceil((new Date(nextRecurrence) - today) / (1000 * 60 * 60 * 24));
                
                // Recordatorio 3 días antes
                if (daysUntil === 3) {
                    addNotification(
                        'Gasto Recurrente Próximo',
                        `El gasto "${category.name}" de ${formatCurrency(category.adjustedBudget)} vence en 3 días.`,
                        'recurring',
                        'normal'
                    );
                }
                
                // Recordatorio el día anterior
                if (daysUntil === 1) {
                    addNotification(
                        'Gasto Recurrente Mañana',
                        `Recuerda pagar "${category.name}" mañana.`,
                        'recurring',
                        'high'
                    );
                }
            }
        }
    });
}

function checkUpcomingReminders() {
    // Verificar ingresos recurrentes
    incomes.forEach(income => {
        const nextIncome = getNextRecurrenceDate(
            income.startDate,
            income.frequency,
            income.customDays
        );
        
        if (nextIncome) {
            const daysUntil = Math.ceil((new Date(nextIncome) - new Date()) / (1000 * 60 * 60 * 24));
            
            // Recordatorio 2 días antes del ingreso
            if (daysUntil === 2) {
                addNotification(
                    'Ingreso Recurrente Próximo',
                    `Tu ingreso "${income.name}" de ${formatCurrency(income.amount)} está programado para dentro de 2 días.`,
                    'reminder',
                    'normal'
                );
            }
        }
    });
}

function setupRecurringReminders() {
    // Configurar recordatorios automáticos
    setInterval(() => {
        checkForNotifications();
    }, 60 * 60 * 1000); // Verificar cada hora
}

// Función para limpiar notificaciones antiguas
function clearOldNotifications() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const originalCount = notifications.length;
    notifications = notifications.filter(notification => {
        const notificationDate = new Date(notification.timestamp);
        return notificationDate > sevenDaysAgo;
    });
    
    if (originalCount !== notifications.length) {
        console.log(`Limpiadas ${originalCount - notifications.length} notificaciones antiguas`);
        saveNotifications();
        updateNotificationsDisplay();
    }
}

// Función para eliminar una notificación específica
function deleteNotification(notificationId) {
    const id = typeof notificationId === 'string' ? parseFloat(notificationId) : notificationId;
    const originalCount = notifications.length;
    
    notifications = notifications.filter(n => n.id !== id);
    
    if (notifications.length !== originalCount) {
        console.log('Notificación eliminada:', notificationId);
        saveNotifications();
        updateNotificationsDisplay();
    }
}

// Función para limpiar todas las notificaciones
function clearAllNotifications() {
    if (notifications.length > 0) {
        console.log('Limpiando todas las notificaciones');
        notifications = [];
        saveNotifications();
        updateNotificationsDisplay();
    }
}

// Función para marcar todas las notificaciones como leídas
function markAllNotificationsAsRead() {
    let hasChanges = false;
    notifications.forEach(notification => {
        if (!notification.read) {
            notification.read = true;
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        console.log('Marcando todas las notificaciones como leídas');
        saveNotifications();
        updateNotificationsDisplay();
    }
}

function getAvailableMonths() {
    // Obtener todos los meses únicos de las transacciones
    const months = [...new Set(transactions.map(t => t.date.substring(0, 7)))];
    
    // Ordenar cronológicamente
    months.sort();
    
    return months;
}

// Función para validar estructura de backup JSON
function validateBackupStructure(data) {
    const errors = [];
    
    // Verificar estructura básica
    if (!data || typeof data !== 'object') {
        errors.push('El archivo no es un JSON válido');
        return { isValid: false, errors };
    }
    
    // Verificar si es un backup completo
    if (data.data && data.user && data.timestamp) {
        // Es un backup completo
        if (!data.data.categories && !data.data.transactions && !data.data.incomes) {
            errors.push('El backup no contiene datos válidos (categorías, transacciones o ingresos)');
        }
    } else if (data.categories || data.transactions || data.incomes) {
        // Son datos directos
        if (!data.categories && !data.transactions && !data.incomes) {
            errors.push('El archivo no contiene datos válidos de JM Budget');
        }
    } else {
        errors.push('El archivo no tiene la estructura esperada de un backup de JM Budget');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Funciones para el modo oscuro
function initializeTheme() {
    // Cargar tema guardado o usar preferencia del sistema
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (systemPrefersDark) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
    
    // Configurar event listener para el botón de tema (ya configurado en setupEventListeners)
    
    // Escuchar cambios en la preferencia del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Actualizar icono del botón en el menú
    const menuThemeToggleBtn = document.getElementById('menuThemeToggleBtn');
    if (menuThemeToggleBtn) {
        const icon = menuThemeToggleBtn.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        // Actualizar texto del botón
        const textSpan = menuThemeToggleBtn.querySelector('span');
        if (textSpan) {
            textSpan.textContent = theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro';
        }
        
        // Actualizar título del botón
        menuThemeToggleBtn.title = theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Agregar al historial
    addToHistory('Tema cambiado', `Cambió a modo ${newTheme === 'dark' ? 'oscuro' : 'claro'}`, 'theme');
}

// Función para detectar si la app está instalada como PWA
function checkPWAInstallation() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalled = window.navigator.standalone || isStandalone;
    
    if (isInstalled) {
        // Ocultar botón de instalación si ya está instalada
        const installBtn = document.getElementById('installAppBtn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
        
        // Agregar clase para estilos específicos de PWA
        document.body.classList.add('pwa-installed');
    }
    
    // Verificar si el navegador soporta PWA
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('✅ PWA soportado');
        
        // Mostrar botón de instalación si no está instalada
        const installBtn = document.getElementById('installAppBtn');
        if (installBtn && !isInstalled) {
            // Verificar si ya se puede instalar
            if (window.deferredPrompt) {
                installBtn.style.display = 'block';
            }
        }
    } else {
        console.log('❌ PWA no soportado');
        const installBtn = document.getElementById('installAppBtn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }
}

// Función de guardado automático periódico
function setupAutoSave() {
    // Guardar automáticamente cada 30 segundos si hay cambios
    setInterval(() => {
        if (currentUser && (categories.length > 0 || transactions.length > 0 || incomes.length > 0)) {
            try {
                saveUserData();
                console.log('💾 Guardado automático realizado');
            } catch (error) {
                console.error('❌ Error en guardado automático:', error);
            }
        }
    }, 30000); // 30 segundos
    
    // Guardar antes de que el usuario salga de la página
    window.addEventListener('beforeunload', () => {
        if (currentUser) {
            try {
                saveUserData();
                console.log('💾 Guardado antes de salir');
            } catch (error) {
                console.error('❌ Error al guardar antes de salir:', error);
            }
        }
    });
    
    // Guardar cuando la página pierde el foco
    window.addEventListener('blur', () => {
        if (currentUser) {
            try {
                saveUserData();
                console.log('💾 Guardado al perder foco');
            } catch (error) {
                console.error('❌ Error al guardar al perder foco:', error);
            }
        }
    });
}

// --- SUBTABS TRANSACCIONES ---
document.addEventListener('DOMContentLoaded', function() {
    const subtabBtns = document.querySelectorAll('.subtab-btn');
    const gastosContainer = document.getElementById('gastosContainer');
    const ingresosContainer = document.getElementById('ingresosContainer');
    const addGastoBtn = document.getElementById('addGastoBtn');
    const addIngresoBtn = document.getElementById('addIngresoBtn');

    subtabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            subtabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.subtab === 'gastos') {
                gastosContainer.classList.add('active');
                ingresosContainer.classList.remove('active');
                addGastoBtn.style.display = '';
                addIngresoBtn.style.display = 'none';
            } else {
                gastosContainer.classList.remove('active');
                ingresosContainer.classList.add('active');
                addGastoBtn.style.display = 'none';
                addIngresoBtn.style.display = '';
            }
        });
    });

    // Mostrar por defecto el botón de gasto
    addGastoBtn.style.display = '';
    addIngresoBtn.style.display = 'none';

    // Lógica para crear nueva transacción según tipo
    addGastoBtn.addEventListener('click', function() {
        openTransactionModal('gasto');
    });
    addIngresoBtn.addEventListener('click', function() {
        openTransactionModal('ingreso');
    });
});

function openTransactionModal(tipo) {
    document.getElementById('transactionType').value = tipo;
    
    // Configurar título según el tipo
    let title = 'Nueva Transacción';
    if (tipo === 'gasto') title = 'Nuevo Gasto';
    else if (tipo === 'ingreso') title = 'Nuevo Ingreso';
    else if (tipo === 'transferencia') title = 'Nueva Transferencia';
    
    document.getElementById('transactionModalTitle').textContent = title;
    
    const submitBtn = document.getElementById('transactionForm').querySelector('.btn-primary');
    submitBtn.textContent = 'Guardar';
    document.getElementById('transactionForm').reset();
    delete document.getElementById('transactionForm').dataset.editId;
    
    // Establecer fecha actual
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    
    // Actualizar categorías según el tipo
    updateCategorySelect();
    
    // Configurar campos de cuenta bancaria
    updateAccountDropdowns();
    
    // Mostrar/ocultar campos de transferencia
    const transferToAccountGroup = document.getElementById('transferToAccountGroup');
    if (tipo === 'transferencia') {
        transferToAccountGroup.style.display = 'block';
    } else {
        transferToAccountGroup.style.display = 'none';
    }
    
    openModal('transactionModal');
}

// Función para abrir modal de pago de tarjetas
function openPagoTarjetaModal() {
    // Establecer fecha actual
    document.getElementById('pagoTarjetaFecha').value = new Date().toISOString().split('T')[0];
    
    // Actualizar dropdowns
    updatePagoTarjetaDropdowns();
    
    // Limpiar formulario
    document.getElementById('pagoTarjetaForm').reset();
    
    openModal('pagoTarjetaModal');
}

// Función para manejar el envío del formulario de pago de tarjetas
async function handlePagoTarjetaSubmit(e) {
    e.preventDefault();
    
    const descripcion = document.getElementById('pagoTarjetaDescripcion').value.trim();
    const monto = parseFloat(document.getElementById('pagoTarjetaMonto').value);
    const cuentaOrigenId = document.getElementById('pagoTarjetaCuentaOrigen').value;
    const tarjetaDestinoId = document.getElementById('pagoTarjetaDestino').value;
    const fecha = document.getElementById('pagoTarjetaFecha').value;
    const comentario = document.getElementById('pagoTarjetaComentario').value.trim();
    
    if (!descripcion || !monto || !cuentaOrigenId || !tarjetaDestinoId || !fecha) {
        showNotification('Por favor completa todos los campos requeridos', 'error');
        return;
    }
    
    if (cuentaOrigenId === tarjetaDestinoId) {
        showNotification('No puedes pagar una tarjeta desde la misma tarjeta', 'error');
        return;
    }
    
    try {
        // Crear una sola transacción de pago de tarjeta
        const transaccionPago = {
            id: Date.now(),
            description: `Pago tarjeta: ${descripcion}`,
            amount: -Math.abs(monto), // Monto negativo para mostrar como pago
            type: 'pago-tarjeta',
            category: 'Pagos de Tarjetas',
            accountId: cuentaOrigenId, // Cuenta desde donde se paga
            tarjetaDestinoId: tarjetaDestinoId, // Tarjeta que se paga
            date: fecha,
            comment: comentario || null,
            createdBy: currentUser,
            createdAt: new Date().toISOString(),
            lastModifiedBy: currentUser,
            lastModifiedAt: new Date().toISOString()
        };
        
        // Agregar solo una transacción
        transactions.push(transaccionPago);
        
        // Actualizar balances
        // Para la cuenta origen: reducir el balance (gasto)
        updateAccountBalance(cuentaOrigenId, -Math.abs(monto), `Pago tarjeta: ${descripcion}`);
        // Para la tarjeta de crédito: reducir el balance pendiente (pago recibido)
        updateAccountBalance(tarjetaDestinoId, Math.abs(monto), `Pago recibido: ${descripcion}`);
        
        // Guardar datos
        saveData();
        
        // Cerrar modal
        closeModal('pagoTarjetaModal');
        
        // Mostrar notificación
        showNotification('Pago de tarjeta realizado exitosamente', 'success');
        
        // Registrar en historial
        addToHistory(
            'Realizó pago de tarjeta',
            `${descripcion} - ${formatCurrency(monto)}`,
            'transaction'
        );
        
    } catch (error) {
        console.error('Error al procesar pago de tarjeta:', error);
        showNotification('Error al procesar el pago de tarjeta', 'error');
    }
}

// Función de depuración para verificar transacciones
function debugTransactions() {
    console.log('=== DEBUG TRANSACCIONES ===');
    console.log('Transacciones totales:', transactions.length);
    console.log('Transacciones:', transactions);
    
    const gastos = transactions.filter(t => t.type === 'gasto');
    const ingresos = transactions.filter(t => t.type === 'ingreso');
    
    console.log('Gastos:', gastos.length, gastos);
    console.log('Ingresos:', ingresos.length, ingresos);
    
    console.log('Categorías disponibles:', Object.keys(categoryGroups));
    console.log('Categorías de ingresos:', Object.keys(defaultIncomeCategories));
    console.log('=== FIN DEBUG ===');
}

// Función para limpiar y reinicializar datos (solo para desarrollo)
function resetTransactionData() {
    if (confirm('¿Estás seguro de que quieres limpiar todas las transacciones? Esto no se puede deshacer.')) {
        transactions = [];
        saveData();
        updateUI(true);
        console.log('Datos de transacciones limpiados');
    }
}

// Funciones para configuración de servicios en la nube
function setupCloudSyncTabs() {
    const tabBtns = document.querySelectorAll('.cloud-tab-btn');
    const tabContents = document.querySelectorAll('.cloud-tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Remover clase active de todos los botones y contenidos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Agregar clase active al botón y contenido seleccionado
            btn.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

function updateSyncStatus() {
    const syncStatus = document.getElementById('syncStatus');
    const currentService = window.cloudServices ? window.cloudServices.getCurrentService() : null;
    
    if (currentService) {
        syncStatus.innerHTML = `
            <p class="sync-status-success">
                <i class="fas fa-check-circle"></i> 
                Conectado a ${currentService.charAt(0).toUpperCase() + currentService.slice(1)}
            </p>
        `;
    } else {
        syncStatus.innerHTML = `
            <p class="sync-status-info">
                <i class="fas fa-info-circle"></i> 
                No hay servicio configurado
            </p>
        `;
    }
}

// Funciones de configuración de servicios
function configureFirebase() {
    const config = {
        apiKey: document.getElementById('firebaseApiKey').value,
        authDomain: document.getElementById('firebaseAuthDomain').value,
        projectId: document.getElementById('firebaseProjectId').value,
        storageBucket: document.getElementById('firebaseStorageBucket').value,
        messagingSenderId: document.getElementById('firebaseMessagingSenderId').value,
        appId: document.getElementById('firebaseAppId').value
    };
    
    if (Object.values(config).some(value => !value)) {
        alert('Por favor, completa todos los campos de configuración de Firebase.');
        return;
    }
    
    if (window.cloudServices) {
        window.cloudServices.configureFirebase(config);
        updateSyncStatus();
        alert('✅ Firebase configurado exitosamente para todos los usuarios.\n\nEsta configuración se aplicará automáticamente a todos los usuarios que usen esta aplicación.');
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

// Función para configurar Firebase directamente desde la consola
window.setupFirebase = function(apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) {
    const config = {
        apiKey: apiKey,
        authDomain: authDomain,
        projectId: projectId,
        storageBucket: storageBucket,
        messagingSenderId: messagingSenderId,
        appId: appId
    };
    
    if (window.cloudServices) {
        window.cloudServices.configureFirebase(config);
        console.log('✅ Firebase configurado globalmente:', config);
        return true;
    } else {
        console.error('❌ Servicios en la nube no disponibles');
        return false;
    }
};

function configureSupabase() {
    const url = document.getElementById('supabaseUrl').value;
    const anonKey = document.getElementById('supabaseAnonKey').value;
    
    if (!url || !anonKey) {
        alert('Por favor, completa todos los campos de configuración de Supabase.');
        return;
    }
    
    if (window.cloudServices) {
        window.cloudServices.configureSupabase(url, anonKey);
        updateSyncStatus();
        alert('Supabase configurado exitosamente.');
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

function configureDropbox() {
    const accessToken = document.getElementById('dropboxAccessToken').value;
    
    if (!accessToken) {
        alert('Por favor, ingresa el access token de Dropbox.');
        return;
    }
    
    if (window.cloudServices) {
        window.cloudServices.configureDropbox(accessToken);
        updateSyncStatus();
        alert('Dropbox configurado exitosamente.');
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

function configureGoogleDrive() {
    const accessToken = document.getElementById('googleDriveAccessToken').value;
    
    if (!accessToken) {
        alert('Por favor, ingresa el access token de Google Drive.');
        return;
    }
    
    if (window.cloudServices) {
        window.cloudServices.configureGoogleDrive(accessToken);
        updateSyncStatus();
        alert('Google Drive configurado exitosamente.');
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

// Funciones de prueba de conexión
async function testFirebaseConnection() {
    if (window.cloudServices) {
        const result = await window.cloudServices.testConnection();
        if (result.success) {
            alert('✅ Conexión exitosa con Firebase');
        } else {
            alert(`❌ Error de conexión: ${result.message}`);
        }
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

async function testSupabaseConnection() {
    if (window.cloudServices) {
        const result = await window.cloudServices.testConnection();
        if (result.success) {
            alert('✅ Conexión exitosa con Supabase');
        } else {
            alert(`❌ Error de conexión: ${result.message}`);
        }
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

async function testDropboxConnection() {
    if (window.cloudServices) {
        const result = await window.cloudServices.testConnection();
        if (result.success) {
            alert('✅ Conexión exitosa con Dropbox');
        } else {
            alert(`❌ Error de conexión: ${result.message}`);
        }
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

async function testGoogleDriveConnection() {
    if (window.cloudServices) {
        const result = await window.cloudServices.testConnection();
        if (result.success) {
            alert('✅ Conexión exitosa con Google Drive');
        } else {
            alert(`❌ Error de conexión: ${result.message}`);
        }
    } else {
        alert('Error: Servicios en la nube no disponibles.');
    }
}

// Funciones de sincronización
async function syncNow() {
    if (!currentUser) {
        alert('Debes estar logueado para sincronizar datos.');
        return;
    }
    
    if (!window.cloudServices || !window.cloudServices.getCurrentService()) {
        alert('No hay servicio en la nube configurado.');
        return;
    }
    
    try {
        // Preparar datos para sincronización
        const userData = {
            categories: categories,
            transactions: transactions,
            categoryGroups: categoryGroups,
            incomes: incomes,
            notifications: notifications,
            lastSync: new Date().toISOString()
        };
        
        // Sincronizar con la nube
        const result = await window.cloudServices.syncToCloud(userData, currentUser);
        
        if (result) {
            alert('✅ Datos sincronizados exitosamente con la nube.');
            updateSyncStatus();
        } else {
            alert('❌ Error al sincronizar datos con la nube.');
        }
    } catch (error) {
        console.error('Error en sincronización:', error);
        alert(`❌ Error de sincronización: ${error.message}`);
    }
}

function viewSyncHistory() {
    // Implementar vista de historial de sincronización
    alert('Función de historial de sincronización en desarrollo.');
}

// Integración con el sistema de almacenamiento profesional
async function saveDataWithProfessionalStorage() {
    if (window.professionalStorage && currentUser) {
        const userData = {
            categories: categories,
            transactions: transactions,
            categoryGroups: categoryGroups,
            incomes: incomes,
            notifications: notifications
        };
        
        // Guardar usando el sistema profesional
        await window.professionalStorage.saveUserData(currentUser, userData);
        
        // Sincronizar con la nube si está disponible
        if (window.cloudServices && window.cloudServices.getCurrentService()) {
            await window.cloudServices.syncToCloud(userData, currentUser);
        }
    }
}

async function loadDataWithProfessionalStorage() {
    if (window.professionalStorage && currentUser) {
        const userData = await window.professionalStorage.loadUserData(currentUser);
        
        if (userData) {
            categories = userData.categories || [];
            transactions = userData.transactions || [];
            categoryGroups = userData.categoryGroups || {};
            incomes = userData.incomes || [];
            notifications = userData.notifications || [];
            
            console.log('✅ Datos cargados usando sistema profesional de almacenamiento');
            return true;
        }
    }
    return false;
}

// ===== FUNCIONES MEJORADAS DE SINCRONIZACIÓN =====

// Función para mostrar pestañas
function showTab(tabName) {
    // Ocultar todas las pestañas
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Desactivar todos los botones
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Mostrar la pestaña seleccionada
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Activar el botón correspondiente
    const selectedButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // Cargar contenido específico de la pestaña
    switch(tabName) {
        case 'sync':
            updateSyncStatus();
            break;
        case 'history':
            loadSyncHistory();
            break;
    }
}

// ===== MEJORAS MOBILE AVANZADAS =====

// Detectar si es dispositivo móvil
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
}

// Mejorar navegación táctil
function setupMobileNavigation() {
    if (!isMobileDevice()) return;
    
    // Mejorar scroll horizontal en pestañas
    const tabNavigation = document.querySelector('.tab-navigation');
    if (tabNavigation) {
        let isScrolling = false;
        let startX = 0;
        let scrollLeft = 0;
        
        tabNavigation.addEventListener('touchstart', (e) => {
            isScrolling = true;
            startX = e.touches[0].pageX - tabNavigation.offsetLeft;
            scrollLeft = tabNavigation.scrollLeft;
        });
        
        tabNavigation.addEventListener('touchmove', (e) => {
            if (!isScrolling) return;
            e.preventDefault();
            const x = e.touches[0].pageX - tabNavigation.offsetLeft;
            const walk = (x - startX) * 2;
            tabNavigation.scrollLeft = scrollLeft - walk;
        });
        
        tabNavigation.addEventListener('touchend', () => {
            isScrolling = false;
        });
    }
}

// Mejorar feedback táctil
function setupTouchFeedback() {
    if (!isMobileDevice()) return;
    
    // Añadir feedback táctil a botones
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-icon, .tab-btn');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Añadir feedback a cards
    const cards = document.querySelectorAll('.summary-card, .category-card, .transaction-item');
    cards.forEach(card => {
        card.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        card.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Mejorar modales para móviles
function setupMobileModals() {
    if (!isMobileDevice()) return;
    
    // Cerrar modal con gesto de swipe
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        let startY = 0;
        let currentY = 0;
        
        modal.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        modal.addEventListener('touchmove', (e) => {
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 50) { // Swipe hacia abajo
                const modalContent = modal.querySelector('.modal-content');
                modalContent.style.transform = `translateY(${diff}px)`;
            }
        });
        
        modal.addEventListener('touchend', (e) => {
            const diff = currentY - startY;
            if (diff > 100) { // Swipe suficiente para cerrar
                const modalId = modal.id;
                closeModal(modalId);
            } else {
                const modalContent = modal.querySelector('.modal-content');
                modalContent.style.transform = 'translateY(0)';
            }
        });
    });
}

// Mejorar formularios para móviles
function setupMobileForms() {
    if (!isMobileDevice()) return;
    
    // Evitar zoom en inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="password"]');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            // Scroll suave al input
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    });
    
    // Mejorar selectores
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        select.addEventListener('change', function() {
            // Feedback visual
            this.style.transform = 'scale(1.02)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    });
}

// Skeleton loading para móviles
function showSkeletonLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
    `;
}

function hideSkeletonLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Remover skeleton y cargar contenido real
    container.innerHTML = '';
    updateUI();
}

// Mejorar performance en móviles
function setupMobilePerformance() {
    if (!isMobileDevice()) return;
    
    // Lazy loading para gráficos
    const observerOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const chartCard = entry.target;
                if (chartCard.classList.contains('chart-card')) {
                    // Cargar gráfico cuando sea visible
                    setTimeout(() => {
                        updateCharts();
                    }, 100);
                }
            }
        });
    }, observerOptions);
    
    // Observar cards de gráficos
    const chartCards = document.querySelectorAll('.chart-card');
    chartCards.forEach(card => observer.observe(card));
}

// Configurar Chart.js para evitar errores de source maps
function setupChartJS() {
    // Deshabilitar source maps para Chart.js
    if (typeof Chart !== 'undefined') {
        // Configurar Chart.js para desarrollo
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#333';
        
        // Configurar para móviles
        if (isMobileDevice()) {
            Chart.defaults.font.size = 10;
            Chart.defaults.plugins.legend.labels.boxWidth = 12;
            Chart.defaults.plugins.legend.labels.padding = 8;
        }
        
        console.log('📊 Chart.js configurado correctamente');
    }
}

// Inicializar mejoras mobile
function initializeMobileEnhancements() {
    if (!isMobileDevice()) return;
    
    setupMobileNavigation();
    setupTouchFeedback();
    setupMobileModals();
    setupMobileForms();
    setupMobilePerformance();
    
    // Añadir clase CSS para móviles
    document.body.classList.add('mobile-device');
    
    console.log('🚀 Mejoras mobile inicializadas');
}

// Inicializar Chart.js cuando esté disponible
function initializeChartJS() {
    // Esperar a que Chart.js esté cargado
    if (typeof Chart !== 'undefined') {
        setupChartJS();
    } else {
        // Si no está cargado, esperar un poco más
        setTimeout(initializeChartJS, 100);
    }
}

// Función para actualizar el estado de conexión
function updateConnectionStatus() {
    const statusIndicator = document.getElementById('connectionStatus');
    const statusDot = statusIndicator.querySelector('.status-dot');
    const statusText = statusIndicator.querySelector('.status-text');
    
    if (window.cloudServices) {
        window.cloudServices.testConnection().then(result => {
            if (result.success) {
                statusDot.className = 'status-dot connected';
                statusText.textContent = 'Conectado a Firebase';
            } else {
                statusDot.className = 'status-dot error';
                statusText.textContent = 'Error de conexión';
            }
        }).catch(error => {
            statusDot.className = 'status-dot error';
            statusText.textContent = 'Error de conexión';
        });
    } else {
        statusDot.className = 'status-dot error';
        statusText.textContent = 'Servicios no disponibles';
    }
}

// Función para actualizar el estado de sincronización
function updateSyncStatus() {
    const lastSyncTime = document.getElementById('lastSyncTime');
    const lastSync = localStorage.getItem('lastSyncTime');
    
    if (lastSync) {
        const date = new Date(lastSync);
        lastSyncTime.textContent = date.toLocaleString();
    } else {
        lastSyncTime.textContent = 'Nunca';
    }
}

// Función para sincronizar a la nube con progreso
async function syncToCloud() {
    const progressBar = document.getElementById('syncProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    // Mostrar barra de progreso
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Iniciando sincronización...';
    
    try {
        // Obtener datos locales
        const transactions = JSON.parse(localStorage.getItem('budgetTransactions') || '[]');
        const categories = JSON.parse(localStorage.getItem('budgetCategories') || '[]');
        const categoryGroups = JSON.parse(localStorage.getItem('budgetCategoryGroups') || '{}');
        const incomes = JSON.parse(localStorage.getItem('budgetIncomes') || '[]');
        
        const totalItems = transactions.length + categories.length + Object.keys(categoryGroups).length + incomes.length;
        let completedItems = 0;
        
        // Verificar qué sincronizar
        const syncTransactions = document.getElementById('syncTransactions')?.checked ?? true;
        const syncCategories = document.getElementById('syncCategories')?.checked ?? true;
        const syncBudgets = document.getElementById('syncBudgets')?.checked ?? true;
        
        const dataToSync = {};
        
        if (syncTransactions) {
            dataToSync.transactions = transactions;
            completedItems += transactions.length;
            progressFill.style.width = (completedItems / totalItems * 100) + '%';
            progressText.textContent = `Sincronizando transacciones... (${completedItems}/${totalItems})`;
        }
        
        if (syncCategories) {
            dataToSync.categories = categories;
            dataToSync.categoryGroups = categoryGroups;
            completedItems += categories.length + Object.keys(categoryGroups).length;
            progressFill.style.width = (completedItems / totalItems * 100) + '%';
            progressText.textContent = `Sincronizando categorías... (${completedItems}/${totalItems})`;
        }
        
        if (syncBudgets) {
            dataToSync.incomes = incomes;
            completedItems += incomes.length;
            progressFill.style.width = (completedItems / totalItems * 100) + '%';
            progressText.textContent = `Sincronizando ingresos... (${completedItems}/${totalItems})`;
        }
        
        // Sincronizar con Firebase
        if (window.cloudServices) {
            const result = await window.cloudServices.syncToCloud(dataToSync, getCurrentUserId());
            
            if (result) {
                // Guardar timestamp de última sincronización
                localStorage.setItem('lastSyncTime', new Date().toISOString());
                
                // Actualizar estado
                progressFill.style.width = '100%';
                progressText.textContent = 'Sincronización completada exitosamente';
                
                // Ocultar progreso después de 2 segundos
                setTimeout(() => {
                    progressBar.style.display = 'none';
                }, 2000);
                
                // Actualizar estado
                updateSyncStatus();
                updateConnectionStatus();
                
                showNotification('Sincronización completada', 'success');
            } else {
                throw new Error('Error en la sincronización');
            }
        } else {
            throw new Error('Servicios en la nube no disponibles');
        }
        
    } catch (error) {
        progressText.textContent = 'Error en la sincronización: ' + error.message;
        progressFill.style.background = '#dc3545';
        
        setTimeout(() => {
            progressBar.style.display = 'none';
            progressFill.style.background = '#007bff';
        }, 3000);
        
        showNotification('Error en la sincronización', 'error');
    }
}

// Función para sincronizar desde la nube
async function syncFromCloud() {
    if (!window.cloudServices) {
        showNotification('Servicios en la nube no disponibles', 'error');
        return;
    }
    
    try {
        const result = await window.cloudServices.syncFromCloud(getCurrentUserId());
        
        if (result) {
            // Restaurar datos desde la nube
            if (result.transactions) {
                localStorage.setItem('budgetTransactions', JSON.stringify(result.transactions));
            }
            if (result.categories) {
                localStorage.setItem('budgetCategories', JSON.stringify(result.categories));
            }
            if (result.categoryGroups) {
                localStorage.setItem('budgetCategoryGroups', JSON.stringify(result.categoryGroups));
            }
            if (result.incomes) {
                localStorage.setItem('budgetIncomes', JSON.stringify(result.incomes));
            }
            
            // Recargar datos en la aplicación
            loadDataSafely();
            loadIncomes();
            
            // Actualizar la interfaz de usuario
            updateUI(true);
            
            // Actualizar timestamp
            localStorage.setItem('lastSyncTime', new Date().toISOString());
            updateSyncStatus();
            
            showNotification('Datos sincronizados desde la nube', 'success');
        } else {
            showNotification('No hay datos en la nube', 'info');
        }
    } catch (error) {
        showNotification('Error al sincronizar desde la nube: ' + error.message, 'error');
    }
}

// Función para restaurar desde la nube
async function restoreFromCloud() {
    const restoreType = document.querySelector('input[name="restoreType"]:checked').value;
    
    if (restoreType === 'all') {
        if (confirm('¿Estás seguro de que quieres restaurar todos los datos desde la nube? Esto sobrescribirá los datos locales.')) {
            await syncFromCloud();
        }
    } else {
        // Restauración selectiva (implementar más adelante)
        showNotification('Restauración selectiva próximamente', 'info');
    }
}

// Función para cargar historial de sincronización
function loadSyncHistory() {
    const historyContainer = document.getElementById('syncHistory');
    const history = JSON.parse(localStorage.getItem('syncHistory') || '[]');
    
    if (history.length === 0) {
        historyContainer.innerHTML = '<div class="history-item"><span class="history-date">No hay historial de sincronización</span></div>';
        return;
    }
    
    historyContainer.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-date">${new Date(item.timestamp).toLocaleString()}</div>
            <div class="history-status">${item.action} - ${item.status}</div>
        </div>
    `).join('');
}



// Función para obtener ID del usuario actual
function getCurrentUserId() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return currentUser.id || 'anonymous';
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    if (window.notificationService) {
        window.notificationService.show(message, type);
    } else {
        // Fallback para cuando el servicio no está disponible
        const notification = document.createElement('div');
        notification.className = `visual-notification ${type}`;
        notification.innerHTML = `
            <div class="visual-notification-content">
                <h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Inicializar estado de sincronización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el modal de sincronización está presente
    const cloudSyncModal = document.getElementById('cloudSyncModal');
    if (cloudSyncModal) {
        // Actualizar estado inicial
        updateConnectionStatus();
        updateSyncStatus();
        
        // Configurar sincronización automática
        const autoSyncCheckbox = document.getElementById('autoSync');
        if (autoSyncCheckbox) {
            autoSyncCheckbox.checked = localStorage.getItem('autoSync') !== 'false';
            
            autoSyncCheckbox.addEventListener('change', function() {
                localStorage.setItem('autoSync', this.checked);
            });
        }
    }
    
    // Inicializar mejoras mobile
    initializeMobileEnhancements();
    
    // Inicializar Chart.js
    initializeChartJS();
    
    console.log('📱 Aplicación inicializada con mejoras mobile');
});

// ===== GESTIÓN DE CUENTAS BANCARIAS =====

// Función para cargar cuentas bancarias
function loadBankAccounts() {
    try {
        const savedAccounts = localStorage.getItem(getStorageKey('bankAccounts'));
        if (savedAccounts) {
            bankAccounts = JSON.parse(savedAccounts);
        }
        
        const savedBankTransactions = localStorage.getItem(getStorageKey('bankTransactions'));
        if (savedBankTransactions) {
            bankTransactions = JSON.parse(savedBankTransactions);
        }
        
        const savedReconciliationData = localStorage.getItem(getStorageKey('reconciliationData'));
        if (savedReconciliationData) {
            reconciliationData = JSON.parse(savedReconciliationData);
        }
        
        console.log(`✅ Cuentas bancarias cargadas: ${bankAccounts.length} cuentas, ${bankTransactions.length} transacciones`);
    } catch (error) {
        console.error('❌ Error al cargar cuentas bancarias:', error);
        bankAccounts = [];
        bankTransactions = [];
        reconciliationData = {};
    }
}

// Función para guardar cuentas bancarias
async function saveBankAccounts() {
    try {
        localStorage.setItem(getStorageKey('bankAccounts'), JSON.stringify(bankAccounts));
        localStorage.setItem(getStorageKey('bankTransactions'), JSON.stringify(bankTransactions));
        localStorage.setItem(getStorageKey('reconciliationData'), JSON.stringify(reconciliationData));
        
        // Sincronizar con Firebase si está disponible
        if (typeof authService !== 'undefined' && authService.saveEncryptedData) {
            await authService.saveEncryptedData('bankAccounts', bankAccounts);
            await authService.saveEncryptedData('bankTransactions', bankTransactions);
            await authService.saveEncryptedData('reconciliationData', reconciliationData);
        }
        
        console.log(`✅ Cuentas bancarias guardadas: ${bankAccounts.length} cuentas, ${bankTransactions.length} transacciones`);
    } catch (error) {
        console.error('❌ Error al guardar cuentas bancarias:', error);
    }
}

// Función para crear una nueva cuenta bancaria
function createBankAccount(accountData) {
    const newAccount = {
        id: 'account_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: accountData.name,
        type: accountData.type, // 'checking', 'savings', 'credit', 'investment'
        bank: accountData.bank,
        accountNumber: accountData.accountNumber,
        balance: accountData.balance || 0,
        currency: accountData.currency || 'DOP',
        color: accountData.color || getRandomColor(),
        status: accountData.status || 'active',
        holder: accountData.holder || '',
        email: accountData.email || '',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastReconciliation: null,
        notes: accountData.notes || '',
        
        // Campos específicos para tarjetas de crédito
        creditLimit: accountData.creditLimit || 0,
        cutoffDate: accountData.cutoffDate || null,
        paymentDueDate: accountData.paymentDueDate || null,
        minimumPayment: accountData.minimumPayment || 0,
        
        // Estadísticas
        totalTransactions: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        lastTransactionDate: null
    };
    
    console.log('✅ Nueva cuenta creada:', newAccount);
    
    addNotification(
        '🏦 Nueva Cuenta Bancaria Creada',
        `Se ha creado la cuenta "${newAccount.name}" con balance inicial de ${formatCurrency(newAccount.balance)} ${newAccount.currency}.`,
        'bank',
        'normal'
    );
    
    return newAccount;
}

// Función para manejar el cambio de tipo de cuenta
function handleAccountTypeChange() {
    const accountTypeElement = document.getElementById('bankAccountType');
    const creditCardFields = document.getElementById('creditCardFields');
    const balanceLabel = document.querySelector('label[for="bankAccountBalance"]');
    const balanceInput = document.getElementById('bankAccountBalance');
    
    console.log('🔄 handleAccountTypeChange() ejecutado');
    console.log('📋 Tipo de cuenta seleccionado:', accountTypeElement?.value);
    console.log('🎯 Campos de tarjeta de crédito encontrados:', !!creditCardFields);
    
    if (!accountTypeElement) return;
    
    const accountType = accountTypeElement.value;
    
    if (accountType === 'credit') {
        if (creditCardFields) creditCardFields.style.display = 'block';
        if (balanceLabel) balanceLabel.textContent = 'Balance actual (saldo pendiente):';
        if (balanceInput) balanceInput.placeholder = 'Saldo pendiente (negativo)';
        
        // Configurar fechas por defecto para tarjetas de crédito SOLO si no tienen valores
        const cutoffDateElement = document.getElementById('cutoffDate');
        const paymentDueDateElement = document.getElementById('paymentDueDate');
        
        if (cutoffDateElement && !cutoffDateElement.value) {
            const today = new Date();
            const cutoffDate = new Date(today.getFullYear(), today.getMonth() + 1, 15); // 15 del próximo mes
            cutoffDateElement.value = cutoffDate.toISOString().split('T')[0];
        }
        
        if (paymentDueDateElement && !paymentDueDateElement.value) {
            const today = new Date();
            const paymentDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 25); // 25 del próximo mes
            paymentDueDateElement.value = paymentDueDate.toISOString().split('T')[0];
        }
        
        // Agregar event listeners para actualizar fechas automáticamente
        if (cutoffDateElement) {
            cutoffDateElement.addEventListener('change', function() {
                updatePaymentDueDate();
            });
        }
        
        if (paymentDueDateElement) {
            paymentDueDateElement.addEventListener('change', function() {
                updateCutoffDate();
            });
        }
        
    } else {
        if (creditCardFields) creditCardFields.style.display = 'none';
        if (balanceLabel) balanceLabel.textContent = 'Balance inicial:';
        if (balanceInput) balanceInput.placeholder = '0.00';
    }
}

// Función para actualizar la fecha de límite de pago basada en la fecha de corte
function updatePaymentDueDate() {
    const cutoffDateElement = document.getElementById('cutoffDate');
    const paymentDueDateElement = document.getElementById('paymentDueDate');
    
    if (!cutoffDateElement || !paymentDueDateElement || !cutoffDateElement.value) return;
    
    const cutoffDate = new Date(cutoffDateElement.value);
    const paymentDueDate = new Date(cutoffDate);
    paymentDueDate.setDate(cutoffDate.getDate() + 10); // 10 días después del corte
    
    paymentDueDateElement.value = paymentDueDate.toISOString().split('T')[0];
}

// Función para actualizar la fecha de corte basada en la fecha de límite de pago
function updateCutoffDate() {
    const cutoffDateElement = document.getElementById('cutoffDate');
    const paymentDueDateElement = document.getElementById('paymentDueDate');
    
    if (!cutoffDateElement || !paymentDueDateElement || !paymentDueDateElement.value) return;
    
    const paymentDueDate = new Date(paymentDueDateElement.value);
    const cutoffDate = new Date(paymentDueDate);
    cutoffDate.setDate(paymentDueDate.getDate() - 10); // 10 días antes del límite de pago
    
    cutoffDateElement.value = cutoffDate.toISOString().split('T')[0];
}

// Función para obtener el color de una cuenta
function getRandomColor() {
    const colors = [
        '#007aff', '#34c759', '#ff9500', '#ff3b30', '#5856d6',
        '#ff2d92', '#5ac8fa', '#30d158', '#8e8e93', '#ffcc02'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Función para obtener el icono del tipo de cuenta
function getAccountTypeIcon(type) {
    const icons = {
        'checking': 'fas fa-university',
        'savings': 'fas fa-piggy-bank',
        'credit': 'fas fa-credit-card',
        'investment': 'fas fa-chart-line'
    };
    return icons[type] || 'fas fa-university';
}

// Función para obtener el texto del tipo de cuenta
function getAccountTypeText(type) {
    const texts = {
        'checking': 'Cuenta Corriente',
        'savings': 'Cuenta de Ahorros',
        'credit': 'Tarjeta de Crédito',
        'investment': 'Cuenta de Inversión'
    };
    return texts[type] || type;
}

// Función para obtener el texto del estado
function getStatusText(status) {
    const texts = {
        'active': 'Activa',
        'inactive': 'Inactiva',
        'suspended': 'Suspendida',
        'closed': 'Cerrada'
    };
    return texts[status] || status;
}

// Función auxiliar para normalizar IDs de cuentas
function normalizeAccountId(accountId) {
    if (typeof accountId === 'string') {
        // Si es un string numérico, convertirlo a número
        if (!isNaN(accountId)) {
            return parseInt(accountId);
        }
        // Si ya es un string válido, mantenerlo
        return accountId;
    } else if (typeof accountId === 'number') {
        // Si es un número, mantenerlo
        return accountId;
    }
    // Si es otro tipo, convertirlo a string
    return String(accountId);
}

// Función auxiliar para encontrar cuenta por ID con manejo de tipos
function findAccountById(accountId) {
    const normalizedId = normalizeAccountId(accountId);
    
    // Intentar encontrar con el ID normalizado
    let account = bankAccounts.find(acc => acc.id === normalizedId);
    
    if (account) return account;
    
    // Si no se encuentra, intentar con diferentes tipos
    if (typeof normalizedId === 'string' && !isNaN(normalizedId)) {
        const numericId = parseInt(normalizedId);
        account = bankAccounts.find(acc => acc.id === numericId);
        if (account) return account;
    }
    
    if (typeof normalizedId === 'number') {
        const stringId = normalizedId.toString();
        account = bankAccounts.find(acc => acc.id === stringId);
        if (account) return account;
    }
    
    return null;
}

// Función para normalizar todos los IDs de cuentas existentes
function normalizeAllAccountIds() {
    console.log('🔧 Normalizando IDs de todas las cuentas...');
    let changesMade = false;
    
    bankAccounts.forEach((account, index) => {
        const originalId = account.id;
        const normalizedId = normalizeAccountId(originalId);
        
        if (originalId !== normalizedId) {
            console.log(`🔄 Normalizando ID: ${originalId} → ${normalizedId}`);
            bankAccounts[index].id = normalizedId;
            changesMade = true;
        }
    });
    
    if (changesMade) {
        saveBankAccounts();
        console.log('✅ IDs normalizados y guardados');
        showNotification('IDs de cuentas normalizados', 'success');
    } else {
        console.log('✅ Todos los IDs ya están normalizados');
    }
    
    return changesMade;
}

// Función para calcular el balance total de todas las cuentas
function calculateTotalBalance() {
    return bankAccounts
        .filter(account => account.status === 'active')
        .reduce((total, account) => {
            // Para cuentas bancarias (savings, checking): sumar (dinero disponible)
            // Para tarjetas de crédito: restar (deuda pendiente)
            if (account.type === 'credit') {
                return total - (account.balance || 0); // Restar deuda
            } else {
                return total + (account.balance || 0); // Sumar dinero disponible
            }
        }, 0);
}

// Función para actualizar el balance de una cuenta
function updateAccountBalance(accountId, amountChange, reason = '') {
    const account = bankAccounts.find(acc => acc.id === accountId);
    if (!account) return false;
    
    const oldBalance = account.balance || 0;
    
    // Para tarjetas de crédito, el balance pendiente se reduce con pagos
    if (account.type === 'credit') {
        // Si es un pago (amountChange positivo), reduce el balance pendiente
        // Si es un gasto (amountChange negativo), aumenta el balance pendiente
        account.balance = oldBalance - amountChange;
    } else {
        // Para cuentas bancarias normales, suma el cambio
        account.balance = oldBalance + amountChange;
    }
    
    account.lastUpdated = new Date().toISOString();
    
    // Registrar el cambio
    const balanceChange = {
        id: Date.now(),
        accountId: accountId,
        oldBalance: oldBalance,
        newBalance: account.balance,
        change: amountChange,
        reason: reason,
        timestamp: new Date().toISOString()
    };
    
    if (!reconciliationData[accountId]) {
        reconciliationData[accountId] = [];
    }
    reconciliationData[accountId].push(balanceChange);
    
    saveBankAccounts();
    
    const accountType = account.type === 'credit' ? 'Tarjeta de Crédito' : 'Cuenta Bancaria';
    const balanceText = account.type === 'credit' ? 
        `Balance pendiente: ${formatCurrency(oldBalance)} → ${formatCurrency(account.balance)}` :
        `Balance: ${formatCurrency(oldBalance)} → ${formatCurrency(account.balance)}`;
    
    addNotification(
        '💰 Balance Actualizado',
        `${accountType} "${account.name}" - ${balanceText}`,
        'bank',
        'normal'
    );
    
    return true;
}

// Función para importar transacciones bancarias desde CSV
function importBankTransactions(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                
                console.log('📋 Headers detectados:', headers);
                
                const importedTransactions = [];
                let successCount = 0;
                let errorCount = 0;
                
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    
                    const values = lines[i].split(',').map(v => v.trim());
                    const transaction = {};
                    
                    // Mapear columnas según formato común de bancos
                    headers.forEach((header, index) => {
                        const value = values[index] || '';
                        
                        switch (header) {
                            case 'date':
                            case 'fecha':
                                transaction.date = value;
                                break;
                            case 'description':
                            case 'descripcion':
                            case 'concepto':
                            case 'descripción':
                                transaction.description = value;
                                break;
                            case 'amount':
                            case 'monto':
                            case 'importe':
                                transaction.amount = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
                                break;
                            case 'debito':
                            case 'débito':
                                const debito = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
                                if (debito > 0) {
                                    transaction.amount = -debito; // Negativo para gastos
                                }
                                break;
                            case 'credito':
                            case 'crédito':
                                const credito = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
                                if (credito > 0) {
                                    transaction.amount = credito; // Positivo para ingresos
                                }
                                break;
                            case 'type':
                            case 'tipo':
                                transaction.type = value.toLowerCase();
                                break;
                            case 'category':
                            case 'categoria':
                            case 'categoría':
                                transaction.category = value;
                                break;
                            case 'account':
                            case 'cuenta':
                                transaction.accountId = value;
                                break;
                            case 'saldo':
                                // Solo para referencia, no se usa en la transacción
                                break;
                        }
                    });
                    
                    // Determinar tipo de transacción si no está especificado
                    if (!transaction.type) {
                        transaction.type = transaction.amount >= 0 ? 'ingreso' : 'gasto';
                    }
                    
                    // Validar y procesar fecha
                    if (transaction.date) {
                        // Intentar diferentes formatos de fecha
                        let parsedDate = null;
                        
                        // Formato YYYY-MM-DD
                        if (/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
                            parsedDate = transaction.date;
                        }
                        // Formato DD/MM/YYYY
                        else if (/^\d{2}\/\d{2}\/\d{4}$/.test(transaction.date)) {
                            const parts = transaction.date.split('/');
                            parsedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                        // Formato MM/DD/YYYY
                        else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(transaction.date)) {
                            const parts = transaction.date.split('/');
                            parsedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                        }
                        
                        if (parsedDate) {
                            transaction.date = parsedDate;
                        }
                    }
                    
                    if (transaction.date && transaction.description && transaction.amount !== undefined) {
                        transaction.id = Date.now() + i;
                        transaction.imported = true;
                        transaction.importDate = new Date().toISOString();
                        
                        // Categorización automática básica
                        if (!transaction.category) {
                            transaction.category = categorizeTransaction(transaction.description);
                        }
                        
                        importedTransactions.push(transaction);
                        successCount++;
                        
                        console.log(`✅ Transacción importada: ${transaction.description} - ${transaction.amount}`);
                    } else {
                        errorCount++;
                        console.warn(`❌ Error en línea ${i + 1}:`, values);
                    }
                }
                
                // Agregar transacciones importadas
                bankTransactions.push(...importedTransactions);
                saveBankAccounts();
                
                addNotification(
                    '📥 Importación Completada',
                    `Se importaron ${successCount} transacciones bancarias. ${errorCount} errores encontrados.`,
                    'bank',
                    'normal'
                );
                
                resolve({
                    success: successCount,
                    errors: errorCount,
                    transactions: importedTransactions
                });
                
            } catch (error) {
                console.error('❌ Error en importación:', error);
                reject(error);
            }
        };
        
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Función para obtener nombre de cuenta
function getAccountName(accountId) {
    const account = bankAccounts.find(acc => acc.id == accountId);
    return account ? account.name : 'Cuenta desconocida';
}

// Función para actualizar dropdowns de cuentas bancarias
function updateAccountDropdowns() {
    const transactionAccount = document.getElementById('transactionAccount');
    const transferToAccount = document.getElementById('transferToAccount');
    
    if (transactionAccount) {
        transactionAccount.innerHTML = '<option value="">Selecciona una cuenta</option>';
        bankAccounts.forEach(account => {
            if (account.status === 'active') {
                const option = document.createElement('option');
                option.value = account.id;
                option.textContent = `${account.name} (${formatCurrency(account.balance)})`;
                transactionAccount.appendChild(option);
            }
        });
    }
    
    if (transferToAccount) {
        transferToAccount.innerHTML = '<option value="">Selecciona cuenta destino</option>';
        bankAccounts.forEach(account => {
            if (account.status === 'active') {
                const option = document.createElement('option');
                option.value = account.id;
                option.textContent = `${account.name} (${formatCurrency(account.balance)})`;
                transferToAccount.appendChild(option);
            }
        });
    }
}

// Función para actualizar dropdowns de pagos de tarjetas
function updatePagoTarjetaDropdowns() {
    const cuentaOrigen = document.getElementById('pagoTarjetaCuentaOrigen');
    const tarjetaDestino = document.getElementById('pagoTarjetaDestino');
    
    if (cuentaOrigen) {
        cuentaOrigen.innerHTML = '<option value="">Selecciona la cuenta desde donde pagarás</option>';
        bankAccounts.forEach(account => {
            if (account.status === 'active' && account.type !== 'credit') {
                const option = document.createElement('option');
                option.value = account.id;
                option.textContent = `${account.name} (${formatCurrency(account.balance)})`;
                cuentaOrigen.appendChild(option);
            }
        });
    }
    
    if (tarjetaDestino) {
        tarjetaDestino.innerHTML = '<option value="">Selecciona la tarjeta a pagar</option>';
        bankAccounts.forEach(account => {
            if (account.status === 'active' && account.type === 'credit') {
                const option = document.createElement('option');
                option.value = account.id;
                const balancePendiente = account.balance || 0;
                option.textContent = `${account.name} (Pendiente: ${formatCurrency(balancePendiente)})`;
                tarjetaDestino.appendChild(option);
            }
        });
    }
}

// Función para actualizar dropdown del modal de importación de transacciones
function updateImportAccountDropdown() {
    const importAccountSelect = document.getElementById('importAccountSelect');
    
    if (importAccountSelect) {
        importAccountSelect.innerHTML = '<option value="">Selecciona una cuenta</option>';
        
        if (bankAccounts && bankAccounts.length > 0) {
            bankAccounts.forEach(account => {
                if (account.status === 'active') {
                    const option = document.createElement('option');
                    option.value = account.id;
                    option.textContent = `${account.name} (${formatCurrency(account.balance)})`;
                    importAccountSelect.appendChild(option);
                }
            });
            console.log(`✅ Dropdown de importación actualizado con ${bankAccounts.length} cuentas`);
        } else {
            console.warn('⚠️ No hay cuentas bancarias disponibles para importación');
            importAccountSelect.innerHTML = '<option value="">No hay cuentas disponibles</option>';
        }
    } else {
        console.error('❌ No se encontró el elemento importAccountSelect');
    }
}

// Funciones de navegación entre pasos del modal de importación
function nextStep(stepNumber) {
    console.log(`🔄 Navegando al paso ${stepNumber}`);
    
    // Ocultar todos los pasos
    const steps = document.querySelectorAll('.import-steps .step');
    steps.forEach(step => step.classList.remove('active'));
    
    // Mostrar el paso solicitado
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
        
        // Validaciones específicas por paso
        if (stepNumber === 2) {
            const selectedAccount = document.getElementById('importAccountSelect').value;
            if (!selectedAccount) {
                showNotification('Debes seleccionar una cuenta antes de continuar', 'warning');
                prevStep(1);
                return;
            }
            console.log(`✅ Cuenta seleccionada: ${selectedAccount}`);
        }
        
        console.log(`✅ Paso ${stepNumber} activado correctamente`);
    } else {
        console.error(`❌ No se encontró el paso ${stepNumber}`);
    }
}

function prevStep(stepNumber) {
    console.log(`🔄 Regresando al paso ${stepNumber}`);
    
    // Ocultar todos los pasos
    const steps = document.querySelectorAll('.import-steps .step');
    steps.forEach(step => step.classList.remove('active'));
    
    // Mostrar el paso solicitado
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
        console.log(`✅ Paso ${stepNumber} activado correctamente`);
    } else {
        console.error(`❌ No se encontró el paso ${stepNumber}`);
    }
}

// Función para categorización automática de transacciones
function categorizeTransaction(description) {
    const desc = description.toLowerCase();
    
    // Alimentación
    if (desc.includes('supermercado') || desc.includes('super') || desc.includes('market') || 
        desc.includes('grocery') || desc.includes('food') || desc.includes('comida')) {
        return 'Alimentación y Bebidas';
    }
    
    // Transporte
    if (desc.includes('gasolina') || desc.includes('gas') || desc.includes('fuel') || 
        desc.includes('uber') || desc.includes('taxi') || desc.includes('transporte')) {
        return 'Transporte';
    }
    
    // Entretenimiento
    if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('amazon') || 
        desc.includes('entertainment') || desc.includes('entretenimiento')) {
        return 'Entretenimiento';
    }
    
    // Servicios
    if (desc.includes('electricidad') || desc.includes('agua') || desc.includes('internet') || 
        desc.includes('telefono') || desc.includes('phone')) {
        return 'Servicios Públicos';
    }
    
    // Salud
    if (desc.includes('farmacia') || desc.includes('pharmacy') || desc.includes('medico') || 
        desc.includes('doctor') || desc.includes('hospital')) {
        return 'Salud';
    }
    
    // Ingresos
    if (desc.includes('salario') || desc.includes('salary') || desc.includes('pago') || 
        desc.includes('transferencia') || desc.includes('deposito')) {
        return 'Ingresos';
    }
    
    // Por defecto
    return 'Otros';
}

// Función para conciliar transacciones
function reconcileTransactions(accountId, transactions) {
    const account = bankAccounts.find(acc => acc.id === accountId);
    if (!account) return false;
    
    let reconciledCount = 0;
    let newTransactions = [];
    
    transactions.forEach(transaction => {
        // Buscar transacción similar en las transacciones existentes
        const existingTransaction = bankTransactions.find(t => 
            t.accountId === accountId &&
            Math.abs(t.amount - transaction.amount) < 0.01 &&
            t.date === transaction.date &&
            t.description.toLowerCase().includes(transaction.description.toLowerCase().substring(0, 10))
        );
        
        if (!existingTransaction) {
            // Nueva transacción bancaria
            const newTransaction = {
                ...transaction,
                id: Date.now() + Math.random(),
                accountId: accountId,
                reconciled: true,
                reconciliationDate: new Date().toISOString()
            };
            
            newTransactions.push(newTransaction);
            reconciledCount++;
        } else if (!existingTransaction.reconciled) {
            // Marcar como conciliada
            existingTransaction.reconciled = true;
            existingTransaction.reconciliationDate = new Date().toISOString();
            reconciledCount++;
        }
    });
    
    // Agregar nuevas transacciones
    bankTransactions.push(...newTransactions);
    
    // Actualizar balance de la cuenta
    const totalChange = newTransactions.reduce((sum, t) => sum + t.amount, 0);
    updateAccountBalance(accountId, account.balance + totalChange, 'Conciliación bancaria');
    
    saveBankAccounts();
    
    addNotification(
        '🔄 Conciliación Completada',
        `Se conciliaron ${reconciledCount} transacciones para la cuenta "${account.name}".`,
        'bank',
        'normal'
    );
    
    return {
        reconciled: reconciledCount,
        newTransactions: newTransactions.length
    };
}

// Función para obtener transacciones de una cuenta
function getAccountTransactions(accountId, filters = {}) {
    let filteredTransactions = bankTransactions.filter(t => t.accountId === accountId);
    
    if (filters.dateFrom) {
        filteredTransactions = filteredTransactions.filter(t => 
            new Date(t.date) >= new Date(filters.dateFrom)
        );
    }
    
    if (filters.dateTo) {
        filteredTransactions = filteredTransactions.filter(t => 
            new Date(t.date) <= new Date(filters.dateTo)
        );
    }
    
    if (filters.type) {
        filteredTransactions = filteredTransactions.filter(t => 
            t.type === filters.type
        );
    }
    
    if (filters.reconciled !== undefined) {
        filteredTransactions = filteredTransactions.filter(t => 
            t.reconciled === filters.reconciled
        );
    }
    
    return filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Función para manejar el envío del formulario de cuenta bancaria
async function handleBankAccountSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const accountData = {
            name: formData.get('bankAccountName') || document.getElementById('bankAccountName')?.value || '',
            type: formData.get('bankAccountType') || document.getElementById('bankAccountType')?.value || '',
            bank: formData.get('bankName') || document.getElementById('bankName')?.value || '',
            accountNumber: formData.get('bankAccountNumber') || document.getElementById('bankAccountNumber')?.value || '',
            balance: parseFloat(formData.get('bankAccountBalance') || document.getElementById('bankAccountBalance')?.value) || 0,
            currency: formData.get('bankAccountCurrency') || document.getElementById('bankAccountCurrency')?.value || 'DOP',
            color: formData.get('bankAccountColor') || document.getElementById('bankAccountColor')?.value || '#007aff',
            status: formData.get('accountStatus') || document.getElementById('accountStatus')?.value || 'active',
            holder: formData.get('accountHolder') || document.getElementById('accountHolder')?.value || '',
            email: formData.get('accountEmail') || document.getElementById('accountEmail')?.value || '',
            notes: formData.get('bankAccountNotes') || document.getElementById('bankAccountNotes')?.value || '',
            
            // Campos específicos para tarjetas de crédito
            creditLimit: parseFloat(formData.get('creditLimit') || document.getElementById('creditLimit')?.value) || 0,
            cutoffDate: formData.get('cutoffDate') || document.getElementById('cutoffDate')?.value || null,
            paymentDueDate: formData.get('paymentDueDate') || document.getElementById('paymentDueDate')?.value || null,
            minimumPayment: parseFloat(formData.get('minimumPayment') || document.getElementById('minimumPayment')?.value) || 0
        };
        
        // Validar datos requeridos
        if (!accountData.name || !accountData.type || !accountData.bank) {
            showNotification('Por favor completa todos los campos requeridos', 'error');
            return;
        }
        
        // Verificar si es edición o nueva cuenta
        const editId = e.target.dataset.editId;
        
        if (editId) {
            // Editar cuenta existente
            const accountIndex = bankAccounts.findIndex(acc => acc.id === editId);
            if (accountIndex !== -1) {
                bankAccounts[accountIndex] = {
                    ...bankAccounts[accountIndex],
                    ...accountData,
                    updatedAt: new Date().toISOString()
                };
                
                showNotification('Cuenta bancaria actualizada correctamente', 'success');
            }
        } else {
            // Verificar si ya existe una cuenta con el mismo nombre
            const existingAccount = bankAccounts.find(acc => 
                acc.name === accountData.name && 
                acc.bank === accountData.bank
            );
            
            if (existingAccount) {
                showNotification('Ya existe una cuenta con este nombre y banco', 'warning');
                return;
            }
            
            // Crear nueva cuenta
            const newAccount = createBankAccount(accountData);
            bankAccounts.push(newAccount);
            
            showNotification('Cuenta bancaria creada correctamente', 'success');
        }
        
        // Guardar datos
        await saveBankAccounts();
        
        // Actualizar UI directamente sin llamar a updateUI
        const container = document.getElementById('bankAccountsContainer');
        if (container) {
            // Limpiar duplicadas antes de mostrar
            cleanDuplicateAccounts();
            
            // Actualizar visualización
            updateBankAccountsDisplay();
            updateAccountSummary();
        }
        
        // Cerrar modal
        closeModal('bankAccountModal');
        
    } catch (error) {
        console.error('Error al guardar cuenta bancaria:', error);
        showNotification('Error al guardar la cuenta bancaria', 'error');
    }
}

// Función para eliminar una cuenta bancaria
async function deleteBankAccount(accountId) {
    console.log('🔍 Intentando eliminar cuenta con ID:', accountId, 'tipo:', typeof accountId);
    
    // Confirmar eliminación
    if (!confirm('¿Estás seguro de que quieres eliminar esta cuenta? Esta acción no se puede deshacer.')) {
        return false;
    }
    
    // Usar la función auxiliar para encontrar la cuenta
    const account = findAccountById(accountId);
    
    if (!account) {
        console.error('❌ Cuenta no encontrada con ID:', accountId);
        console.error('🔍 IDs disponibles:', bankAccounts.map(acc => acc.id));
        showNotification(`Cuenta no encontrada (ID: ${accountId})`, 'error');
        return false;
    }
    
    const accountIndex = bankAccounts.findIndex(acc => acc.id === account.id);
    console.log('✅ Cuenta encontrada:', account);
    
    try {
        // Eliminar transacciones asociadas
        const transactionsToRemove = bankTransactions.filter(t => t.accountId === accountId);
        bankTransactions = bankTransactions.filter(t => t.accountId !== accountId);
        console.log(`🗑️ Eliminadas ${transactionsToRemove.length} transacciones asociadas`);
        
        // Eliminar datos de conciliación
        if (reconciliationData[accountId]) {
            delete reconciliationData[accountId];
            console.log('🗑️ Datos de conciliación eliminados');
        }
        
        // Eliminar cuenta
        bankAccounts.splice(accountIndex, 1);
        console.log('✅ Cuenta eliminada del array');
        
        // Guardar cambios
        await saveBankAccounts();
        console.log('💾 Cambios guardados');
        
        // Actualizar UI
        updateBankAccountsDisplay();
        updateAccountSummary();
        
        showNotification(`Cuenta "${account.name}" eliminada correctamente`, 'success');
        
        return true;
    } catch (error) {
        console.error('❌ Error al eliminar cuenta:', error);
        showNotification(`Error al eliminar la cuenta: ${error.message}`, 'error');
        return false;
    }
}

// Función para limpiar cuentas duplicadas
function cleanDuplicateAccounts() {
    console.log('🔍 Verificando cuentas duplicadas...');
    console.log('📋 Cuentas antes de limpiar:', bankAccounts.length);
    
    const uniqueAccounts = [];
    const seenIds = new Set();
    const seenNames = new Set();
    let duplicatesFound = 0;
    
    bankAccounts.forEach((account, index) => {
        // Si el ID ya existe, generar uno nuevo
        if (seenIds.has(account.id)) {
            console.log(`🔄 ID duplicado encontrado: ${account.id}, generando nuevo ID`);
            account.id = 'account_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            duplicatesFound++;
        }
        
        // Si el nombre ya existe, agregar sufijo
        if (seenNames.has(account.name)) {
            console.log(`🔄 Nombre duplicado encontrado: ${account.name}, agregando sufijo`);
            account.name = account.name + ' (Copia)';
            duplicatesFound++;
        }
        
        seenIds.add(account.id);
        seenNames.add(account.name);
        uniqueAccounts.push(account);
    });
    
    // Solo actualizar si hay cambios
    if (duplicatesFound > 0) {
        bankAccounts = uniqueAccounts;
        saveBankAccounts();
        console.log(`✅ ${duplicatesFound} duplicados encontrados y corregidos`);
        showNotification(`${duplicatesFound} cuentas duplicadas corregidas`, 'success');
    } else {
        console.log('✅ No se encontraron duplicados');
    }
    
    return duplicatesFound;
}

// Función para limpiar cuentas duplicadas existentes (más agresiva)
function removeDuplicateAccounts() {
    console.log('🧹 Limpiando cuentas duplicadas existentes...');
    
    const uniqueAccounts = [];
    const seenKeys = new Set();
    let removedCount = 0;
    
    bankAccounts.forEach(account => {
        // Crear una clave única basada en nombre, banco y número de cuenta
        const key = `${account.name}-${account.bank}-${account.accountNumber}`;
        
        if (seenKeys.has(key)) {
            console.log(`🗑️ Eliminando cuenta duplicada: ${account.name}`);
            removedCount++;
        } else {
            seenKeys.add(key);
            uniqueAccounts.push(account);
        }
    });
    
    if (removedCount > 0) {
        bankAccounts = uniqueAccounts;
        saveBankAccounts();
        console.log(`✅ ${removedCount} cuentas duplicadas eliminadas`);
        showNotification(`${removedCount} cuentas duplicadas eliminadas`, 'success');
    } else {
        console.log('✅ No se encontraron cuentas duplicadas para eliminar');
    }
    
    return removedCount;
}

// Función para actualizar la visualización de cuentas bancarias
function updateBankAccountsDisplay() {
    const container = document.getElementById('bankAccountsContainer');
    if (!container) return;
    
    if (bankAccounts.length === 0) {
        container.innerHTML = `
            <div class="no-accounts-message">
                <i class="fas fa-university"></i>
                <h3>No tienes cuentas bancarias configuradas</h3>
                <p>Agrega tu primera cuenta bancaria para comenzar a gestionar tus finanzas</p>
                <button class="btn-primary" onclick="openModal('bankAccountModal')">
                    <i class="fas fa-plus"></i> Agregar Primera Cuenta
                </button>
            </div>
        `;
        return;
    }
    
    // Agrupar cuentas por tipo
    const groupedAccounts = {
        checking: [],
        savings: [],
        credit: [],
        investment: []
    };
    
    bankAccounts.forEach(account => {
        if (groupedAccounts[account.type]) {
            groupedAccounts[account.type].push(account);
        } else {
            groupedAccounts.checking.push(account); // Default fallback
        }
    });
    
    // Generar HTML para cada grupo
    let accountsHTML = '';
    
    // Función para generar tarjeta de cuenta individual
    const generateAccountCard = (account) => {
        const accountTransactions = bankTransactions.filter(t => t.accountId === account.id);
        const recentTransactions = accountTransactions.slice(0, 5);
        
        // Calcular estadísticas
        const totalDeposits = accountTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const totalWithdrawals = accountTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        // Información específica para tarjetas de crédito (compacta)
        const creditLimit = account.creditLimit || 0;
        const currentBalance = Math.abs(account.balance || 0);
        const availableAmount = creditLimit - currentBalance;
        
        const creditInfo = account.type === 'credit' ? `
            <div class="credit-info-compact">
                <div class="credit-summary">
                    <div class="credit-limit-compact">
                        <small>Límite: ${formatCurrency(creditLimit)}</small>
                    </div>
                    <div class="credit-available-compact">
                        <small>Disponible: <span class="${availableAmount >= 0 ? 'positive' : 'negative'}">${formatCurrency(availableAmount)}</span></small>
                    </div>
                </div>
                ${(account.cutoffDate || account.paymentDueDate) ? `
                    <div class="credit-dates-compact">
                        ${account.cutoffDate ? `<small>Corte: ${formatDate(account.cutoffDate)}</small>` : ''}
                        ${account.paymentDueDate ? `<small>Vence: ${formatDate(account.paymentDueDate)}</small>` : ''}
                    </div>
                ` : ''}
            </div>
        ` : '';
        
        return `
            <div class="bank-account-card ${account.status !== 'active' ? 'inactive' : ''} ${account.type === 'credit' ? 'credit-card' : ''}" data-account-id="${account.id}">
                <div class="account-header">
                    <div class="account-info">
                        <div class="account-icon" style="background-color: ${account.color}">
                            <i class="${getAccountTypeIcon(account.type)}"></i>
                        </div>
                        <div class="account-details">
                            <h4>${account.name}</h4>
                            <p>${account.bank} - ${getAccountTypeText(account.type)}</p>
                            ${account.accountNumber ? `<small>****${account.accountNumber.slice(-4)}</small>` : ''}
                            <span class="status-badge ${account.status}">${getStatusText(account.status)}</span>
                        </div>
                    </div>
                    <div class="account-balance">
                        <div class="balance-amount ${account.balance >= 0 ? 'positive' : 'negative'}">
                            ${formatCurrency(Math.abs(account.balance))}
                        </div>
                        <small>${account.currency}</small>
                    </div>
                </div>
                
                ${creditInfo}
                
                <div class="account-actions-compact">
                    <button class="btn-sm expand-account-btn" data-account-id="${account.id}" title="Ver detalles">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <button class="btn-sm edit-account-btn" data-account-id="${account.id}" title="Editar cuenta">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm delete-account-btn" data-account-id="${account.id}" title="Eliminar cuenta">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <!-- Panel expandible con detalles completos -->
                <div class="account-details-panel" id="details-${account.id}" style="display: none;">
                    <div class="details-content">
                        ${account.type === 'credit' ? `
                            <div class="credit-details-full">
                                <h5>Información de Tarjeta de Crédito</h5>
                                <div class="credit-grid">
                                    <div class="credit-item">
                                        <strong>Límite de la Tarjeta:</strong>
                                        <span class="limit-amount">${formatCurrency(creditLimit)}</span>
                                    </div>
                                    <div class="credit-item">
                                        <strong>Balance Actual:</strong>
                                        <span class="balance-amount ${account.balance < 0 ? 'negative' : 'positive'}">${formatCurrency(currentBalance)}</span>
                                    </div>
                                    <div class="credit-item">
                                        <strong>Monto Disponible:</strong>
                                        <span class="available-amount ${availableAmount >= 0 ? 'positive' : 'negative'}">${formatCurrency(availableAmount)}</span>
                                    </div>
                                    ${account.minimumPayment ? `
                                        <div class="credit-item">
                                            <strong>Pago Mínimo:</strong>
                                            <span>${formatCurrency(account.minimumPayment)}</span>
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="credit-dates-full">
                                    ${account.cutoffDate ? `
                                        <div class="date-item">
                                            <i class="fas fa-calendar-alt"></i>
                                            <strong>Fecha de Corte:</strong>
                                            <span>${formatDate(account.cutoffDate)}</span>
                                        </div>
                                    ` : ''}
                                    ${account.paymentDueDate ? `
                                        <div class="date-item">
                                            <i class="fas fa-clock"></i>
                                            <strong>Fecha Límite de Pago:</strong>
                                            <span>${formatDate(account.paymentDueDate)}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="account-stats-full">
                            <h5>Estadísticas</h5>
                            <div class="stats-grid">
                                <div class="stat-item">
                                    <strong>Depósitos:</strong>
                                    <span>${formatCurrency(totalDeposits)}</span>
                                </div>
                                <div class="stat-item">
                                    <strong>Retiros:</strong>
                                    <span>${formatCurrency(totalWithdrawals)}</span>
                                </div>
                                <div class="stat-item">
                                    <strong>Transacciones:</strong>
                                    <span>${accountTransactions.length}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="account-actions-full">
                            <button class="btn-secondary view-transactions-btn" data-account-id="${account.id}">
                                <i class="fas fa-list"></i> Ver Transacciones
                            </button>
                            <button class="btn-secondary import-transactions-btn" data-account-id="${account.id}">
                                <i class="fas fa-file-import"></i> Importar
                            </button>
                        </div>
                        
                        ${recentTransactions.length > 0 ? `
                            <div class="recent-transactions-full">
                                <h5>Transacciones Recientes</h5>
                                <div class="transactions-list">
                                    ${recentTransactions.map(transaction => `
                                        <div class="transaction-item">
                                            <div class="transaction-date">${formatDate(transaction.date)}</div>
                                            <div class="transaction-description">${transaction.description}</div>
                                            <div class="transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}">
                                                ${formatCurrency(Math.abs(transaction.amount))}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    };
    
    // Generar secciones para cada tipo de cuenta
    const accountTypes = [
        { key: 'checking', title: 'Cuentas Corrientes', icon: 'fas fa-university' },
        { key: 'savings', title: 'Cuentas de Ahorros', icon: 'fas fa-piggy-bank' },
        { key: 'credit', title: 'Tarjetas de Crédito', icon: 'fas fa-credit-card' },
        { key: 'investment', title: 'Cuentas de Inversión', icon: 'fas fa-chart-line' }
    ];
    
    accountTypes.forEach(type => {
        const accountsOfType = groupedAccounts[type.key];
        if (accountsOfType.length > 0) {
            const totalBalance = accountsOfType.reduce((sum, acc) => sum + acc.balance, 0);
            
            accountsHTML += `
                <div class="account-type-section">
                    <div class="section-header">
                        <div class="section-title">
                            <i class="${type.icon}"></i>
                            <h3>${type.title}</h3>
                            <span class="account-count">${accountsOfType.length} cuenta${accountsOfType.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="section-balance">
                            <span class="balance-label">Balance Total:</span>
                            <span class="balance-amount ${totalBalance >= 0 ? 'positive' : 'negative'}">
                                ${formatCurrency(Math.abs(totalBalance))}
                            </span>
                        </div>
                    </div>
                    <div class="accounts-grid">
                        ${accountsOfType.map(account => generateAccountCard(account)).join('')}
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = accountsHTML;
}

// Función para actualizar el resumen de cuentas
function updateAccountSummary() {
    const totalBalance = calculateTotalBalance();
    const activeAccounts = bankAccounts.length;
    const totalTransactions = bankTransactions.length;
    const reconciledTransactions = bankTransactions.filter(t => t.reconciled).length;
    
    // Actualizar tarjetas de resumen
    const totalBalanceElement = document.getElementById('totalBankBalance');
    const activeAccountsElement = document.getElementById('activeAccountsCount');
    const totalTransactionsElement = document.getElementById('totalBankTransactions');
    const reconciledTransactionsElement = document.getElementById('reconciledTransactions');
    
    if (totalBalanceElement) totalBalanceElement.textContent = formatCurrency(totalBalance);
    if (activeAccountsElement) activeAccountsElement.textContent = activeAccounts;
    if (totalTransactionsElement) totalTransactionsElement.textContent = totalTransactions;
    if (reconciledTransactionsElement) reconciledTransactionsElement.textContent = reconciledTransactions;
}

// Función para editar cuenta bancaria
function editBankAccount(accountId) {
    console.log('🔍 Editando cuenta con ID:', accountId, 'tipo:', typeof accountId);
    
    // Usar la función auxiliar para encontrar la cuenta
    const account = findAccountById(accountId);
    
    if (!account) {
        console.error('❌ Cuenta no encontrada para editar con ID:', accountId);
        showNotification(`Cuenta no encontrada (ID: ${accountId})`, 'error');
        return;
    }
    
    console.log('🔍 Editando cuenta:', account);
    
    // Llenar formulario con datos de la cuenta
    const form = document.getElementById('bankAccountForm');
    if (form) {
        form.dataset.editId = accountId;
        document.getElementById('bankAccountModalTitle').textContent = 'Editar Cuenta Bancaria';
        
        // Llenar campos básicos
        const nameElement = document.getElementById('bankAccountName');
        const typeElement = document.getElementById('bankAccountType');
        const bankElement = document.getElementById('bankName');
        const numberElement = document.getElementById('bankAccountNumber');
        const balanceElement = document.getElementById('bankAccountBalance');
        const currencyElement = document.getElementById('bankAccountCurrency');
        const colorElement = document.getElementById('bankAccountColor');
        const statusElement = document.getElementById('accountStatus');
        const holderElement = document.getElementById('accountHolder');
        const emailElement = document.getElementById('accountEmail');
        const notesElement = document.getElementById('bankAccountNotes');
        
        if (nameElement) nameElement.value = account.name || '';
        if (typeElement) typeElement.value = account.type || '';
        if (bankElement) bankElement.value = account.bank || '';
        if (numberElement) numberElement.value = account.accountNumber || '';
        if (balanceElement) balanceElement.value = account.balance || 0;
        if (currencyElement) currencyElement.value = account.currency || 'DOP';
        if (colorElement) colorElement.value = account.color || '#007aff';
        if (statusElement) statusElement.value = account.status || 'active';
        if (holderElement) holderElement.value = account.holder || '';
        if (emailElement) emailElement.value = account.email || '';
        if (notesElement) notesElement.value = account.notes || '';
        
        // Llenar campos específicos de tarjeta de crédito
        if (account.type === 'credit') {
            console.log('💳 Llenando campos de tarjeta de crédito para:', account.name);
            
            const creditLimitElement = document.getElementById('creditLimit');
            const cutoffDateElement = document.getElementById('cutoffDate');
            const paymentDueDateElement = document.getElementById('paymentDueDate');
            const minimumPaymentElement = document.getElementById('minimumPayment');
            
            console.log('💰 Límite de crédito:', account.creditLimit);
            console.log('📅 Fecha de corte:', account.cutoffDate);
            console.log('⏰ Fecha límite de pago:', account.paymentDueDate);
            console.log('💵 Pago mínimo:', account.minimumPayment);
            
            if (creditLimitElement) creditLimitElement.value = account.creditLimit || 0;
            if (cutoffDateElement) cutoffDateElement.value = account.cutoffDate || '';
            if (paymentDueDateElement) paymentDueDateElement.value = account.paymentDueDate || '';
            if (minimumPaymentElement) minimumPaymentElement.value = account.minimumPayment || 0;
        }
        
        // Mostrar/ocultar campos de tarjeta de crédito DESPUÉS de llenar los valores
        handleAccountTypeChange();
        
        // Abrir modal
        openModal('bankAccountModal');
    }
}

// Función para ver transacciones de una cuenta
function viewAccountTransactions(accountId) {
    console.log('🔍 Viendo transacciones de cuenta con ID:', accountId, 'tipo:', typeof accountId);
    
    // Usar la función auxiliar para encontrar la cuenta
    const account = findAccountById(accountId);
    
    if (!account) {
        console.error('❌ Cuenta no encontrada para ver transacciones con ID:', accountId);
        showNotification(`Cuenta no encontrada (ID: ${accountId})`, 'error');
        return;
    }
    
    const transactions = getAccountTransactions(accountId);
    
    if (transactions.length === 0) {
        showNotification(`No hay transacciones para la cuenta ${account.name}`, 'info');
        return;
    }
    
    // Crear modal para mostrar transacciones
    const modalContent = `
        <div class="modal" id="transactionsModal" style="display: block;">
            <div class="modal-content" style="max-width: 800px;">
                <span class="close" onclick="closeModal('transactionsModal')">&times;</span>
                <h2>Transacciones de ${account.name}</h2>
                <div class="transactions-list">
                    ${transactions.map(transaction => `
                        <div class="transaction-item">
                            <div class="transaction-date">${formatDate(transaction.date)}</div>
                            <div class="transaction-description">${transaction.description}</div>
                            <div class="transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}">
                                ${formatCurrency(Math.abs(transaction.amount))}
                            </div>
                            <div class="transaction-status">
                                ${transaction.reconciled ? '<span class="badge reconciled">✓ Conciliada</span>' : '<span class="badge pending">⏳ Pendiente</span>'}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeModal('transactionsModal')">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    showNotification(`Mostrando ${transactions.length} transacciones para ${account.name}`, 'info');
}

// Función para importar transacciones para una cuenta específica
function importTransactionsForAccount(accountId) {
    console.log('🔍 Importando transacciones para cuenta con ID:', accountId, 'tipo:', typeof accountId);
    
    // Usar la función auxiliar para encontrar la cuenta
    const account = findAccountById(accountId);
    
    if (!account) {
        console.error('❌ Cuenta no encontrada para importar transacciones con ID:', accountId);
        showNotification(`Cuenta no encontrada (ID: ${accountId})`, 'error');
        return;
    }
    
    // Guardar la cuenta seleccionada en el modal de importación
    localStorage.setItem('selectedAccountForImport', accountId);
    
    // Mostrar modal de importación con la cuenta pre-seleccionada
    openModal('importBankTransactionsModal');
    
    // Actualizar dropdown y pre-seleccionar la cuenta en el modal
    setTimeout(() => {
        updateImportAccountDropdown();
        const accountSelect = document.getElementById('importAccountSelect');
        if (accountSelect) {
            accountSelect.value = accountId;
            // Disparar evento change para actualizar la UI
            accountSelect.dispatchEvent(new Event('change'));
        }
    }, 100);
    
    showNotification(`Preparando importación para ${account.name}`, 'info');
}

// Función para configurar event delegation de botones de cuentas
function setupBankAccountEventDelegation() {
    const container = document.getElementById('bankAccountsContainer');
    if (!container) return;
    
    // Event delegation para botones de cuentas
    container.addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (!target) return;
        
        const accountId = target.dataset.accountId;
        if (!accountId) return;
        
        // Botón editar
        if (target.classList.contains('edit-account-btn')) {
            e.preventDefault();
            editBankAccount(accountId);
        }
        
        // Botón ver transacciones
        else if (target.classList.contains('view-transactions-btn')) {
            e.preventDefault();
            viewAccountTransactions(accountId);
        }
        
        // Botón importar transacciones
        else if (target.classList.contains('import-transactions-btn')) {
            e.preventDefault();
            importTransactionsForAccount(accountId);
        }
        
        // Botón eliminar
        else if (target.classList.contains('delete-account-btn')) {
            e.preventDefault();
            deleteBankAccount(accountId);
        }
        
        // Botón expandir/contraer detalles
        else if (target.classList.contains('expand-account-btn')) {
            e.preventDefault();
            toggleAccountDetails(accountId);
        }
    });
    
    console.log('✅ Event delegation configurado para botones de cuentas');
}

// Función para expandir/contraer detalles de cuenta
function toggleAccountDetails(accountId) {
    const detailsPanel = document.getElementById(`details-${accountId}`);
    const expandBtn = document.querySelector(`[data-account-id="${accountId}"].expand-account-btn i`);
    
    if (!detailsPanel || !expandBtn) return;
    
    if (detailsPanel.style.display === 'none') {
        // Expandir
        detailsPanel.style.display = 'block';
        expandBtn.className = 'fas fa-chevron-up';
        detailsPanel.classList.add('expanded');
    } else {
        // Contraer
        detailsPanel.style.display = 'none';
        expandBtn.className = 'fas fa-chevron-down';
        detailsPanel.classList.remove('expanded');
    }
}

// ===== OPTIMIZACIONES Y MEJORAS DE RENDIMIENTO =====

// Función para optimizar el rendimiento de la aplicación
function optimizePerformance() {
    console.log('🚀 Aplicando optimizaciones de rendimiento...');
    
    // Optimizar localStorage
    optimizeLocalStorage();
    
    // Optimizar manejo de eventos
    optimizeEventHandling();
    
    // Optimizar renderizado de gráficos
    optimizeChartRendering();
    
    // Optimizar manejo de memoria
    optimizeMemoryUsage();
    
    console.log('✅ Optimizaciones aplicadas correctamente');
}

// ===== FUNCIONES PARA MANEJO AUTOMÁTICO DE FECHAS DE TARJETAS DE CRÉDITO =====

// Función para avanzar fechas al siguiente mes automáticamente
function advanceCreditCardDates() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    bankAccounts.forEach(account => {
        if (account.type === 'credit' && account.cutoffDate) {
            const cutoffDate = new Date(account.cutoffDate);
            const cutoffMonth = cutoffDate.getMonth();
            const cutoffYear = cutoffDate.getFullYear();
            
            // Si la fecha de corte ya pasó este mes, avanzar al siguiente
            if (cutoffYear < currentYear || (cutoffYear === currentYear && cutoffMonth < currentMonth)) {
                const newCutoffDate = new Date(cutoffDate);
                newCutoffDate.setMonth(cutoffMonth + 1);
                if (newCutoffDate.getMonth() === 0) { // Si es enero del siguiente año
                    newCutoffDate.setFullYear(cutoffYear + 1);
                }
                
                account.cutoffDate = newCutoffDate.toISOString().split('T')[0];
                
                // Actualizar también la fecha de límite de pago
                if (account.paymentDueDate) {
                    const paymentDueDate = new Date(account.paymentDueDate);
                    const newPaymentDueDate = new Date(paymentDueDate);
                    newPaymentDueDate.setMonth(paymentDueDate.getMonth() + 1);
                    if (newPaymentDueDate.getMonth() === 0) {
                        newPaymentDueDate.setFullYear(paymentDueDate.getFullYear() + 1);
                    }
                    
                    account.paymentDueDate = newPaymentDueDate.toISOString().split('T')[0];
                }
                
                console.log(`🔄 Fechas actualizadas para ${account.name}: Corte ${account.cutoffDate}, Pago ${account.paymentDueDate}`);
            }
        }
    });
    
    // Guardar los cambios
    saveBankAccounts();
    updateBankAccountsDisplay();
}

// Función para verificar y actualizar fechas al cargar la aplicación
function checkAndUpdateCreditCardDates() {
    console.log('🔍 Verificando fechas de tarjetas de crédito...');
    advanceCreditCardDates();
}

// Función para configurar fechas inteligentes basadas en el día seleccionado
function setupSmartDateHandling() {
    const cutoffDateElement = document.getElementById('cutoffDate');
    const paymentDueDateElement = document.getElementById('paymentDueDate');
    
    if (cutoffDateElement) {
        cutoffDateElement.addEventListener('change', function() {
            if (this.value) {
                const selectedDate = new Date(this.value);
                const dayOfMonth = selectedDate.getDate();
                
                // Configurar la fecha de límite de pago 10 días después
                const paymentDueDate = new Date(selectedDate);
                paymentDueDate.setDate(dayOfMonth + 10);
                
                if (paymentDueDateElement) {
                    paymentDueDateElement.value = paymentDueDate.toISOString().split('T')[0];
                }
                
                console.log(`📅 Fecha de corte: ${this.value}, Fecha límite de pago: ${paymentDueDateElement?.value}`);
            }
        });
    }
    
    if (paymentDueDateElement) {
        paymentDueDateElement.addEventListener('change', function() {
            if (this.value) {
                const selectedDate = new Date(this.value);
                const dayOfMonth = selectedDate.getDate();
                
                // Configurar la fecha de corte 10 días antes
                const cutoffDate = new Date(selectedDate);
                cutoffDate.setDate(dayOfMonth - 10);
                
                if (cutoffDateElement) {
                    cutoffDateElement.value = cutoffDate.toISOString().split('T')[0];
                }
                
                console.log(`📅 Fecha límite de pago: ${this.value}, Fecha de corte: ${cutoffDateElement?.value}`);
            }
        });
    }
}

// Optimizar localStorage
function optimizeLocalStorage() {
    try {
        // Verificar si localStorage está disponible
        const testKey = '__test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        
        // Implementar compresión para datos grandes
        const originalSetItem = localStorage.setItem;
        const originalGetItem = localStorage.getItem;
        
        localStorage.setItem = function(key, value) {
            try {
                // Comprimir datos si son muy grandes
                if (value && value.length > 1000) {
                    const compressed = btoa(encodeURIComponent(value));
                    originalSetItem.call(this, key, compressed);
                    originalSetItem.call(this, key + '_compressed', 'true');
                } else {
                    originalSetItem.call(this, key, value);
                    localStorage.removeItem(key + '_compressed');
                }
            } catch (error) {
                console.warn('Error al guardar en localStorage:', error);
                // Fallback al método original
                originalSetItem.call(this, key, value);
            }
        };
        
        localStorage.getItem = function(key) {
            try {
                const value = originalGetItem.call(this, key);
                const isCompressed = originalGetItem.call(this, key + '_compressed');
                
                if (isCompressed === 'true' && value) {
                    return decodeURIComponent(atob(value));
                }
                return value;
            } catch (error) {
                console.warn('Error al leer de localStorage:', error);
                return originalGetItem.call(this, key);
            }
        };
        
        console.log('✅ localStorage optimizado');
    } catch (error) {
        console.warn('⚠️ No se pudo optimizar localStorage:', error);
    }
}

// Optimizar manejo de eventos
function optimizeEventHandling() {
    // Implementar debounce para funciones costosas
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Aplicar debounce a funciones costosas
    if (typeof updateUI === 'function') {
        window.updateUI = debounce(updateUI, 300);
    }
    
    if (typeof saveData === 'function') {
        window.saveData = debounce(saveData, 500);
    }
    
    // Optimizar event listeners con delegación de eventos
    document.addEventListener('click', function(e) {
        // Delegación para botones de eliminar
        if (e.target.matches('.delete-btn, .btn-delete')) {
            e.preventDefault();
            const itemId = e.target.dataset.id;
            const itemType = e.target.dataset.type;
            
            if (itemId && itemType) {
                handleDeleteItem(itemId, itemType);
            }
        }
        
        // Delegación para botones de editar
        if (e.target.matches('.edit-btn, .btn-edit')) {
            e.preventDefault();
            const itemId = e.target.dataset.id;
            const itemType = e.target.dataset.type;
            
            if (itemId && itemType) {
                handleEditItem(itemId, itemType);
            }
        }
    });
    
    console.log('✅ Manejo de eventos optimizado');
}

// Optimizar renderizado de gráficos
function optimizeChartRendering() {
    // Implementar lazy loading para gráficos
    const observerOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    };
    
    const chartObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const chartId = entry.target.dataset.chartId;
                if (chartId && !entry.target.dataset.chartLoaded) {
                    loadChart(chartId);
                    entry.target.dataset.chartLoaded = 'true';
                }
            }
        });
    }, observerOptions);
    
    // Observar contenedores de gráficos
    document.querySelectorAll('[data-chart-id]').forEach(container => {
        chartObserver.observe(container);
    });
    
    console.log('✅ Renderizado de gráficos optimizado');
}

// Optimizar uso de memoria
function optimizeMemoryUsage() {
    // Limpiar referencias circulares
    function cleanupCircularReferences() {
        // Limpiar referencias en transacciones
        transactions.forEach(transaction => {
            if (transaction.element) {
                delete transaction.element;
            }
        });
        
        // Limpiar referencias en categorías
        categories.forEach(category => {
            if (category.element) {
                delete category.element;
            }
        });
    }
    
    // Ejecutar limpieza periódicamente
    setInterval(cleanupCircularReferences, 30000); // Cada 30 segundos
    
    // Limpiar al cambiar de pestaña
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cleanupCircularReferences();
        }
    });
    
    console.log('✅ Uso de memoria optimizado');
}

// Función para manejar eliminación de elementos
function handleDeleteItem(itemId, itemType) {
    const confirmMessage = `¿Estás seguro de que quieres eliminar este ${itemType}?`;
    
    if (confirm(confirmMessage)) {
        switch (itemType) {
            case 'category':
                deleteCategory(itemId);
                break;
            case 'transaction':
                deleteTransaction(itemId);
                break;
            case 'income':
                deleteIncome(itemId);
                break;
            case 'goal':
                deleteGoal(itemId);
                break;
            case 'bankAccount':
                deleteBankAccount(itemId);
                break;
            default:
                console.warn('Tipo de elemento no reconocido:', itemType);
        }
    }
}

// Función para manejar edición de elementos
function handleEditItem(itemId, itemType) {
    switch (itemType) {
        case 'category':
            editCategory(itemId);
            break;
        case 'transaction':
            editTransaction(itemId);
            break;
        case 'income':
            editIncome(itemId);
            break;
        case 'goal':
            editGoal(itemId);
            break;
        default:
            console.warn('Tipo de elemento no reconocido para edición:', itemType);
    }
}

// Función para cargar gráficos de forma lazy
function loadChart(chartId) {
    console.log('📊 Cargando gráfico:', chartId);
    
    // Simular carga de gráfico
    setTimeout(() => {
        const container = document.querySelector(`[data-chart-id="${chartId}"]`);
        if (container) {
            container.innerHTML = '<div class="chart-loading">Cargando gráfico...</div>';
            
            // Aquí se cargaría el gráfico real
            setTimeout(() => {
                container.innerHTML = '<div class="chart-loaded">Gráfico cargado</div>';
            }, 1000);
        }
    }, 100);
}

// Función para verificar y reparar datos corruptos
function repairCorruptedData() {
    console.log('🔧 Verificando integridad de datos...');
    
    let repaired = false;
    
    // Verificar transacciones
    if (Array.isArray(transactions)) {
        transactions = transactions.filter(transaction => {
            if (!transaction || typeof transaction !== 'object') {
                repaired = true;
                return false;
            }
            
            // Reparar campos faltantes
            if (!transaction.id) {
                transaction.id = Date.now() + Math.random();
                repaired = true;
            }
            
            if (!transaction.date) {
                transaction.date = new Date().toISOString().split('T')[0];
                repaired = true;
            }
            
            if (typeof transaction.amount !== 'number') {
                transaction.amount = parseFloat(transaction.amount) || 0;
                repaired = true;
            }
            
            return true;
        });
    } else {
        transactions = [];
        repaired = true;
    }
    
    // Verificar categorías
    if (Array.isArray(categories)) {
        categories = categories.filter(category => {
            if (!category || typeof category !== 'object') {
                repaired = true;
                return false;
            }
            
            // Reparar campos faltantes
            if (!category.id) {
                category.id = Date.now() + Math.random();
                repaired = true;
            }
            
            if (!category.budget) {
                category.budget = 0;
                repaired = true;
            }
            
            return true;
        });
    } else {
        categories = [];
        repaired = true;
    }
    
    if (repaired) {
        console.log('🔧 Datos reparados, guardando...');
        saveData();
        showNotification('Datos reparados automáticamente', 'info');
    } else {
        console.log('✅ Integridad de datos verificada');
    }
}

// Función para monitorear rendimiento
function monitorPerformance() {
    const performanceData = {
        loadTime: performance.now(),
        memoryUsage: 0,
        errors: 0
    };
    
    // Monitorear errores
    window.addEventListener('error', () => {
        performanceData.errors++;
    });
    
    // Monitorear memoria (si está disponible)
    if (performance.memory) {
        setInterval(() => {
            performanceData.memoryUsage = performance.memory.usedJSHeapSize;
            
            // Alerta si el uso de memoria es alto
            if (performance.memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
                console.warn('⚠️ Uso de memoria alto:', performance.memory.usedJSHeapSize / 1024 / 1024, 'MB');
                cleanupCircularReferences();
            }
        }, 10000); // Cada 10 segundos
    }
    
    // Reportar métricas cada minuto
    setInterval(() => {
        console.log('📊 Métricas de rendimiento:', {
            tiempoCarga: performance.now() - performanceData.loadTime,
            errores: performanceData.errors,
            memoria: performanceData.memoryUsage / 1024 / 1024 + ' MB'
        });
    }, 60000);
    
    console.log('📊 Monitoreo de rendimiento iniciado');
}

// Función para inicializar optimizaciones
function initializeOptimizations() {
    console.log('🚀 Inicializando optimizaciones...');
    
    // Inicializar manejador de errores
    if (typeof initializeErrorHandler === 'function') {
        const errorHandler = initializeErrorHandler();
        console.log('🛡️ Manejador de errores:', errorHandler);
    }
    
    // Inicializar configuración de rendimiento
    if (typeof initializePerformanceConfig === 'function') {
        const performanceSetup = initializePerformanceConfig();
        console.log('📊 Configuración de rendimiento:', performanceSetup);
    }
    
    // Aplicar optimizaciones
    optimizePerformance();
    
    // Reparar datos corruptos
    repairCorruptedData();
    
    // Iniciar monitoreo de rendimiento
    monitorPerformance();
    
    console.log('✅ Optimizaciones inicializadas');
}