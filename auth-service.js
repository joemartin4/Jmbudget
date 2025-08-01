/**
 * Servicio de Autenticación y Seguridad para JM Budget
 * Implementa autenticación real con Firebase Auth y encriptación de datos
 */

class AuthService {
    constructor() {
        this.currentUser = null;
        this.auth = null;
        this.isInitialized = false;
        this.useLocalMode = false; // Modo local cuando Firebase no está disponible
        this.encryptionKey = null;
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 horas
        this.lastActivity = Date.now();
        
        this.init();
    }

    async init() {
        try {
            console.log('🔧 Inicializando servicio de autenticación...');
            
            // Esperar a que Firebase esté disponible
            let attempts = 0;
            const maxAttempts = 100; // 10 segundos máximo
            
            while ((typeof firebase === 'undefined' || typeof window.FIREBASE_CONFIG === 'undefined') && attempts < maxAttempts) {
                console.log(`⏳ Esperando Firebase... (intento ${attempts + 1}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (typeof firebase === 'undefined' || typeof window.FIREBASE_CONFIG === 'undefined') {
                console.warn('⚠️ Firebase no está disponible, usando modo local');
                this.useLocalMode = true;
                this.isInitialized = true;
                console.log('✅ Servicio de autenticación inicializado en modo local');
                return;
            }
            
            console.log('✅ Firebase está disponible');
            
            // Inicializar Firebase si no está inicializado
            if (!firebase.apps.length) {
                console.log('🚀 Inicializando Firebase App...');
                try {
                    firebase.initializeApp(window.FIREBASE_CONFIG);
                    console.log('✅ Firebase App inicializado correctamente');
                } catch (error) {
                    console.error('❌ Error al inicializar Firebase App:', error);
                    console.warn('⚠️ Cambiando a modo local debido a error de Firebase');
                    this.useLocalMode = true;
                    this.isInitialized = true;
                    console.log('✅ Servicio de autenticación inicializado en modo local');
                    return;
                }
            } else {
                console.log('✅ Firebase App ya está inicializado');
            }

            // Inicializar Firebase Auth
            console.log('🔐 Inicializando Firebase Auth...');
            
            if (!firebase.auth) {
                console.error('❌ Firebase Auth no está disponible');
                return;
            }
            
            this.auth = firebase.auth();
            console.log('✅ Firebase Auth inicializado');
            
            // Configurar listeners de autenticación
            this.auth.onAuthStateChanged((user) => {
                console.log('👤 Estado de autenticación cambiado:', user ? 'Usuario logueado' : 'Usuario desconectado');
                this.handleAuthStateChange(user);
            });

            // Configurar encriptación
            await this.setupEncryption();
            
            // Configurar monitoreo de actividad
            this.setupActivityMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Servicio de autenticación inicializado');
            
        } catch (error) {
            console.error('❌ Error al inicializar servicio de autenticación:', error);
        }
    }

    async setupEncryption() {
        try {
            // Generar o recuperar clave de encriptación
            let storedKey = localStorage.getItem('jm_budget_encryption_key');
            
            if (!storedKey) {
                // Generar nueva clave usando Web Crypto API
                const key = await this.generateEncryptionKey();
                storedKey = await this.exportKey(key);
                localStorage.setItem('jm_budget_encryption_key', storedKey);
            }
            
            this.encryptionKey = await this.importKey(storedKey);
            console.log('🔐 Encriptación configurada');
            
        } catch (error) {
            console.error('❌ Error al configurar encriptación:', error);
        }
    }

    async generateEncryptionKey() {
        return await window.crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    async exportKey(key) {
        const exported = await window.crypto.subtle.exportKey('raw', key);
        return btoa(String.fromCharCode(...new Uint8Array(exported)));
    }

    async importKey(keyString) {
        const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
        return await window.crypto.subtle.importKey(
            'raw',
            keyData,
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    async encrypt(data) {
        if (!this.encryptionKey) {
            throw new Error('Clave de encriptación no disponible');
        }

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(JSON.stringify(data));
        
        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            this.encryptionKey,
            encodedData
        );

        return {
            data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
            iv: btoa(String.fromCharCode(...iv))
        };
    }

    async decrypt(encryptedData) {
        if (!this.encryptionKey) {
            throw new Error('Clave de encriptación no disponible');
        }

        const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
        const data = Uint8Array.from(atob(encryptedData.data), c => c.charCodeAt(0));
        
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            this.encryptionKey,
            data
        );

        return JSON.parse(new TextDecoder().decode(decrypted));
    }

    handleAuthStateChange(user) {
        if (user) {
            this.currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email,
                emailVerified: user.emailVerified,
                lastLogin: new Date().toISOString()
            };
            
            this.updateLastActivity();
            this.saveUserSession();
            console.log('👤 Usuario autenticado:', this.currentUser.displayName);
            
            // Disparar evento de login exitoso
            window.dispatchEvent(new CustomEvent('userLoggedIn', { 
                detail: this.currentUser 
            }));
            
        } else {
            this.currentUser = null;
            this.clearUserSession();
            console.log('👤 Usuario desconectado');
            
            // Disparar evento de logout
            window.dispatchEvent(new CustomEvent('userLoggedOut'));
        }
    }

    setupActivityMonitoring() {
        // Monitorear actividad del usuario
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.updateLastActivity();
            }, { passive: true });
        });

        // Verificar sesión cada minuto
        setInterval(() => {
            this.checkSessionTimeout();
        }, 60000);
    }

    updateLastActivity() {
        this.lastActivity = Date.now();
        if (this.currentUser) {
            localStorage.setItem('jm_budget_last_activity', this.lastActivity.toString());
        }
    }

    checkSessionTimeout() {
        if (!this.currentUser) return;
        
        const timeSinceLastActivity = Date.now() - this.lastActivity;
        
        if (timeSinceLastActivity > this.sessionTimeout) {
            console.log('⏰ Sesión expirada por inactividad');
            this.logout();
            this.showSessionExpiredMessage();
        }
    }

    showSessionExpiredMessage() {
        const message = 'Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.';
        if (typeof showNotification === 'function') {
            showNotification(message, 'warning');
        } else {
            alert(message);
        }
    }

    // Métodos de autenticación
    async register(email, password, displayName = null) {
        try {
            console.log('🔐 Iniciando registro de usuario:', { email, displayName });
            
            this.validatePassword(password);
            this.validateEmail(email);
            
            // Si estamos en modo local, simular registro
            if (this.useLocalMode) {
                console.log('🏠 Registrando usuario en modo local...');
                
                // Verificar si el usuario ya existe
                const existingUsers = JSON.parse(localStorage.getItem('localUsers') || '{}');
                if (existingUsers[email]) {
                    throw new Error('Ya existe una cuenta con este email');
                }
                
                // Crear usuario local
                const newUser = {
                    uid: 'local_' + Date.now(),
                    email: email,
                    displayName: displayName || email,
                    emailVerified: true,
                    createdAt: new Date().toISOString()
                };
                
                // Guardar usuario
                existingUsers[email] = {
                    ...newUser,
                    password: await this.hashPassword(password) // En producción, usar bcrypt
                };
                localStorage.setItem('localUsers', JSON.stringify(existingUsers));
                
                console.log('✅ Usuario registrado exitosamente en modo local');
                return { success: true, user: newUser };
            }
            
            // Verificar que Firebase Auth esté disponible
            if (!this.auth) {
                console.error('❌ Firebase Auth no está inicializado');
                throw new Error('Servicio de autenticación no disponible');
            }
            
            console.log('✅ Validaciones pasadas, creando usuario en Firebase...');
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            
            if (displayName) {
                await userCredential.user.updateProfile({
                    displayName: displayName
                });
            }
            
            // Enviar email de verificación
            await userCredential.user.sendEmailVerification();
            
            console.log('✅ Usuario registrado exitosamente');
            return { success: true, user: userCredential.user };
            
        } catch (error) {
            console.error('❌ Error al registrar usuario:', error);
            return { 
                success: false, 
                error: this.getAuthErrorMessage(error.code) 
            };
        }
    }

    async login(email, password) {
        try {
            this.validateEmail(email);
            
            // Si estamos en modo local, simular login
            if (this.useLocalMode) {
                console.log('🏠 Iniciando sesión en modo local...');
                
                const existingUsers = JSON.parse(localStorage.getItem('localUsers') || '{}');
                const user = existingUsers[email];
                
                if (!user) {
                    throw new Error('No existe una cuenta con este email');
                }
                
                // Verificar contraseña (en producción, usar bcrypt.compare)
                const hashedPassword = await this.hashPassword(password);
                if (user.password !== hashedPassword) {
                    throw new Error('Contraseña incorrecta');
                }
                
                console.log('✅ Login exitoso en modo local');
                return { success: true, user: user };
            }
            
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            
            console.log('✅ Login exitoso');
            return { success: true, user: userCredential.user };
            
        } catch (error) {
            console.error('❌ Error en login:', error);
            return { 
                success: false, 
                error: this.getAuthErrorMessage(error.code) || error.message
            };
        }
    }

    async logout() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            this.clearUserSession();
            console.log('✅ Logout exitoso');
            
        } catch (error) {
            console.error('❌ Error en logout:', error);
        }
    }

    async resetPassword(email) {
        try {
            this.validateEmail(email);
            
            await this.auth.sendPasswordResetEmail(email);
            console.log('✅ Email de reset enviado');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error al enviar email de reset:', error);
            return { 
                success: false, 
                error: this.getAuthErrorMessage(error.code) 
            };
        }
    }

    async updatePassword(newPassword) {
        try {
            this.validatePassword(newPassword);
            
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('No hay usuario autenticado');
            }
            
            await user.updatePassword(newPassword);
            console.log('✅ Contraseña actualizada');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error al actualizar contraseña:', error);
            return { 
                success: false, 
                error: this.getAuthErrorMessage(error.code) 
            };
        }
    }

    // Validaciones
    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const errors = [];
        
        if (password.length < minLength) {
            errors.push(`La contraseña debe tener al menos ${minLength} caracteres`);
        }
        if (!hasUpperCase) {
            errors.push('La contraseña debe contener al menos una letra mayúscula');
        }
        if (!hasLowerCase) {
            errors.push('La contraseña debe contener al menos una letra minúscula');
        }
        if (!hasNumbers) {
            errors.push('La contraseña debe contener al menos un número');
        }
        if (!hasSpecialChar) {
            errors.push('La contraseña debe contener al menos un carácter especial');
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join('. '));
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('El formato del email no es válido');
        }
    }

    // Gestión de sesión
    saveUserSession() {
        if (this.currentUser) {
            const sessionData = {
                uid: this.currentUser.uid,
                lastActivity: this.lastActivity,
                timestamp: Date.now()
            };
            
            localStorage.setItem('jm_budget_session', JSON.stringify(sessionData));
        }
    }

    clearUserSession() {
        localStorage.removeItem('jm_budget_session');
        localStorage.removeItem('jm_budget_last_activity');
    }

    async restoreSession() {
        try {
            const sessionData = localStorage.getItem('jm_budget_session');
            if (!sessionData) return false;
            
            const session = JSON.parse(sessionData);
            const timeSinceLastActivity = Date.now() - session.lastActivity;
            
            // Verificar si la sesión no ha expirado
            if (timeSinceLastActivity < this.sessionTimeout) {
                this.lastActivity = session.lastActivity;
                return true;
            } else {
                this.clearUserSession();
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error al restaurar sesión:', error);
            this.clearUserSession();
            return false;
        }
    }

    // Función para hashear contraseñas (simplificada para modo local)
    async hashPassword(password) {
        // En producción, usar bcrypt o similar
        // Por ahora, usar un hash simple para demostración
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Utilidades
    getAuthErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No existe una cuenta con este email',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/email-already-in-use': 'Ya existe una cuenta con este email',
            'auth/weak-password': 'La contraseña es demasiado débil',
            'auth/invalid-email': 'El formato del email no es válido',
            'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
            'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
            'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
            'auth/operation-not-allowed': 'Esta operación no está permitida',
            'auth/requires-recent-login': 'Por seguridad, inicia sesión nuevamente',
            'auth/configuration-not-found': 'Error de configuración de Firebase. Verifica tu proyecto.',
            'Ya existe una cuenta con este email': 'Ya existe una cuenta con este email',
            'No existe una cuenta con este email': 'No existe una cuenta con este email',
            'Contraseña incorrecta': 'Contraseña incorrecta'
        };
        
        return errorMessages[errorCode] || errorCode || 'Error de autenticación desconocido';
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Métodos para datos encriptados
    async saveEncryptedData(key, data) {
        try {
            const encrypted = await this.encrypt(data);
            localStorage.setItem(`jm_budget_encrypted_${key}`, JSON.stringify(encrypted));
            return true;
        } catch (error) {
            console.error('❌ Error al guardar datos encriptados:', error);
            return false;
        }
    }

    async loadEncryptedData(key) {
        try {
            const encryptedData = localStorage.getItem(`jm_budget_encrypted_${key}`);
            if (!encryptedData) return null;
            
            const encrypted = JSON.parse(encryptedData);
            return await this.decrypt(encrypted);
        } catch (error) {
            console.error('❌ Error al cargar datos encriptados:', error);
            return null;
        }
    }

    async clearEncryptedData(key) {
        localStorage.removeItem(`jm_budget_encrypted_${key}`);
    }
}

// Instancia global del servicio de autenticación
const authService = new AuthService();

// Exportar para uso global
window.authService = authService; 