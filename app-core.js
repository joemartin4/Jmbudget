// ===== JM Budget - Núcleo de la Aplicación =====

// Variables globales de la aplicación
window.appState = {
    // Datos principales
    categories: [],
    transactions: [],
    categoryGroups: {},
    currentUser: null,
    
    // Datos adicionales
    incomes: [],
    goals: [],
    notifications: [],
    bankAccounts: [],
    bankTransactions: [],
    reconciliationData: {},
    
    // Estado de la aplicación
    isInitialized: false,
    isLoading: false,
    currentTab: 'reportes',
    currentMonth: new Date().toISOString().slice(0, 7),
    
    // Configuración
    theme: 'light',
    autoSync: true,
    notificationsEnabled: true
};

// Inicialización de la aplicación
class JMBudgetApp {
    constructor() {
        this.isInitialized = false;
        this.eventListeners = new Map();
        this.debouncedFunctions = new Map();
    }

    // Inicializar la aplicación
    async initialize() {
        try {
            console.log('🚀 Iniciando JM Budget...');
            
            // Cargar configuración
            this.loadConfiguration();
            
            // Migrar datos antiguos si es necesario
            this.migrateOldData();
            
            // Cargar datos del usuario
            await this.loadUserData();
            
            // Inicializar componentes
            this.initializeComponents();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Actualizar UI
            this.updateUI();
            
            // Marcar como inicializada
            this.isInitialized = true;
            window.appState.isInitialized = true;
            
            console.log('✅ JM Budget inicializado correctamente');
            
            // Mostrar notificación de bienvenida
            if (window.appState.currentUser) {
                NotificationUtils.show(`¡Bienvenido de vuelta, ${window.appState.currentUser}!`, 'success');
            }
            
        } catch (error) {
            console.error('❌ Error al inicializar JM Budget:', error);
            NotificationUtils.show('Error al inicializar la aplicación', 'error');
        }
    }

    // Cargar configuración
    loadConfiguration() {
        // Cargar tema
        const savedTheme = localStorage.getItem('jmBudget_theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else if (JMBudgetConfig.themes.autoDetect) {
            this.setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        }

        // Cargar configuración de sincronización
        const syncConfig = localStorage.getItem('syncConfig');
        if (syncConfig) {
            try {
                const config = JSON.parse(syncConfig);
                window.appState.autoSync = config.autoSync !== false;
            } catch (error) {
                console.warn('Error al cargar configuración de sincronización:', error);
            }
        }
    }

    // Migrar datos antiguos
    migrateOldData() {
        console.log('🔄 Verificando migración de datos...');
        
        const oldKeys = [
            'budgetCategories', 'budgetTransactions', 'budgetCategoryGroups',
            'incomes', 'notifications', 'goals', 'bankAccounts'
        ];
        
        oldKeys.forEach(oldKey => {
            const oldData = localStorage.getItem(oldKey);
            if (oldData) {
                const newKey = StorageUtils.getKey(oldKey);
                localStorage.setItem(newKey, oldData);
                localStorage.removeItem(oldKey);
                console.log(`✅ Migrado: ${oldKey} → ${newKey}`);
            }
        });
    }

    // Cargar datos del usuario
    async loadUserData() {
        try {
            // Intentar cargar usuario actual
            const userData = localStorage.getItem('jm_budget_user_data');
            if (userData) {
                const user = JSON.parse(userData);
                window.appState.currentUser = user.email;
                window.currentUser = user.email;
            }

            // Cargar datos principales
            window.appState.categories = StorageUtils.load('categories', []);
            window.appState.transactions = StorageUtils.load('transactions', []);
            window.appState.categoryGroups = StorageUtils.load('categoryGroups', {});
            
            // Cargar datos adicionales
            window.appState.incomes = StorageUtils.load('incomes', []);
            window.appState.goals = StorageUtils.load('goals', []);
            window.appState.notifications = StorageUtils.load('notifications', []);
            window.appState.bankAccounts = StorageUtils.load('bankAccounts', []);
            window.appState.bankTransactions = StorageUtils.load('bankTransactions', []);
            window.appState.reconciliationData = StorageUtils.load('reconciliationData', {});

            // Validar datos
            this.validateData();
            
            // Inicializar categorías por defecto si no existen
            if (Object.keys(window.appState.categoryGroups).length === 0) {
                this.initializeDefaultCategories();
            }

            console.log('📊 Datos cargados:', {
                categories: window.appState.categories.length,
                transactions: window.appState.transactions.length,
                categoryGroups: Object.keys(window.appState.categoryGroups).length,
                incomes: window.appState.incomes.length,
                goals: window.appState.goals.length,
                notifications: window.appState.notifications.length,
                bankAccounts: window.appState.bankAccounts.length
            });

        } catch (error) {
            console.error('Error al cargar datos:', error);
            throw error;
        }
    }

    // Validar datos
    validateData() {
        // Validar arrays
        if (!Array.isArray(window.appState.categories)) window.appState.categories = [];
        if (!Array.isArray(window.appState.transactions)) window.appState.transactions = [];
        if (!Array.isArray(window.appState.incomes)) window.appState.incomes = [];
        if (!Array.isArray(window.appState.goals)) window.appState.goals = [];
        if (!Array.isArray(window.appState.notifications)) window.appState.notifications = [];
        if (!Array.isArray(window.appState.bankAccounts)) window.appState.bankAccounts = [];
        if (!Array.isArray(window.appState.bankTransactions)) window.appState.bankTransactions = [];

        // Validar objetos
        if (typeof window.appState.categoryGroups !== 'object' || window.appState.categoryGroups === null) {
            window.appState.categoryGroups = {};
        }
        if (typeof window.appState.reconciliationData !== 'object' || window.appState.reconciliationData === null) {
            window.appState.reconciliationData = {};
        }
    }

    // Inicializar categorías por defecto
    initializeDefaultCategories() {
        console.log('📝 Inicializando categorías por defecto...');
        
        window.appState.categoryGroups = { ...JMBudgetConfig.defaultCategories };
        
        // Crear categorías en el array
        Object.entries(JMBudgetConfig.defaultCategories).forEach(([categoryName, config]) => {
            const category = {
                id: Date.now() + Math.random(),
                name: categoryName,
                color: config.color,
                icon: config.icon,
                budget: 0,
                spent: 0,
                subcategories: config.subcategories,
                createdAt: new Date().toISOString()
            };
            
            window.appState.categories.push(category);
        });

        this.saveData();
        console.log('✅ Categorías por defecto inicializadas');
    }

    // Inicializar componentes
    initializeComponents() {
        // Inicializar tema
        this.initializeTheme();
        
        // Inicializar navegación
        this.initializeNavigation();
        
        // Inicializar formularios
        this.initializeForms();
        
        // Inicializar gráficos
        this.initializeCharts();
        
        // Inicializar notificaciones
        this.initializeNotifications();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Event listeners de navegación
        this.addEventListeners('tab-navigation', 'click', '.tab-btn', (e) => {
            const tabName = e.target.closest('.tab-btn').dataset.tab;
            this.switchTab(tabName);
        });

        // Event listeners de formularios
        this.addEventListeners('transactionForm', 'submit', null, this.handleTransactionSubmit.bind(this));
        this.addEventListeners('categoryForm', 'submit', null, this.handleCategorySubmit.bind(this));
        this.addEventListeners('incomeForm', 'submit', null, this.handleIncomeSubmit.bind(this));
        this.addEventListeners('goalForm', 'submit', null, this.handleGoalSubmit.bind(this));

        // Event listeners de modales
        this.addEventListeners('document', 'click', '.close', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                this.closeModal(modal.id);
            }
        });

        // Event listeners de botones
        this.addEventListeners('document', 'click', '[data-action]', (e) => {
            const action = e.target.dataset.action;
            this.handleAction(action, e.target);
        });

        // Event listeners de filtros
        this.addEventListeners('document', 'change', '.filter-select', (e) => {
            this.handleFilterChange(e.target);
        });

        // Event listeners de teclado
        this.addEventListeners('document', 'keydown', null, (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Event listeners de resize
        this.addEventListeners('window', 'resize', null, PerformanceUtils.debounce(() => {
            this.handleResize();
        }, 250));
    }

    // Agregar event listeners con delegación
    addEventListeners(selector, event, childSelector, handler) {
        const element = selector === 'document' ? document : 
                       selector === 'window' ? window : 
                       document.querySelector(selector);
        
        if (!element) return;

        const wrappedHandler = (e) => {
            if (childSelector) {
                const target = e.target.closest(childSelector);
                if (target) {
                    handler.call(target, e);
                }
            } else {
                handler.call(element, e);
            }
        };

        element.addEventListener(event, wrappedHandler);
        
        // Guardar referencia para limpieza
        if (!this.eventListeners.has(selector)) {
            this.eventListeners.set(selector, []);
        }
        this.eventListeners.get(selector).push({ event, handler: wrappedHandler });
    }

    // Cambiar pestaña
    switchTab(tabName) {
        if (window.appState.currentTab === tabName) return;

        // Remover clase active de todas las pestañas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Activar pestaña seleccionada
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(tabName);
        
        if (activeBtn && activeContent) {
            activeBtn.classList.add('active');
            activeContent.classList.add('active');
            window.appState.currentTab = tabName;
            
            // Actualizar contenido específico de la pestaña
            this.updateTabContent(tabName);
        }
    }

    // Actualizar contenido de pestaña
    updateTabContent(tabName) {
        switch (tabName) {
            case 'reportes':
                this.updateReports();
                break;
            case 'presupuesto':
                this.updateBudget();
                break;
            case 'transacciones':
                this.updateTransactions();
                break;
            case 'estadisticas':
                this.updateStatistics();
                break;
            case 'metas':
                this.updateGoals();
                break;
            case 'bancos':
                this.updateBankAccounts();
                break;
        }
    }

    // Actualizar UI completa
    updateUI() {
        this.updateSummaryCards();
        this.updateTabContent(window.appState.currentTab);
        this.updateNavigation();
        this.updateNotifications();
    }

    // Actualizar tarjetas de resumen
    updateSummaryCards() {
        const currentMonth = window.appState.currentMonth;
        const monthTransactions = window.appState.transactions.filter(t => 
            t.date.startsWith(currentMonth)
        );

        const income = monthTransactions
            .filter(t => t.type === 'ingreso')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const expenses = monthTransactions
            .filter(t => t.type === 'gasto')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const balance = income - expenses;

        // Actualizar elementos
        this.updateElement('monthlyIncome', FormatUtils.currency(income));
        this.updateElement('monthlyExpenses', FormatUtils.currency(expenses));
        this.updateElement('monthlyBalance', FormatUtils.currency(balance));
        
        // Actualizar clases de color
        this.updateElementClass('monthlyIncome', 'amount', 'income');
        this.updateElementClass('monthlyExpenses', 'amount', 'expense');
        this.updateElementClass('monthlyBalance', 'amount', balance >= 0 ? 'income' : 'expense');
    }

    // Actualizar elemento
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    // Actualizar clase de elemento
    updateElementClass(id, baseClass, newClass) {
        const element = document.getElementById(id);
        if (element) {
            element.className = baseClass;
            if (newClass) {
                element.classList.add(newClass);
            }
        }
    }

    // Guardar datos
    saveData() {
        try {
            StorageUtils.save('categories', window.appState.categories);
            StorageUtils.save('transactions', window.appState.transactions);
            StorageUtils.save('categoryGroups', window.appState.categoryGroups);
            StorageUtils.save('incomes', window.appState.incomes);
            StorageUtils.save('goals', window.appState.goals);
            StorageUtils.save('notifications', window.appState.notifications);
            StorageUtils.save('bankAccounts', window.appState.bankAccounts);
            StorageUtils.save('bankTransactions', window.appState.bankTransactions);
            StorageUtils.save('reconciliationData', window.appState.reconciliationData);
            
            return true;
        } catch (error) {
            console.error('Error al guardar datos:', error);
            return false;
        }
    }

    // Establecer tema
    setTheme(theme) {
        if (theme === window.appState.theme) return;

        window.appState.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('jmBudget_theme', theme);
        
        // Actualizar iconos y elementos específicos del tema
        this.updateThemeElements(theme);
    }

    // Actualizar elementos del tema
    updateThemeElements(theme) {
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.className = `theme-icon fas fa-${theme === 'dark' ? 'sun' : 'moon'}`;
        }
    }

    // Inicializar tema
    initializeTheme() {
        const savedTheme = localStorage.getItem('jmBudget_theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else if (JMBudgetConfig.themes.autoDetect) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? 'dark' : 'light');
        }
    }

    // Inicializar navegación
    initializeNavigation() {
        // Configurar navegación por pestañas
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.closest('.tab-btn').dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Configurar navegación móvil
        if (window.innerWidth <= 768) {
            this.setupMobileNavigation();
        }
    }

    // Configurar navegación móvil
    setupMobileNavigation() {
        const tabNavigation = document.querySelector('.tab-navigation');
        if (tabNavigation) {
            tabNavigation.style.overflowX = 'auto';
            tabNavigation.style.scrollSnapType = 'x mandatory';
        }
    }

    // Inicializar formularios
    initializeForms() {
        // Configurar validación de formularios
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
        });

        // Configurar autocompletado
        this.setupAutocomplete();
    }

    // Validar formulario
    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                this.showFieldError(input, 'Este campo es requerido');
                isValid = false;
            } else {
                this.clearFieldError(input);
            }
        });

        return isValid;
    }

    // Mostrar error de campo
    showFieldError(input, message) {
        this.clearFieldError(input);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = 'var(--danger-color)';
        errorDiv.style.fontSize = 'var(--font-size-xs)';
        errorDiv.style.marginTop = 'var(--spacing-xs)';
        
        input.parentNode.appendChild(errorDiv);
        input.style.borderColor = 'var(--danger-color)';
    }

    // Limpiar error de campo
    clearFieldError(input) {
        const errorDiv = input.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        input.style.borderColor = '';
    }

    // Configurar autocompletado
    setupAutocomplete() {
        // Implementar autocompletado para descripciones de transacciones
        const descriptionInput = document.getElementById('transactionDescription');
        if (descriptionInput) {
            const descriptions = [...new Set(window.appState.transactions.map(t => t.description))];
            
            descriptionInput.addEventListener('input', (e) => {
                const value = e.target.value.toLowerCase();
                const matches = descriptions.filter(d => 
                    d.toLowerCase().includes(value) && value.length > 2
                ).slice(0, 5);
                
                this.showAutocomplete(matches, descriptionInput);
            });
        }
    }

    // Mostrar autocompletado
    showAutocomplete(matches, input) {
        // Remover autocompletado existente
        const existing = document.querySelector('.autocomplete-dropdown');
        if (existing) {
            existing.remove();
        }

        if (matches.length === 0) return;

        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius-md);
            box-shadow: var(--shadow-md);
            z-index: var(--z-dropdown);
            max-height: 200px;
            overflow-y: auto;
        `;

        matches.forEach(match => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = match;
            item.style.cssText = `
                padding: var(--spacing-sm) var(--spacing-md);
                cursor: pointer;
                transition: background-color var(--transition-fast);
            `;
            
            item.addEventListener('click', () => {
                input.value = match;
                dropdown.remove();
            });
            
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = 'var(--bg-tertiary)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = '';
            });
            
            dropdown.appendChild(item);
        });

        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(dropdown);
    }

    // Inicializar gráficos
    initializeCharts() {
        // Configurar Chart.js
        if (typeof Chart !== 'undefined') {
            Chart.defaults.font.family = 'var(--font-family)';
            Chart.defaults.color = 'var(--text-primary)';
            Chart.defaults.plugins.legend.labels.usePointStyle = true;
            Chart.defaults.plugins.tooltip.backgroundColor = 'var(--bg-modal)';
            Chart.defaults.plugins.tooltip.titleColor = 'var(--text-primary)';
            Chart.defaults.plugins.tooltip.bodyColor = 'var(--text-secondary)';
        }
    }

    // Inicializar notificaciones
    initializeNotifications() {
        // Solicitar permisos de notificación
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Configurar notificaciones push
        this.setupPushNotifications();
    }

    // Configurar notificaciones push
    setupPushNotifications() {
        // Implementar notificaciones push si es necesario
        console.log('📱 Notificaciones push configuradas');
    }

    // Manejar resize
    handleResize() {
        if (window.innerWidth <= 768) {
            this.setupMobileNavigation();
        }
    }

    // Cerrar todos los modales
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // Limpiar recursos
    cleanup() {
        // Limpiar event listeners
        this.eventListeners.forEach((listeners, selector) => {
            listeners.forEach(({ event, handler }) => {
                const element = selector === 'document' ? document : 
                               selector === 'window' ? window : 
                               document.querySelector(selector);
                if (element) {
                    element.removeEventListener(event, handler);
                }
            });
        });

        // Limpiar cache
        PerformanceUtils.clearCache();

        console.log('🧹 Recursos limpiados');
    }

    // Métodos de manejo de formularios (delegados a script.js)
    handleTransactionSubmit(e) {
        // Delegar al script principal
        if (typeof handleTransactionSubmit === 'function') {
            return handleTransactionSubmit(e);
        }
        console.warn('⚠️ handleTransactionSubmit no disponible');
    }

    handleCategorySubmit(e) {
        // Delegar al script principal
        if (typeof handleCategorySubmit === 'function') {
            return handleCategorySubmit(e);
        }
        console.warn('⚠️ handleCategorySubmit no disponible');
    }

    handleIncomeSubmit(e) {
        // Delegar al script principal
        if (typeof handleIncomeSubmit === 'function') {
            return handleIncomeSubmit(e);
        }
        console.warn('⚠️ handleIncomeSubmit no disponible');
    }

    handleGoalSubmit(e) {
        // Delegar al script principal
        if (typeof handleGoalSubmit === 'function') {
            return handleGoalSubmit(e);
        }
        console.warn('⚠️ handleGoalSubmit no disponible');
    }

    // Métodos de manejo de acciones
    handleAction(action, element) {
        console.log(`🔧 Acción: ${action}`, element);
        // Implementar manejo de acciones según sea necesario
    }

    handleFilterChange(filter) {
        console.log('🔍 Filtro cambiado:', filter.value);
        // Implementar manejo de filtros según sea necesario
    }

    // Métodos de actualización de contenido
    updateReports() {
        if (typeof updateReports === 'function') {
            updateReports();
        }
    }

    updateBudget() {
        if (typeof updateBudgetForMonth === 'function') {
            updateBudgetForMonth();
        }
    }

    updateTransactions() {
        if (typeof updateGastosIngresosDisplay === 'function') {
            updateGastosIngresosDisplay();
        }
    }

    updateStatistics() {
        if (typeof updateAdvancedReports === 'function') {
            updateAdvancedReports();
        }
    }

    updateGoals() {
        if (typeof updateGoalsDisplay === 'function') {
            updateGoalsDisplay();
        }
    }

    updateBankAccounts() {
        if (typeof updateBankAccountsDisplay === 'function') {
            updateBankAccountsDisplay();
        }
    }
}
}

// Crear instancia global de la aplicación
window.app = new JMBudgetApp();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app.initialize();
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.cleanup();
    }
});

console.log('✅ Núcleo de JM Budget cargado correctamente'); 