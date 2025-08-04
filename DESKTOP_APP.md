# 🖥️ JM Budget - Aplicación de Escritorio

## 📋 Descripción

JM Budget ahora está disponible como una aplicación nativa de escritorio para **macOS**, **Windows** y **Linux**, construida con **Electron**.

## ✨ Características de la App de Escritorio

### 🎯 **Funcionalidades Nativas:**
- **Menú nativo** del sistema operativo
- **Atajos de teclado** (Cmd/Ctrl + N, I, E)
- **Integración con el sistema** (Dock, Taskbar, etc.)
- **Ventana redimensionable** con tamaños mínimos
- **Icono personalizado** en la barra de tareas
- **Prevención de múltiples instancias**

### 🔧 **Características Técnicas:**
- **Rendimiento optimizado** - Más rápido que en navegador
- **Almacenamiento local** - Datos guardados en el sistema
- **Sin dependencias de internet** - Funciona offline
- **Actualizaciones automáticas** - Sistema integrado
- **Seguridad mejorada** - Context isolation

## 🚀 Instalación

### **Requisitos Previos:**
- **Node.js** (versión 16 o superior)
- **npm** (incluido con Node.js)

### **Pasos de Instalación:**

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/joemartin4/Jmbudget.git
   cd Jmbudget
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

4. **Construir la aplicación:**
   ```bash
   # Para todas las plataformas
   npm run build
   
   # Solo para macOS
   npm run build:mac
   
   # Solo para Windows
   npm run build:win
   
   # Solo para Linux
   npm run build:linux
   ```

## 📦 Formatos de Distribución

### **macOS:**
- **.dmg** - Instalador con interfaz gráfica
- **.zip** - Archivo comprimido portable

### **Windows:**
- **.exe** - Instalador NSIS
- **.exe** - Versión portable

### **Linux:**
- **.AppImage** - Aplicación portable
- **.deb** - Paquete Debian/Ubuntu

## 🎮 Uso de la Aplicación

### **Atajos de Teclado:**
- **Cmd/Ctrl + N** - Nueva transacción
- **Cmd/Ctrl + I** - Importar datos
- **Cmd/Ctrl + E** - Exportar datos
- **Cmd/Ctrl + R** - Recargar aplicación
- **Cmd/Ctrl + Shift + I** - Abrir DevTools

### **Menú de la Aplicación:**

#### **Archivo:**
- Nueva Transacción
- Importar Datos
- Exportar Datos

#### **Editar:**
- Deshacer/Rehacer
- Cortar/Copiar/Pegar
- Seleccionar Todo

#### **Ver:**
- Recargar
- Zoom In/Out
- Pantalla Completa

#### **Ayuda:**
- Acerca de JM Budget
- Documentación
- Reportar Problema

## 🔧 Desarrollo

### **Estructura del Proyecto:**
```
JMbudget/
├── electron/
│   ├── main.js          # Proceso principal
│   └── preload.js       # Script de precarga
├── assets/
│   ├── icon.png         # Icono principal
│   ├── icon.icns        # Icono macOS
│   └── icon.ico         # Icono Windows
├── package.json         # Configuración del proyecto
└── index.html           # Aplicación web
```

### **Scripts Disponibles:**
- `npm start` - Ejecutar aplicación
- `npm run dev` - Modo desarrollo
- `npm run build` - Construir para distribución
- `npm run build:mac` - Construir para macOS
- `npm run build:win` - Construir para Windows
- `npm run build:linux` - Construir para Linux

## 🎨 Personalización

### **Iconos:**
Coloca tus iconos personalizados en la carpeta `assets/`:
- `icon.png` - Icono principal (512x512)
- `icon.icns` - Icono macOS
- `icon.ico` - Icono Windows

### **Configuración:**
Modifica `package.json` para personalizar:
- Nombre de la aplicación
- Versión
- Descripción
- Configuración de build

## 🔄 Actualizaciones

### **Automáticas:**
La aplicación verifica actualizaciones automáticamente al iniciar.

### **Manuales:**
Puedes implementar tu propio sistema de actualizaciones modificando la función `checkForUpdates()` en `electron/main.js`.

## 🛠️ Solución de Problemas

### **Error de Permisos (macOS):**
```bash
# Dar permisos de ejecución
chmod +x dist/mac/JM\ Budget.app/Contents/MacOS/JM\ Budget
```

### **Error de Dependencias:**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### **Error de Build:**
```bash
# Limpiar cache
npm run postinstall
npm run build
```

## 📱 Comparación: Web vs Desktop

| Característica | Web | Desktop |
|----------------|-----|---------|
| **Rendimiento** | ⚡ | ⚡⚡⚡ |
| **Offline** | ❌ | ✅ |
| **Menú nativo** | ❌ | ✅ |
| **Atajos de teclado** | ⚠️ | ✅ |
| **Almacenamiento** | Limitado | Completo |
| **Actualizaciones** | Manual | Automática |
| **Instalación** | No requiere | Requiere |

## 🌐 Enlaces Útiles

- **Repositorio:** https://github.com/joemartin4/Jmbudget
- **Aplicación Web:** https://joemartin4.github.io/Jmbudget/
- **Issues:** https://github.com/joemartin4/Jmbudget/issues
- **Documentación Electron:** https://www.electronjs.org/docs

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**¡Disfruta usando JM Budget como aplicación de escritorio!** 🎉 