# 🔥 Guía de Configuración de Firebase para JM Budget

## 📋 Pasos para Configurar Firebase

### 1. **Configurar Firestore Database**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `jm-budget-app`
3. En el menú lateral, ve a **Firestore Database**
4. Haz clic en **Crear base de datos**
5. Selecciona **Comenzar en modo de prueba** (para desarrollo)
6. Selecciona la ubicación más cercana a ti

### 2. **Configurar Reglas de Seguridad**

1. En Firestore Database, ve a la pestaña **Reglas**
2. Reemplaza las reglas existentes con el contenido de `firestore.rules`
3. Haz clic en **Publicar**

### 3. **Habilitar Authentication**

1. En el menú lateral, ve a **Authentication**
2. Haz clic en **Comenzar**
3. En la pestaña **Sign-in method**, habilita:
   - **Email/Password**
   - **Google** (opcional)
4. Haz clic en **Guardar**

### 4. **Configurar Variables de Entorno (Opcional)**

Si quieres usar variables de entorno, crea un archivo `.env`:

```env
FIREBASE_API_KEY=AIzaSyCGmkLIE6d8jhS_QsNzkyjJxOM5D_OdXO0
FIREBASE_AUTH_DOMAIN=jm-budget-app.firebaseapp.com
FIREBASE_PROJECT_ID=jm-budget-app
FIREBASE_STORAGE_BUCKET=jm-budget-app.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=397811974130
FIREBASE_APP_ID=1:397811974130:web:c23dfad4187ca6f77d356b
```

## 🔧 Solución de Problemas

### Error 400 - Bad Request
- **Causa**: Reglas de seguridad muy restrictivas
- **Solución**: Usar las reglas proporcionadas en `firestore.rules`

### Error de Permisos
- **Causa**: Usuario no autenticado o reglas incorrectas
- **Solución**: Verificar que el usuario esté autenticado

### Error de Conexión
- **Causa**: Configuración incorrecta de Firebase
- **Solución**: Verificar la configuración en `firebase-config.js`

## 🚀 Modo Desarrollo

En desarrollo local (`localhost`), la sincronización automática está deshabilitada para evitar errores. Para probar la sincronización:

1. Haz clic en el botón de sincronización manual
2. Verifica los logs en la consola
3. Revisa Firebase Console para ver los datos

## 📱 Producción

Para producción:

1. Configura las reglas de seguridad apropiadas
2. Habilita la sincronización automática
3. Configura el dominio en Firebase Console
4. Verifica que todos los servicios estén habilitados

## 🔒 Seguridad

- Las reglas de Firestore solo permiten acceso a usuarios autenticados
- Cada usuario solo puede acceder a sus propios datos
- Los datos están protegidos por autenticación de Firebase 