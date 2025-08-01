/**
 * Configuración de Rendimiento y Optimizaciones para JM Budget
 * Este archivo contiene configuraciones para mejorar el rendimiento y manejo de errores
 */

// Configuración de rendimiento
const PERFORMANCE_CONFIG = {
    // Configuración de debounce
    DEBOUNCE: {
        UI_UPDATE: 300,
        SAVE_DATA: 500,
        SEARCH: 250,
        CHART_UPDATE: 1000
    },
    
    // Configuración de throttling
    THROTTLE: {
        SCROLL: 100,
        RESIZE: 250,
        INPUT: 150
    },
    
    // Configuración de memoria
    MEMORY: {
        MAX_HEAP_SIZE: 50 * 1024 * 1024, // 50MB
        CLEANUP_INTERVAL: 30000, // 30 segundos
        WARNING_THRESHOLD: 0.8 // 80% del límite
    },
    
    // Configuración de cache
    CACHE: {
        DURATION: 5 * 60 * 1000, // 5 minutos
        MAX_SIZE: 100,
        CLEANUP_INTERVAL: 60000 // 1 minuto
    },
    
    // Configuración de lazy loading
    LAZY_LOADING: {
        CHART_THRESHOLD: 0.1,
        IMAGE_THRESHOLD: 0.5,
        MARGIN: '50px'
    },
    
    // Configuración de compresión
    COMPRESSION: {
        ENABLED: true,
        MIN_SIZE: 1000, // Comprimir archivos mayores a 1KB
        ALGORITHM: 'base64'
    },
    
    // Configuración de monitoreo
    MONITORING: {
        ENABLED: true,
        INTERVAL: 10000, // 10 segundos
        LOG_INTERVAL: 60000, // 1 minuto
        ERROR_THRESHOLD: 5
    }
};

// Configuración de manejo de errores
const ERROR_HANDLING_CONFIG = {
    // Tipos de errores
    ERROR_TYPES: {
        NETWORK: 'network',
        STORAGE: 'storage',
        VALIDATION: 'validation',
        RUNTIME: 'runtime',
        SYNTAX: 'syntax'
    },
    
    // Niveles de severidad
    SEVERITY: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    },
    
    // Configuración de reintentos
    RETRY: {
        MAX_ATTEMPTS: 3,
        DELAY: 1000,
        BACKOFF_MULTIPLIER: 2
    },
    
    // Configuración de logging
    LOGGING: {
        ENABLED: true,
        LEVEL: 'warn', // 'debug', 'info', 'warn', 'error'
        PERSIST: true,
        MAX_ENTRIES: 100
    }
};

// Configuración de optimizaciones específicas
const OPTIMIZATION_CONFIG = {
    // Optimizaciones de DOM
    DOM: {
        BATCH_UPDATES: true,
        VIRTUAL_SCROLLING: false,
        ELEMENT_POOLING: true,
        DELEGATION: true
    },
    
    // Optimizaciones de eventos
    EVENTS: {
        DELEGATION: true,
        PASSIVE_LISTENERS: true,
        THROTTLING: true,
        DEBOUNCING: true
    },
    
    // Optimizaciones de datos
    DATA: {
        COMPRESSION: true,
        VALIDATION: true,
        CACHING: true,
        INDEXING: true
    },
    
    // Optimizaciones de renderizado
    RENDERING: {
        LAZY_LOADING: true,
        VIRTUALIZATION: false,
        BATCH_RENDERING: true,
        FRAME_THROTTLING: true
    }
};

// Función para obtener configuración
function getPerformanceConfig() {
    return PERFORMANCE_CONFIG;
}

// Función para obtener configuración de errores
function getErrorHandlingConfig() {
    return ERROR_HANDLING_CONFIG;
}

// Función para obtener configuración de optimizaciones
function getOptimizationConfig() {
    return OPTIMIZATION_CONFIG;
}

// Función para aplicar configuración personalizada
function applyCustomConfig(customConfig) {
    if (customConfig.performance) {
        Object.assign(PERFORMANCE_CONFIG, customConfig.performance);
    }
    
    if (customConfig.errorHandling) {
        Object.assign(ERROR_HANDLING_CONFIG, customConfig.errorHandling);
    }
    
    if (customConfig.optimization) {
        Object.assign(OPTIMIZATION_CONFIG, customConfig.optimization);
    }
    
    console.log('✅ Configuración personalizada aplicada');
}

// Función para verificar compatibilidad del navegador
function checkBrowserCompatibility() {
    const compatibility = {
        localStorage: typeof Storage !== 'undefined',
        serviceWorker: 'serviceWorker' in navigator,
        intersectionObserver: 'IntersectionObserver' in window,
        performance: 'performance' in window,
        memory: 'memory' in performance,
        compression: 'CompressionStream' in window,
        webWorkers: typeof Worker !== 'undefined'
    };
    
    console.log('🔍 Compatibilidad del navegador:', compatibility);
    return compatibility;
}

// Función para detectar capacidades del dispositivo
function detectDeviceCapabilities() {
    const capabilities = {
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isTablet: /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(navigator.userAgent),
        isDesktop: !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)),
        hasTouch: 'ontouchstart' in window,
        hasPointer: 'onpointerdown' in window,
        hasHover: window.matchMedia('(hover: hover)').matches,
        isLowEnd: navigator.hardwareConcurrency <= 2,
        hasFastNetwork: navigator.connection ? navigator.connection.effectiveType === '4g' : true
    };
    
    console.log('📱 Capacidades del dispositivo:', capabilities);
    return capabilities;
}

// Función para ajustar configuración según el dispositivo
function adjustConfigForDevice() {
    const capabilities = detectDeviceCapabilities();
    
    if (capabilities.isMobile || capabilities.isLowEnd) {
        // Configuración optimizada para dispositivos móviles o de bajas prestaciones
        PERFORMANCE_CONFIG.DEBOUNCE.UI_UPDATE = 500;
        PERFORMANCE_CONFIG.DEBOUNCE.SAVE_DATA = 1000;
        PERFORMANCE_CONFIG.MEMORY.MAX_HEAP_SIZE = 25 * 1024 * 1024; // 25MB
        PERFORMANCE_CONFIG.CACHE.DURATION = 2 * 60 * 1000; // 2 minutos
        OPTIMIZATION_CONFIG.DOM.VIRTUAL_SCROLLING = true;
        OPTIMIZATION_CONFIG.RENDERING.VIRTUALIZATION = true;
        
        console.log('📱 Configuración ajustada para dispositivo móvil/bajo rendimiento');
    } else if (capabilities.isDesktop && !capabilities.isLowEnd) {
        // Configuración optimizada para escritorio de alto rendimiento
        PERFORMANCE_CONFIG.DEBOUNCE.UI_UPDATE = 200;
        PERFORMANCE_CONFIG.DEBOUNCE.SAVE_DATA = 300;
        PERFORMANCE_CONFIG.MEMORY.MAX_HEAP_SIZE = 100 * 1024 * 1024; // 100MB
        PERFORMANCE_CONFIG.CACHE.DURATION = 10 * 60 * 1000; // 10 minutos
        
        console.log('🖥️ Configuración ajustada para escritorio de alto rendimiento');
    }
}

// Función para inicializar configuración
function initializePerformanceConfig() {
    console.log('⚙️ Inicializando configuración de rendimiento...');
    
    // Verificar compatibilidad
    const compatibility = checkBrowserCompatibility();
    
    // Detectar capacidades del dispositivo
    const capabilities = detectDeviceCapabilities();
    
    // Ajustar configuración según el dispositivo
    adjustConfigForDevice();
    
    // Aplicar configuraciones personalizadas si existen
    const savedConfig = localStorage.getItem('jm_budget_performance_config');
    if (savedConfig) {
        try {
            const customConfig = JSON.parse(savedConfig);
            applyCustomConfig(customConfig);
        } catch (error) {
            console.warn('Error al cargar configuración personalizada:', error);
        }
    }
    
    console.log('✅ Configuración de rendimiento inicializada');
    
    return {
        compatibility,
        capabilities,
        config: {
            performance: PERFORMANCE_CONFIG,
            errorHandling: ERROR_HANDLING_CONFIG,
            optimization: OPTIMIZATION_CONFIG
        }
    };
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PERFORMANCE_CONFIG,
        ERROR_HANDLING_CONFIG,
        OPTIMIZATION_CONFIG,
        getPerformanceConfig,
        getErrorHandlingConfig,
        getOptimizationConfig,
        applyCustomConfig,
        checkBrowserCompatibility,
        detectDeviceCapabilities,
        adjustConfigForDevice,
        initializePerformanceConfig
    };
} else {
    window.PERFORMANCE_CONFIG = PERFORMANCE_CONFIG;
    window.ERROR_HANDLING_CONFIG = ERROR_HANDLING_CONFIG;
    window.OPTIMIZATION_CONFIG = OPTIMIZATION_CONFIG;
    window.getPerformanceConfig = getPerformanceConfig;
    window.getErrorHandlingConfig = getErrorHandlingConfig;
    window.getOptimizationConfig = getOptimizationConfig;
    window.applyCustomConfig = applyCustomConfig;
    window.checkBrowserCompatibility = checkBrowserCompatibility;
    window.detectDeviceCapabilities = detectDeviceCapabilities;
    window.adjustConfigForDevice = adjustConfigForDevice;
    window.initializePerformanceConfig = initializePerformanceConfig;
} 