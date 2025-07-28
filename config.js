// Configuración de JM Budget
const JM_BUDGET_CONFIG = {
    // Información de la aplicación
    APP_NAME: 'JM Budget',
    VERSION: '1.0.0',
    AUTHOR: 'Sistema de Presupuesto Familiar',
    
    // Configuración de almacenamiento
    STORAGE_KEYS: {
        USERS: 'jm_budget_users',
        CURRENT_USER: 'jm_budget_current_user',
        CATEGORIES: 'jm_budget_categories',
        TRANSACTIONS: 'jm_budget_transactions',
        CATEGORY_GROUPS: 'jm_budget_category_groups',
        COLLABORATIONS: 'jm_budget_collaborations',
        INVITATIONS: 'jm_budget_invitations',
        CHANGE_HISTORY: 'jm_budget_change_history',
        IMPORT_DATA: 'jm_budget_import_data'
    },
    
    // Configuración de la interfaz
    UI: {
        DEFAULT_COLORS: [
            '#007aff', '#34c759', '#ff3b30', '#ff9500', '#af52de',
            '#5856d6', '#ff2d92', '#5ac8fa', '#ffcc02', '#4cd964'
        ],
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 300,
        MODAL_Z_INDEX: 1000,
        TOAST_Z_INDEX: 10000
    },
    
    // Configuración de validación
    VALIDATION: {
        MIN_USERNAME_LENGTH: 3,
        MIN_PASSWORD_LENGTH: 4,
        MAX_DESCRIPTION_LENGTH: 100,
        MAX_COMMENT_LENGTH: 500,
        MIN_AMOUNT: 0.01,
        MAX_AMOUNT: 999999.99
    },
    
    // Configuración de importación
    IMPORT: {
        SUPPORTED_FORMATS: ['.csv', '.xlsx', '.xls'],
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        REQUIRED_COLUMNS: ['descripción', 'monto', 'tipo', 'categoría', 'fecha'],
        DATE_FORMATS: ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']
    },
    
    // Configuración de gráficos
    CHARTS: {
        DOUGHNUT_HEIGHT: 300,
        BAR_HEIGHT: 300,
        COLORS: [
            '#007aff', '#34c759', '#ff3b30', '#ff9500', '#af52de',
            '#5856d6', '#ff2d92', '#5ac8fa', '#ffcc02', '#4cd964'
        ]
    },
    
    // Mensajes del sistema
    MESSAGES: {
        SUCCESS: {
            LOGIN: 'Inicio de sesión exitoso',
            REGISTER: 'Registro exitoso',
            SAVE: 'Datos guardados correctamente',
            DELETE: 'Elemento eliminado correctamente',
            IMPORT: 'Datos importados correctamente'
        },
        ERROR: {
            LOGIN_FAILED: 'Usuario o contraseña incorrectos',
            REGISTER_FAILED: 'Error al registrar usuario',
            SAVE_FAILED: 'Error al guardar datos',
            DELETE_FAILED: 'Error al eliminar elemento',
            IMPORT_FAILED: 'Error al importar datos',
            NETWORK_ERROR: 'Error de conexión',
            STORAGE_ERROR: 'Error de almacenamiento'
        },
        WARNING: {
            UNSAVED_CHANGES: 'Tienes cambios sin guardar',
            LARGE_FILE: 'El archivo es muy grande',
            INVALID_FORMAT: 'Formato de archivo no válido'
        }
    },
    
    // Configuración de categorías por defecto
    DEFAULT_CATEGORIES: {
        'Vivienda': {
            color: '#007aff',
            subcategories: ['Alquiler', 'Hipoteca', 'Servicios', 'Mantenimiento', 'Seguro Hogar']
        },
        'Alimentación y Bebidas': {
            color: '#34c759',
            subcategories: ['Supermercado', 'Restaurantes', 'Delivery', 'Café', 'Snacks']
        },
        'Transporte': {
            color: '#ff3b30',
            subcategories: ['Gasolina', 'Transporte Público', 'Taxi/Uber', 'Mantenimiento Auto', 'Seguro Auto']
        },
        'Salud': {
            color: '#ff9500',
            subcategories: ['Médicos', 'Medicamentos', 'Seguro Médico', 'Dentista', 'Óptica']
        },
        'Entretenimiento': {
            color: '#af52de',
            subcategories: ['Cine', 'Deportes', 'Hobbies', 'Videojuegos', 'Libros']
        },
        'Ropa y Accesorios': {
            color: '#5856d6',
            subcategories: ['Vestimenta', 'Calzado', 'Accesorios', 'Joyería', 'Cosméticos']
        },
        'Educación': {
            color: '#ff2d92',
            subcategories: ['Cursos', 'Libros', 'Material Escolar', 'Tecnología', 'Idiomas']
        },
        'Tecnología': {
            color: '#5ac8fa',
            subcategories: ['Dispositivos', 'Software', 'Internet', 'Telefonía', 'Accesorios']
        },
        'Viajes': {
            color: '#ffcc02',
            subcategories: ['Vacaciones', 'Escapadas', 'Transporte', 'Hospedaje', 'Actividades']
        },
        'Seguros': {
            color: '#4cd964',
            subcategories: ['Vida', 'Hogar', 'Auto', 'Salud', 'Viajes']
        },
        'Inversiones': {
            color: '#007aff',
            subcategories: ['Ahorros', 'Fondos', 'Acciones', 'Criptomonedas', 'Bienes Raíces']
        },
        'Deudas': {
            color: '#ff3b30',
            subcategories: ['Tarjetas de Crédito', 'Préstamos', 'Hipoteca', 'Otros Préstamos', 'Pagos Mínimos']
        },
        'Ingresos': {
            color: '#34c759',
            subcategories: ['Salario', 'Freelance', 'Inversiones', 'Negocios', 'Otros Ingresos']
        }
    },
    
    // Configuración de rendimiento
    PERFORMANCE: {
        CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
        MAX_CACHE_SIZE: 100,
        DEBOUNCE_DELAY: 300,
        THROTTLE_DELAY: 100
    },
    
    // Configuración de seguridad
    SECURITY: {
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 horas
        MAX_LOGIN_ATTEMPTS: 5,
        PASSWORD_MIN_LENGTH: 4
    }
};

// Exportar configuración para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JM_BUDGET_CONFIG;
} else {
    window.JM_BUDGET_CONFIG = JM_BUDGET_CONFIG;
} 