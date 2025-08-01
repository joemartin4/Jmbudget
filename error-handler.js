/**
 * Manejador de Errores Avanzado para JM Budget
 * Proporciona manejo robusto de errores, logging y recuperación
 */

// Clase para manejo de errores
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.retryAttempts = new Map();
        this.errorCallbacks = new Map();
        
        this.initialize();
    }
    
    initialize() {
        // Capturar errores globales
        window.addEventListener('error', (event) => {
            this.handleError(event.error || new Error(event.message), {
                type: 'runtime',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        // Capturar promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                type: 'promise',
                promise: event.promise
            });
        });
        
        // Capturar errores de recursos
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError(new Error(`Error loading resource: ${event.target.src || event.target.href}`), {
                    type: 'resource',
                    element: event.target
                });
            }
        }, true);
        
        console.log('✅ Manejador de errores inicializado');
    }
    
    // Manejar error
    handleError(error, context = {}) {
        const errorInfo = {
            message: error.message || 'Unknown error',
            stack: error.stack,
            type: context.type || 'unknown',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            context: context
        };
        
        // Agregar al log
        this.addToLog(errorInfo);
        
        // Determinar severidad
        const severity = this.determineSeverity(errorInfo);
        
        // Ejecutar callbacks registrados
        this.executeCallbacks(errorInfo, severity);
        
        // Intentar recuperación automática
        this.attemptRecovery(errorInfo, severity);
        
        // Mostrar notificación al usuario si es necesario
        this.showUserNotification(errorInfo, severity);
        
        // Log en consola
        this.logToConsole(errorInfo, severity);
        
        return errorInfo;
    }
    
    // Determinar severidad del error
    determineSeverity(errorInfo) {
        const criticalKeywords = ['syntax', 'reference', 'type', 'network'];
        const highKeywords = ['storage', 'validation', 'auth'];
        const mediumKeywords = ['timeout', 'resource'];
        
        const message = errorInfo.message.toLowerCase();
        const type = errorInfo.type.toLowerCase();
        
        if (criticalKeywords.some(keyword => message.includes(keyword) || type.includes(keyword))) {
            return 'critical';
        } else if (highKeywords.some(keyword => message.includes(keyword) || type.includes(keyword))) {
            return 'high';
        } else if (mediumKeywords.some(keyword => message.includes(keyword) || type.includes(keyword))) {
            return 'medium';
        } else {
            return 'low';
        }
    }
    
    // Agregar error al log
    addToLog(errorInfo) {
        this.errorLog.push(errorInfo);
        
        // Mantener tamaño del log
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }
        
        // Guardar en localStorage
        this.persistErrorLog();
    }
    
    // Persistir log de errores
    persistErrorLog() {
        try {
            const logData = {
                errors: this.errorLog.slice(-20), // Solo los últimos 20 errores
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };
            
            localStorage.setItem('jm_budget_error_log', JSON.stringify(logData));
        } catch (error) {
            console.warn('No se pudo persistir el log de errores:', error);
        }
    }
    
    // Cargar log de errores
    loadErrorLog() {
        try {
            const logData = localStorage.getItem('jm_budget_error_log');
            if (logData) {
                const parsed = JSON.parse(logData);
                if (parsed.errors && Array.isArray(parsed.errors)) {
                    this.errorLog = parsed.errors;
                }
            }
        } catch (error) {
            console.warn('No se pudo cargar el log de errores:', error);
        }
    }
    
    // Ejecutar callbacks registrados
    executeCallbacks(errorInfo, severity) {
        const callbacks = this.errorCallbacks.get(severity) || [];
        callbacks.forEach(callback => {
            try {
                callback(errorInfo);
            } catch (callbackError) {
                console.error('Error en callback de manejo de errores:', callbackError);
            }
        });
    }
    
    // Intentar recuperación automática
    attemptRecovery(errorInfo, severity) {
        if (severity === 'critical') {
            // Para errores críticos, intentar recargar la página
            this.retryWithBackoff(() => {
                window.location.reload();
            }, 'page_reload');
        } else if (severity === 'high') {
            // Para errores altos, intentar reinicializar componentes
            this.retryWithBackoff(() => {
                this.reinitializeComponents();
            }, 'component_reinit');
        }
    }
    
    // Reintentar con backoff exponencial
    retryWithBackoff(action, actionName) {
        const attempts = this.retryAttempts.get(actionName) || 0;
        const maxAttempts = 3;
        
        if (attempts >= maxAttempts) {
            console.error(`Máximo de intentos alcanzado para: ${actionName}`);
            return;
        }
        
        this.retryAttempts.set(actionName, attempts + 1);
        
        const delay = Math.pow(2, attempts) * 1000; // 1s, 2s, 4s
        
        setTimeout(() => {
            try {
                action();
                this.retryAttempts.delete(actionName); // Reset en éxito
            } catch (error) {
                console.error(`Error en reintento ${attempts + 1} para ${actionName}:`, error);
            }
        }, delay);
    }
    
    // Reinicializar componentes
    reinitializeComponents() {
        console.log('🔄 Reinicializando componentes...');
        
        // Reinicializar datos
        if (typeof loadDataSafely === 'function') {
            loadDataSafely();
        }
        
        // Reinicializar UI
        if (typeof updateUI === 'function') {
            updateUI(true);
        }
        
        // Reinicializar gráficos
        if (typeof updateCharts === 'function') {
            updateCharts();
        }
        
        console.log('✅ Componentes reinicializados');
    }
    
    // Mostrar notificación al usuario
    showUserNotification(errorInfo, severity) {
        if (severity === 'critical' || severity === 'high') {
            const message = this.getUserFriendlyMessage(errorInfo);
            
            if (typeof showNotification === 'function') {
                showNotification(message, 'error');
            } else {
                // Fallback básico
                alert(`Error: ${message}`);
            }
        }
    }
    
    // Obtener mensaje amigable para el usuario
    getUserFriendlyMessage(errorInfo) {
        const message = errorInfo.message.toLowerCase();
        
        if (message.includes('network') || message.includes('fetch')) {
            return 'Error de conexión. Verifica tu conexión a internet.';
        } else if (message.includes('storage') || message.includes('localstorage')) {
            return 'Error de almacenamiento. Los datos pueden no guardarse correctamente.';
        } else if (message.includes('syntax') || message.includes('reference')) {
            return 'Error interno de la aplicación. La página se recargará automáticamente.';
        } else if (message.includes('auth') || message.includes('login')) {
            return 'Error de autenticación. Por favor, inicia sesión nuevamente.';
        } else {
            return 'Ha ocurrido un error inesperado.';
        }
    }
    
    // Log en consola
    logToConsole(errorInfo, severity) {
        const logMethod = severity === 'critical' ? 'error' : 
                         severity === 'high' ? 'warn' : 'log';
        
        console[logMethod](`[${severity.toUpperCase()}] ${errorInfo.message}`, {
            type: errorInfo.type,
            timestamp: errorInfo.timestamp,
            context: errorInfo.context
        });
    }
    
    // Registrar callback para un tipo de error
    onError(severity, callback) {
        if (!this.errorCallbacks.has(severity)) {
            this.errorCallbacks.set(severity, []);
        }
        this.errorCallbacks.get(severity).push(callback);
    }
    
    // Obtener estadísticas de errores
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            bySeverity: {},
            byType: {},
            recent: this.errorLog.slice(-10)
        };
        
        this.errorLog.forEach(error => {
            // Contar por severidad
            const severity = this.determineSeverity(error);
            stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
            
            // Contar por tipo
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        });
        
        return stats;
    }
    
    // Limpiar log de errores
    clearErrorLog() {
        this.errorLog = [];
        this.retryAttempts.clear();
        localStorage.removeItem('jm_budget_error_log');
        console.log('🗑️ Log de errores limpiado');
    }
    
    // Exportar log de errores
    exportErrorLog() {
        const exportData = {
            errors: this.errorLog,
            stats: this.getErrorStats(),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-log-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Función para envolver funciones con manejo de errores
function withErrorHandling(fn, context = {}) {
    return function(...args) {
        try {
            return fn.apply(this, args);
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handleError(error, {
                    type: 'function',
                    functionName: fn.name || 'anonymous',
                    context: context
                });
            }
            throw error;
        }
    };
}

// Función para manejar errores asíncronos
function withAsyncErrorHandling(fn, context = {}) {
    return async function(...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handleError(error, {
                    type: 'async_function',
                    functionName: fn.name || 'anonymous',
                    context: context
                });
            }
            throw error;
        }
    };
}

// Función para validar datos
function validateData(data, schema) {
    const errors = [];
    
    for (const [key, rules] of Object.entries(schema)) {
        const value = data[key];
        
        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`Campo requerido faltante: ${key}`);
        }
        
        if (value !== undefined && value !== null) {
            if (rules.type && typeof value !== rules.type) {
                errors.push(`Tipo incorrecto para ${key}: esperado ${rules.type}, obtenido ${typeof value}`);
            }
            
            if (rules.min && value < rules.min) {
                errors.push(`Valor mínimo no alcanzado para ${key}: ${value} < ${rules.min}`);
            }
            
            if (rules.max && value > rules.max) {
                errors.push(`Valor máximo excedido para ${key}: ${value} > ${rules.max}`);
            }
            
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(`Formato incorrecto para ${key}`);
            }
        }
    }
    
    if (errors.length > 0) {
        const error = new Error('Validación de datos fallida');
        error.validationErrors = errors;
        throw error;
    }
    
    return true;
}

// Función para manejar errores de red
function handleNetworkError(error, retryFn = null) {
    if (window.errorHandler) {
        window.errorHandler.handleError(error, {
            type: 'network',
            retryFunction: retryFn ? retryFn.name : null
        });
    }
    
    if (retryFn && typeof retryFn === 'function') {
        return window.errorHandler.retryWithBackoff(retryFn, 'network_retry');
    }
}

// Inicializar manejador de errores global
let errorHandler;

// Función de inicialización
function initializeErrorHandler() {
    console.log('🛡️ Inicializando manejador de errores...');
    
    errorHandler = new ErrorHandler();
    window.errorHandler = errorHandler;
    
    // Cargar log existente
    errorHandler.loadErrorLog();
    
    // Registrar callbacks por defecto
    errorHandler.onError('critical', (errorInfo) => {
        console.error('Error crítico detectado:', errorInfo);
    });
    
    errorHandler.onError('high', (errorInfo) => {
        console.warn('Error alto detectado:', errorInfo);
    });
    
    console.log('✅ Manejador de errores inicializado');
    
    return errorHandler;
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ErrorHandler,
        withErrorHandling,
        withAsyncErrorHandling,
        validateData,
        handleNetworkError,
        initializeErrorHandler
    };
} else {
    window.ErrorHandler = ErrorHandler;
    window.withErrorHandling = withErrorHandling;
    window.withAsyncErrorHandling = withAsyncErrorHandling;
    window.validateData = validateData;
    window.handleNetworkError = handleNetworkError;
    window.initializeErrorHandler = initializeErrorHandler;
} 