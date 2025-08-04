/**
 * Configuración Global de Firebase para JM Budget
 * Esta configuración se aplica a todos los usuarios de la aplicación
 */

// Configuración de Firebase para JM Budget
// IMPORTANTE: Esta es una configuración de ejemplo. Para producción, necesitas crear tu propio proyecto Firebase.

// Configuración centralizada de Firebase para JM Budget
// IMPORTANTE: Reemplaza estos valores con tu configuración real de Firebase

window.FIREBASE_CONFIG = {
    // 🔥 CONFIGURACIÓN CENTRALIZADA DE FIREBASE
    // Reemplaza estos valores con tu configuración real de Firebase Console
    
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Configuración adicional de la aplicación
window.FIREBASE_APP_CONFIG = {
    appName: "JM Budget",
    appVersion: "2.0.7",
    developerEmail: "joemart4@gmail.com",
    
    // Configuración de seguridad
    enableEmailVerification: true,
    allowAnonymousAuth: false,
    maxUsersPerProject: 1000,
    
    // Configuración de datos
    dataRetentionDays: 365,
    maxDataSizePerUser: 10 * 1024 * 1024, // 10MB por usuario
    enableDataExport: true,
    
    // Configuración de notificaciones
    enableEmailNotifications: true,
    enablePushNotifications: true,
    
    // Configuración de backup
    enableAutoBackup: true,
    backupFrequency: "daily",
    maxBackupsPerUser: 10
};

// Función para obtener la configuración centralizada
function getFirebaseConfig() {
    console.log('🌐 Usando configuración centralizada de Firebase');
    return window.FIREBASE_CONFIG;
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