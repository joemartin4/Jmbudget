// Utilidades optimizadas para JM Budget

// Cache para optimización de rendimiento
const cache = new Map();
const currencyCache = new Map();

// Utilidades de almacenamiento
const StorageUtils = {
    // Obtener clave de almacenamiento
    getKey(key, user = null) {
        const currentUser = user || window.currentUser || 'anonymous';
        const sanitizedEmail = currentUser.replace(/[^a-zA-Z0-9]/g, '_');
        return `${JMBudgetConfig.storage.prefix}${sanitizedEmail}_${key}`;
    },

    // Guardar datos con validación
    save(key, data) {
        try {
            const storageKey = this.getKey(key);
            const dataToSave = {
                data,
                timestamp: Date.now(),
                version: JMBudgetConfig.app.version
            };
            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
            return true;
        } catch (error) {
            console.error('Error al guardar datos:', error);
            return false;
        }
    },

    // Cargar datos con validación
    load(key, defaultValue = null) {
        try {
            const storageKey = this.getKey(key);
            const stored = localStorage.getItem(storageKey);
            if (!stored) return defaultValue;

            const parsed = JSON.parse(stored);
            return parsed.data || defaultValue;
        } catch (error) {
            console.error('Error al cargar datos:', error);
            return defaultValue;
        }
    },

    // Limpiar datos
    clear(key) {
        try {
            const storageKey = this.getKey(key);
            localStorage.removeItem(storageKey);
            return true;
        } catch (error) {
            console.error('Error al limpiar datos:', error);
            return false;
        }
    },

    // Verificar espacio disponible
    getAvailableSpace() {
        try {
            let used = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(JMBudgetConfig.storage.prefix)) {
                    used += localStorage.getItem(key).length;
                }
            }
            return {
                used,
                available: JMBudgetConfig.storage.maxCacheSize - used
            };
        } catch (error) {
            return { used: 0, available: 0 };
        }
    }
};

// Utilidades de formato
const FormatUtils = {
    // Formatear moneda
    currency(amount, currency = JMBudgetConfig.app.defaultCurrency) {
        const key = `${amount}_${currency}`;
        if (currencyCache.has(key)) {
            return currencyCache.get(key);
        }

        try {
            const formatted = new Intl.NumberFormat('es-DO', {
                style: 'currency',
                currency: currency
            }).format(amount);
            currencyCache.set(key, formatted);
            return formatted;
        } catch (error) {
            return `${currency} ${amount.toFixed(2)}`;
        }
    },

    // Formatear fecha
    date(dateString, format = 'short') {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (format === 'relative') {
                if (diffDays === 1) return 'Ayer';
                if (diffDays === 0) return 'Hoy';
                if (diffDays < 7) return `Hace ${diffDays} días`;
            }

            return date.toLocaleDateString('es-DO', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    },

    // Formatear número
    number(value, decimals = 2) {
        try {
            return new Intl.NumberFormat('es-DO', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(value);
        } catch (error) {
            return value.toFixed(decimals);
        }
    },

    // Formatear porcentaje
    percentage(value, decimals = 1) {
        try {
            return new Intl.NumberFormat('es-DO', {
                style: 'percent',
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(value / 100);
        } catch (error) {
            return `${value.toFixed(decimals)}%`;
        }
    }
};

// Utilidades de validación
const ValidationUtils = {
    // Validar email
    email(email) {
        return JMBudgetConfig.validation.email.test(email);
    },

    // Validar contraseña
    password(password) {
        const config = JMBudgetConfig.validation.password;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLongEnough = password.length >= config.minLength;

        return {
            isValid: isLongEnough && hasUppercase && hasLowercase && hasNumbers,
            score: [isLongEnough, hasUppercase, hasLowercase, hasNumbers, hasSpecialChars]
                .filter(Boolean).length,
            details: {
                length: isLongEnough,
                uppercase: hasUppercase,
                lowercase: hasLowercase,
                numbers: hasNumbers,
                specialChars: hasSpecialChars
            }
        };
    },

    // Validar monto
    amount(amount) {
        const num = parseFloat(amount);
        return !isNaN(num) && num >= 0 && num <= 999999.99;
    },

    // Validar fecha
    date(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }
};

// Utilidades de conversión de moneda
const CurrencyUtils = {
    // Convertir a moneda por defecto
    convertToDefault(amount, fromCurrency) {
        if (!fromCurrency || fromCurrency === JMBudgetConfig.app.defaultCurrency) {
            return amount;
        }
        const rate = JMBudgetConfig.app.exchangeRates[fromCurrency];
        if (!rate) {
            console.warn(`Tasa de cambio no encontrada para ${fromCurrency}`);
            return amount;
        }
        return amount * rate;
    },

    // Obtener moneda de cuenta
    getAccountCurrency(accountId) {
        const account = window.bankAccounts?.find(acc => acc.id === accountId);
        return account?.currency || JMBudgetConfig.app.defaultCurrency;
    },

    // Obtener tasa de cambio
    getExchangeRate(fromCurrency, toCurrency = JMBudgetConfig.app.defaultCurrency) {
        if (fromCurrency === toCurrency) return 1;
        const fromRate = JMBudgetConfig.app.exchangeRates[fromCurrency];
        const toRate = JMBudgetConfig.app.exchangeRates[toCurrency];
        if (!fromRate || !toRate) return 1;
        return fromRate / toRate;
    }
};

// Utilidades de rendimiento
const PerformanceUtils = {
    // Debounce
    debounce(func, delay = JMBudgetConfig.performance.debounceDelay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    // Throttle
    throttle(func, delay = JMBudgetConfig.performance.throttleDelay) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                func.apply(this, args);
            }
        };
    },

    // Memoización
    memoize(func) {
        return function (...args) {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = func.apply(this, args);
            cache.set(key, result);
            return result;
        };
    },

    // Limpiar cache
    clearCache() {
        cache.clear();
        currencyCache.clear();
    }
};

// Utilidades de DOM
const DOMUtils = {
    // Crear elemento
    createElement(tag, className = '', attributes = {}) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
    },

    // Buscar elemento
    find(selector, parent = document) {
        return parent.querySelector(selector);
    },

    // Buscar elementos
    findAll(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    },

    // Mostrar elemento
    show(element) {
        if (element) element.style.display = '';
    },

    // Ocultar elemento
    hide(element) {
        if (element) element.style.display = 'none';
    },

    // Alternar visibilidad
    toggle(element) {
        if (element) {
            element.style.display = element.style.display === 'none' ? '' : 'none';
        }
    },

    // Agregar clase
    addClass(element, className) {
        if (element) element.classList.add(className);
    },

    // Remover clase
    removeClass(element, className) {
        if (element) element.classList.remove(className);
    },

    // Alternar clase
    toggleClass(element, className) {
        if (element) element.classList.toggle(className);
    }
};

// Utilidades de notificaciones
const NotificationUtils = {
    // Mostrar notificación
    show(message, type = 'info', duration = JMBudgetConfig.notifications.duration) {
        if (!JMBudgetConfig.notifications.enabled) return;

        const notification = DOMUtils.createElement('div', `notification notification-${type}`);
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remover
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);

        // Cerrar manualmente
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        }

        return notification;
    },

    // Obtener icono por tipo
    getIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
};

// Utilidades de fecha
const DateUtils = {
    // Obtener fecha actual
    now() {
        return new Date();
    },

    // Obtener primer día del mes
    firstDayOfMonth(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    },

    // Obtener último día del mes
    lastDayOfMonth(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    },

    // Obtener mes anterior
    previousMonth(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth() - 1, 1);
    },

    // Obtener mes siguiente
    nextMonth(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 1);
    },

    // Formatear fecha para input
    formatForInput(date) {
        return date.toISOString().split('T')[0];
    },

    // Calcular diferencia en días
    daysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((date1 - date2) / oneDay));
    }
};

// Utilidades de cálculo
const MathUtils = {
    // Sumar array de números
    sum(numbers) {
        return numbers.reduce((acc, num) => acc + (parseFloat(num) || 0), 0);
    },

    // Calcular promedio
    average(numbers) {
        if (numbers.length === 0) return 0;
        return this.sum(numbers) / numbers.length;
    },

    // Calcular porcentaje
    percentage(part, total) {
        if (total === 0) return 0;
        return (part / total) * 100;
    },

    // Redondear a decimales
    round(value, decimals = 2) {
        return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    },

    // Calcular cambio porcentual
    percentageChange(oldValue, newValue) {
        if (oldValue === 0) return newValue > 0 ? 100 : 0;
        return ((newValue - oldValue) / oldValue) * 100;
    }
};

// Exportar utilidades globales
window.StorageUtils = StorageUtils;
window.FormatUtils = FormatUtils;
window.ValidationUtils = ValidationUtils;
window.CurrencyUtils = CurrencyUtils;
window.PerformanceUtils = PerformanceUtils;
window.DOMUtils = DOMUtils;
window.NotificationUtils = NotificationUtils;
window.DateUtils = DateUtils;
window.MathUtils = MathUtils;

console.log('✅ Utilidades de JM Budget cargadas correctamente'); 