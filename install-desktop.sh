#!/bin/bash

# 🖥️ JM Budget - Instalador de Aplicación de Escritorio
# Script de instalación rápida para macOS, Windows y Linux

echo "🚀 JM Budget - Instalador de Aplicación de Escritorio"
echo "=================================================="

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado."
    echo "📥 Por favor, instala Node.js desde: https://nodejs.org/"
    echo "💡 Recomendamos la versión LTS (Long Term Support)"
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js versión $NODE_VERSION detectada."
    echo "📥 Se requiere Node.js versión 16 o superior."
    echo "💡 Actualiza Node.js desde: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado."
    echo "📥 npm debería venir con Node.js. Reinstala Node.js."
    exit 1
fi

echo "✅ npm $(npm -v) detectado"

# Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias."
    echo "💡 Intenta ejecutar: npm cache clean --force"
    exit 1
fi

echo "✅ Dependencias instaladas correctamente"

# Detectar sistema operativo
OS=$(uname -s)
case "$OS" in
    Darwin*)    PLATFORM="macOS" ;;
    Linux*)     PLATFORM="Linux" ;;
    MINGW*|CYGWIN*|MSYS*) PLATFORM="Windows" ;;
    *)          PLATFORM="Unknown" ;;
esac

echo ""
echo "🖥️  Sistema detectado: $PLATFORM"

# Mostrar opciones de construcción
echo ""
echo "🔨 Opciones de construcción:"
echo "1. Ejecutar en modo desarrollo"
echo "2. Construir para $PLATFORM"
echo "3. Construir para todas las plataformas"
echo "4. Solo construir para macOS"
echo "5. Solo construir para Windows"
echo "6. Solo construir para Linux"
echo ""

read -p "Selecciona una opción (1-6): " choice

case $choice in
    1)
        echo "🚀 Ejecutando en modo desarrollo..."
        npm run dev
        ;;
    2)
        echo "🔨 Construyendo para $PLATFORM..."
        case "$PLATFORM" in
            macOS) npm run build:mac ;;
            Linux) npm run build:linux ;;
            Windows) npm run build:win ;;
        esac
        ;;
    3)
        echo "🔨 Construyendo para todas las plataformas..."
        npm run build
        ;;
    4)
        echo "🍎 Construyendo para macOS..."
        npm run build:mac
        ;;
    5)
        echo "🪟 Construyendo para Windows..."
        npm run build:win
        ;;
    6)
        echo "🐧 Construyendo para Linux..."
        npm run build:linux
        ;;
    *)
        echo "❌ Opción inválida."
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Construcción completada exitosamente!"
    echo ""
    echo "📁 Los archivos de distribución se encuentran en:"
    echo "   ./dist/"
    echo ""
    echo "🎉 ¡JM Budget está listo para usar!"
    echo ""
    echo "📖 Para más información, consulta: DESKTOP_APP.md"
else
    echo ""
    echo "❌ Error durante la construcción."
    echo "💡 Verifica los logs de error arriba."
    exit 1
fi 