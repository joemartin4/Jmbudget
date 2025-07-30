// Configuración optimizada para Chart.js
(function() {
    'use strict';
    
    // Esperar a que Chart.js esté disponible
    let attempts = 0;
    const maxAttempts = 50; // Máximo 5 segundos (50 * 100ms)
    
    function waitForChartJS() {
        attempts++;
        
        if (typeof Chart !== 'undefined' && Chart.defaults) {
            // Esperar un poco más para asegurar que Chart.js esté completamente inicializado
            setTimeout(() => {
                configureChartJS();
            }, 100);
        } else if (attempts < maxAttempts) {
            setTimeout(waitForChartJS, 100);
        } else {
            console.warn('Chart.js no se pudo cargar después de varios intentos');
        }
    }
    
    function configureChartJS() {
        try {
            // Verificar que Chart.js esté completamente cargado
            if (typeof Chart === 'undefined') {
                console.warn('Chart.js no está disponible');
                return;
            }
            
            // Configuración global de Chart.js
            if (Chart.defaults) {
                // Configuración de fuentes
                if (Chart.defaults.font) {
                    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
                    Chart.defaults.font.size = 12;
                }
                
                if (Chart.defaults.color !== undefined) {
                    Chart.defaults.color = '#333';
                }
                
                if (Chart.defaults.responsive !== undefined) {
                    Chart.defaults.responsive = true;
                }
                
                if (Chart.defaults.maintainAspectRatio !== undefined) {
                    Chart.defaults.maintainAspectRatio = false;
                }
            }
            
            // Configuración para dispositivos móviles
            if (window.innerWidth <= 768) {
                if (Chart.defaults.font) {
                    Chart.defaults.font.size = 10;
                }
                
                if (Chart.defaults.plugins && Chart.defaults.plugins.legend) {
                    if (Chart.defaults.plugins.legend.labels) {
                        Chart.defaults.plugins.legend.labels.boxWidth = 12;
                        Chart.defaults.plugins.legend.labels.padding = 8;
                    }
                    if (Chart.defaults.plugins.legend.position !== undefined) {
                        Chart.defaults.plugins.legend.position = 'bottom';
                    }
                }
            }
            
            // Configuración de animaciones
            if (Chart.defaults.animation) {
                if (Chart.defaults.animation.duration !== undefined) {
                    Chart.defaults.animation.duration = 1000;
                }
                if (Chart.defaults.animation.easing !== undefined) {
                    Chart.defaults.animation.easing = 'easeInOutQuart';
                }
            }
            
            // Configuración de tooltips
            if (Chart.defaults.plugins && Chart.defaults.plugins.tooltip) {
                const tooltip = Chart.defaults.plugins.tooltip;
                if (tooltip.backgroundColor !== undefined) tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                if (tooltip.titleColor !== undefined) tooltip.titleColor = '#fff';
                if (tooltip.bodyColor !== undefined) tooltip.bodyColor = '#fff';
                if (tooltip.borderColor !== undefined) tooltip.borderColor = 'rgba(255, 255, 255, 0.2)';
                if (tooltip.borderWidth !== undefined) tooltip.borderWidth = 1;
                if (tooltip.cornerRadius !== undefined) tooltip.cornerRadius = 8;
                if (tooltip.padding !== undefined) tooltip.padding = 12;
            }
            
            // Configuración de legendas
            if (Chart.defaults.plugins && Chart.defaults.plugins.legend) {
                if (Chart.defaults.plugins.legend.labels) {
                    const labels = Chart.defaults.plugins.legend.labels;
                    if (labels.usePointStyle !== undefined) labels.usePointStyle = true;
                    if (labels.padding !== undefined) labels.padding = 15;
                }
            }
            
            // Configuración de elementos
            if (Chart.defaults.elements) {
                if (Chart.defaults.elements.point) {
                    if (Chart.defaults.elements.point.radius !== undefined) Chart.defaults.elements.point.radius = 4;
                    if (Chart.defaults.elements.point.hoverRadius !== undefined) Chart.defaults.elements.point.hoverRadius = 6;
                }
                if (Chart.defaults.elements.line && Chart.defaults.elements.line.tension !== undefined) {
                    Chart.defaults.elements.line.tension = 0.4;
                }
            }
            
            // Configuración de escalas (compatible con versiones modernas de Chart.js)
            if (Chart.defaults.scales && Chart.defaults.scales.linear) {
                const linear = Chart.defaults.scales.linear;
                if (linear.beginAtZero !== undefined) linear.beginAtZero = true;
                if (linear.grid) {
                    if (linear.grid.color !== undefined) linear.grid.color = 'rgba(0, 0, 0, 0.1)';
                    if (linear.grid.borderColor !== undefined) linear.grid.borderColor = 'rgba(0, 0, 0, 0.1)';
                }
            }
            
            console.log('📊 Chart.js configurado correctamente');
            
        } catch (error) {
            console.warn('Error al configurar Chart.js:', error.message);
        }
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForChartJS);
    } else {
        waitForChartJS();
    }
    
    // También inicializar cuando se cargue la ventana
    window.addEventListener('load', waitForChartJS);
    
})(); 