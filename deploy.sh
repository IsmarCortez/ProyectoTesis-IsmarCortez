#!/bin/bash

echo "🚀 Iniciando proceso de despliegue..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm run install:all

# Construir frontend
echo "🏗️ Construyendo frontend..."
npm run build:frontend

# Verificar que todo está listo
echo "✅ Verificando configuración..."
echo "📁 Archivos listos para despliegue:"
ls -la frontend/build/

echo "🎯 Listo para desplegar en Railway!"
echo "📝 Recuerda configurar las variables de entorno en Railway"

