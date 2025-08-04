/**
 * Configuración Global de Firebase para JM Budget
 * Esta configuración se aplica a todos los usuarios de la aplicación
 */

// Configuración de Firebase para JM Budget
// IMPORTANTE: Esta es una configuración de ejemplo. Para producción, necesitas crear tu propio proyecto Firebase.

window.FIREBASE_CONFIG = {
    // 🔧 CONFIGURACIÓN DE DESARROLLO (LOCAL)
    // Esta configuración funciona solo en localhost
    development: {
        apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        authDomain: "tu-proyecto.firebaseapp.com",
        projectId: "tu-proyecto",
        storageBucket: "tu-proyecto.appspot.com",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:abcdef123456"
    },
    
    // 🌐 CONFIGURACIÓN DE PRODUCCIÓN (GITHUB PAGES)
    // Para usar en GitHub Pages, necesitas:
    // 1. Crear un proyecto en Firebase Console
    // 2. Habilitar Authentication y Firestore
    // 3. Configurar las reglas de seguridad
    // 4. Reemplazar esta configuración con la tuya
    production: {
        apiKey: "TU_API_KEY_AQUI",
        authDomain: "TU_PROJECT_ID.firebaseapp.com",
        projectId: "TU_PROJECT_ID",
        storageBucket: "TU_PROJECT_ID.appspot.com",
        messagingSenderId: "TU_SENDER_ID",
        appId: "TU_APP_ID"
    }
};

// Función para obtener la configuración según el entorno
function getFirebaseConfig() {
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('localhost');
    
    if (isDevelopment) {
        console.log('🔧 Usando configuración de desarrollo');
        return window.FIREBASE_CONFIG.development;
    } else {
        console.log('🌐 Usando configuración de producción');
        return window.FIREBASE_CONFIG.production;
    }
}

// Función para configurar Firebase manualmente
window.configureFirebase = function(config) {
    if (typeof firebase !== 'undefined') {
        try {
            firebase.initializeApp(config);
            console.log('✅ Firebase configurado exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error al configurar Firebase:', error);
            return false;
        }
    } else {
        console.error('❌ Firebase SDK no está cargado');
        return false;
    }
};

// Función para verificar si Firebase está disponible
window.isFirebaseAvailable = function() {
    return typeof firebase !== 'undefined' && 
           typeof firebase.auth !== 'undefined' && 
           typeof firebase.firestore !== 'undefined';
};

// Configuración automática al cargar
document.addEventListener('DOMContentLoaded', function() {
    const config = getFirebaseConfig();
    
    // Solo configurar si Firebase está disponible y no está ya inicializado
    if (window.isFirebaseAvailable() && !firebase.apps.length) {
        window.configureFirebase(config);
    }
});

console.log('📋 Firebase Config cargado');
console.log('💡 Para configurar Firebase en producción:');
console.log('1. Ve a https://console.firebase.google.com');
console.log('2. Crea un nuevo proyecto');
console.log('3. Habilita Authentication y Firestore');
console.log('4. Copia la configuración a firebase-config.js');
console.log('5. O usa la función window.configureFirebase(config) desde la consola'); 