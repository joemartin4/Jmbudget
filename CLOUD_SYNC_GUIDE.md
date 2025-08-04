# 🌟 Guía de Sincronización en la Nube - JM Budget

## 📋 Descripción General

JM Budget ahora permite a los usuarios elegir entre múltiples servicios de nube para sincronizar y hacer backup de sus datos financieros. Esto proporciona mayor flexibilidad y control sobre dónde se almacenan los datos.

## ☁️ Servicios Soportados

### 1. **Google Drive** 📁
- **Descripción**: Sincroniza con tu cuenta personal de Google Drive
- **Ventajas**: 
  - 15GB gratuitos
  - Integración nativa con Google Workspace
  - Acceso desde cualquier dispositivo
- **Configuración**: Requiere Client ID y API Key de Google Cloud Console

### 2. **Dropbox** 📦
- **Descripción**: Sincroniza con tu cuenta de Dropbox
- **Ventajas**:
  - 2GB gratuitos
  - Interfaz simple y confiable
  - Sincronización rápida
- **Configuración**: Requiere Access Token de Dropbox Developers

### 3. **OneDrive** 💻
- **Descripción**: Sincroniza con tu cuenta de Microsoft OneDrive
- **Ventajas**:
  - 5GB gratuitos
  - Integración con Office 365
  - Seguridad empresarial
- **Configuración**: Requiere Access Token de Microsoft Graph

### 4. **iCloud** 🍎
- **Descripción**: Sincroniza con tu cuenta de iCloud usando WebDAV
- **Ventajas**:
  - 5GB gratuitos
  - Integración nativa con dispositivos Apple
  - Encriptación end-to-end
- **Configuración**: Requiere Apple ID y contraseña

### 5. **Firebase** 🔥
- **Descripción**: Sincronización con Firebase (sistema actual)
- **Ventajas**:
  - Base de datos en tiempo real
  - Autenticación integrada
  - Escalabilidad automática
- **Configuración**: Requiere configuración completa de Firebase

## 🚀 Cómo Configurar un Servicio

### Paso 1: Acceder al Modal de Sincronización
1. Inicia sesión en JM Budget
2. Haz clic en el menú (☰) en la esquina superior derecha
3. Selecciona "Sincronización en la Nube"

### Paso 2: Elegir Servicio
1. En la pestaña "Servicios", verás todas las opciones disponibles
2. Haz clic en "Configurar" en el servicio que desees usar
3. Completa el formulario con las credenciales necesarias

### Paso 3: Probar Conexión
1. Una vez configurado, haz clic en "Probar" para verificar la conexión
2. Si la prueba es exitosa, el servicio estará listo para usar

## 📝 Guías de Configuración por Servicio

### Google Drive

#### Obtener Credenciales:
1. Ve a [Google Cloud Console](https://console.developers.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Drive
4. Ve a "Credenciales" → "Crear credenciales" → "ID de cliente OAuth 2.0"
5. Configura los orígenes autorizados (tu dominio)
6. Copia el Client ID y API Key

#### Configuración en JM Budget:
- **Client ID**: Pega el Client ID de Google Cloud Console
- **API Key**: Pega la API Key de Google Cloud Console

### Dropbox

#### Obtener Access Token:
1. Ve a [Dropbox Developers](https://www.dropbox.com/developers)
2. Crea una nueva app
3. En "Permissions", habilita:
   - `files.content.write`
   - `files.content.read`
4. En "Settings", genera un Access Token
5. Copia el token generado

#### Configuración en JM Budget:
- **Access Token**: Pega el token generado en Dropbox Developers

### OneDrive

#### Obtener Access Token:
1. Ve a [Azure Portal](https://portal.azure.com)
2. Registra una nueva aplicación
3. Configura los permisos de Microsoft Graph:
   - `Files.ReadWrite`
   - `User.Read`
4. Genera un Access Token
5. Copia el token generado

#### Configuración en JM Budget:
- **Access Token**: Pega el token generado en Azure Portal

### iCloud

#### Preparar Cuenta:
1. Asegúrate de tener una cuenta de iCloud activa
2. Habilita el acceso WebDAV en tu cuenta
3. Ten tu Apple ID y contraseña listos

#### Configuración en JM Budget:
- **Apple ID**: Tu dirección de email de iCloud
- **Contraseña**: Tu contraseña de iCloud
- **URL del servidor**: Selecciona la opción recomendada

### Firebase

#### Obtener Configuración:
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Agrega una aplicación web
4. Copia la configuración completa

#### Configuración en JM Budget:
- **API Key**: Tu Firebase API Key
- **Project ID**: Tu Firebase Project ID
- **Auth Domain**: Tu dominio de autenticación
- **Storage Bucket**: Tu bucket de almacenamiento
- **Messaging Sender ID**: Tu ID de remitente
- **App ID**: Tu App ID de Firebase

## 🔄 Funciones de Sincronización

### Sincronización Manual
- **Sincronizar Ahora**: Sube todos los datos locales a la nube
- **Sincronizar desde la Nube**: Descarga datos desde la nube
- **Probar Conexión**: Verifica que el servicio esté funcionando

### Sincronización Automática
- Se puede configurar para sincronizar automáticamente cada 5, 10, 30 minutos o cada hora
- Los datos se sincronizan automáticamente al guardar cambios

### Restauración
- **Restaurar Todo**: Restaura todos los datos desde la nube (sobrescribe datos locales)
- **Restauración Selectiva**: Restaura solo ciertos tipos de datos (próximamente)

## 📊 Datos Sincronizados

Los siguientes datos se sincronizan automáticamente:

- ✅ **Transacciones**: Todos los gastos, ingresos y transferencias
- ✅ **Categorías**: Categorías y subcategorías personalizadas
- ✅ **Presupuestos**: Configuración de presupuestos mensuales
- ✅ **Metas**: Metas financieras y progreso
- ✅ **Cuentas Bancarias**: Información de cuentas y balances
- ✅ **Configuraciones**: Preferencias del usuario

## 🔒 Seguridad y Privacidad

### Encriptación
- Todos los datos se encriptan antes de enviarse a la nube
- Las credenciales se almacenan de forma segura en el navegador
- No se comparten datos con terceros

### Control de Acceso
- Solo tú tienes acceso a tus datos
- Cada servicio usa sus propios mecanismos de autenticación
- Puedes desconectar servicios en cualquier momento

### Backup
- Los datos se almacenan tanto localmente como en la nube
- Si un servicio falla, siempre tienes acceso a tus datos locales
- Puedes cambiar de servicio sin perder datos

## 🛠️ Solución de Problemas

### Error de Conexión
1. Verifica que las credenciales sean correctas
2. Asegúrate de que el servicio esté habilitado
3. Revisa tu conexión a internet
4. Prueba la conexión desde el modal

### Datos No Sincronizados
1. Verifica que el servicio esté configurado correctamente
2. Haz clic en "Sincronizar Ahora" manualmente
3. Revisa el historial de sincronización
4. Contacta soporte si el problema persiste

### Cambiar de Servicio
1. Configura el nuevo servicio
2. Sincroniza desde el nuevo servicio
3. Desconecta el servicio anterior
4. Los datos se mantendrán en ambos lugares

## 📱 Uso en Móviles

La sincronización en la nube funciona perfectamente en dispositivos móviles:

- **PWA**: Instala JM Budget como aplicación
- **Sincronización automática**: Los datos se sincronizan entre dispositivos
- **Acceso offline**: Puedes usar la app sin conexión
- **Sincronización al reconectar**: Los cambios se sincronizan automáticamente

## 🎯 Mejores Prácticas

### Recomendaciones de Seguridad
- Usa contraseñas fuertes para tus cuentas de nube
- Habilita la autenticación de dos factores cuando sea posible
- Revisa regularmente los permisos de las aplicaciones
- Mantén actualizada la aplicación JM Budget

### Optimización de Rendimiento
- Elige un servicio cercano a tu ubicación
- Evita sincronizar archivos muy grandes
- Usa sincronización automática con intervalos razonables
- Limpia datos antiguos regularmente

### Backup Regular
- Configura múltiples servicios para redundancia
- Haz backups manuales periódicamente
- Exporta datos importantes en formato JSON
- Mantén copias locales como respaldo

## 🔮 Funciones Futuras

Próximamente se agregarán:

- 🔄 **Sincronización en tiempo real** entre dispositivos
- 📊 **Análisis de uso** de almacenamiento
- 🔐 **Encriptación adicional** de datos sensibles
- 📱 **Notificaciones push** de sincronización
- 🌐 **Soporte para más servicios** (Box, Amazon Drive, etc.)
- 📈 **Métricas de sincronización** y rendimiento

## 📞 Soporte

Si tienes problemas con la sincronización:

1. **Revisa esta guía** para soluciones comunes
2. **Verifica la configuración** del servicio elegido
3. **Prueba la conexión** desde el modal
4. **Contacta soporte** con detalles del error

---

**¡Disfruta de la libertad de elegir dónde sincronizar tus datos financieros!** 💰✨ 