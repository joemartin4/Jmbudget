// Configuración centralizada de JM Budget - Versión Optimizada para Usuario Final
window.JMBudgetConfig = {
    // Configuración de la aplicación
    app: {
        name: 'JM Budget',
        version: '2.0.4',
        description: 'Gestión de Presupuesto Familiar',
        defaultCurrency: 'DOP',
        supportedCurrencies: ['DOP', 'USD', 'EUR', 'MXN', 'COP', 'ARS', 'CLP', 'PEN'],
        exchangeRates: {
            'USD': 58.50,
            'EUR': 63.20,
            'MXN': 3.45,
            'COP': 0.015,
            'ARS': 0.065,
            'CLP': 0.062,
            'PEN': 15.80,
            'DOP': 1.00
        }
    },

    // Configuración de desarrollo (automática)
    development: {
        enabled: window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.includes('localhost'),
        debugLogs: false, // Deshabilitado para usuario final
        autoRefresh: false
    },

    // Configuración de almacenamiento optimizada
    storage: {
        prefix: 'jmBudget_',
        encryption: true,
        compression: true,
        maxCacheSize: 50 * 1024 * 1024, // 50MB
        autoCleanup: true, // Limpieza automática de datos antiguos
        backupInterval: 24 * 60 * 60 * 1000 // Backup automático cada 24 horas
    },

    // Configuración de sincronización mejorada
    sync: {
        autoSync: true,
        syncInterval: 5 * 60 * 1000, // 5 minutos
        conflictResolution: 'smart-merge',
        maxRetries: 3,
        timeout: 30000,
        offlineMode: true // Funciona sin conexión
    },

    // Configuración de notificaciones optimizada
    notifications: {
        enabled: true,
        position: 'top-right',
        duration: 5000,
        maxNotifications: 5,
        soundEnabled: false, // Deshabilitado por defecto
        budgetAlerts: true,
        recurringReminders: true
    },

    // Configuración de temas mejorada
    themes: {
        default: 'auto', // Auto-detecta preferencia del sistema
        autoDetect: true,
        transition: true,
        highContrast: false
    },

    // Configuración de rendimiento optimizada
    performance: {
        debounceDelay: 300,
        throttleDelay: 100,
        maxChartDataPoints: 100,
        lazyLoading: true,
        virtualScrolling: true,
        imageOptimization: true,
        cacheStrategy: 'aggressive'
    },

    // Configuración de validación mejorada
    validation: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        password: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false
        },
        amount: {
            maxDecimals: 2,
            allowNegative: true
        }
    },

    // Configuración de categorías por defecto optimizada
    defaultCategories: {
        'Alimentación y Bebidas': {
            color: '#FF6B6B',
            icon: 'fas fa-utensils',
            subcategories: ['Supermercado', 'Restaurantes', 'Delivery', 'Café']
        },
        'Transporte': {
            color: '#4ECDC4',
            icon: 'fas fa-car',
            subcategories: ['Gasolina', 'Mantenimiento', 'Transporte público', 'Taxi']
        },
        'Vivienda': {
            color: '#45B7D1',
            icon: 'fas fa-home',
            subcategories: ['Alquiler', 'Servicios', 'Mantenimiento', 'Decoración']
        },
        'Salud': {
            color: '#96CEB4',
            icon: 'fas fa-heartbeat',
            subcategories: ['Médico', 'Farmacia', 'Seguro médico', 'Gimnasio']
        },
        'Educación': {
            color: '#FFEAA7',
            icon: 'fas fa-graduation-cap',
            subcategories: ['Matrícula', 'Libros', 'Cursos', 'Material escolar']
        },
        'Entretenimiento': {
            color: '#DDA0DD',
            icon: 'fas fa-film',
            subcategories: ['Cine', 'Conciertos', 'Videojuegos', 'Hobbies']
        },
        'Ropa y Accesorios': {
            color: '#98D8C8',
            icon: 'fas fa-tshirt',
            subcategories: ['Ropa', 'Zapatos', 'Accesorios', 'Cosméticos']
        },
        'Servicios Financieros': {
            color: '#F7DC6F',
            icon: 'fas fa-university',
            subcategories: ['Comisiones bancarias', 'Seguros', 'Inversiones', 'Préstamos']
        },
        'Otros': {
            color: '#BDC3C7',
            icon: 'fas fa-ellipsis-h',
            subcategories: ['Gastos varios', 'Regalos', 'Donaciones', 'Emergencias']
        }
    },

    // Configuración de seguridad
    security: {
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
        maxLoginAttempts: 5,
        passwordExpiry: 90 * 24 * 60 * 60 * 1000, // 90 días
        dataEncryption: true,
        secureStorage: true
    },

    // Configuración de accesibilidad
    accessibility: {
        highContrast: false,
        largeText: false,
        screenReader: true,
        keyboardNavigation: true,
        focusIndicators: true
    },

    // Configuración de exportación
    export: {
        formats: ['csv', 'json', 'pdf'],
        includeCharts: true,
        includeMetadata: true,
        compression: true
    },

    // Configuración de importación
    import: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        supportedFormats: ['csv', 'json', 'xlsx'],
        autoValidation: true,
        backupBeforeImport: true
    },

    // Configuración de reportes
    reports: {
        defaultPeriod: 'current-month',
        chartTypes: ['pie', 'bar', 'line', 'doughnut'],
        autoGenerate: true,
        includeTrends: true
    },

    // Configuración de metas financieras
    goals: {
        maxGoals: 10,
        reminderFrequency: 'weekly',
        progressTracking: true,
        milestoneAlerts: true
    },

    // Configuración de cuentas bancarias
    accounts: {
        maxAccounts: 20,
        autoReconciliation: true,
        transactionMatching: true,
        balanceAlerts: true
    }
};

// Función para obtener configuración según el entorno
function getConfig(key) {
    const keys = key.split('.');
    let value = window.JMBudgetConfig;
    
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return null;
        }
    }
    
    return value;
}

// Función para actualizar configuración
function updateConfig(key, value) {
    const keys = key.split('.');
    let config = window.JMBudgetConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in config)) {
            config[keys[i]] = {};
        }
        config = config[keys[i]];
    }
    
    config[keys[keys.length - 1]] = value;
    
    // Guardar en localStorage
    localStorage.setItem('jmBudget_config', JSON.stringify(window.JMBudgetConfig));
}

// Función para cargar configuración personalizada
function loadCustomConfig() {
    const savedConfig = localStorage.getItem('jmBudget_config');
    if (savedConfig) {
        try {
            const customConfig = JSON.parse(savedConfig);
            Object.assign(window.JMBudgetConfig, customConfig);
        } catch (error) {
            console.warn('Error al cargar configuración personalizada:', error);
        }
    }
}

// Función para resetear configuración
function resetConfig() {
    localStorage.removeItem('jmBudget_config');
    window.location.reload();
}

// Cargar configuración personalizada al iniciar
loadCustomConfig();

// Exportar funciones para uso global
window.getConfig = getConfig;
window.updateConfig = updateConfig;
window.resetConfig = resetConfig;

console.log('✅ Configuración JM Budget cargada - Versión', window.JMBudgetConfig.app.version); 