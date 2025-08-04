// Configuración Centralizada de Firebase para JM Budget
// Esta configuración permite que cualquier usuario se registre sin configuración técnica

window.FIREBASE_CENTRAL_CONFIG = {
    // 🔥 CONFIGURACIÓN CENTRALIZADA DE FIREBASE
    // IMPORTANTE: Reemplaza estos valores con tu configuración de Firebase real
    
    // Configuración de Firebase (reemplazar con valores reales)
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456",
    
    // Configuración de la aplicación
    appName: "JM Budget",
    appVersion: "2.0.6",
    developerEmail: "joemart4@gmail.com",
    
    // Configuración de seguridad
    enableEmailVerification: true,
    allowAnonymousAuth: false,
    maxUsersPerProject: 1000, // Límite de usuarios (ajustar según plan de Firebase)
    
    // Configuración de datos
    dataRetentionDays: 365, // Días de retención de datos
    maxDataSizePerUser: 10 * 1024 * 1024, // 10MB por usuario
    enableDataExport: true,
    
    // Configuración de notificaciones
    enableEmailNotifications: true,
    enablePushNotifications: true,
    
    // Configuración de backup
    enableAutoBackup: true,
    backupFrequency: "daily", // daily, weekly, monthly
    maxBackupsPerUser: 10
};

// Función para verificar si la configuración está completa
function checkCentralFirebaseConfig() {
    const config = window.FIREBASE_CENTRAL_CONFIG;
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    
    const missingFields = requiredFields.filter(field => 
        !config[field] || config[field].includes('TU_') || config[field].includes('tu-proyecto')
    );
    
    if (missingFields.length > 0) {
        console.warn('⚠️ Configuración de Firebase centralizada incompleta. Campos faltantes:', missingFields);
        return false;
    }
    
    return true;
}

// Función para inicializar Firebase centralizado
function initializeCentralFirebase() {
    if (!checkCentralFirebaseConfig()) {
        console.log('🔧 Configuración de Firebase centralizada no encontrada, usando modo local');
        return false;
    }
    
    try {
        // Verificar si Firebase está disponible
        if (typeof firebase === 'undefined') {
            console.log('⏳ Firebase no cargado aún, esperando...');
            setTimeout(initializeCentralFirebase, 1000);
            return false;
        }
        
        // Inicializar Firebase con configuración centralizada
        firebase.initializeApp(window.FIREBASE_CENTRAL_CONFIG);
        
        console.log('✅ Firebase centralizado inicializado correctamente');
        
        // Habilitar sincronización en la nube para todos los usuarios
        window.cloudSyncEnabled = true;
        window.firebaseInitialized = true;
        window.centralFirebaseEnabled = true;
        
        // Configurar reglas de Firestore automáticamente
        setupFirestoreRules();
        
        return true;
    } catch (error) {
        console.error('❌ Error al inicializar Firebase centralizado:', error);
        return false;
    }
}

// Función para configurar reglas de Firestore automáticamente
function setupFirestoreRules() {
    const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Los usuarios solo pueden acceder a sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Datos de presupuesto por usuario
    match /users/{userId}/budgets/{budgetId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Transacciones por usuario
    match /users/{userId}/transactions/{transactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Categorías por usuario
    match /users/{userId}/categories/{categoryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Metas por usuario
    match /users/{userId}/goals/{goalId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Cuentas bancarias por usuario
    match /users/{userId}/accounts/{accountId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Configuración por usuario
    match /users/{userId}/settings/{settingId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;
    
    console.log('📋 Reglas de Firestore configuradas para seguridad por usuario');
    console.log('💡 Copia estas reglas en tu Firebase Console > Firestore > Rules');
    console.log(rules);
}

// Función para registrar usuario en Firebase centralizado
async function registerUserInCentralFirebase(email, password, userData = {}) {
    try {
        if (!window.firebaseInitialized) {
            throw new Error('Firebase no está inicializado');
        }
        
        // Crear usuario en Firebase Auth
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Enviar email de verificación si está habilitado
        if (window.FIREBASE_CENTRAL_CONFIG.enableEmailVerification) {
            await user.sendEmailVerification();
        }
        
        // Crear documento de usuario en Firestore
        const userDoc = {
            uid: user.uid,
            email: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            ...userData
        };
        
        await firebase.firestore().collection('users').doc(user.uid).set(userDoc);
        
        console.log('✅ Usuario registrado exitosamente en Firebase centralizado');
        return { success: true, user };
        
    } catch (error) {
        console.error('❌ Error al registrar usuario:', error);
        return { success: false, error: error.message };
    }
}

// Función para iniciar sesión en Firebase centralizado
async function loginUserInCentralFirebase(email, password) {
    try {
        if (!window.firebaseInitialized) {
            throw new Error('Firebase no está inicializado');
        }
        
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Actualizar último login
        await firebase.firestore().collection('users').doc(user.uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Usuario autenticado exitosamente');
        return { success: true, user };
        
    } catch (error) {
        console.error('❌ Error al autenticar usuario:', error);
        return { success: false, error: error.message };
    }
}

// Función para cargar datos del usuario desde Firebase
async function loadUserDataFromFirebase(userId) {
    try {
        if (!window.firebaseInitialized) {
            throw new Error('Firebase no está inicializado');
        }
        
        const userDoc = await firebase.firestore().collection('users').doc(userId).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Cargar datos específicos del usuario
            const [budgets, transactions, categories, goals, accounts, settings] = await Promise.all([
                firebase.firestore().collection('users').doc(userId).collection('budgets').get(),
                firebase.firestore().collection('users').doc(userId).collection('transactions').get(),
                firebase.firestore().collection('users').doc(userId).collection('categories').get(),
                firebase.firestore().collection('users').doc(userId).collection('goals').get(),
                firebase.firestore().collection('users').doc(userId).collection('accounts').get(),
                firebase.firestore().collection('users').doc(userId).collection('settings').get()
            ]);
            
            return {
                success: true,
                userData,
                budgets: budgets.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                transactions: transactions.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                categories: categories.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                goals: goals.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                accounts: accounts.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                settings: settings.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            };
        } else {
            throw new Error('Usuario no encontrado');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar datos del usuario:', error);
        return { success: false, error: error.message };
    }
}

// Función para guardar datos del usuario en Firebase
async function saveUserDataToFirebase(userId, dataType, data) {
    try {
        if (!window.firebaseInitialized) {
            throw new Error('Firebase no está inicializado');
        }
        
        const batch = firebase.firestore().batch();
        const collectionRef = firebase.firestore().collection('users').doc(userId).collection(dataType);
        
        // Guardar cada elemento en la colección
        data.forEach(item => {
            const docRef = item.id ? collectionRef.doc(item.id) : collectionRef.doc();
            batch.set(docRef, item);
        });
        
        await batch.commit();
        
        console.log(`✅ Datos de ${dataType} guardados exitosamente`);
        return { success: true };
        
    } catch (error) {
        console.error(`❌ Error al guardar datos de ${dataType}:`, error);
        return { success: false, error: error.message };
    }
}

// Función para mostrar instrucciones de configuración para el desarrollador
function showDeveloperSetupInstructions() {
    const instructions = `
🔧 CONFIGURACIÓN PARA DESARROLLADOR - FIREBASE CENTRALIZADO

Para configurar Firebase centralizado y permitir que cualquier usuario se registre:

1. 🌐 Crear Proyecto Firebase:
   - Ve a: https://console.firebase.google.com/
   - Crea un proyecto: JM-Budget-Central
   - Habilita Google Analytics

2. 🔐 Configurar Authentication:
   - Ve a Authentication > Sign-in method
   - Habilita Email/Password
   - Opcional: Habilita verificación de email

3. 🗄️ Configurar Firestore:
   - Ve a Firestore Database
   - Crea base de datos en modo de prueba
   - Selecciona ubicación cercana

4. ⚙️ Obtener Configuración:
   - Ve a Configuración del proyecto
   - Registra app web: JM-Budget-Web
   - Copia la configuración

5. 🔧 Aplicar Configuración:
   - Reemplaza los valores en FIREBASE_CENTRAL_CONFIG
   - Sube el archivo actualizado
   - ¡Listo! Cualquier usuario puede registrarse

6. 🛡️ Configurar Reglas de Seguridad:
   - Ve a Firestore > Rules
   - Copia las reglas que aparecen en la consola
   - Publica las reglas

¡Después de esto, cualquier usuario podrá registrarse sin configuración técnica!
    `;
    
    console.log(instructions);
    alert('Revisa la consola del navegador para ver las instrucciones completas de configuración');
}

// Auto-inicializar cuando se carga el archivo
if (typeof firebase !== 'undefined') {
    initializeCentralFirebase();
} else {
    // Esperar a que Firebase se cargue
    window.addEventListener('load', () => {
        setTimeout(initializeCentralFirebase, 2000);
    });
}

// Exportar funciones para uso global
window.initializeCentralFirebase = initializeCentralFirebase;
window.checkCentralFirebaseConfig = checkCentralFirebaseConfig;
window.registerUserInCentralFirebase = registerUserInCentralFirebase;
window.loginUserInCentralFirebase = loginUserInCentralFirebase;
window.loadUserDataFromFirebase = loadUserDataFromFirebase;
window.saveUserDataToFirebase = saveUserDataToFirebase;
window.showDeveloperSetupInstructions = showDeveloperSetupInstructions;

console.log('📁 Configuración Firebase centralizada cargada');
console.log('💡 Para configurar, ejecuta: showDeveloperSetupInstructions()'); 