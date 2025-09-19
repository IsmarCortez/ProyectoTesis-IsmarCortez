# Script de PowerShell para instalar sistema de testing
# Ejecutar con: powershell -ExecutionPolicy Bypass -File install-tests.ps1

Write-Host "🧪 INSTALANDO SISTEMA DE TESTING - TALLER MECÁNICO" -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue

# Función para mostrar mensajes
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
}

Write-Status "Instalando dependencias de testing para el backend..."

# Instalar dependencias del backend
Set-Location backend
if (Test-Path "package.json") {
    try {
        npm install --save-dev jest supertest nodemon
        Write-Success "Dependencias del backend instaladas correctamente"
    }
    catch {
        Write-Error "Error instalando dependencias del backend: $_"
        exit 1
    }
}
else {
    Write-Error "No se encontró package.json en el directorio backend"
    exit 1
}

Set-Location ..

Write-Status "Verificando dependencias del frontend..."

# Verificar dependencias del frontend
Set-Location frontend
if (Test-Path "package.json") {
    Write-Success "Dependencias del frontend ya están configuradas"
}
else {
    Write-Error "No se encontró package.json en el directorio frontend"
    exit 1
}

Set-Location ..

Write-Status "Configurando variables de entorno..."

# Crear archivo .env de ejemplo para testing
$envContent = @"
NODE_ENV=test
DB_TEST_DATABASE=taller_mecanico_test
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_PORT=3306
"@

$envContent | Out-File -FilePath "backend\.env.test" -Encoding UTF8
Write-Success "Archivo .env.test creado en backend/"

Write-Status "Verificando configuración..."

# Verificar que los archivos de test existen
if (Test-Path "backend\tests\setup.js") {
    Write-Success "✅ Setup de tests del backend configurado"
}
else {
    Write-Error "❌ No se encontró backend\tests\setup.js"
}

if (Test-Path "frontend\src\setupTests.js") {
    Write-Success "✅ Setup de tests del frontend configurado"
}
else {
    Write-Error "❌ No se encontró frontend\src\setupTests.js"
}

if (Test-Path "backend\jest.config.js") {
    Write-Success "✅ Configuración de Jest del backend lista"
}
else {
    Write-Error "❌ No se encontró backend\jest.config.js"
}

Write-Host ""
Write-Host "🎉 INSTALACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 🔧 Configurar base de datos de prueba:" -ForegroundColor White
Write-Host "   mysql -u root -p" -ForegroundColor Gray
Write-Host "   CREATE DATABASE taller_mecanico_test;" -ForegroundColor Gray
Write-Host ""
Write-Host "2. ⚙️  Configurar variables de entorno:" -ForegroundColor White
Write-Host "   Editar backend\.env.test con tus credenciales" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 🧪 Ejecutar tests del backend:" -ForegroundColor White
Write-Host "   cd backend && npm test" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 🎨 Ejecutar tests del frontend:" -ForegroundColor White
Write-Host "   cd frontend && npm test" -ForegroundColor Gray
Write-Host ""
Write-Host "5. 📊 Ver cobertura de tests:" -ForegroundColor White
Write-Host "   cd backend && npm run test:coverage" -ForegroundColor Gray
Write-Host "   cd frontend && npm run test:coverage" -ForegroundColor Gray
Write-Host ""
Write-Host "6. ⚡ Ejecutar tests de rendimiento:" -ForegroundColor White
Write-Host "   cd backend && npm run test:performance" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Para más información, consulta README_TESTING.md" -ForegroundColor Cyan
Write-Host ""
Write-Success "¡Sistema de testing listo para usar!"


