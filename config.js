// Configuración centralizada de JM Budget
window.JMBudgetConfig = {
    // Configuración de la aplicación
    app: {
        name: 'JM Budget',
        version: '2.0.0',
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

    // Configuración de desarrollo
    development: {
        enabled: window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.includes('localhost'),
        debugLogs: true,
        autoRefresh: false
    },

    // Configuración de almacenamiento
    storage: {
        prefix: 'jmBudget_',
        encryption: true,
        compression: true,
        maxCacheSize: 50 * 1024 * 1024 // 50MB
    },

    // Configuración de sincronización
    sync: {
        autoSync: true,
        syncInterval: 5 * 60 * 1000, // 5 minutos
        conflictResolution: 'smart-merge',
        maxRetries: 3,
        timeout: 30000
    },

    // Configuración de notificaciones
    notifications: {
        enabled: true,
        position: 'top-right',
        duration: 5000,
        maxNotifications: 5
    },

    // Configuración de temas
    themes: {
        default: 'light',
        autoDetect: true,
        transition: true
    },

    // Configuración de rendimiento
    performance: {
        debounceDelay: 300,
        throttleDelay: 100,
        maxChartDataPoints: 100,
        lazyLoading: true,
        virtualScrolling: true
    },

    // Configuración de validación
    validation: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        password: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false
        }
    },

    // Configuración de categorías por defecto
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
            subcategories: ['Médicos', 'Medicamentos', 'Seguro médico', 'Gimnasio']
        },
        'Entretenimiento': {
            color: '#FFEAA7',
            icon: 'fas fa-gamepad',
            subcategories: ['Cine', 'Eventos', 'Hobbies', 'Deportes']
        },
        'Educación': {
            color: '#DDA0DD',
            icon: 'fas fa-graduation-cap',
            subcategories: ['Matrícula', 'Libros', 'Cursos', 'Material escolar']
        },
        'Ropa y Accesorios': {
            color: '#FFB6C1',
            icon: 'fas fa-tshirt',
            subcategories: ['Ropa', 'Zapatos', 'Accesorios', 'Cosméticos']
        },
        'Tecnología': {
            color: '#87CEEB',
            icon: 'fas fa-laptop',
            subcategories: ['Electrónicos', 'Software', 'Internet', 'Reparaciones']
        },
        'Ahorros e Inversiones': {
            color: '#98FB98',
            icon: 'fas fa-piggy-bank',
            subcategories: ['Ahorros', 'Inversiones', 'Fondos de emergencia']
        },
        'Otros': {
            color: '#D3D3D3',
            icon: 'fas fa-ellipsis-h',
            subcategories: ['Gastos varios', 'Regalos', 'Donaciones']
        }
    },

    // Configuración de tipos de cuenta bancaria
    accountTypes: {
        checking: {
            name: 'Cuenta Corriente',
            icon: 'fas fa-university',
            color: '#007aff'
        },
        savings: {
            name: 'Cuenta de Ahorros',
            icon: 'fas fa-piggy-bank',
            color: '#34c759'
        },
        credit: {
            name: 'Tarjeta de Crédito',
            icon: 'fas fa-credit-card',
            color: '#ff9500'
        },
        investment: {
            name: 'Cuenta de Inversión',
            icon: 'fas fa-chart-line',
            color: '#5856d6'
        }
    },

    // Configuración de estados de cuenta
    accountStatus: {
        active: {
            name: 'Activa',
            color: '#28a745'
        },
        inactive: {
            name: 'Inactiva',
            color: '#6c757d'
        },
        suspended: {
            name: 'Suspendida',
            color: '#ffc107'
        },
        closed: {
            name: 'Cerrada',
            color: '#dc3545'
        }
    }
};

// Configuración global
window.isDevelopment = JMBudgetConfig.development.enabled;
window.DEFAULT_CURRENCY = JMBudgetConfig.app.defaultCurrency;
window.EXCHANGE_RATES = JMBudgetConfig.app.exchangeRates;

// Configuración de Chart.js
window.chartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                    size: 12
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#007aff',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true
        }
    }
};

// Configuración de colores para gráficos
window.chartColors = {
    primary: '#007aff',
    secondary: '#34c759',
    warning: '#ff9500',
    danger: '#ff3b30',
    info: '#5856d6',
    light: '#8e8e93',
    dark: '#1c1c1e',
    success: '#28a745',
    muted: '#6c757d'
};

console.log('✅ Configuración de JM Budget cargada correctamente'); 