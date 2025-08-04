// Configuración de Firebase para Usuario Personal
// INSTRUCCIONES: Reemplaza los valores con tu configuración de Firebase

window.FIREBASE_USER_CONFIG = {
    // 🔥 CONFIGURACIÓN DE FIREBASE PERSONAL
    // Reemplaza estos valores con tu configuración de Firebase Console
    
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Función para verificar si la configuración está completa
function checkFirebaseConfig() {
    const config = window.FIREBASE_USER_CONFIG;
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    
    const missingFields = requiredFields.filter(field => 
        !config[field] || config[field].includes('TU_') || config[field].includes('tu-proyecto')
    );
    
    if (missingFields.length > 0) {
        console.warn('⚠️ Configuración de Firebase incompleta. Campos faltantes:', missingFields);
        return false;
    }
    
    return true;
}

// Función para inicializar Firebase con configuración personal
function initializePersonalFirebase() {
    if (!checkFirebaseConfig()) {
        console.log('🔧 Configuración de Firebase no encontrada, usando modo local');
        return false;
    }
    
    try {
        // Verificar si Firebase está disponible
        if (typeof firebase === 'undefined') {
            console.log('⏳ Firebase no cargado aún, esperando...');
            setTimeout(initializePersonalFirebase, 1000);
            return false;
        }
        
        // Inicializar Firebase con configuración personal
        firebase.initializeApp(window.FIREBASE_USER_CONFIG);
        
        console.log('✅ Firebase inicializado con configuración personal');
        
        // Habilitar sincronización en la nube
        window.cloudSyncEnabled = true;
        window.firebaseInitialized = true;
        
        return true;
    } catch (error) {
        console.error('❌ Error al inicializar Firebase:', error);
        return false;
    }
}

// Función para mostrar instrucciones de configuración
function showFirebaseSetupInstructions() {
    const instructions = `
🔧 CONFIGURACIÓN DE FIREBASE PARA SINCRONIZACIÓN EN LA NUBE

Para usar tu cuenta personal con sincronización en la nube, sigue estos pasos:

1. 🌐 Crear Proyecto Firebase:
   - Ve a: https://console.firebase.google.com/
   - Crea un nuevo proyecto
   - Nómbralo: JM-Budget-[TuNombre]

2. 🔐 Configurar Authentication:
   - Ve a Authentication > Sign-in method
   - Habilita Email/Password

3. 🗄️ Configurar Firestore:
   - Ve a Firestore Database
   - Crea base de datos en modo de prueba
   - Selecciona ubicación cercana

4. ⚙️ Obtener Configuración:
   - Ve a Configuración del proyecto
   - Copia la configuración de SDK
   - Reemplaza los valores en este archivo

5. 🔄 Reiniciar Aplicación:
   - Recarga la página
   - Crea tu cuenta personal
   - ¡Disfruta de la sincronización!

¿Necesitas ayuda con algún paso específico?
    `;
    
    console.log(instructions);
    alert('Revisa la consola del navegador para ver las instrucciones completas de configuración de Firebase');
}

// Auto-inicializar cuando se carga el archivo
if (typeof firebase !== 'undefined') {
    initializePersonalFirebase();
} else {
    // Esperar a que Firebase se cargue
    window.addEventListener('load', () => {
        setTimeout(initializePersonalFirebase, 2000);
    });
}

// Función para verificar estado de sincronización
function checkCloudSyncStatus() {
    if (window.cloudSyncEnabled && window.firebaseInitialized) {
        console.log('✅ Sincronización en la nube habilitada');
        return true;
    } else {
        console.log('⚠️ Sincronización en la nube no disponible');
        return false;
    }
}

// Exportar funciones para uso global
window.initializePersonalFirebase = initializePersonalFirebase;
window.checkFirebaseConfig = checkFirebaseConfig;
window.showFirebaseSetupInstructions = showFirebaseSetupInstructions;
window.checkCloudSyncStatus = checkCloudSyncStatus;

console.log('📁 Archivo de configuración Firebase personal cargado');
console.log('💡 Para configurar Firebase, ejecuta: showFirebaseSetupInstructions()'); 