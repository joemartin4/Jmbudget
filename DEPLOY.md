# 🚀 Guía de Despliegue - JM Budget

## 📋 Requisitos Previos

### Para Uso Local
- Navegador web moderno (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- No requiere servidor web (funciona directamente)

### Para Despliegue Web
- Cuenta en un servicio de hosting
- Conocimientos básicos de FTP o Git

## 🎯 Opciones de Despliegue

### 1. Uso Directo (Recomendado para Pruebas)
```bash
# Simplemente abre el archivo index.html en tu navegador
# O usa un servidor local:

# Con Python 3
python -m http.server 8000

# Con Node.js
npx http-server

# Con PHP
php -S localhost:8000
```

### 2. GitHub Pages (Gratuito)
```bash
# 1. Crea un repositorio en GitHub
# 2. Sube todos los archivos
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/jm-budget.git
git push -u origin main

# 3. Ve a Settings > Pages
# 4. Selecciona "Deploy from a branch"
# 5. Selecciona "main" branch
# 6. Tu sitio estará disponible en: https://tu-usuario.github.io/jm-budget
```

### 3. Netlify (Gratuito)
```bash
# 1. Ve a netlify.com
# 2. Arrastra la carpeta del proyecto
# 3. ¡Listo! Tu sitio estará disponible en: https://tu-sitio.netlify.app
```

### 4. Vercel (Gratuito)
```bash
# 1. Instala Vercel CLI
npm i -g vercel

# 2. Despliega
vercel

# 3. Sigue las instrucciones
```

### 5. Firebase Hosting (Gratuito)
```bash
# 1. Instala Firebase CLI
npm install -g firebase-tools

# 2. Inicia sesión
firebase login

# 3. Inicializa el proyecto
firebase init hosting

# 4. Despliega
firebase deploy
```

### 6. Hosting Tradicional (cPanel, etc.)
```bash
# 1. Sube todos los archivos via FTP
# 2. Asegúrate de que index.html esté en la raíz
# 3. Verifica que .htaccess esté presente
```

## 📁 Estructura de Archivos Requerida

```
jm-budget/
├── index.html          # Página principal
├── styles.css          # Estilos
├── script.js           # Lógica de la aplicación
├── config.js           # Configuración
├── manifest.json       # PWA manifest
├── .htaccess          # Configuración del servidor
├── package.json       # Configuración del proyecto
├── README.md          # Documentación
└── DEPLOY.md          # Esta guía
```

## 🔧 Configuración del Servidor

### Apache (.htaccess incluido)
- El archivo `.htaccess` ya está configurado
- Incluye compresión GZIP, cache, headers de seguridad
- No requiere configuración adicional

### Nginx
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/jm-budget;
    index index.html;

    # Compresión GZIP
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### IIS (web.config)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="SPA Routes" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/" />
                </rule>
            </rules>
        </rewrite>
        <staticContent>
            <mimeMap fileExtension=".json" mimeType="application/json" />
        </staticContent>
    </system.webServer>
</configuration>
```

## 🌐 Dominio Personalizado

### Configuración DNS
```bash
# Añade estos registros en tu proveedor DNS:
# A     @      tu-ip-del-servidor
# CNAME www    tu-dominio.com
```

### SSL/HTTPS
- **Let's Encrypt**: Gratuito, automático
- **Cloudflare**: SSL gratuito + CDN
- **Hosting providers**: Generalmente incluido

## 📱 PWA (Progressive Web App)

### Instalación
- La aplicación es PWA-ready
- Los usuarios pueden instalarla como app nativa
- Funciona offline (datos locales)

### Configuración
- `manifest.json` ya configurado
- Iconos SVG incluidos
- Service Worker (opcional para cache avanzado)

## 🔍 Verificación Post-Despliegue

### Checklist
- [ ] La página carga correctamente
- [ ] El login funciona
- [ ] Se pueden crear categorías
- [ ] Se pueden agregar transacciones
- [ ] Los gráficos se muestran
- [ ] El diseño es responsive
- [ ] HTTPS funciona (si aplica)
- [ ] PWA se puede instalar

### Herramientas de Verificación
```bash
# Lighthouse (Chrome DevTools)
# - Performance
# - Accessibility
# - Best Practices
# - SEO
# - PWA

# PageSpeed Insights
# https://pagespeed.web.dev/

# GTmetrix
# https://gtmetrix.com/
```

## 🛠️ Solución de Problemas

### Problemas Comunes

**La página no carga**
- Verifica que `index.html` esté en la raíz
- Revisa los logs del servidor
- Verifica permisos de archivos

**Los estilos no se cargan**
- Verifica que `styles.css` esté presente
- Revisa la consola del navegador (F12)
- Verifica rutas relativas

**JavaScript no funciona**
- Verifica que `script.js` esté presente
- Revisa la consola para errores
- Verifica que Chart.js se cargue

**PWA no se instala**
- Verifica que `manifest.json` esté presente
- Asegúrate de que esté en HTTPS
- Revisa los iconos en el manifest

### Logs Útiles
```bash
# Apache error log
tail -f /var/log/apache2/error.log

# Nginx error log
tail -f /var/log/nginx/error.log

# Browser console
F12 > Console
```

## 📊 Monitoreo

### Google Analytics
```html
<!-- Añade esto en el <head> de index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Uptime Monitoring
- **UptimeRobot**: Monitoreo gratuito
- **Pingdom**: Monitoreo avanzado
- **StatusCake**: Monitoreo con alertas

## 🔄 Actualizaciones

### Proceso de Actualización
1. **Desarrollo local**: Prueba cambios
2. **Backup**: Respalda la versión actual
3. **Despliegue**: Sube nuevos archivos
4. **Verificación**: Prueba funcionalidades
5. **Rollback**: Si es necesario, restaura backup

### Versionado
- Usa Git para control de versiones
- Tag releases importantes
- Mantén changelog actualizado

## 📞 Soporte

### Recursos Útiles
- **MDN Web Docs**: Documentación web
- **Can I Use**: Compatibilidad de navegadores
- **Web.dev**: Mejores prácticas
- **Lighthouse**: Auditoría de rendimiento

### Comunidad
- **Stack Overflow**: Preguntas técnicas
- **GitHub Issues**: Reporte de bugs
- **Discord/Slack**: Comunidad de desarrolladores

---

**¡Tu aplicación JM Budget está lista para el mundo! 🌍** 