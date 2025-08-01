/**
 * Servicio de Notificaciones Avanzado para JM Budget
 * Maneja notificaciones del sistema, recordatorios y alertas
 */

class NotificationService {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 5;
        this.notificationDuration = 5000; // 5 segundos
        this.container = null;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        try {
            console.log('🔔 Inicializando servicio de notificaciones...');
            
            // Esperar a que el DOM esté listo
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.initializeAfterDOMReady();
                });
            } else {
                this.initializeAfterDOMReady();
            }
            
        } catch (error) {
            console.error('❌ Error al inicializar servicio de notificaciones:', error);
        }
    }

    initializeAfterDOMReady() {
        try {
            // Crear contenedor de notificaciones
            this.createNotificationContainer();
            
            // Cargar notificaciones guardadas
            this.loadSavedNotifications();
            
            // Configurar notificaciones del sistema
            this.setupSystemNotifications();
            
            this.isInitialized = true;
            console.log('✅ Servicio de notificaciones inicializado');
            
        } catch (error) {
            console.error('❌ Error al inicializar servicio de notificaciones después del DOM:', error);
        }
    }

    createNotificationContainer() {
        // Crear contenedor si no existe
        if (!document.getElementById('notificationContainer')) {
            const container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            
            // Verificar que document.body esté disponible
            if (document.body) {
                document.body.appendChild(container);
            } else {
                // Si document.body no está disponible, esperar a que el DOM esté listo
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        document.body.appendChild(container);
                    });
                } else {
                    console.warn('⚠️ document.body no disponible para crear contenedor de notificaciones');
                    return;
                }
            }
        }
        
        this.container = document.getElementById('notificationContainer');
    }

    show(message, type = 'info', options = {}) {
        const notification = {
            id: this.generateId(),
            message,
            type,
            timestamp: new Date(),
            read: false,
            ...options
        };

        // Agregar a la lista
        this.notifications.unshift(notification);
        
        // Limitar número de notificaciones
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }

        // Mostrar en UI
        this.displayNotification(notification);
        
        // Guardar en localStorage
        this.saveNotifications();
        
        // Notificación del sistema si está permitido
        if (options.systemNotification !== false) {
            this.showSystemNotification(message, type);
        }

        return notification.id;
    }

    displayNotification(notification) {
        // Verificar que el contenedor esté disponible
        if (!this.container) {
            console.warn('⚠️ Contenedor de notificaciones no disponible');
            return;
        }

        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.id = `notification-${notification.id}`;
        
        const icon = this.getIconForType(notification.type);
        const time = this.formatTime(notification.timestamp);
        
        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-text">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${time}</div>
                </div>
                <button class="notification-close" onclick="notificationService.dismiss('${notification.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-progress"></div>
        `;

        // Agregar al contenedor
        this.container.appendChild(element);

        // Animación de entrada
        setTimeout(() => {
            element.classList.add('show');
        }, 10);

        // Auto-dismiss después del tiempo especificado
        if (notification.duration !== 0) {
            const duration = notification.duration || this.notificationDuration;
            setTimeout(() => {
                this.dismiss(notification.id);
            }, duration);
        }

        // Barra de progreso
        if (notification.duration !== 0) {
            const progressBar = element.querySelector('.notification-progress');
            const duration = notification.duration || this.notificationDuration;
            
            progressBar.style.transition = `width ${duration}ms linear`;
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 10);
        }
    }

    dismiss(notificationId) {
        const element = document.getElementById(`notification-${notificationId}`);
        if (element) {
            element.classList.add('hiding');
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }

        // Remover de la lista
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.saveNotifications();
    }

    dismissAll() {
        this.notifications.forEach(notification => {
            this.dismiss(notification.id);
        });
    }

    getIconForType(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
            sync: '<i class="fas fa-sync-alt"></i>',
            budget: '<i class="fas fa-chart-pie"></i>',
            reminder: '<i class="fas fa-bell"></i>'
        };
        return icons[type] || icons.info;
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        
        if (diff < 60000) { // Menos de 1 minuto
            return 'Ahora';
        } else if (diff < 3600000) { // Menos de 1 hora
            const minutes = Math.floor(diff / 60000);
            return `Hace ${minutes} min`;
        } else if (diff < 86400000) { // Menos de 1 día
            const hours = Math.floor(diff / 3600000);
            return `Hace ${hours} h`;
        } else {
            return timestamp.toLocaleDateString();
        }
    }

    generateId() {
        return 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    saveNotifications() {
        try {
            const notificationsToSave = this.notifications.map(n => ({
                ...n,
                timestamp: n.timestamp.toISOString()
            }));
            localStorage.setItem('notifications', JSON.stringify(notificationsToSave));
        } catch (error) {
            console.error('Error al guardar notificaciones:', error);
        }
    }

    loadSavedNotifications() {
        try {
            const saved = localStorage.getItem('notifications');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.notifications = parsed.map(n => ({
                    ...n,
                    timestamp: new Date(n.timestamp)
                }));
            }
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
        }
    }

    setupSystemNotifications() {
        // Configurar notificaciones del sistema sin solicitar permisos automáticamente
        if ('Notification' in window) {
            console.log('🔔 Notificaciones del sistema disponibles');
            console.log('📋 Estado de permisos:', Notification.permission);
            
            // Solo mostrar información, no solicitar permisos automáticamente
            if (Notification.permission === 'default') {
                console.log('ℹ️ Los permisos de notificación se solicitarán cuando el usuario interactúe');
                this.showNotificationPermissionButton();
            } else if (Notification.permission === 'granted') {
                console.log('✅ Permisos de notificación concedidos');
                this.hideNotificationPermissionButton();
            } else if (Notification.permission === 'denied') {
                console.log('❌ Permisos de notificación denegados');
                this.hideNotificationPermissionButton();
            }
        } else {
            console.log('⚠️ Notificaciones del sistema no disponibles');
            this.hideNotificationPermissionButton();
        }
    }
    
    showNotificationPermissionButton() {
        const btn = document.getElementById('requestNotificationPermissionBtn');
        if (btn) {
            btn.style.display = 'flex';
        }
    }
    
    hideNotificationPermissionButton() {
        const btn = document.getElementById('requestNotificationPermissionBtn');
        if (btn) {
            btn.style.display = 'none';
        }
    }

    requestNotificationPermission() {
        // Solicitar permisos de notificación solo cuando el usuario haga clic
        if ('Notification' in window && Notification.permission === 'default') {
            return Notification.requestPermission().then(permission => {
                console.log('🔔 Permiso de notificación:', permission);
                return permission;
            });
        } else if (Notification.permission === 'granted') {
            return Promise.resolve('granted');
        } else {
            return Promise.resolve('denied');
        }
    }

    showSystemNotification(message, type = 'info') {
        if ('Notification' in window && Notification.permission === 'granted') {
            const title = 'JM Budget';
            const options = {
                body: message,
                icon: '/manifest.json',
                badge: '/manifest.json',
                tag: 'jm-budget-notification'
            };

            new Notification(title, options);
        }
    }

    // Métodos de conveniencia para diferentes tipos de notificaciones
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    sync(message, options = {}) {
        return this.show(message, 'sync', options);
    }

    budget(message, options = {}) {
        return this.show(message, 'budget', options);
    }

    reminder(message, options = {}) {
        return this.show(message, 'reminder', options);
    }

    // Métodos para notificaciones específicas de la aplicación
    showBudgetAlert(category, amount, limit) {
        const percentage = (amount / limit) * 100;
        let message, type;
        
        if (percentage >= 100) {
            message = `¡Has excedido el presupuesto de ${category}!`;
            type = 'error';
        } else if (percentage >= 80) {
            message = `Cuidado: ${category} al ${percentage.toFixed(0)}% del presupuesto`;
            type = 'warning';
        } else {
            return; // No mostrar notificación si está por debajo del 80%
        }

        this.show(message, type, {
            duration: 8000,
            systemNotification: true
        });
    }

    showSyncStatus(status, details = '') {
        const messages = {
            'syncing': 'Sincronizando datos...',
            'synced': 'Datos sincronizados correctamente',
            'error': 'Error en la sincronización',
            'offline': 'Sin conexión - sincronización pendiente'
        };

        const message = details || messages[status] || status;
        this.sync(message, { duration: 3000 });
    }

    showTransactionAdded(amount, category) {
        this.success(`Transacción agregada: $${amount.toFixed(2)} en ${category}`, {
            duration: 3000
        });
    }

    showIncomeAdded(amount, source) {
        this.success(`Ingreso agregado: $${amount.toFixed(2)} de ${source}`, {
            duration: 3000
        });
    }

    // Métodos para recordatorios
    scheduleReminder(message, time) {
        const reminder = {
            id: this.generateId(),
            message,
            scheduledTime: time,
            type: 'reminder'
        };

        // Guardar recordatorio
        const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        reminders.push(reminder);
        localStorage.setItem('reminders', JSON.stringify(reminders));

        // Programar notificación
        const delay = time.getTime() - Date.now();
        if (delay > 0) {
            setTimeout(() => {
                this.reminder(message, { systemNotification: true });
            }, delay);
        }
    }

    // Métodos públicos para uso externo
    getNotifications() {
        return this.notifications;
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
        }
    }

    clearAll() {
        this.dismissAll();
        localStorage.removeItem('notifications');
    }
}

// Instancia global del servicio de notificaciones
const notificationService = new NotificationService();

// Exportar para uso global
window.notificationService = notificationService; 