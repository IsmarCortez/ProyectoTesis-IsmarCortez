#!/bin/bash

echo "🧪 INSTALANDO SISTEMA DE TESTING - TALLER MECÁNICO"
echo "=================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

print_status "Instalando dependencias de testing para el backend..."

# Instalar dependencias del backend
cd backend
if [ -f "package.json" ]; then
    npm install --save-dev jest supertest nodemon
    if [ $? -eq 0 ]; then
        print_success "Dependencias del backend instaladas correctamente"
    else
        print_error "Error instalando dependencias del backend"
        exit 1
    fi
else
    print_error "No se encontró package.json en el directorio backend"
    exit 1
fi

cd ..

print_status "Verificando dependencias del frontend..."

# Verificar dependencias del frontend
cd frontend
if [ -f "package.json" ]; then
    # Las dependencias de testing ya están incluidas
    print_success "Dependencias del frontend ya están configuradas"
else
    print_error "No se encontró package.json en el directorio frontend"
    exit 1
fi

cd ..

print_status "Creando base de datos de prueba..."

# Crear base de datos de prueba (requiere MySQL)
echo "CREATE DATABASE IF NOT EXISTS taller_mecanico_test;" | mysql -u root -p 2>/dev/null
if [ $? -eq 0 ]; then
    print_success "Base de datos de prueba creada"
else
    print_warning "No se pudo crear la base de datos de prueba automáticamente"
    print_warning "Crea manualmente: CREATE DATABASE taller_mecanico_test;"
fi

print_status "Configurando variables de entorno..."

# Crear archivo .env de ejemplo para testing
cat > backend/.env.test << EOF
NODE_ENV=test
DB_TEST_DATABASE=taller_mecanico_test
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_PORT=3306
EOF

print_success "Archivo .env.test creado en backend/"

print_status "Verificando configuración..."

# Verificar que los archivos de test existen
if [ -f "backend/tests/setup.js" ]; then
    print_success "✅ Setup de tests del backend configurado"
else
    print_error "❌ No se encontró backend/tests/setup.js"
fi

if [ -f "frontend/src/setupTests.js" ]; then
    print_success "✅ Setup de tests del frontend configurado"
else
    print_error "❌ No se encontró frontend/src/setupTests.js"
fi

if [ -f "backend/jest.config.js" ]; then
    print_success "✅ Configuración de Jest del backend lista"
else
    print_error "❌ No se encontró backend/jest.config.js"
fi

echo ""
echo "🎉 INSTALACIÓN COMPLETADA"
echo "========================="
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo ""
echo "1. 🔧 Configurar base de datos de prueba:"
echo "   mysql -u root -p"
echo "   CREATE DATABASE taller_mecanico_test;"
echo ""
echo "2. ⚙️  Configurar variables de entorno:"
echo "   Editar backend/.env.test con tus credenciales"
echo ""
echo "3. 🧪 Ejecutar tests del backend:"
echo "   cd backend && npm test"
echo ""
echo "4. 🎨 Ejecutar tests del frontend:"
echo "   cd frontend && npm test"
echo ""
echo "5. 📊 Ver cobertura de tests:"
echo "   cd backend && npm run test:coverage"
echo "   cd frontend && npm run test:coverage"
echo ""
echo "6. ⚡ Ejecutar tests de rendimiento:"
echo "   cd backend && npm run test:performance"
echo ""
echo "📚 Para más información, consulta README_TESTING.md"
echo ""
print_success "¡Sistema de testing listo para usar!"


