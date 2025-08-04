/**
 * Inicialización de Firebase para JM Budget
 * Este script debe ejecutarse antes de cualquier uso de Firebase
 */

console.log('🔥 Script firebase-init.js cargado y ejecutándose...');

// Verificar si estamos en modo desarrollo
if (typeof window.isDevelopment === 'undefined') {
    window.isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.includes('localhost');
}

if (window.isDevelopment) {
    console.log('🔧 Modo desarrollo detectado - Firebase deshabilitado para evitar errores');
    window.firebaseInitialized = false;
    window.firebaseDisabled = true;
    // No hacer return aquí, solo marcar como deshabilitado
} else {
    console.log('🔥 Inicializando Firebase...');
    
    // Verificar que Firebase esté cargado
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase no está cargado. Verifica que los scripts de Firebase estén incluidos.');
    } else {
        console.log('✅ Firebase SDK cargado correctamente');
    }
    
    // Verificar que la configuración esté disponible
    if (typeof window.FIREBASE_CONFIG === 'undefined') {
        console.error('❌ Configuración de Firebase no encontrada');
    } else {
        console.log('✅ Configuración de Firebase disponible:', window.FIREBASE_CONFIG);
    }
}



// Función para inicializar Firebase
function initializeFirebase() {
    try {
        // Verificar si Firebase está deshabilitado
        if (window.firebaseDisabled) {
            console.log('🔧 Firebase deshabilitado en modo desarrollo');
            return;
        }
        
        // Verificar si ya está inicializado
        if (!firebase.apps.length) {
            console.log('🚀 Inicializando Firebase App...');
            firebase.initializeApp(window.FIREBASE_CONFIG);
            console.log('✅ Firebase App inicializado correctamente');
        } else {
            console.log('✅ Firebase App ya está inicializado');
        }
        
        // Verificar que Auth esté disponible
        if (firebase.auth) {
            console.log('✅ Firebase Auth disponible');
        } else {
            console.error('❌ Firebase Auth no está disponible');
        }
        
        // Verificar que Firestore esté disponible
        if (firebase.firestore) {
            console.log('✅ Firebase Firestore disponible');
        } else {
            console.error('❌ Firebase Firestore no está disponible');
        }
        
        // Marcar como inicializado
        window.firebaseInitialized = true;
        console.log('✅ Firebase completamente inicializado');
        
    } catch (error) {
        console.error('❌ Error al inicializar Firebase:', error);
        window.firebaseInitialized = false;
    }
}

// Solo intentar inicializar si no estamos en modo desarrollo
if (!window.firebaseDisabled) {
    if (typeof firebase !== 'undefined' && typeof window.FIREBASE_CONFIG !== 'undefined') {
        console.log('🔥 Firebase y configuración disponibles, inicializando...');
        initializeFirebase();
    } else {
        console.log('⏳ Esperando a que Firebase esté completamente cargado...');
        
        // Esperar a que Firebase esté disponible
        let attempts = 0;
        const maxAttempts = 100; // 10 segundos máximo
        
        const checkFirebase = setInterval(() => {
            attempts++;
            
            if (window.firebaseDisabled) {
                console.log('🔧 Firebase deshabilitado en modo desarrollo');
                clearInterval(checkFirebase);
            } else if (typeof firebase !== 'undefined' && typeof window.FIREBASE_CONFIG !== 'undefined') {
                console.log('🔥 Firebase detectado, inicializando...');
                clearInterval(checkFirebase);
                initializeFirebase();
        } else if (attempts >= maxAttempts) {
            console.error('❌ Firebase no se cargó en el tiempo esperado');
            clearInterval(checkFirebase);
            window.firebaseInitialized = false;
        } else {
            console.log(`⏳ Esperando Firebase... (${attempts}/${maxAttempts})`);
        }
    }, 100);
}
}

// Exportar la función para uso externo
window.initializeFirebase = initializeFirebase;

// Verificar el estado de inicialización
console.log('📊 Estado de Firebase:', {
    disabled: window.firebaseDisabled,
    initialized: window.firebaseInitialized,
    firebaseAvailable: typeof firebase !== 'undefined',
    configAvailable: typeof window.FIREBASE_CONFIG !== 'undefined'
}); 