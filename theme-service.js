/**
 * Servicio de Temas para JM Budget
 * Maneja modo oscuro/claro y temas personalizados
 */

class ThemeService {
    constructor() {
        this.currentTheme = 'light';
        this.availableThemes = ['light', 'dark', 'auto'];
        this.customColors = {};
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        try {
            console.log('🎨 Inicializando servicio de temas...');
            
            // Cargar configuración guardada
            this.loadThemeConfig();
            
            // Aplicar tema inicial
            this.applyTheme();
            
            // Configurar listener para cambios de preferencia del sistema
            this.setupSystemThemeListener();
            
            this.isInitialized = true;
            console.log('✅ Servicio de temas inicializado');
            
        } catch (error) {
            console.error('❌ Error al inicializar servicio de temas:', error);
        }
    }

    loadThemeConfig() {
        try {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme && this.availableThemes.includes(savedTheme)) {
                this.currentTheme = savedTheme;
            } else {
                // Detectar preferencia del sistema
                this.currentTheme = this.detectSystemTheme();
            }

            // Cargar colores personalizados
            const savedColors = localStorage.getItem('customColors');
            if (savedColors) {
                this.customColors = JSON.parse(savedColors);
            }
            
        } catch (error) {
            console.error('Error al cargar configuración de tema:', error);
        }
    }

    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    setupSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (this.currentTheme === 'auto') {
                    this.applyTheme();
                }
            });
        }
    }

    setTheme(theme) {
        if (!this.availableThemes.includes(theme)) {
            console.error('Tema no válido:', theme);
            return;
        }

        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        this.applyTheme();
        
        // Notificar cambio de tema
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: this.getEffectiveTheme() } 
        }));
    }

    getEffectiveTheme() {
        if (this.currentTheme === 'auto') {
            return this.detectSystemTheme();
        }
        return this.currentTheme;
    }

    applyTheme() {
        const effectiveTheme = this.getEffectiveTheme();
        const root = document.documentElement;
        
        // Remover clases de tema anteriores
        root.classList.remove('theme-light', 'theme-dark');
        
        // Agregar clase del tema actual
        root.classList.add(`theme-${effectiveTheme}`);
        
        // Aplicar variables CSS del tema
        this.applyThemeVariables(effectiveTheme);
        
        // Actualizar meta theme-color
        this.updateMetaThemeColor(effectiveTheme);
        
        console.log(`🎨 Tema aplicado: ${effectiveTheme}`);
    }

    applyThemeVariables(theme) {
        const root = document.documentElement;
        const variables = this.getThemeVariables(theme);
        
        Object.entries(variables).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }

    getThemeVariables(theme) {
        const baseVariables = {
            'light': {
                '--bg-primary': '#ffffff',
                '--bg-secondary': '#f2f2f7',
                '--bg-tertiary': '#e5e5ea',
                '--text-primary': '#1d1d1f',
                '--text-secondary': '#8e8e93',
                '--text-tertiary': '#c7c7cc',
                '--accent-primary': '#007aff',
                '--accent-secondary': '#5856d6',
                '--success': '#34c759',
                '--warning': '#ff9500',
                '--error': '#ff3b30',
                '--border': '#c6c6c8',
                '--shadow': 'rgba(0, 0, 0, 0.1)',
                '--card-bg': '#ffffff',
                '--input-bg': '#ffffff',
                '--modal-bg': '#ffffff',
                '--overlay': 'rgba(0, 0, 0, 0.5)'
            },
            'dark': {
                '--bg-primary': '#000000',
                '--bg-secondary': '#1c1c1e',
                '--bg-tertiary': '#2c2c2e',
                '--text-primary': '#ffffff',
                '--text-secondary': '#8e8e93',
                '--text-tertiary': '#48484a',
                '--accent-primary': '#0a84ff',
                '--accent-secondary': '#5e5ce6',
                '--success': '#30d158',
                '--warning': '#ff9f0a',
                '--error': '#ff453a',
                '--border': '#38383a',
                '--shadow': 'rgba(0, 0, 0, 0.3)',
                '--card-bg': '#1c1c1e',
                '--input-bg': '#2c2c2e',
                '--modal-bg': '#1c1c1e',
                '--overlay': 'rgba(0, 0, 0, 0.7)'
            }
        };

        let variables = baseVariables[theme] || baseVariables['light'];
        
        // Aplicar colores personalizados si existen
        if (this.customColors[theme]) {
            variables = { ...variables, ...this.customColors[theme] };
        }

        return variables;
    }

    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        const colors = {
            'light': '#ffffff',
            'dark': '#000000'
        };

        metaThemeColor.content = colors[theme] || colors['light'];
    }

    setCustomColor(theme, colorName, value) {
        if (!this.customColors[theme]) {
            this.customColors[theme] = {};
        }
        
        this.customColors[theme][`--${colorName}`] = value;
        localStorage.setItem('customColors', JSON.stringify(this.customColors));
        
        // Reaplicar tema si es el actual
        if (this.getEffectiveTheme() === theme) {
            this.applyTheme();
        }
    }

    resetCustomColors(theme = null) {
        if (theme) {
            delete this.customColors[theme];
        } else {
            this.customColors = {};
        }
        
        localStorage.setItem('customColors', JSON.stringify(this.customColors));
        this.applyTheme();
    }

    // Métodos públicos para uso externo
    getCurrentTheme() {
        return this.currentTheme;
    }

    getEffectiveTheme() {
        if (this.currentTheme === 'auto') {
            return this.detectSystemTheme();
        }
        return this.currentTheme;
    }

    isDarkMode() {
        return this.getEffectiveTheme() === 'dark';
    }

    toggleTheme() {
        const current = this.getCurrentTheme();
        const newTheme = current === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    // Métodos para animaciones de transición
    enableTransitions() {
        document.documentElement.style.setProperty('--transition-duration', '0.3s');
    }

    disableTransitions() {
        document.documentElement.style.setProperty('--transition-duration', '0s');
    }

    // Métodos para temas específicos de la aplicación
    applyBudgetTheme() {
        // Tema especial para la sección de presupuestos
        const root = document.documentElement;
        const isDark = this.isDarkMode();
        
        const budgetColors = {
            '--budget-progress-bg': isDark ? '#2c2c2e' : '#f2f2f7',
            '--budget-progress-fill': isDark ? '#30d158' : '#34c759',
            '--budget-warning': isDark ? '#ff9f0a' : '#ff9500',
            '--budget-danger': isDark ? '#ff453a' : '#ff3b30'
        };

        Object.entries(budgetColors).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }

    applyChartTheme() {
        // Tema especial para gráficos
        const isDark = this.isDarkMode();
        
        const chartColors = {
            '--chart-bg': isDark ? '#1c1c1e' : '#ffffff',
            '--chart-text': isDark ? '#ffffff' : '#1d1d1f',
            '--chart-grid': isDark ? '#38383a' : '#e5e5ea',
            '--chart-border': isDark ? '#2c2c2e' : '#f2f2f7'
        };

        const root = document.documentElement;
        Object.entries(chartColors).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }
}

// Instancia global del servicio de temas
const themeService = new ThemeService();

// Exportar para uso global
window.themeService = themeService; 