# 🛠️ TECNOLOGÍAS Y LIBRERÍAS POR FUNCIONALIDAD
## Sistema TECNOAUTO - Desglose Técnico Detallado

---

## 📋 ÍNDICE RÁPIDO

1. [Frontend - React](#frontend---react)
2. [Backend - Node.js](#backend---nodejs)
3. [Base de Datos - MySQL](#base-de-datos---mysql)
4. [Servicios Externos](#servicios-externos)
5. [Infraestructura](#infraestructura)

---

## 🎨 FRONTEND - REACT

### **Framework Principal**
```javascript
React 19.1.0
```
**¿Para qué se usa?**
- Crear la interfaz de usuario (UI)
- Manejar el estado de la aplicación
- Renderizar componentes dinámicos
- Single Page Application (SPA)

**¿Dónde se ve?**
- Todos los archivos `.jsx` en `frontend/src/`
- Componentes como `Ordenes.jsx`, `Dashboard.jsx`, `Login.jsx`

---

### **Routing (Navegación entre páginas)**
```javascript
react-router-dom 7.7.0
```
**¿Para qué se usa?**
- Navegación entre diferentes páginas sin recargar
- Rutas protegidas (requieren autenticación)
- URLs amigables (/ordenes, /dashboard, /tracker)

**¿Dónde se ve?**
```javascript
// En App.js
<Router>
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/ordenes" element={<Ordenes />} />
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Router>
```

**Ejemplos de uso:**
- `/` → Login
- `/home` → Página principal
- `/ordenes` → Gestión de órdenes
- `/tracker` → Tracker público (sin login)

---

### **Estilos y Diseño**
```javascript
Bootstrap 5.3.0
```
**¿Para qué se usa?**
- Componentes de UI pre-diseñados (botones, modales, tablas)
- Grid system (layout responsive)
- Estilos profesionales listos para usar
- Diseño responsive (móvil y desktop)

**¿Dónde se ve?**
```javascript
// Clases de Bootstrap
<button className="btn btn-primary">Guardar</button>
<div className="modal">...</div>
<table className="table table-striped">...</table>
<div className="row">
  <div className="col-md-6">...</div>
</div>
```

**Componentes que usa:**
- Modals (ventanas emergentes)
- Cards (tarjetas de información)
- Tables (tablas de datos)
- Forms (formularios)
- Buttons (botones)
- Alerts (mensajes de alerta)

---

### **Gráficos y Estadísticas**
```javascript
Chart.js 4.5.0
react-chartjs-2 5.3.0
```
**¿Para qué se usa?**
- Crear gráficos interactivos
- Visualizar estadísticas del dashboard
- Gráficos de líneas, barras, pastel

**¿Dónde se ve?**
```javascript
// En Dashboard.jsx
<Line 
  data={datosOrdenesMes} 
  options={opcionesGenerales} 
/>

<Bar 
  data={datosMarcas} 
  options={opcionesBarras} 
/>
```

**Gráficos implementados:**
1. **Line Charts (Líneas):**
   - Órdenes por mes
   - Clientes por mes
   - Ingresos por mes

2. **Bar Charts (Barras):**
   - Marcas de vehículos populares
   - Servicios más solicitados

**Características:**
- Interactivos (hover muestra datos)
- Responsive (se adaptan al tamaño)
- Colores personalizados
- Animaciones suaves

---

### **Peticiones HTTP al Backend**
```javascript
Axios 1.10.0
```
**¿Para qué se usa?**
- Comunicarse con el backend
- Enviar y recibir datos (JSON)
- Subir archivos (imágenes, videos)
- Manejar errores de red

**¿Dónde se ve?**
```javascript
// Obtener datos
const response = await axios.get('http://localhost:8080/api/ordenes');
const ordenes = response.data;

// Enviar datos
await axios.post('http://localhost:8080/api/ordenes', {
  cliente: 'Juan Pérez',
  vehiculo: 'Toyota'
});

// Subir archivos
const formData = new FormData();
formData.append('imagen_1', file);
await axios.post('/api/ordenes', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

**Funcionalidades que usa Axios:**
- Cargar lista de órdenes
- Crear/editar órdenes
- Subir imágenes/videos
- Cambiar estados
- Generar reportes
- Buscar en tracker público

---

### **Testing (Pruebas)**
```javascript
@testing-library/react 16.3.0
@testing-library/jest-dom 6.6.3
Jest (incluido en React)
```
**¿Para qué se usa?**
- Probar componentes
- Asegurar que todo funciona
- Detectar bugs antes de producción

**¿Dónde se ve?**
```javascript
// En Ordenes.test.js
test('renderiza la tabla de órdenes', () => {
  render(<Ordenes />);
  expect(screen.getByText('Órdenes de Servicio')).toBeInTheDocument();
});
```

---

### **Configuración y Build**
```javascript
react-scripts 5.0.1
```
**¿Para qué se usa?**
- Compilar el proyecto para producción
- Servidor de desarrollo
- Webpack configurado automáticamente
- Hot reload (recarga automática en desarrollo)

**Comandos:**
```bash
npm start       # Inicia servidor desarrollo (http://localhost:3000)
npm run build   # Genera build de producción (frontend/build/)
npm test        # Ejecuta pruebas
```

---

### **Gestión de Multimedia (Frontend)**
```javascript
frontend/src/config/cloudinary.js
```
**¿Para qué se usa?**
- Helper para obtener URLs de Cloudinary
- Transformaciones de imágenes
- Optimización de carga

**¿Dónde se ve?**
```javascript
import { getFileUrl } from './config/cloudinary';

// Mostrar imagen
<img src={getFileUrl(orden.imagen_1)} alt="Vehículo" />

// Mostrar video
<video src={getFileUrl(orden.video)} controls />
```

---

## 🔙 BACKEND - NODE.JS

### **Runtime y Framework**
```javascript
Node.js 18+
Express 5.1.0
```
**¿Para qué se usa?**
- Servidor web
- API REST
- Manejar peticiones HTTP
- Enrutamiento

**¿Dónde se ve?**
```javascript
// En backend/index.js
const express = require('express');
const app = express();

// Endpoints
app.get('/api/ordenes', async (req, res) => {
  // Obtener órdenes de la BD
  res.json(ordenes);
});

app.post('/api/ordenes', async (req, res) => {
  // Crear nueva orden
  res.json({ id: nuevaOrden.id });
});

app.listen(8080, () => {
  console.log('Servidor corriendo en puerto 8080');
});
```

**Características de Express:**
- Middleware (CORS, JWT, Multer)
- Rutas organizadas
- Manejo de errores
- Servir archivos estáticos

---

### **Base de Datos**
```javascript
mysql2 3.14.2
```
**¿Para qué se usa?**
- Conectar con MySQL
- Ejecutar consultas SQL
- Prepared statements (seguridad)
- Promises (async/await)

**¿Dónde se ve?**
```javascript
const mysql = require('mysql2/promise');

// Configuración
const dbConfig = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQLDATABASE,
  port: 3306
};

// Consulta
const connection = await mysql.createConnection(dbConfig);
const [rows] = await connection.execute(
  'SELECT * FROM tbl_ordenes WHERE pk_id_orden = ?',
  [id]
);
await connection.end();
```

**Funcionalidades:**
- CRUD de todas las tablas
- JOINs complejos
- Transacciones
- Connection pooling

---

### **Autenticación y Seguridad**
```javascript
jsonwebtoken 9.0.2    // JWT Tokens
bcrypt 6.0.0          // Hash de contraseñas
crypto (Node.js)      // SHA-256
```

#### **1. JWT (JSON Web Tokens)**
**¿Para qué se usa?**
- Autenticación de usuarios
- Sesiones sin estado
- Tokens con expiración

**¿Dónde se ve?**
```javascript
const jwt = require('jsonwebtoken');

// Generar token al login
const token = jwt.sign(
  { id: usuario.id, email: usuario.email },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);

// Verificar token en cada request
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

#### **2. Bcrypt**
**¿Para qué se usa?**
- Hashear contraseñas de forma segura
- Verificar contraseñas

**¿Dónde se ve?**
```javascript
const bcrypt = require('bcrypt');

// Al registrar usuario
const hashedPassword = await bcrypt.hash(password, 10);

// Al hacer login
const valid = await bcrypt.compare(password, hashedPassword);
```

#### **3. Crypto (SHA-256)**
**¿Para qué se usa?**
- Hash de contraseñas (legacy)
- Tokens de recuperación

**¿Dónde se ve?**
```javascript
const crypto = require('crypto');

// Hash de contraseña
const hash = crypto.createHash('sha256').update(password).digest('hex');

// Token único
const token = crypto.randomBytes(32).toString('hex');
```

---

### **Cross-Origin Resource Sharing**
```javascript
cors 2.8.5
```
**¿Para qué se usa?**
- Permitir peticiones desde el frontend
- Seguridad entre dominios
- Railway requiere CORS configurado

**¿Dónde se ve?**
```javascript
const cors = require('cors');

app.use(cors({
  origin: true,        // Permitir todos los orígenes
  credentials: true    // Permitir cookies
}));
```

---

### **Gestión de Variables de Entorno**
```javascript
dotenv 17.2.0
```
**¿Para qué se usa?**
- Cargar variables de archivo `.env`
- Credenciales seguras
- Configuración por entorno

**¿Dónde se ve?**
```javascript
require('dotenv').config();

// Usar variables
const dbHost = process.env.MYSQLHOST;
const jwtSecret = process.env.JWT_SECRET;
const cloudinaryKey = process.env.CLOUDINARY_API_KEY;
```

**Variables que maneja:**
- Base de datos (host, user, password, database)
- JWT secret
- Cloudinary (cloud name, API key, API secret)
- Email (service, user, password)
- WhatsApp (enabled, session path)

---

### **Upload de Archivos**
```javascript
multer 2.0.2
multer-storage-cloudinary 4.0.0
```

#### **1. Multer**
**¿Para qué se usa?**
- Procesar archivos multipart/form-data
- Subir imágenes y videos
- Validar tamaño y tipo

**¿Dónde se ve?**
```javascript
const multer = require('multer');

const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024,  // 100MB
    files: 5
  }
});

// En endpoint
app.post('/api/ordenes', 
  upload.fields([
    { name: 'imagen_1', maxCount: 1 },
    { name: 'imagen_2', maxCount: 1 },
    { name: 'imagen_3', maxCount: 1 },
    { name: 'imagen_4', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  async (req, res) => {
    const files = req.files;
    // Procesar archivos
  }
);
```

#### **2. Multer-Storage-Cloudinary**
**¿Para qué se usa?**
- Integrar Multer con Cloudinary
- Subir directamente a la nube
- Evitar almacenamiento local

---

### **Generación de PDFs**
```javascript
pdfkit 0.17.1
```
**¿Para qué se usa?**
- Crear órdenes de servicio en PDF
- Documentos personalizados
- Agregar texto, imágenes, formas

**¿Dónde se ve?**
```javascript
// En backend/services/pdfGenerator.js
const PDFDocument = require('pdfkit');

class PDFGenerator {
  generateOrderPDF(orderData) {
    const doc = new PDFDocument({ size: 'A4' });
    
    // Header
    doc.fontSize(20).text('TECNOAUTO', 50, 50);
    doc.fontSize(12).text('Centro de Servicio Automotriz', 50, 75);
    
    // Datos de la orden
    doc.fontSize(14).text(`Orden #${orderData.numero}`, 50, 120);
    doc.text(`Cliente: ${orderData.cliente}`, 50, 140);
    doc.text(`Vehículo: ${orderData.vehiculo}`, 50, 160);
    
    // Generar
    return doc;
  }
}
```

**Qué genera:**
- Órdenes de servicio completas
- Logo de la empresa
- Datos del cliente y vehículo
- Información del servicio
- Notas importantes
- Pie de página

---

### **Generación de Excel**
```javascript
exceljs 4.4.0
```
**¿Para qué se usa?**
- Reportes en formato Excel (.xlsx)
- Tablas con formato
- Múltiples hojas
- Estilos y colores

**¿Dónde se ve?**
```javascript
// En backend/services/reportService.js
const ExcelJS = require('exceljs');

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Órdenes');

// Headers
worksheet.columns = [
  { header: 'Orden', key: 'orden', width: 10 },
  { header: 'Cliente', key: 'cliente', width: 30 },
  { header: 'Vehículo', key: 'vehiculo', width: 30 },
  { header: 'Estado', key: 'estado', width: 20 }
];

// Datos
ordenes.forEach(orden => {
  worksheet.addRow({
    orden: orden.numero,
    cliente: orden.cliente,
    vehiculo: orden.vehiculo,
    estado: orden.estado
  });
});

// Estilos
worksheet.getRow(1).font = { bold: true };
worksheet.getRow(1).fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF3498db' }
};

// Guardar
await workbook.xlsx.writeFile('reporte.xlsx');
```

**Reportes que genera:**
- Reporte de órdenes por periodo
- Reporte de clientes
- Reporte de ingresos
- Estadísticas generales

---

### **Envío de Emails**
```javascript
nodemailer 7.0.5
```
**¿Para qué se usa?**
- Enviar correos electrónicos
- Templates HTML
- Adjuntos (PDFs)
- SMTP (Gmail)

**¿Dónde se ve?**
```javascript
// En backend/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS  // App password de Gmail
  }
});

const mailOptions = {
  from: 'TECNOAUTO <notificaciones@tecnoauto.com>',
  to: cliente.email,
  subject: `Orden #${orden.numero} - Actualización de Estado`,
  html: `
    <h2>¡Tu orden ha sido actualizada!</h2>
    <p>Estado actual: <strong>${orden.estado}</strong></p>
    <p>Observaciones: ${orden.observaciones}</p>
  `,
  attachments: [
    {
      filename: `Orden_${orden.numero}.pdf`,
      content: pdfBuffer
    }
  ]
};

await transporter.sendMail(mailOptions);
```

**Notificaciones que envía:**
- Cambio de estado de orden
- Nueva orden creada
- Recuperación de contraseña
- Orden completada

---

### **WhatsApp**
```javascript
whatsapp-web.js 1.32.0
qrcode-terminal 0.12.0
```

#### **1. whatsapp-web.js**
**¿Para qué se usa?**
- Enviar mensajes de WhatsApp
- Conectar con WhatsApp Web
- Sesión persistente

**¿Dónde se ve?**
```javascript
// En backend/services/whatsappService.js
const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'taller-mecanico',
    dataPath: './whatsapp-session'
  }),
  puppeteer: {
    args: ['--no-sandbox']
  }
});

// Inicializar
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('Escanea este QR con tu WhatsApp');
});

client.on('ready', () => {
  console.log('WhatsApp conectado!');
});

// Enviar mensaje
await client.sendMessage(
  '50212345678@c.us',
  `🔔 *TECNOAUTO*\n\nOrden #${orden.numero}\nEstado: ${estado}`
);

client.initialize();
```

#### **2. qrcode-terminal**
**¿Para qué se usa?**
- Mostrar código QR en terminal
- Autenticación de WhatsApp

**Primera vez:**
1. Servidor genera QR
2. Usuario escanea con WhatsApp móvil
3. Sesión se guarda en `./whatsapp-session/`
4. No requiere escanear de nuevo

---

### **Almacenamiento en la Nube**
```javascript
cloudinary 1.41.3
```
**¿Para qué se usa?**
- Subir imágenes y videos
- Almacenamiento en la nube
- CDN global (carga rápida)
- Transformaciones automáticas

**¿Dónde se ve?**
```javascript
// En backend/services/cloudinaryService.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar Multer con Cloudinary
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'taller-mecanico',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'],
    resource_type: 'auto',
    transformation: [
      { quality: 'auto' },
      { format: 'auto' }
    ]
  }
});

const upload = multer({ storage });
```

**Características:**
- **Transformaciones automáticas:**
  - Compresión inteligente
  - Formato WebP para web
  - Thumbnails de videos
  
- **URLs generadas:**
  ```
  https://res.cloudinary.com/[cloud]/image/upload/v123/taller/img.jpg
  ```

- **Ventajas:**
  - No consume espacio en servidor
  - CDN global (carga rápida)
  - Backup automático
  - Transformaciones on-the-fly

---

### **Axios (Backend)**
```javascript
axios 1.11.0
```
**¿Para qué se usa?**
- Peticiones HTTP desde el backend
- Consumir APIs externas
- Descargar archivos

**Ejemplo de uso:**
- Integración futura con APIs de pago
- Consultar APIs de servicios externos

---

## 🗄️ BASE DE DATOS - MYSQL

### **Motor de Base de Datos**
```
MySQL 8.0+
```
**¿Para qué se usa?**
- Almacenar todos los datos
- Relaciones entre tablas
- Consultas complejas
- Integridad referencial

**Características usadas:**

#### **1. Tipos de Datos**
```sql
-- Números
INT               (IDs, años)
FLOAT             (odómetro, precios)

-- Texto
VARCHAR(n)        (nombres, emails, teléfonos)
TEXT              (descripciones largas, observaciones)

-- Fechas
DATETIME          (fechas de registro, cambios)
TIMESTAMP         (automático en cambios)

-- Enumerados
ENUM('val1', 'val2')  (nivel combustible, unidad odómetro)
```

#### **2. Constraints (Restricciones)**
```sql
-- Claves primarias
PRIMARY KEY
AUTO_INCREMENT

-- Claves foráneas
FOREIGN KEY ... REFERENCES ...
ON DELETE CASCADE

-- Unicidad
UNIQUE (placa_vehiculo, dpi_cliente, NIT)

-- No nulos
NOT NULL

-- Valores por defecto
DEFAULT 'valor'
DEFAULT CURRENT_TIMESTAMP
```

#### **3. Funciones de MySQL usadas**
```sql
-- Fechas
NOW()                    -- Fecha/hora actual
DATE_FORMAT()            -- Formatear fechas
YEAR(), MONTH()          -- Extraer partes de fecha
DATE_SUB()               -- Restar tiempo
INTERVAL                 -- Intervalos de tiempo

-- Agregación
COUNT()                  -- Contar registros
SUM()                    -- Sumar valores
AVG()                    -- Promedio
COALESCE()               -- Valor por defecto si NULL

-- CTEs Recursivas
WITH RECURSIVE           -- Generar secuencias (meses)
```

#### **4. JOINs Complejos**
```sql
-- Ejemplo: Obtener orden completa
SELECT 
  o.*,
  c.nombre_cliente,
  c.telefono_cliente,
  v.placa_vehiculo,
  v.marca_vehiculo,
  v.modelo_vehiculo,
  s.servicio,
  e.estado_orden
FROM tbl_ordenes o
INNER JOIN tbl_clientes c ON o.fk_id_cliente = c.PK_id_cliente
INNER JOIN tbl_vehiculos v ON o.fk_id_vehiculo = v.pk_id_vehiculo
INNER JOIN tbl_servicios s ON o.fk_id_servicio = s.pk_id_servicio
INNER JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
WHERE o.pk_id_orden = ?
```

#### **5. Transacciones**
```sql
START TRANSACTION;
  INSERT INTO tbl_ordenes (...) VALUES (...);
  INSERT INTO tbl_historial_estado_orden (...) VALUES (...);
COMMIT;
```

### **Encoding**
```
utf8mb4_unicode_ci
```
**¿Para qué se usa?**
- Soporte completo de Unicode
- Emojis en textos
- Caracteres especiales
- Acentos y ñ

---

## 🌐 SERVICIOS EXTERNOS

### **1. Cloudinary**
```
Servicio: Cloud Storage + CDN
Plan: Free tier
```
**¿Qué hace?**
- Almacena imágenes y videos
- Optimización automática
- Transformaciones on-the-fly
- Entrega vía CDN

**Integración:**
```javascript
// Backend
const cloudinary = require('cloudinary').v2;

// Frontend
const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
```

---

### **2. Gmail API**
```
Servicio: SMTP de Google
Protocolo: SMTP
```
**¿Qué hace?**
- Envía correos electrónicos
- Templates HTML
- Adjuntos

**Integración:**
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tu_email@gmail.com',
    pass: 'contraseña_de_aplicacion'
  }
});
```

**Configuración requerida:**
1. Activar verificación en dos pasos en Gmail
2. Generar contraseña de aplicación
3. Usar esa contraseña en el código

---

### **3. WhatsApp Web**
```
Servicio: WhatsApp Business
Librería: whatsapp-web.js
```
**¿Qué hace?**
- Envía mensajes de WhatsApp
- Usa WhatsApp Web internamente
- Sesión persistente

**Cómo funciona:**
1. Primera vez: escanear QR con móvil
2. Sesión se guarda localmente
3. No requiere escanear de nuevo
4. Reconexión automática

---

## 🐳 INFRAESTRUCTURA

### **1. Docker**
```dockerfile
FROM node:18-alpine
```
**¿Para qué se usa?**
- Contenedor para la aplicación
- Entorno consistente
- Fácil despliegue

**¿Qué incluye?**
- Node.js 18
- Alpine Linux (ligero)
- Frontend compilado
- Backend

---

### **2. Railway**
```
Plataforma: Railway.app
Tipo: PaaS (Platform as a Service)
```
**¿Qué proporciona?**
- Hosting de la aplicación
- Base de datos MySQL
- Variables de entorno
- SSL automático
- Dominio .up.railway.app
- Deploy automático desde Git

**Proceso de deploy:**
```
1. git push origin main
2. Railway detecta cambios
3. Construye imagen Docker
4. Ejecuta tests
5. Despliega nueva versión
6. Health check
7. Cambia tráfico
```

---

## 📦 RESUMEN POR CATEGORÍA

### **FRONTEND (React)**
| Tecnología | Versión | Para qué sirve |
|------------|---------|----------------|
| React | 19.1.0 | UI e interfaz |
| React Router | 7.7.0 | Navegación |
| Bootstrap | 5.3.0 | Estilos y diseño |
| Chart.js | 4.5.0 | Gráficos |
| React-ChartJS-2 | 5.3.0 | Gráficos en React |
| Axios | 1.10.0 | Peticiones HTTP |
| Testing Library | 16.3.0 | Pruebas |
| React Scripts | 5.0.1 | Build y dev server |

### **BACKEND (Node.js)**
| Tecnología | Versión | Para qué sirve |
|------------|---------|----------------|
| Node.js | 18+ | Runtime JavaScript |
| Express | 5.1.0 | Framework web |
| MySQL2 | 3.14.2 | Base de datos |
| JWT | 9.0.2 | Autenticación |
| Bcrypt | 6.0.0 | Hash contraseñas |
| CORS | 2.8.5 | Cross-origin |
| Dotenv | 17.2.0 | Variables entorno |
| Multer | 2.0.2 | Upload archivos |
| PDFKit | 0.17.1 | Generar PDFs |
| ExcelJS | 4.4.0 | Generar Excel |
| Nodemailer | 7.0.5 | Enviar emails |
| WhatsApp-web.js | 1.32.0 | WhatsApp |
| Cloudinary | 1.41.3 | Storage nube |
| Axios | 1.11.0 | HTTP requests |

### **BASE DE DATOS**
| Tecnología | Versión | Para qué sirve |
|------------|---------|----------------|
| MySQL | 8.0+ | Base de datos relacional |
| UTF8MB4 | - | Encoding Unicode |

### **INFRAESTRUCTURA**
| Tecnología | Versión | Para qué sirve |
|------------|---------|----------------|
| Docker | - | Contenedores |
| Railway | - | Hosting y deploy |
| Cloudinary | - | CDN y storage |
| Gmail | - | SMTP emails |

---

## 🎯 MAPA DE DEPENDENCIAS POR FUNCIONALIDAD

### **📝 Gestión de Órdenes**
```
FRONTEND:
├─ React (UI)
├─ Bootstrap (Formularios, modales)
├─ Axios (Peticiones al backend)
└─ Cloudinary (Visualizar imágenes)

BACKEND:
├─ Express (API endpoints)
├─ MySQL2 (Almacenar en BD)
├─ Multer (Recibir archivos)
├─ Cloudinary (Subir a nube)
├─ Nodemailer (Notificar por email)
└─ WhatsApp-web.js (Notificar por WhatsApp)
```

### **📊 Dashboard con Estadísticas**
```
FRONTEND:
├─ React (Renderizado)
├─ Chart.js + React-ChartJS-2 (Gráficos)
├─ Bootstrap (Layout)
└─ Axios (Cargar datos)

BACKEND:
├─ Express (API /dashboard)
├─ MySQL2 (Consultas complejas)
└─ CTEs Recursivas (Generar meses)
```

### **🔍 Tracker Público**
```
FRONTEND:
├─ React (UI sin autenticación)
├─ Bootstrap (Diseño)
├─ Axios (Buscar órdenes)
└─ Cloudinary (Mostrar multimedia)

BACKEND:
├─ Express (API /tracker)
└─ MySQL2 (JOINs complejos)
```

### **📄 Generación de PDFs**
```
BACKEND:
├─ Express (Endpoint /ordenes/:id/pdf)
├─ PDFKit (Crear documento)
├─ MySQL2 (Obtener datos orden)
└─ Stream (Enviar PDF al cliente)
```

### **📈 Reportes en Excel**
```
BACKEND:
├─ Express (Endpoint /reportes/generar)
├─ ExcelJS (Crear archivo .xlsx)
├─ MySQL2 (Consultar datos filtrados)
└─ Stream (Descargar archivo)
```

### **🔐 Autenticación**
```
FRONTEND:
├─ React (Formulario login)
├─ Axios (POST /api/login)
└─ LocalStorage (Guardar token)

BACKEND:
├─ Express (Endpoint /api/login)
├─ MySQL2 (Verificar usuario)
├─ Crypto (Hash SHA-256)
└─ JWT (Generar token)
```

### **📧 Notificaciones**
```
BACKEND:
├─ NotificationService (Orquestador)
├─ EmailService
│  ├─ Nodemailer (Cliente SMTP)
│  └─ Gmail API (Servicio)
├─ WhatsAppService
│  └─ whatsapp-web.js (Cliente WA)
└─ PDFGenerator (Adjuntar PDFs)
```

### **📸 Gestión Multimedia**
```
FRONTEND:
├─ HTML5 (Input file)
├─ FormData (Construir multipart)
└─ Axios (Upload)

BACKEND:
├─ Multer (Procesar multipart)
├─ Multer-Storage-Cloudinary (Integración)
├─ Cloudinary (Almacenar)
└─ MySQL2 (Guardar URLs)
```

---

## 🎓 CONCLUSIÓN

Tu proyecto usa un **stack MERN modificado**:
- **M**ySQL (en lugar de MongoDB)
- **E**xpress
- **R**eact
- **N**ode.js

Más:
- **Bootstrap** para estilos
- **Chart.js** para gráficos
- **Cloudinary** para multimedia
- **Nodemailer** + **WhatsApp-web.js** para notificaciones
- **PDFKit** + **ExcelJS** para reportes
- **Railway** + **Docker** para deploy

Es un **stack moderno y profesional** con todas las mejores prácticas actuales.

---

**Documento generado:** 2 de noviembre de 2025  
**Sistema:** TECNOAUTO  
**Versión:** 1.0.0



