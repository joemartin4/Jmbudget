# 📱 Guía de Despliegue para Móviles

## 🚀 Opciones para Acceso Móvil

### **1. 🌐 Acceso Web (Recomendado)**

#### **Opción A: Servidor Local en Red WiFi**
```bash
# Ejecutar servidor en modo red
python3 -m http.server 8000 --bind 0.0.0.0

# Encontrar IP de la computadora
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Pasos:**
1. Ejecutar el comando arriba en tu computadora
2. Anotar la IP (ej: 192.168.1.100)
3. En celulares: abrir navegador → `http://192.168.1.100:8000`
4. Ambos deben estar en la misma WiFi

#### **Opción B: Despliegue en la Nube (Mejor opción)**

**Servicios Gratuitos Recomendados:**

##### **Netlify (Más Fácil)**
1. Crear cuenta en [netlify.com](https://netlify.com)
2. Arrastrar la carpeta del proyecto
3. URL automática: `https://tu-app.netlify.app`

##### **Vercel (Excelente)**
1. Crear cuenta en [vercel.com](https://vercel.com)
2. Conectar repositorio GitHub
3. Despliegue automático

##### **GitHub Pages**
1. Subir código a GitHub
2. Activar GitHub Pages
3. URL: `https://tu-usuario.github.io/tu-repo`

### **2. 📱 Aplicación Móvil Nativa**

#### **PWA (Progressive Web App) - Ya Configurado**
- ✅ La aplicación ya es PWA
- ✅ Se puede instalar en pantalla de inicio
- ✅ Funciona offline
- ✅ Sincronización en la nube

**Cómo instalar:**
1. Abrir la aplicación en navegador móvil
2. Buscar "Añadir a pantalla de inicio" o "Instalar app"
3. Confirmar instalación

### **3. 🔄 Sincronización Multi-Usuario**

#### **Configuración Actual (Global)**
- ✅ Todos los usuarios comparten los mismos datos
- ✅ Sincronización automática con Firebase
- ✅ No requiere configuración individual

#### **Configuración Multi-Usuario (Opcional)**
Si quieres datos separados por usuario:
1. Modificar `firebase-config.js` para usar autenticación
2. Cada usuario tendría su propia cuenta
3. Datos separados por usuario

## 🎯 **Recomendación**

**Para tu caso específico:**
1. **Desplegar en Netlify** (gratis y fácil)
2. **Usar la configuración global actual** (compartir datos)
3. **Instalar como PWA** en ambos celulares

## 📋 **Pasos Rápidos para Despliegue**

### **Netlify (5 minutos)**
1. Ir a [netlify.com](https://netlify.com)
2. Crear cuenta gratuita
3. Arrastrar carpeta `JMbudget` al área de drop
4. Copiar URL generada
5. Compartir URL con tu esposa

### **Vercel (5 minutos)**
1. Ir a [vercel.com](https://vercel.com)
2. Conectar con GitHub
3. Importar repositorio
4. Desplegar automáticamente

## 🔧 **Configuración de Dominio Personalizado (Opcional)**
- Comprar dominio (ej: `mibudget.com`)
- Configurar en Netlify/Vercel
- URL profesional y fácil de recordar

## 📞 **Soporte**
- La aplicación funciona offline
- Sincronización automática cuando hay internet
- Datos seguros en Firebase
- Backup automático en la nube 