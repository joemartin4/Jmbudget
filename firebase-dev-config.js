/**
 * Configuración de Firebase para Desarrollo
 * Deshabilita Firestore en desarrollo local para evitar errores
 */

// Detectar si estamos en desarrollo
if (typeof window.isDevelopment === 'undefined') {
    window.isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
}

if (window.isDevelopment) {
    console.log('🔧 Modo desarrollo detectado - Firebase configurado para desarrollo local');
    
    // Configuración mínima para desarrollo
    const FIREBASE_DEV_CONFIG = {
        apiKey: "AIzaSyCGmkLIE6d8jhS_QsNzkyjJxOM5D_OdXO0",
        authDomain: "jm-budget-app.firebaseapp.com",
        projectId: "jm-budget-app",
        storageBucket: "jm-budget-app.firebasestorage.app",
        messagingSenderId: "397811974130",
        appId: "1:397811974130:web:c23dfad4187ca6f77d356b"
    };
    
    // Inicializar Firebase solo para autenticación
    if (typeof firebase !== 'undefined') {
        try {
            firebase.initializeApp(FIREBASE_DEV_CONFIG);
            console.log('✅ Firebase inicializado para desarrollo (solo autenticación)');
        } catch (error) {
            console.log('⚠️ Firebase ya inicializado');
        }
    }
    
    // Deshabilitar Firestore en desarrollo
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        // Sobrescribir métodos de Firestore para evitar errores
        const originalFirestore = firebase.firestore;
        firebase.firestore = function() {
            console.log('🔧 Firestore deshabilitado en desarrollo');
            return {
                collection: () => ({
                    doc: () => ({
                        get: () => Promise.resolve({ exists: false, data: () => null }),
                        set: () => Promise.resolve(),
                        update: () => Promise.resolve(),
                        delete: () => Promise.resolve()
                    }),
                    add: () => Promise.resolve({ id: 'dev-doc-id' }),
                    where: () => ({ get: () => Promise.resolve({ docs: [] }) })
                }),
                batch: () => ({
                    set: () => ({ commit: () => Promise.resolve() }),
                    update: () => ({ commit: () => Promise.resolve() }),
                    delete: () => ({ commit: () => Promise.resolve() })
                }),
                FieldValue: {
                    serverTimestamp: () => new Date()
                }
            };
        };
        firebase.firestore.FieldValue = firebase.firestore().FieldValue;
    }
} else {
    console.log('🚀 Modo producción - Firebase configurado completamente');
} 