/**
 * Configuración Global de Firebase para JM Budget
 * Esta configuración se aplica a todos los usuarios de la aplicación
 */

// Configuración de Firebase - Configurado para JM Budget
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDsIAnb_vCNtT4GqcXTFsujYQI2OsmskEk",
    authDomain: "jm-budget-baa69.firebaseapp.com",
    projectId: "jm-budget-baa69",
    storageBucket: "jm-budget-baa69.firebasestorage.app",
    messagingSenderId: "1029140625131",
    appId: "1:1029140625131:web:98b84bccf65b0c9212f0ae"
};

// Función para verificar si la configuración está completa
function isFirebaseConfigComplete() {
    return Object.values(FIREBASE_CONFIG).every(value => 
        value && value !== "TU_API_KEY_AQUI" && value !== "TU_PROJECT_ID" && 
        value !== "TU_MESSAGING_SENDER_ID" && value !== "TU_APP_ID"
    );
}

// Función para obtener la configuración
function getFirebaseConfig() {
    return FIREBASE_CONFIG;
}

// Función para actualizar la configuración
function updateFirebaseConfig(newConfig) {
    Object.assign(FIREBASE_CONFIG, newConfig);
    // Guardar en localStorage para persistencia
    localStorage.setItem('globalFirebaseConfig', JSON.stringify(FIREBASE_CONFIG));
}

// Cargar configuración guardada al iniciar
function loadSavedConfig() {
    const saved = localStorage.getItem('globalFirebaseConfig');
    if (saved) {
        try {
            const config = JSON.parse(saved);
            Object.assign(FIREBASE_CONFIG, config);
        } catch (error) {
            console.error('Error al cargar configuración guardada:', error);
        }
    }
}

// Inicializar al cargar el script
loadSavedConfig();

// Exportar para uso global
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.isFirebaseConfigComplete = isFirebaseConfigComplete;
window.getFirebaseConfig = getFirebaseConfig;
window.updateFirebaseConfig = updateFirebaseConfig; 