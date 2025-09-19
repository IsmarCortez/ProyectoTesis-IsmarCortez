# 🧪 **GUÍA DE TESTING - SISTEMA TALLER MECÁNICO**

## 📋 **DESCRIPCIÓN GENERAL**

Esta guía explica cómo implementar y ejecutar tests básicos para el sistema de taller mecánico, incluyendo tests de funcionalidad, rendimiento e integración.

---

## 🏗️ **ARQUITECTURA DE TESTING**

### **Backend (Node.js + Jest + Supertest)**
```
📁 backend/
├── 📁 tests/
│   ├── 📁 api/           # Tests de endpoints
│   ├── 📁 performance/   # Tests de rendimiento
│   ├── 📁 integration/   # Tests de integración
│   └── 📄 setup.js       # Configuración global
├── 📄 jest.config.js     # Configuración de Jest
└── 📄 package.json       # Scripts y dependencias
```

### **Frontend (React + Jest + React Testing Library)**
```
📁 frontend/
├── 📁 src/
│   ├── 📁 components/
│   │   └── 📁 __tests__/ # Tests de componentes
│   └── 📄 setupTests.js  # Configuración global
└── 📄 package.json       # Scripts y dependencias
```

---

## 🚀 **INSTALACIÓN Y CONFIGURACIÓN**

### **1. Backend**

```bash
cd backend
npm install --save-dev jest supertest nodemon
```

### **2. Frontend**

```bash
cd frontend
# Las dependencias ya están incluidas en package.json
npm install
```

### **3. Base de Datos de Prueba**

Crear una base de datos de prueba:

```sql
CREATE DATABASE taller_mecanico_test;
```

Configurar variables de entorno:

```bash
# backend/.env
DB_TEST_DATABASE=taller_mecanico_test
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_PORT=3306
```

---

## 🧪 **TIPOS DE TESTS IMPLEMENTADOS**

### **1. 🔧 Tests de API (Backend)**

#### **Tests de Clientes:**
- ✅ GET /api/clientes - Listar clientes
- ✅ GET /api/clientes/nit/:nit - Buscar por NIT
- ✅ POST /api/clientes - Crear cliente
- ✅ PUT /api/clientes/:id - Actualizar cliente
- ✅ DELETE /api/clientes/:id - Eliminar cliente

#### **Tests de Órdenes:**
- ✅ GET /api/ordenes - Listar órdenes
- ✅ POST /api/ordenes - Crear orden
- ✅ POST /api/ordenes (CF) - Consumidor Final
- ✅ PUT /api/ordenes/:id - Actualizar orden
- ✅ DELETE /api/ordenes/:id - Eliminar orden

### **2. ⚡ Tests de Rendimiento**

#### **Tests de Carga:**
- ✅ Tiempo de respuesta < 500ms (clientes)
- ✅ Tiempo de respuesta < 800ms (órdenes)
- ✅ Tiempo de respuesta < 600ms (vehículos)

#### **Tests de Carga Concurrente:**
- ✅ 10 requests simultáneos a /api/clientes
- ✅ 5 órdenes creadas simultáneamente
- ✅ Verificación de uso de memoria

### **3. 🎨 Tests de Componentes (Frontend)**

#### **Tests de Login:**
- ✅ Renderizado del formulario
- ✅ Validación de campos requeridos
- ✅ Login exitoso
- ✅ Manejo de errores
- ✅ Enlace de recuperar contraseña

#### **Tests de Órdenes:**
- ✅ Renderizado del formulario
- ✅ Búsqueda de cliente por NIT
- ✅ Funcionalidad Consumidor Final (CF)
- ✅ Validación de campos
- ✅ Tabla de órdenes

#### **Tests de Clientes:**
- ✅ Formulario de clientes
- ✅ Verificación por NIT
- ✅ Validaciones de campos
- ✅ Tabla de clientes

#### **Tests de Dashboard:**
- ✅ Renderizado de estadísticas
- ✅ Gráficos (Chart.js)
- ✅ Manejo de errores

### **4. 🔗 Tests de Integración End-to-End**

#### **Flujo Completo:**
- ✅ Cliente → Vehículo → Orden → Notificación
- ✅ Consumidor Final (CF)
- ✅ CRUD completo de clientes
- ✅ Validaciones de integridad

---

## 🏃‍♂️ **EJECUTAR TESTS**

### **Backend**

```bash
cd backend

# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con coverage
npm run test:coverage

# Ejecutar solo tests de rendimiento
npm run test:performance
```

### **Frontend**

```bash
cd frontend

# Ejecutar todos los tests
npm test

# Ejecutar tests con coverage
npm run test:coverage

# Ejecutar tests para CI/CD
npm run test:ci
```

---

## 📊 **COBERTURA DE TESTS**

### **Objetivos de Cobertura:**
- **Líneas de código**: > 80%
- **Funciones**: > 90%
- **Ramas**: > 70%
- **Declaraciones**: > 80%

### **Verificar Cobertura:**

```bash
# Backend
cd backend && npm run test:coverage

# Frontend
cd frontend && npm run test:coverage
```

Los reportes se generan en:
- `backend/coverage/`
- `frontend/coverage/`

---

## 🎯 **TESTS DE RENDIMIENTO**

### **Métricas Objetivo:**

| Endpoint | Tiempo Máximo | Requests Concurrentes |
|----------|---------------|----------------------|
| GET /api/clientes | 500ms | 10 |
| GET /api/ordenes | 800ms | 5 |
| GET /api/vehiculos | 600ms | 8 |
| POST /api/ordenes | 1000ms | 3 |

### **Ejecutar Tests de Rendimiento:**

```bash
cd backend
npm run test:performance
```

---

## 🔧 **CONFIGURACIÓN AVANZADA**

### **Variables de Entorno para Tests:**

```bash
# backend/.env.test
NODE_ENV=test
DB_TEST_DATABASE=taller_mecanico_test
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=test_password
DB_PORT=3306
```

### **Configuración de Jest (Backend):**

```javascript
// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  verbose: true
};
```

---

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### **Problemas Comunes:**

#### **1. Error de conexión a base de datos:**
```bash
# Verificar que MySQL esté ejecutándose
sudo service mysql start

# Verificar credenciales en .env
cat backend/.env
```

#### **2. Tests fallan por datos existentes:**
```bash
# Limpiar base de datos de prueba
mysql -u root -p
DROP DATABASE taller_mecanico_test;
CREATE DATABASE taller_mecanico_test;
```

#### **3. Timeout en tests de rendimiento:**
```bash
# Aumentar timeout en jest.config.js
testTimeout: 15000
```

#### **4. Mocks no funcionan en frontend:**
```bash
# Verificar setupTests.js
# Asegurar que los mocks estén correctamente configurados
```

---

## 📈 **MEJORES PRÁCTICAS**

### **1. Escribir Tests Efectivos:**
- ✅ Un test por funcionalidad
- ✅ Nombres descriptivos
- ✅ Arrange-Act-Assert pattern
- ✅ Limpiar datos después de cada test

### **2. Tests de Rendimiento:**
- ✅ Medir tiempos reales
- ✅ Probar carga concurrente
- ✅ Monitorear uso de memoria
- ✅ Establecer límites realistas

### **3. Tests de Integración:**
- ✅ Probar flujos completos
- ✅ Verificar integridad de datos
- ✅ Simular escenarios reales
- ✅ Validar relaciones entre entidades

---

## 🎯 **PRÓXIMOS PASOS**

### **Mejoras Sugeridas:**

1. **Tests de UI Automatizados:**
   - Cypress para E2E
   - Playwright para cross-browser

2. **Tests de Carga Avanzados:**
   - Artillery.js para carga masiva
   - K6 para performance testing

3. **Tests de Seguridad:**
   - OWASP ZAP integration
   - Penetration testing

4. **CI/CD Integration:**
   - GitHub Actions
   - Automated testing pipeline

---

## 📚 **RECURSOS ADICIONALES**

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## ✅ **RESUMEN**

El sistema de testing implementado incluye:

- ✅ **Tests de API** completos para todos los endpoints
- ✅ **Tests de rendimiento** con métricas específicas
- ✅ **Tests de componentes** React con React Testing Library
- ✅ **Tests de integración** end-to-end
- ✅ **Configuración** de cobertura y reporting
- ✅ **Documentación** completa y guías de uso

**El sistema está listo para testing en desarrollo y producción.**


