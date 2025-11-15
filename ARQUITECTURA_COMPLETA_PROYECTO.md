# 🏗️ ARQUITECTURA COMPLETA DEL PROYECTO
## Sistema de Gestión de Taller Mecánico - TECNOAUTO

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura General](#arquitectura-general)
4. [Base de Datos](#base-de-datos)
5. [Backend (API REST)](#backend-api-rest)
6. [Frontend (React SPA)](#frontend-react-spa)
7. [Servicios Externos](#servicios-externos)
8. [Despliegue](#despliegue)
9. [Estructura de Directorios](#estructura-de-directorios)
10. [Flujos de Trabajo Principales](#flujos-de-trabajo-principales)

---

## 🎯 RESUMEN EJECUTIVO

### **Nombre del Proyecto:** 
Sistema de Gestión de Taller Mecánico - TECNOAUTO

### **Tipo de Aplicación:**
Full-Stack Web Application (SPA + API REST)

### **Propósito:**
Sistema integral para gestión de órdenes de servicio, clientes, vehículos, y seguimiento de reparaciones en tiempo real para un taller mecánico.

### **Características Principales:**
- ✅ Gestión completa de órdenes de servicio
- ✅ Administración de clientes y vehículos
- ✅ Tracker público en tiempo real (sin autenticación)
- ✅ Sistema de notificaciones multicanal (Email + WhatsApp)
- ✅ Generación de reportes (PDF + Excel)
- ✅ Dashboard con estadísticas y gráficos
- ✅ Gestión multimedia (imágenes/videos en Cloudinary)
- ✅ Sistema de autenticación JWT
- ✅ Recuperación de contraseñas

---

## 🛠️ STACK TECNOLÓGICO

### **Frontend**
```yaml
Framework: React 19.1.0
Lenguaje: JavaScript (ES6+)
Routing: React Router DOM 7.7.0
UI Framework: Bootstrap 5.3.0
Gráficos: Chart.js 4.5.0 + React-ChartJS-2
HTTP Client: Axios 1.10.0
Build Tool: React Scripts 5.0.1 (Webpack)
Testing: React Testing Library + Jest
```

### **Backend**
```yaml
Runtime: Node.js 18+
Framework: Express 5.1.0
Lenguaje: JavaScript (ES6+)
Base de Datos: MySQL 8.0+
ORM: MySQL2 (Promise-based)
Autenticación: JWT (jsonwebtoken 9.0.2)
Encriptación: Crypto (SHA-256), Bcrypt 6.0.0
Testing: Jest 29.7.0 + Supertest
```

### **Servicios Externos**
```yaml
Almacenamiento: Cloudinary (imágenes/videos)
Email: Nodemailer 7.0.5 (Gmail API)
WhatsApp: whatsapp-web.js 1.32.0
PDF Generation: PDFKit 0.17.1
Excel Generation: ExcelJS 4.4.0
```

### **Infraestructura**
```yaml
Hosting: Railway.app
Contenedor: Docker (Node 18 Alpine)
Base de Datos: MySQL en Railway
CI/CD: Git push → Railway Deploy
```

---

## 🏛️ ARQUITECTURA GENERAL

### **Patrón de Arquitectura:** 
**Client-Server (3-Tier Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      USUARIO FINAL                           │
│                   (Navegador Web)                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTP/HTTPS
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  CAPA DE PRESENTACIÓN                        │
│                                                              │
│   ┌──────────────────────────────────────────────────┐     │
│   │         FRONTEND (React SPA)                      │     │
│   │  - Components (JSX)                               │     │
│   │  - State Management (useState, useEffect)         │     │
│   │  - Routing (React Router)                         │     │
│   │  - API Client (Axios)                             │     │
│   └──────────────────────────────────────────────────┘     │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ REST API (JSON)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   CAPA DE APLICACIÓN                         │
│                                                              │
│   ┌──────────────────────────────────────────────────┐     │
│   │        BACKEND (Express API)                      │     │
│   │                                                   │     │
│   │  ┌─────────────────────────────────────────┐    │     │
│   │  │     API Endpoints (Routes)              │    │     │
│   │  │  - /api/login                           │    │     │
│   │  │  - /api/clientes                        │    │     │
│   │  │  - /api/vehiculos                       │    │     │
│   │  │  - /api/ordenes                         │    │     │
│   │  │  - /api/dashboard                       │    │     │
│   │  │  - /api/reportes                        │    │     │
│   │  │  - /api/tracker                         │    │     │
│   │  └─────────────────────────────────────────┘    │     │
│   │                                                   │     │
│   │  ┌─────────────────────────────────────────┐    │     │
│   │  │     Servicios (Business Logic)          │    │     │
│   │  │  - notificationService.js               │    │     │
│   │  │  - pdfGenerator.js                      │    │     │
│   │  │  - reportService.js                     │    │     │
│   │  │  - emailService.js                      │    │     │
│   │  │  - whatsappService.js                   │    │     │
│   │  │  - cloudinaryService.js                 │    │     │
│   │  └─────────────────────────────────────────┘    │     │
│   │                                                   │     │
│   │  ┌─────────────────────────────────────────┐    │     │
│   │  │     Middlewares                          │    │     │
│   │  │  - CORS                                  │    │     │
│   │  │  - JWT Verification                      │    │     │
│   │  │  - Multer (File Upload)                 │    │     │
│   │  │  - Error Handling                        │    │     │
│   │  └─────────────────────────────────────────┘    │     │
│   └──────────────────────────────────────────────────┘     │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ SQL Queries
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   CAPA DE DATOS                              │
│                                                              │
│   ┌──────────────────────────────────────────────────┐     │
│   │         BASE DE DATOS (MySQL)                     │     │
│   │                                                   │     │
│   │  - tbl_usuarios                                   │     │
│   │  - tbl_clientes                                   │     │
│   │  - tbl_vehiculos                                  │     │
│   │  - tbl_servicios                                  │     │
│   │  - tbl_orden_estado                               │     │
│   │  - tbl_ordenes                                    │     │
│   │  - tbl_historial_estado_orden                     │     │
│   │  - tbl_password_reset_tokens                      │     │
│   │  - tbl_telefono_usuario                           │     │
│   │  - tbl_telefono_cliente                           │     │
│   └──────────────────────────────────────────────────┘     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  SERVICIOS EXTERNOS                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Cloudinary  │  │  Gmail API   │  │  WhatsApp    │      │
│  │  (Storage)   │  │  (Email)     │  │  Web.js      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗄️ BASE DE DATOS

### **Motor:** MySQL 8.0+
### **Encoding:** UTF8MB4 (soporte completo Unicode)
### **Collation:** utf8mb4_unicode_ci

### **Esquema de Tablas:**

```sql
taller_mecanico/
│
├── tbl_usuarios (10 tablas principales)
│   ├── pk_id_usuarios (INT, PK, AUTO_INCREMENT)
│   ├── nombre_usuario (VARCHAR 100)
│   ├── email_usuario (VARCHAR 100)
│   ├── contrasenia_usuario (VARCHAR 255, SHA-256)
│   ├── foto_perfil_usuario (VARCHAR 255)
│   └── pregunta_seguridad_usuario (VARCHAR 255)
│
├── tbl_clientes
│   ├── PK_id_cliente (INT, PK, AUTO_INCREMENT)
│   ├── nombre_cliente (VARCHAR 100, NOT NULL)
│   ├── apellido_cliente (VARCHAR 100)
│   ├── dpi_cliente (VARCHAR 13, UNIQUE)
│   ├── NIT (VARCHAR 13, UNIQUE)
│   ├── telefono_cliente (VARCHAR 8)
│   ├── correo_cliente (VARCHAR 100)
│   ├── direccion_cliente (TEXT)
│   └── fecha_registro_cliente (DATETIME, DEFAULT NOW)
│
├── tbl_vehiculos
│   ├── pk_id_vehiculo (INT, PK, AUTO_INCREMENT)
│   ├── placa_vehiculo (VARCHAR 7, UNIQUE)
│   ├── marca_vehiculo (VARCHAR 50)
│   ├── modelo_vehiculo (VARCHAR 50)
│   ├── anio_vehiculo (INT)
│   └── color_vehiculo (VARCHAR 30)
│
├── tbl_servicios
│   ├── pk_id_servicio (INT, PK, AUTO_INCREMENT)
│   ├── servicio (VARCHAR 50)
│   └── descripcion_servicios (VARCHAR 100)
│
├── tbl_orden_estado
│   ├── pk_id_estado (INT, PK, AUTO_INCREMENT)
│   ├── estado_orden (VARCHAR 50)
│   └── descripcion_estado (VARCHAR 100)
│
├── tbl_ordenes ⭐ (Tabla principal)
│   ├── pk_id_orden (INT, PK, AUTO_INCREMENT)
│   ├── fecha_ingreso_orden (DATETIME, DEFAULT NOW)
│   ├── fk_id_vehiculo (INT, FK → tbl_vehiculos)
│   ├── fk_id_cliente (INT, FK → tbl_clientes)
│   ├── fk_id_servicio (INT, FK → tbl_servicios)
│   ├── comentario_cliente_orden (TEXT)
│   ├── nivel_combustible_orden (ENUM: Reserva, 1/4, Medio, 3/4, Full)
│   ├── odometro_auto_cliente_orden (FLOAT)
│   ├── unidad_odometro (ENUM: km, millas)
│   ├── imagen_1 (VARCHAR 255, Cloudinary URL)
│   ├── imagen_2 (VARCHAR 255, Cloudinary URL)
│   ├── imagen_3 (VARCHAR 255, Cloudinary URL)
│   ├── imagen_4 (VARCHAR 255, Cloudinary URL)
│   ├── video (VARCHAR 255, Cloudinary URL)
│   ├── fk_id_estado_orden (INT, FK → tbl_orden_estado)
│   ├── observaciones_orden (VARCHAR 100)
│   └── estado_vehiculo (TEXT)
│
├── tbl_historial_estado_orden
│   ├── pk_id_historial (INT, PK, AUTO_INCREMENT)
│   ├── fk_id_orden (INT, FK → tbl_ordenes)
│   ├── fk_id_estado_anterior (INT, FK → tbl_orden_estado)
│   ├── fk_id_estado_nuevo (INT, FK → tbl_orden_estado)
│   ├── fecha_cambio (DATETIME, DEFAULT NOW)
│   ├── observaciones_cambio (TEXT)
│   └── usuario_cambio (VARCHAR 100)
│
├── tbl_password_reset_tokens
│   ├── id (INT, PK, AUTO_INCREMENT)
│   ├── email (VARCHAR 255, NOT NULL)
│   ├── token (VARCHAR 255, NOT NULL)
│   ├── expiry (DATETIME, NOT NULL)
│   └── created_at (DATETIME, DEFAULT NOW)
│
├── tbl_telefono_usuario
│   ├── pk_id_telefono (INT, PK, AUTO_INCREMENT)
│   ├── fk_id_usuario (INT, FK → tbl_usuarios)
│   └── telefono_usuario (VARCHAR 15)
│
└── tbl_telefono_cliente
    ├── pk_id_telefono_cliente (INT, PK, AUTO_INCREMENT)
    ├── fk_id_cliente (INT, FK → tbl_clientes)
    └── telefono_cliente (VARCHAR 15)
```

### **Relaciones:**

```
tbl_clientes ──┬─→ tbl_ordenes
               │
tbl_vehiculos ─┴─→ tbl_ordenes
               
tbl_servicios ───→ tbl_ordenes

tbl_orden_estado ──┬─→ tbl_ordenes
                   └─→ tbl_historial_estado_orden

tbl_ordenes ─────→ tbl_historial_estado_orden

tbl_usuarios ─────→ tbl_telefono_usuario

tbl_clientes ─────→ tbl_telefono_cliente
```

### **Índices y Constraints:**

```sql
-- UNIQUE Constraints
- dpi_cliente (permite NULL múltiples)
- NIT (permite NULL múltiples)
- placa_vehiculo
- email_usuario

-- Foreign Keys con ON DELETE CASCADE
- Todas las FKs usan CASCADE para mantener integridad referencial

-- Primary Keys
- Todas las tablas usan AUTO_INCREMENT
```

---

## 🔙 BACKEND (API REST)

### **Arquitectura:** Monolítico con Separación de Responsabilidades

### **Estructura:**

```
backend/
│
├── index.js ⭐ (Main server file - 2,536 líneas)
│   ├── Configuración de Express
│   ├── Middlewares globales
│   ├── Configuración de base de datos
│   ├── Todos los endpoints API
│   └── Servidor estático para frontend
│
├── services/
│   ├── notificationService.js
│   │   ├── Gestión multicanal (Email + WhatsApp)
│   │   ├── Sistema de cola de notificaciones
│   │   ├── Manejo de errores y reintentos
│   │   └── Logging detallado
│   │
│   ├── pdfGenerator.js
│   │   ├── Generación de órdenes de servicio
│   │   ├── PDFKit con diseño personalizado
│   │   ├── Códigos QR para tracking
│   │   └── Branding (TECNOAUTO)
│   │
│   ├── reportService.js
│   │   ├── Reportes en Excel (ExcelJS)
│   │   ├── Reportes en PDF
│   │   ├── Filtros avanzados
│   │   └── Cálculos estadísticos
│   │
│   ├── emailService.js
│   │   ├── Nodemailer + Gmail API
│   │   ├── Templates HTML personalizados
│   │   ├── Adjuntos (PDFs)
│   │   └── Manejo de errores SMTP
│   │
│   ├── whatsappService.js
│   │   ├── whatsapp-web.js
│   │   ├── Gestión de sesiones persistentes
│   │   ├── QR Code para autenticación
│   │   └── Envío de mensajes y archivos
│   │
│   └── cloudinaryService.js
│       ├── Configuración de Cloudinary
│       ├── Upload de imágenes/videos
│       ├── Transformaciones automáticas
│       └── Gestión de URLs
│
├── routes/
│   └── usuarios.js (Separación modular de usuarios)
│
├── config/
│   └── notifications.js (Configuración de notificaciones)
│
└── scripts/
    ├── migrate-to-cloudinary.js (Migración de archivos)
    └── update-cloudinary-urls.js (Actualización de URLs)
```

### **Endpoints API:**

#### **Autenticación y Usuarios**
```javascript
POST   /api/login                    // Login (JWT)
POST   /api/forgot-password          // Solicitar recuperación
POST   /api/reset-password/:token    // Resetear contraseña
POST   /api/verify-security-answer   // Verificar pregunta seguridad
GET    /api/usuarios                 // Listar usuarios
POST   /api/usuarios                 // Crear usuario
PUT    /api/usuarios/:id             // Actualizar usuario
DELETE /api/usuarios/:id             // Eliminar usuario
```

#### **Clientes**
```javascript
GET    /api/clientes                 // Listar todos
GET    /api/clientes/:id             // Obtener uno
GET    /api/clientes/buscar/:termino // Búsqueda flexible (nombre/NIT/CF)
POST   /api/clientes                 // Crear cliente
PUT    /api/clientes/:id             // Actualizar cliente
DELETE /api/clientes/:id             // Eliminar cliente
```

#### **Vehículos**
```javascript
GET    /api/vehiculos                // Listar todos
GET    /api/vehiculos/:id            // Obtener uno
POST   /api/vehiculos                // Crear vehículo
PUT    /api/vehiculos/:id            // Actualizar vehículo
DELETE /api/vehiculos/:id            // Eliminar vehículo
```

#### **Servicios**
```javascript
GET    /api/servicios                // Listar todos
GET    /api/servicios/:id            // Obtener uno
POST   /api/servicios                // Crear servicio
PUT    /api/servicios/:id            // Actualizar servicio
DELETE /api/servicios/:id            // Eliminar servicio
```

#### **Estados**
```javascript
GET    /api/estados                  // Listar todos
GET    /api/estados/:id              // Obtener uno
POST   /api/estados                  // Crear estado
PUT    /api/estados/:id              // Actualizar estado
DELETE /api/estados/:id              // Eliminar estado
```

#### **Órdenes de Servicio** ⭐
```javascript
GET    /api/ordenes                  // Listar todas (con JOINs completos)
GET    /api/ordenes/:id              // Obtener una orden completa
POST   /api/ordenes                  // Crear orden (+ multimedia)
PUT    /api/ordenes/:id              // Actualizar orden (+ multimedia)
DELETE /api/ordenes/:id              // Eliminar orden
GET    /api/ordenes/:id/historial    // Historial de cambios de estado
PUT    /api/ordenes/:id/estado       // Cambiar estado (+ notificación)
GET    /api/ordenes/:id/pdf          // Generar PDF de la orden
```

#### **Dashboard y Estadísticas**
```javascript
GET    /api/dashboard/estadisticas           // Estadísticas generales
GET    /api/dashboard/estadisticas/:periodo  // Estadísticas por periodo
GET    /api/dashboard/vehiculos-populares    // Marcas más usadas
GET    /api/dashboard/servicios-populares    // Servicios más solicitados
```

#### **Reportes**
```javascript
POST   /api/reportes/generar         // Generar reporte (Excel/PDF)
GET    /api/reportes/ordenes         // Reporte de órdenes
```

#### **Tracker Público** (Sin autenticación)
```javascript
GET    /api/tracker/orden/:numero    // Buscar por número de orden
GET    /api/tracker/telefono/:tel    // Buscar por teléfono
GET    /api/tracker/placa/:placa     // Buscar por placa vehículo
```

#### **Notificaciones**
```javascript
GET    /api/notifications/status     // Estado del sistema
POST   /api/notifications/test       // Probar notificaciones
```

#### **Health Check**
```javascript
GET    /api/health                   // Verificar salud del sistema
```

### **Características Técnicas del Backend:**

#### **1. Gestión de Archivos Multimedia**
```javascript
// Cloudinary (Producción)
- Imágenes: Auto-optimización, formato WebP
- Videos: Streaming, thumbnails automáticos
- URLs permanentes con CDN
- Límites: 10MB (imágenes), 100MB (videos)

// Almacenamiento Local (Fallback)
- Multer para uploads locales
- Carpeta /uploads
- Límites configurables
```

#### **2. Sistema de Notificaciones**
```javascript
// Canales activos
✅ Email (Nodemailer + Gmail)
✅ WhatsApp (whatsapp-web.js)

// Eventos que disparan notificaciones
- Cambio de estado de orden
- Nueva orden creada
- Orden completada/entregada
- Orden cancelada

// Cola de notificaciones
- Reintentos automáticos (3 intentos)
- Logging de éxitos/fallos
- Notificación multicanal paralela
```

#### **3. Seguridad**
```javascript
// Autenticación
- JWT con expiración de 8 horas
- Contraseñas hasheadas con SHA-256
- Tokens de recuperación con expiración

// Validaciones
- Input sanitization
- SQL Injection prevention (Prepared Statements)
- CORS configurado para Railway
- File upload limits

// Manejo de datos sensibles
- DPI y NIT permiten NULL múltiples
- Validación de unicidad solo para valores no vacíos
```

#### **4. Optimizaciones**
```javascript
// Base de Datos
- Connection pooling con mysql2/promise
- Consultas optimizadas con JOINs
- Índices en campos de búsqueda
- CTEs recursivas para gráficas mensuales

// Performance
- Archivos estáticos servidos por Express
- Build de frontend pre-compilado
- Compresión de respuestas
- Lazy loading de servicios
```

---

## 🎨 FRONTEND (REACT SPA)

### **Arquitectura:** Single Page Application (SPA)

### **Estructura:**

```
frontend/
│
├── public/
│   ├── index.html
│   ├── LogoTecnoAuto.jpg
│   ├── LogoElectrofrio.jpg
│   ├── Fondo.jpg
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   ├── index.js                    // Entry point
│   ├── App.js                      // Router principal
│   ├── index.css                   // Estilos globales
│   ├── App.css                     // Estilos de App
│   │
│   ├── config/
│   │   ├── api.js                  // Configuración de endpoints
│   │   └── cloudinary.js           // Helpers de Cloudinary
│   │
│   ├── components/                 // Páginas/Componentes
│   │   │
│   │   ├── Login.jsx               // Autenticación
│   │   ├── ForgotPassword.jsx      // Recuperar contraseña
│   │   ├── RecuperarContrasena.jsx // Pregunta de seguridad
│   │   ├── ResetPassword.jsx       // Resetear contraseña
│   │   │
│   │   ├── Home.jsx                // Dashboard principal
│   │   ├── Dashboard.jsx           // Estadísticas y gráficos
│   │   │
│   │   ├── Clientes.jsx            // CRUD Clientes
│   │   ├── Vehiculos.jsx           // CRUD Vehículos
│   │   ├── Servicios.jsx           // CRUD Servicios
│   │   ├── Estados.jsx             // CRUD Estados
│   │   ├── Usuarios.jsx            // CRUD Usuarios
│   │   │
│   │   ├── Ordenes.jsx ⭐          // CRUD Órdenes (complejo)
│   │   │   ├── Formulario de creación/edición
│   │   │   ├── Upload de multimedia
│   │   │   ├── Autocomplete de clientes
│   │   │   ├── Cambio de estado
│   │   │   ├── Historial de cambios
│   │   │   └── Vista previa de multimedia
│   │   │
│   │   ├── ImprimirOrden.jsx       // Vista previa de impresión
│   │   ├── TrackerPublico.jsx      // Tracker sin autenticación
│   │   └── Reportes.jsx            // Generación de reportes
│   │
│   └── components/__tests__/       // Unit tests
│       ├── Clientes.test.js
│       ├── Dashboard.test.js
│       └── Ordenes.test.js
│
└── build/                          // Producción (generado)
    └── static/
        ├── css/
        └── js/
```

### **Componentes Principales:**

#### **1. Login.jsx**
```jsx
Funcionalidades:
- Autenticación con JWT
- Almacenamiento en localStorage
- Redirección a Home
- Link a recuperación de contraseña
```

#### **2. Home.jsx**
```jsx
Funcionalidades:
- Navbar de navegación
- Información del usuario logueado
- Logout
- Links a todas las secciones
- Información del tracker público
```

#### **3. Ordenes.jsx** ⭐ (Componente más complejo)
```jsx
Funcionalidades:
- Tabla de órdenes con paginación
- Formulario de creación/edición
- Búsqueda de clientes en tiempo real (autocomplete)
- Upload de 4 imágenes + 1 video
- Selector de nivel de combustible (5 opciones)
- Selector de unidad de odómetro (km/millas)
- Cambio de estado con notificaciones
- Historial de cambios de estado
- Vista previa de multimedia
- Impresión de órdenes
- Filtros y búsqueda

Estados manejados:
- 10+ estados locales con useState
- useEffect para carga de datos
- Validaciones de formulario
- Manejo de errores
```

#### **4. Dashboard.jsx**
```jsx
Funcionalidades:
- 6 tarjetas con estadísticas clave:
  * Órdenes completadas (Entregado)
  * Órdenes este mes (filtro correcto)
  * Órdenes pendientes
  * Listos para entrega
  * Ingresos estimados
  * Total clientes

- 5 Gráficos interactivos (Chart.js):
  * Órdenes por mes (Line Chart)
  * Clientes por mes (Line Chart)
  * Ingresos por mes (Line Chart)
  * Marcas populares (Bar Chart)
  * Servicios populares (Bar Chart)

- Selector de periodo:
  * Última semana
  * Último mes
  * Últimos 3 meses
  * Último año

Características técnicas:
- CTE recursivas para meses sin datos
- Filtro desde fecha de implementación (29/09/2025)
- Parsing correcto de fechas (timezone local)
- Responsive design
- Auto-refresh de datos
```

#### **5. TrackerPublico.jsx** (Sin autenticación)
```jsx
Funcionalidades:
- Búsqueda por 3 métodos:
  * Número de orden
  * Teléfono del cliente
  * Placa del vehículo

- Información mostrada:
  * Estado actual
  * Datos del vehículo
  * Comentarios del cliente
  * Observaciones del taller
  * Multimedia (imágenes/videos)
  * Historial de estados
  * Información de contacto

- Diseño público:
  * Sin navbar
  * Diseño limpio
  * Responsive
  * Fácil de usar
```

#### **6. ImprimirOrden.jsx**
```jsx
Funcionalidades:
- Vista previa antes de imprimir
- PDF con diseño profesional
- Información completa de la orden
- Branding de TECNOAUTO
- Notas importantes
- Estado del vehículo
- Sin firmas (actualizado)
- Formato A4
- Media queries para impresión
```

#### **7. Reportes.jsx**
```jsx
Funcionalidades:
- Generación de reportes en Excel/PDF
- Filtros avanzados:
  * Rango de fechas
  * Estado de orden
  * Cliente
  * Vehículo
  * Servicio

- Datos incluidos:
  * Resumen ejecutivo
  * Listado de órdenes
  * Estadísticas
  * Cálculos de ingresos
```

### **Patrones y Prácticas:**

#### **1. State Management**
```jsx
// useState para estado local
const [clientes, setClientes] = useState([]);
const [loading, setLoading] = useState(false);

// useEffect para cargas
useEffect(() => {
  cargarDatos();
}, [dependencias]);

// localStorage para persistencia
localStorage.setItem('usuario', JSON.stringify(user));
```

#### **2. API Communication**
```jsx
// Axios para todas las peticiones
import axios from 'axios';
import { API_ENDPOINTS } from './config/api';

// Con manejo de errores
try {
  const response = await axios.get(API_ENDPOINTS.CLIENTES);
  setClientes(response.data);
} catch (error) {
  console.error(error);
  alert('Error al cargar datos');
}
```

#### **3. Routing**
```jsx
// React Router con protección de rutas
<Route 
  path="/ordenes" 
  element={usuario ? <Ordenes /> : <Navigate to="/" />} 
/>

// Ruta pública
<Route path="/tracker" element={<TrackerPublico />} />
```

#### **4. Componentes Reutilizables**
```jsx
// Modales de Bootstrap
<div className="modal" tabIndex="-1">
  <div className="modal-dialog">
    {/* Contenido del modal */}
  </div>
</div>

// Formularios controlados
<input
  type="text"
  value={formData.nombre}
  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
/>
```

### **Estilos y UI:**

#### **Framework CSS:** Bootstrap 5.3.0
```css
/* Variables CSS personalizadas */
:root {
  --tecno-primary: #2c3e50;
  --tecno-secondary: #3498db;
  --tecno-success: #27ae60;
  --tecno-danger: #e74c3c;
  --tecno-warning: #f39c12;
  --tecno-info: #16a085;
  --tecno-light: #ecf0f1;
  --tecno-dark: #34495e;
  --tecno-gray: #95a5a6;
  --tecno-gray-dark: #7f8c8d;
}

/* Clases personalizadas */
.card-tecno { /* Tarjetas personalizadas */ }
.btn-tecno { /* Botones personalizados */ }
.navbar-tecno { /* Navbar personalizada */ }
```

#### **Responsive Design:**
```css
/* Mobile First */
@media (max-width: 768px) {
  /* Estilos móviles */
}

@media print {
  /* Estilos de impresión */
}
```

---

## 🌐 SERVICIOS EXTERNOS

### **1. Cloudinary**
```yaml
Propósito: Almacenamiento de imágenes y videos

Configuración:
  Cloud Name: [configurado en .env]
  API Key: [configurado en .env]
  API Secret: [configurado en .env]
  Folder: taller-mecanico

Características:
  - CDN global
  - Transformaciones automáticas
  - Compresión inteligente
  - Formato WebP automático
  - Streaming de videos
  - Thumbnails automáticos
  
Límites:
  - Imágenes: 10 MB
  - Videos: 100 MB
  - Total storage: Según plan

URLs generadas:
  https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
```

### **2. Gmail API (Email)**
```yaml
Propósito: Envío de notificaciones por correo

Configuración:
  Service: gmail
  User: [email configurado]
  Password: [contraseña de aplicación]
  
Características:
  - Templates HTML personalizados
  - Adjuntos (PDFs de órdenes)
  - Reintentos automáticos
  - Logging de errores
  
Eventos notificados:
  - Cambio de estado de orden
  - Nueva orden creada
  - Recuperación de contraseña
  
Template incluye:
  - Número de orden
  - Estado actual
  - Datos del vehículo
  - Información de contacto
  - PDF adjunto (opcional)
```

### **3. WhatsApp Web.js**
```yaml
Propósito: Notificaciones por WhatsApp

Configuración:
  Client ID: taller-mecanico
  Session Path: ./whatsapp-session
  
Características:
  - Sesión persistente
  - QR Code para autenticación
  - Envío de mensajes
  - Envío de archivos
  - Manejo de reconexión
  
Eventos notificados:
  - Cambio de estado de orden
  - Nueva orden creada
  
Formato de mensaje:
  🔔 *TECNOAUTO - Actualización de Orden*
  
  📋 Orden: #{numero}
  🚗 Vehículo: {marca} {modelo} ({placa})
  📊 Estado: {estado_actual}
  
  📝 Observaciones:
  {observaciones}
  
  📞 Contacto: {telefono_taller}
```

---

## 🚀 DESPLIEGUE

### **Plataforma:** Railway.app

### **Configuración de Despliegue:**

#### **1. Railway Service**
```yaml
Name: ProyectoTesis-IsmarCortez
Type: Web Service
Region: US West
Builder: Dockerfile

Environment Variables:
  # Base de datos (auto-generadas por Railway)
  MYSQLHOST: [auto]
  MYSQLUSER: [auto]
  MYSQL_ROOT_PASSWORD: [auto]
  MYSQLDATABASE: taller_mecanico
  MYSQLPORT: 3306
  
  # JWT
  JWT_SECRET: [custom]
  
  # Cloudinary
  CLOUDINARY_CLOUD_NAME: [custom]
  CLOUDINARY_API_KEY: [custom]
  CLOUDINARY_API_SECRET: [custom]
  
  # Email
  EMAIL_ENABLED: true
  EMAIL_SERVICE: gmail
  EMAIL_USER: [custom]
  EMAIL_PASS: [custom]
  
  # WhatsApp
  WHATSAPP_ENABLED: true
  
  # Puerto
  PORT: 8080
```

#### **2. Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm ci
RUN cd frontend && npm ci

# Copiar código
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Build frontend
RUN cd frontend && npm run build

# Exponer puerto
EXPOSE 8080

# Iniciar servidor
CMD ["node", "backend/index.js"]
```

#### **3. railway.json**
```json
{
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 600,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### **Proceso de Deploy:**

```bash
# 1. Commit cambios
git add .
git commit -m "Descripción de cambios"

# 2. Push a main
git push origin main

# 3. Railway automáticamente:
#    - Detecta el push
#    - Construye la imagen Docker
#    - Ejecuta tests (si están configurados)
#    - Despliega la nueva versión
#    - Hace health check
#    - Cambia el tráfico a la nueva versión

# 4. Verificar deploy
curl https://[tu-app].up.railway.app/api/health
```

### **URLs de Producción:**
```
Web App: https://[tu-proyecto].up.railway.app
API: https://[tu-proyecto].up.railway.app/api
Tracker: https://[tu-proyecto].up.railway.app/tracker
Health: https://[tu-proyecto].up.railway.app/api/health
```

### **Monitoreo:**
```yaml
Railway Dashboard:
  - Logs en tiempo real
  - Métricas de CPU/RAM
  - Tráfico de red
  - Builds history
  - Environment variables
  - Database metrics
```

---

## 📁 ESTRUCTURA DE DIRECTORIOS COMPLETA

```
ProyectoTesis-IsmarCortez/
│
├── frontend/                          # Frontend React
│   ├── build/                         # Build de producción
│   ├── node_modules/                  # Dependencias
│   ├── public/                        # Archivos públicos
│   │   ├── index.html
│   │   ├── LogoTecnoAuto.jpg
│   │   ├── LogoElectrofrio.jpg
│   │   ├── Fondo.jpg
│   │   └── manifest.json
│   ├── src/                           # Código fuente
│   │   ├── components/                # Componentes
│   │   │   └── __tests__/             # Tests
│   │   ├── config/                    # Configuración
│   │   │   ├── api.js
│   │   │   └── cloudinary.js
│   │   ├── App.js                     # Router principal
│   │   ├── index.js                   # Entry point
│   │   ├── Login.jsx
│   │   ├── Home.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Clientes.jsx
│   │   ├── Vehiculos.jsx
│   │   ├── Servicios.jsx
│   │   ├── Estados.jsx
│   │   ├── Ordenes.jsx
│   │   ├── Usuarios.jsx
│   │   ├── Reportes.jsx
│   │   ├── TrackerPublico.jsx
│   │   ├── ImprimirOrden.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── RecuperarContrasena.jsx
│   │   └── ResetPassword.jsx
│   ├── package.json
│   └── README.md
│
├── backend/                           # Backend Node.js
│   ├── node_modules/                  # Dependencias
│   ├── config/                        # Configuración
│   │   └── notifications.js
│   ├── routes/                        # Rutas modulares
│   │   └── usuarios.js
│   ├── services/                      # Servicios
│   │   ├── notificationService.js
│   │   ├── pdfGenerator.js
│   │   ├── reportService.js
│   │   ├── emailService.js
│   │   ├── whatsappService.js
│   │   ├── cloudinaryService.js
│   │   └── gmailApiService.js
│   ├── scripts/                       # Scripts de utilidad
│   │   ├── migrate-to-cloudinary.js
│   │   └── update-cloudinary-urls.js
│   ├── tests/                         # Tests
│   │   ├── api/
│   │   ├── integration/
│   │   └── performance/
│   ├── Logos/                         # Assets
│   │   ├── LogoTecnoAuto.jpg
│   │   └── LogoElectrofrio.jpg
│   ├── whatsapp-session/              # Sesión de WhatsApp
│   ├── index.js ⭐                    # Servidor principal
│   ├── package.json
│   ├── env.example                    # Template de .env
│   ├── jest.config.js                 # Configuración de Jest
│   └── README_*.md                    # Documentación
│
├── backups/                           # Backups de código
│   ├── dashboard_backup_20251023/
│   └── odometro_backup_20251007/
│
├── node_modules/                      # Dependencias raíz
│
├── Taller_LDD.sql ⭐                  # Schema de BD (DDL)
├── Taller_LMD.sql                     # Datos iniciales (DML)
├── database_setup.sql                 # Setup completo
│
├── migration_*.sql                    # Migraciones
├── INSTRUCCIONES_MIGRACION_*.md       # Docs de migración
│
├── ARQUITECTURA_COMPLETA_PROYECTO.md  # Este documento
├── DEPLOYMENT.md                      # Guía de despliegue
├── CAMBIOS_*.md                       # Documentación de cambios
├── CORRECCION_*.md                    # Documentación de correcciones
├── README_*.md                        # Documentación técnica
│
├── Dockerfile ⭐                      # Configuración Docker
├── railway.json                       # Configuración Railway
├── package.json                       # Dependencias raíz
├── package-lock.json
│
├── .gitignore                         # Archivos ignorados
├── .env                               # Variables de entorno (NO EN GIT)
│
└── DiagramaTallerMecanico.pdf         # Diagramas del sistema
```

---

## 🔄 FLUJOS DE TRABAJO PRINCIPALES

### **1. Flujo de Creación de Orden**

```mermaid
Usuario → Frontend (Ordenes.jsx)
  ↓
1. Llenar formulario
   - Buscar cliente (autocomplete)
   - Seleccionar vehículo
   - Seleccionar servicio
   - Comentarios del cliente
   - Nivel de combustible (5 opciones)
   - Odómetro (km/millas)
   - Estado del vehículo
   - 4 imágenes + 1 video (opcional)
  ↓
2. Submit formulario
  ↓
Frontend → Backend (POST /api/ordenes)
  ↓
3. Backend procesa:
   - Validar datos
   - Procesar archivos multimedia (Cloudinary)
   - Insertar en tbl_ordenes
   - Crear registro en tbl_historial_estado_orden
   - Enviar notificaciones (Email + WhatsApp)
  ↓
4. Backend responde con:
   - ID de la orden creada
   - Datos completos de la orden
  ↓
Frontend actualiza:
  - Cerrar modal
  - Recargar tabla de órdenes
  - Mostrar mensaje de éxito
```

### **2. Flujo de Cambio de Estado**

```mermaid
Usuario → Frontend (Ordenes.jsx)
  ↓
1. Clic en "Cambiar Estado"
  ↓
2. Seleccionar nuevo estado
3. Agregar observaciones (opcional)
  ↓
Frontend → Backend (PUT /api/ordenes/:id/estado)
  ↓
4. Backend procesa:
   - Validar cambio de estado
   - Obtener datos actuales de la orden
   - Obtener teléfonos de cliente
   - Actualizar estado en tbl_ordenes
   - Crear registro en tbl_historial_estado_orden
   - Disparar notificaciones:
     * Email al cliente
     * WhatsApp al cliente
  ↓
5. Sistema de notificaciones:
   - NotificationService.notifyStateChange()
   - EmailService.send() → Gmail API
   - WhatsAppService.send() → WhatsApp Web
   - Logging de resultados
   - Reintentos si falla (3 intentos)
  ↓
6. Backend responde:
   - Confirmación de cambio
   - Estado actualizado
   - Resultado de notificaciones
  ↓
Frontend actualiza:
  - Actualizar estado en la tabla
  - Mostrar badge con nuevo estado
  - Mostrar mensaje de confirmación
  - Actualizar historial (si está abierto)
```

### **3. Flujo de Tracker Público**

```mermaid
Cliente → TrackerPublico.jsx (Sin autenticación)
  ↓
1. Seleccionar tipo de búsqueda:
   - Por número de orden
   - Por teléfono
   - Por placa del vehículo
  ↓
2. Ingresar criterio de búsqueda
  ↓
Frontend → Backend (GET /api/tracker/*)
  ↓
3. Backend consulta:
   - /api/tracker/orden/:numero
   - /api/tracker/telefono/:tel
   - /api/tracker/placa/:placa
   
   Query con JOINS:
   - tbl_ordenes
   - tbl_clientes
   - tbl_vehiculos
   - tbl_servicios
   - tbl_orden_estado
   - tbl_historial_estado_orden
   - tbl_telefono_cliente
  ↓
4. Backend responde:
   - Datos completos de la orden(es)
   - Historial de estados
   - Multimedia (URLs de Cloudinary)
   - Información de contacto
  ↓
Frontend muestra:
  - Tarjeta con información de orden(es)
  - Timeline de estados
  - Galería de imágenes
  - Video (si existe)
  - Información de contacto del taller
```

### **4. Flujo de Generación de PDF**

```mermaid
Usuario → Frontend (Ordenes.jsx)
  ↓
1. Clic en "Imprimir" o "Vista Previa"
  ↓
Opción A: Vista Previa en Frontend
  Frontend (ImprimirOrden.jsx)
  ↓
  - Renderiza orden con estilos de impresión
  - Muestra todos los datos
  - Usuario usa Ctrl+P para imprimir
  
Opción B: Generar PDF en Backend
  Frontend → Backend (GET /api/ordenes/:id/pdf)
  ↓
  2. Backend (pdfGenerator.js):
     - Consultar datos de la orden
     - Crear documento PDFKit
     - Agregar:
       * Logo de TECNOAUTO
       * Información de la empresa
       * Datos del cliente
       * Datos del vehículo
       * Detalles del servicio
       * Estado del vehículo
       * Nivel de combustible
       * Odómetro (con unidad)
       * Observaciones
       * Notas importantes
       * Código QR para tracking
  ↓
  3. Backend responde:
     - Stream del PDF
     - Headers: Content-Type: application/pdf
  ↓
  Frontend descarga:
     - Orden_#{numero}.pdf
     - Usuario puede abrir/guardar
```

### **5. Flujo de Dashboard y Estadísticas**

```mermaid
Usuario → Frontend (Dashboard.jsx)
  ↓
1. Cargar dashboard
  ↓
Frontend → Backend (GET /api/dashboard/estadisticas)
  ↓
2. Backend ejecuta múltiples queries:
   
   A. Tarjetas de estadísticas:
      - COUNT órdenes completadas (Entregado)
      - COUNT órdenes este mes (MONTH/YEAR)
      - COUNT órdenes pendientes (NOT Entregado/Cancelado)
      - COUNT listos para entrega (3 estados)
      - SUM ingresos estimados
      - COUNT total clientes
   
   B. Gráficas mensuales (CTE Recursivas):
      - Órdenes por mes (desde 29/09/2025)
      - Clientes por mes (desde 29/09/2025)
      - Ingresos por mes (desde 29/09/2025)
      
      Query con:
      * WITH RECURSIVE para generar todos los meses
      * LEFT JOIN con filtro de fecha >= '2025-09-29'
      * COALESCE para mostrar 0 en meses sin datos
   
   C. Marcas populares:
      - COUNT vehículos por marca
      - COUNT órdenes por marca
      - TOP 5
   
   D. Servicios populares:
      - COUNT órdenes por servicio
      - TOP 5
  ↓
3. Backend responde con objeto JSON:
   {
     ordenes_completadas: 8,
     ordenes_mes_actual: 12,
     ordenes_pendientes: 4,
     ordenes_listas_entrega: 3,
     ingresos_estimados: 45000,
     total_clientes: 25,
     ordenes_por_mes: [...],
     clientes_por_mes: [...],
     ingresos_por_mes: [...],
     marcas_populares: [...],
     servicios_populares: [...]
   }
  ↓
4. Frontend (Chart.js):
   - Procesar datos
   - Parsing de fechas (timezone local)
   - Renderizar 6 tarjetas
   - Renderizar 5 gráficos interactivos
   - Aplicar colores y estilos personalizados
```

### **6. Flujo de Recuperación de Contraseña**

```mermaid
Usuario → Frontend (ForgotPassword.jsx)
  ↓
1. Ingresar email
  ↓
Frontend → Backend (POST /api/forgot-password)
  ↓
2. Backend:
   - Buscar usuario por email
   - Generar token único (crypto)
   - Calcular expiración (1 hora)
   - Guardar en tbl_password_reset_tokens
   - Enviar email con link de recuperación
  ↓
3. Usuario recibe email:
   - Link: /reset-password?token=XXX
   - Click en el link
  ↓
Usuario → Frontend (ResetPassword.jsx)
  ↓
4. Ingresar nueva contraseña
  ↓
Frontend → Backend (POST /api/reset-password/:token)
  ↓
5. Backend:
   - Validar token existe
   - Validar token no expirado
   - Hashear nueva contraseña (SHA-256)
   - Actualizar tbl_usuarios
   - Eliminar token usado
  ↓
6. Frontend redirige a Login
```

---

## 📊 ESTADÍSTICAS DEL PROYECTO

### **Líneas de Código:**
```
Backend:
  - index.js: ~2,536 líneas
  - services/: ~1,500 líneas
  - Total: ~4,000 líneas

Frontend:
  - Components: ~3,500 líneas
  - Config: ~100 líneas
  - Total: ~3,600 líneas

Base de Datos:
  - Schema (LDD): 346 líneas
  - Datos (LMD): ~200 líneas

Tests:
  - ~500 líneas

TOTAL: ~8,800 líneas de código
```

### **Archivos:**
```
- JavaScript/JSX: 45 archivos
- SQL: 12 archivos
- Markdown: 15 archivos
- Config: 8 archivos
- Assets: 10 archivos

TOTAL: 90+ archivos
```

### **Dependencias:**
```
Backend:
  - Producción: 15 paquetes
  - Desarrollo: 3 paquetes

Frontend:
  - Producción: 13 paquetes
  - Desarrollo: 3 paquetes

TOTAL: 34 dependencias directas
```

---

## 🔐 SEGURIDAD

### **Autenticación:**
- ✅ JWT con expiración
- ✅ Contraseñas hasheadas (SHA-256)
- ✅ Tokens de recuperación con expiración
- ✅ Validación de sesión en cada request

### **Base de Datos:**
- ✅ Prepared statements (previene SQL injection)
- ✅ Validación de inputs
- ✅ Constraints de integridad referencial
- ✅ Unique constraints donde aplica

### **API:**
- ✅ CORS configurado
- ✅ Validación de tipos de datos
- ✅ Límites de tamaño de archivos
- ✅ Manejo de errores seguro (no expone detalles)

### **Archivos:**
- ✅ Cloudinary para almacenamiento seguro
- ✅ URLs firmadas
- ✅ Límites de tamaño
- ✅ Validación de tipos MIME

---

## 🎯 CARACTERÍSTICAS DESTACADAS

### **1. Sistema de Notificaciones Multicanal**
- Notificaciones automáticas por Email y WhatsApp
- Cola de mensajes con reintentos
- Logging detallado de éxitos/fallos
- Templates personalizables

### **2. Tracker Público en Tiempo Real**
- Sin necesidad de autenticación
- Búsqueda por 3 métodos diferentes
- Historial completo de estados
- Vista de multimedia

### **3. Dashboard Avanzado con Gráficos**
- 6 KPIs principales
- 5 gráficos interactivos
- Filtrado por periodos
- Datos en tiempo real

### **4. Gestión Multimedia Robusta**
- Upload de múltiples archivos
- Integración con Cloudinary
- Optimización automática
- Vista previa en galería

### **5. Sistema de Reportes Completo**
- Excel y PDF
- Filtros avanzados
- Cálculos automáticos
- Diseño profesional

### **6. Autocomplete Inteligente**
- Búsqueda de clientes en tiempo real
- Por nombre, NIT o CF
- Resultados instantáneos
- UX optimizada

---

## 📈 ROADMAP Y MEJORAS FUTURAS

### **Funcionalidades Planeadas:**
- [ ] App móvil (React Native)
- [ ] Chat en tiempo real
- [ ] Sistema de inventario de repuestos
- [ ] Facturación electrónica (FEL)
- [ ] Integración con bancos (pagos online)
- [ ] Sistema de citas online
- [ ] Multi-tenant (múltiples talleres)
- [ ] API pública con documentación (Swagger)

### **Mejoras Técnicas:**
- [ ] Migración a TypeScript
- [ ] GraphQL en lugar de REST
- [ ] Server-Side Rendering (Next.js)
- [ ] State management global (Redux/Zustand)
- [ ] Tests end-to-end (Cypress)
- [ ] CI/CD automatizado
- [ ] Monitoreo con Sentry
- [ ] Analytics con Google Analytics

---

## 📝 DOCUMENTACIÓN DISPONIBLE

### **En el Proyecto:**
```
1. ARQUITECTURA_COMPLETA_PROYECTO.md (este documento)
2. DEPLOYMENT.md (Guía de despliegue)
3. CAMBIOS_DASHBOARD_20251023.md
4. CAMBIOS_GRAFICAS_MENSUALES_20251023.md
5. CAMBIOS_NIVEL_COMBUSTIBLE_VISUAL.md
6. CAMBIOS_PDF_VISTA_PREVIA.md
7. CORRECCION_FILTRO_FECHAS_20251023.md
8. CORRECCION_LABELS_FECHAS_20251023.md
9. INSTRUCCIONES_MIGRACION_ODOMETRO.md
10. INSTRUCCIONES_MIGRACION_COMBUSTIBLE.md
11. RESUMEN_CAMBIOS_COMBUSTIBLE.md
12. README_BITACORA.md
13. README_CLOUDINARY.md
14. README_NOTIFICACIONES.md
15. README_VEHICULOS.md
16. README_TESTING.md
```

---

## 👥 ROLES Y PERMISOS

### **Actualmente:**
- Un solo rol: Administrador
- Acceso completo a todas las funcionalidades
- Autenticación con JWT

### **Roles Planeados:**
```
1. Administrador
   - Acceso completo
   - Gestión de usuarios
   - Configuración del sistema

2. Mecánico
   - Gestión de órdenes
   - Cambio de estados
   - Visualización de datos
   
3. Recepcionista
   - Creación de órdenes
   - Gestión de clientes
   - Vista de reportes
   
4. Cliente (Futuro)
   - Vista de sus órdenes
   - Tracker personal
   - Historial
```

---

## 🌟 CONCLUSIÓN

Este sistema representa una solución completa y moderna para la gestión de un taller mecánico. Utiliza tecnologías actuales, patrones de diseño probados, y está desplegado en infraestructura cloud confiable.

### **Puntos Fuertes:**
✅ Arquitectura escalable y mantenible
✅ Stack moderno y popular
✅ Código bien documentado
✅ Sistema de notificaciones robusto
✅ Seguridad implementada correctamente
✅ UX/UI intuitiva
✅ Despliegue automatizado

### **Áreas de Mejora:**
⚠️ Agregar tests más completos
⚠️ Implementar caché (Redis)
⚠️ Migrar a TypeScript
⚠️ Agregar sistema de roles
⚠️ Mejorar manejo de errores
⚠️ Implementar rate limiting

---

**Documento generado el:** 28 de octubre de 2025
**Versión del sistema:** 1.0.0
**Autor:** Sistema de Gestión TECNOAUTO
**Última actualización:** Corrección de labels de fechas en Dashboard

---

## 📞 CONTACTO Y SOPORTE

Para preguntas, reportar bugs o solicitar nuevas funcionalidades, contactar al equipo de desarrollo.

---

**FIN DEL DOCUMENTO**


