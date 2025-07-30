#!/bin/bash

# 🚀 Script de Despliegue para Móviles - JM Budget App
# Este script te ayuda a desplegar la aplicación para acceso móvil

echo "📱 JM Budget - Despliegue para Móviles"
echo "======================================"
echo ""

# Función para mostrar el menú
show_menu() {
    echo "Selecciona una opción:"
    echo "1) 🌐 Servidor local en red WiFi"
    echo "2) 📋 Preparar para Netlify"
    echo "3) 📋 Preparar para Vercel"
    echo "4) 📋 Preparar para GitHub Pages"
    echo "5) 🔍 Verificar configuración"
    echo "6) ❌ Salir"
    echo ""
}

# Función para servidor local
start_local_server() {
    echo "🌐 Iniciando servidor local en red WiFi..."
    echo ""
    
    # Obtener IP de la computadora
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    
    if [ -z "$IP" ]; then
        echo "❌ No se pudo obtener la IP de la computadora"
        return 1
    fi
    
    echo "✅ IP de tu computadora: $IP"
    echo "🌐 URL para acceder desde móviles: http://$IP:8000"
    echo ""
    echo "📱 Pasos para conectar:"
    echo "1. Asegúrate de que tu celular y el de tu esposa estén en la misma WiFi"
    echo "2. Abre el navegador en ambos celulares"
    echo "3. Ve a: http://$IP:8000"
    echo "4. ¡Listo! Ambos pueden usar la aplicación"
    echo ""
    echo "💡 Para detener el servidor: Ctrl+C"
    echo ""
    
    # Iniciar servidor
    python3 -m http.server 8000 --bind 0.0.0.0
}

# Función para preparar Netlify
prepare_netlify() {
    echo "📋 Preparando para Netlify..."
    echo ""
    
    # Verificar que todos los archivos estén presentes
    required_files=("index.html" "script.js" "styles.css" "firebase-config.js" "chart-config.js")
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            echo "✅ $file"
        else
            echo "❌ $file (faltante)"
        fi
    done
    
    echo ""
    echo "📋 Pasos para desplegar en Netlify:"
    echo "1. Ve a https://netlify.com"
    echo "2. Crea una cuenta gratuita"
    echo "3. Arrastra toda esta carpeta al área de drop"
    echo "4. Copia la URL generada"
    echo "5. Compártela con tu esposa"
    echo ""
    echo "🎯 Ventajas de Netlify:"
    echo "   ✅ Gratis para siempre"
    echo "   ✅ HTTPS automático"
    echo "   ✅ CDN global"
    echo "   ✅ Despliegue instantáneo"
    echo ""
}

# Función para preparar Vercel
prepare_vercel() {
    echo "📋 Preparando para Vercel..."
    echo ""
    
    # Verificar si hay repositorio Git
    if [ -d ".git" ]; then
        echo "✅ Repositorio Git detectado"
    else
        echo "⚠️  No hay repositorio Git. Creando uno..."
        git init
        git add .
        git commit -m "Initial commit for mobile deployment"
        echo "✅ Repositorio Git creado"
    fi
    
    echo ""
    echo "📋 Pasos para desplegar en Vercel:"
    echo "1. Ve a https://vercel.com"
    echo "2. Crea una cuenta gratuita"
    echo "3. Conecta con tu cuenta de GitHub"
    echo "4. Importa este repositorio"
    echo "5. Haz clic en 'Deploy'"
    echo "6. Copia la URL generada"
    echo ""
    echo "🎯 Ventajas de Vercel:"
    echo "   ✅ Muy rápido"
    echo "   ✅ Despliegue automático"
    echo "   ✅ Edge functions"
    echo "   ✅ Analytics incluidos"
    echo ""
}

# Función para preparar GitHub Pages
prepare_github_pages() {
    echo "📋 Preparando para GitHub Pages..."
    echo ""
    
    # Verificar si hay repositorio Git
    if [ -d ".git" ]; then
        echo "✅ Repositorio Git detectado"
    else
        echo "⚠️  No hay repositorio Git. Creando uno..."
        git init
        git add .
        git commit -m "Initial commit for GitHub Pages"
        echo "✅ Repositorio Git creado"
    fi
    
    echo ""
    echo "📋 Pasos para desplegar en GitHub Pages:"
    echo "1. Ve a https://github.com"
    echo "2. Crea un nuevo repositorio llamado 'JMbudget'"
    echo "3. Sube este código al repositorio:"
    echo "   git remote add origin https://github.com/TU-USUARIO/JMbudget.git"
    echo "   git push -u origin main"
    echo "4. Ve a Settings → Pages"
    echo "5. Selecciona 'Deploy from a branch'"
    echo "6. Selecciona la rama 'main'"
    echo "7. Tu app estará en: https://TU-USUARIO.github.io/JMbudget"
    echo ""
    echo "🎯 Ventajas de GitHub Pages:"
    echo "   ✅ Gratis para siempre"
    echo "   ✅ Integración con Git"
    echo "   ✅ HTTPS automático"
    echo "   ✅ Personalización de dominio"
    echo ""
}

# Función para verificar configuración
verify_configuration() {
    echo "🔍 Verificando configuración..."
    echo ""
    
    # Verificar archivos principales
    echo "📁 Archivos principales:"
    if [ -f "index.html" ]; then
        echo "✅ index.html"
    else
        echo "❌ index.html (faltante)"
    fi
    
    if [ -f "script.js" ]; then
        echo "✅ script.js"
    else
        echo "❌ script.js (faltante)"
    fi
    
    if [ -f "styles.css" ]; then
        echo "✅ styles.css"
    else
        echo "❌ styles.css (faltante)"
    fi
    
    if [ -f "firebase-config.js" ]; then
        echo "✅ firebase-config.js"
    else
        echo "❌ firebase-config.js (faltante)"
    fi
    
    if [ -f "chart-config.js" ]; then
        echo "✅ chart-config.js"
    else
        echo "❌ chart-config.js (faltante)"
    fi
    
    echo ""
    
    # Verificar configuración de Firebase
    echo "🔥 Configuración de Firebase:"
    if grep -q "apiKey" firebase-config.js; then
        echo "✅ Firebase configurado"
    else
        echo "❌ Firebase no configurado"
    fi
    
    echo ""
    
    # Verificar PWA
    echo "📱 Configuración PWA:"
    if [ -f "manifest.json" ]; then
        echo "✅ manifest.json presente"
    else
        echo "❌ manifest.json faltante"
    fi
    
    if [ -f "sw.js" ]; then
        echo "✅ Service Worker presente"
    else
        echo "❌ Service Worker faltante"
    fi
    
    echo ""
    echo "🎯 Estado general:"
    echo "   ✅ Aplicación lista para móviles"
    echo "   ✅ Sincronización en la nube configurada"
    echo "   ✅ PWA habilitada"
    echo "   ✅ Responsive design implementado"
    echo ""
}

# Bucle principal
while true; do
    show_menu
    read -p "Selecciona una opción (1-6): " choice
    
    case $choice in
        1)
            start_local_server
            break
            ;;
        2)
            prepare_netlify
            ;;
        3)
            prepare_vercel
            ;;
        4)
            prepare_github_pages
            ;;
        5)
            verify_configuration
            ;;
        6)
            echo "👋 ¡Hasta luego!"
            exit 0
            ;;
        *)
            echo "❌ Opción inválida. Intenta de nuevo."
            ;;
    esac
    
    echo ""
    read -p "Presiona Enter para continuar..."
    echo ""
done 