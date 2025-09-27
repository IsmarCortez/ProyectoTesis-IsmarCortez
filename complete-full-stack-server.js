// Servidor completo del Sistema Taller Mecánico con Frontend
console.log('🚀 Iniciando Sistema Taller Mecánico Full-Stack...');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');

// ==================== SISTEMA DE NOTIFICACIONES ====================
const NotificationService = require('./backend/services/notificationService');

// ==================== SISTEMA DE CLOUDINARY ====================
const { upload: cloudinaryUpload, isConfigured: cloudinaryConfigured } = require('./backend/services/cloudinaryService');

const app = express();
const PORT = process.env.PORT || 8080;

console.log('🔍 Puerto:', PORT);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

// Configuración de base de datos
const dbConfig = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT || 3306,
};

console.log('🔍 DB Config:', {
  host: dbConfig.host ? 'Configurado' : 'No configurado',
  user: dbConfig.user ? 'Configurado' : 'No configurado',
  password: dbConfig.password ? 'Configurado' : 'No configurado',
  database: dbConfig.database ? 'Configurado' : 'No configurado',
  port: dbConfig.port
});

// Configurar CORS para Railway
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Servir carpeta uploads como estática para acceder a imágenes (fallback)
app.use('/uploads', express.static(path.join(__dirname, 'backend/uploads')));

// Configuración de almacenamiento para multer (fallback local)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'backend/uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});

// Usar Cloudinary si está configurado, sino usar almacenamiento local
const upload = cloudinaryConfigured() ? cloudinaryUpload : multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB máximo (límite de Cloudinary para videos)
    files: 5 // Máximo 5 archivos por request
  },
  onError: (err, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const error = new Error('Archivo demasiado grande. Límites: Imágenes 10MB, Videos 100MB');
      error.status = 413;
      return next(error);
    }
    next(err);
  }
});

// Función helper para procesar archivos (Cloudinary o local)
const processFiles = (files, fieldName) => {
  if (!files || !files[fieldName] || files[fieldName].length === 0) {
    return cloudinaryConfigured() ? null : 'sin_imagen.jpg';
  }
  
  const file = files[fieldName][0];
  
  if (cloudinaryConfigured()) {
    // Cloudinary devuelve la URL completa
    return file.path || file.secure_url;
  } else {
    // Almacenamiento local devuelve el filename
    return file.filename;
  }
};

// ==================== API ENDPOINTS ====================

// Health check
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check recibido');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test de base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT NOW() as current_time');
    await connection.end();
    
    res.status(200).json({
      status: 'OK',
      database: 'Conectado',
      message: 'Base de datos funcionando correctamente',
      time: rows[0].current_time
    });
  } catch (error) {
    console.error('Error en test de DB:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      message: 'Error conectando a MySQL'
    });
  }
});

// ==================== AUTENTICACIÓN ====================

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña requeridos.' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM tbl_usuarios WHERE email_usuario = ?',
      [email]
    );
    await connection.end();
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }
    const usuario = rows[0];

    // Hasheamos la contraseña ingresada para compararla con la almacenada
    const hashPassword = crypto.createHash('sha256').update(password).digest('hex');
    if (hashPassword !== usuario.password_usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario.pk_id_usuarios, 
        email: usuario.email_usuario,
        nombre: usuario.nombre_usuario 
      },
      process.env.JWT_SECRET || 'secret_key_default',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuario.pk_id_usuarios,
        nombre: usuario.nombre_usuario,
        email: usuario.email_usuario,
        foto: usuario.foto_perfil_usuario
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ==================== RUTAS DEL BACKEND COMPLETO ====================

// Aquí vamos a importar todas las rutas del backend original
// Por ahora, vamos a copiar las rutas más importantes

// ==================== USUARIOS ====================

// Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_usuarios');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error obteniendo usuarios' });
  }
});

// Crear usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nombre_usuario, email_usuario, password_usuario, foto_perfil_usuario } = req.body;
    const hashPassword = crypto.createHash('sha256').update(password_usuario).digest('hex');
    
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO tbl_usuarios (nombre_usuario, email_usuario, password_usuario, foto_perfil_usuario) VALUES (?, ?, ?, ?)',
      [nombre_usuario, email_usuario, hashPassword, foto_perfil_usuario || null]
    );
    await connection.end();
    
    res.status(201).json({ message: 'Usuario creado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ message: 'Error creando usuario' });
  }
});

// ==================== CLIENTES ====================

// Obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_clientes ORDER BY PK_id_cliente DESC');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ message: 'Error obteniendo clientes' });
  }
});

// Crear cliente
app.post('/api/clientes', async (req, res) => {
  try {
    const { nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente } = req.body;
    
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO tbl_clientes (nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente]
    );
    await connection.end();
    
    res.status(201).json({ message: 'Cliente creado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({ message: 'Error creando cliente' });
  }
});

// Buscar cliente por NIT
app.get('/api/clientes/nit/:nit', async (req, res) => {
  try {
    const { nit } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM tbl_clientes WHERE NIT = ?',
      [nit]
    );
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error buscando cliente:', error);
    res.status(500).json({ message: 'Error buscando cliente' });
  }
});

// ==================== VEHÍCULOS ====================

// Obtener todos los vehículos
app.get('/api/vehiculos', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_vehiculos ORDER BY pk_id_vehiculo DESC');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo vehículos:', error);
    res.status(500).json({ message: 'Error obteniendo vehículos' });
  }
});

// Crear vehículo
app.post('/api/vehiculos', async (req, res) => {
  try {
    const { placa_vehiculo, marca_vehiculo, modelo_vehiculo, anio_vehiculo, color_vehiculo } = req.body;
    
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO tbl_vehiculos (placa_vehiculo, marca_vehiculo, modelo_vehiculo, anio_vehiculo, color_vehiculo) VALUES (?, ?, ?, ?, ?)',
      [placa_vehiculo, marca_vehiculo, modelo_vehiculo, anio_vehiculo, color_vehiculo]
    );
    await connection.end();
    
    res.status(201).json({ message: 'Vehículo creado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error creando vehículo:', error);
    res.status(500).json({ message: 'Error creando vehículo' });
  }
});

// ==================== SERVICIOS ====================

// Obtener todos los servicios
app.get('/api/servicios', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_servicios ORDER BY pk_id_servicio DESC');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo servicios:', error);
    res.status(500).json({ message: 'Error obteniendo servicios' });
  }
});

// Crear servicio
app.post('/api/servicios', async (req, res) => {
  try {
    const { servicio, descripcion_servicios } = req.body;
    
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO tbl_servicios (servicio, descripcion_servicios) VALUES (?, ?)',
      [servicio, descripcion_servicios]
    );
    await connection.end();
    
    res.status(201).json({ message: 'Servicio creado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error creando servicio:', error);
    res.status(500).json({ message: 'Error creando servicio' });
  }
});

// ==================== ESTADOS ====================

// Obtener todos los estados
app.get('/api/estados', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_estados_orden ORDER BY pk_id_estado DESC');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo estados:', error);
    res.status(500).json({ message: 'Error obteniendo estados' });
  }
});

// ==================== ÓRDENES ====================

// Obtener todas las órdenes
app.get('/api/ordenes', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT 
        o.*,
        c.nombre_cliente,
        c.apellido_cliente,
        c.NIT,
        v.placa_vehiculo,
        v.marca_vehiculo,
        v.modelo_vehiculo,
        s.servicio,
        e.estado_orden
      FROM tbl_ordenes o
      LEFT JOIN tbl_clientes c ON o.fk_id_cliente = c.PK_id_cliente
      LEFT JOIN tbl_vehiculos v ON o.fk_id_vehiculo = v.pk_id_vehiculo
      LEFT JOIN tbl_servicios s ON o.fk_id_servicio = s.pk_id_servicio
      LEFT JOIN tbl_estados_orden e ON o.fk_id_estado_orden = e.pk_id_estado
      ORDER BY o.pk_id_orden DESC
    `);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    res.status(500).json({ message: 'Error obteniendo órdenes' });
  }
});

// ==================== DASHBOARD ====================

// Estadísticas del dashboard
app.get('/api/dashboard/estadisticas', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Contar clientes
    const [clientes] = await connection.execute('SELECT COUNT(*) as total FROM tbl_clientes');
    
    // Contar vehículos
    const [vehiculos] = await connection.execute('SELECT COUNT(*) as total FROM tbl_vehiculos');
    
    // Contar órdenes
    const [ordenes] = await connection.execute('SELECT COUNT(*) as total FROM tbl_ordenes');
    
    // Contar servicios
    const [servicios] = await connection.execute('SELECT COUNT(*) as total FROM tbl_servicios');
    
    await connection.end();
    
    res.json({
      totales: {
        clientes: clientes[0].total,
        vehiculos: vehiculos[0].total,
        ordenes: ordenes[0].total,
        servicios: servicios[0].total
      },
      message: 'Dashboard funcionando correctamente'
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error obteniendo estadísticas' });
  }
});

// ==================== RUTAS FALTANTES (PLACEHOLDER) ====================

// Estas rutas necesitan implementarse completamente del backend original
app.post('/api/auth/forgot-password', (req, res) => {
  res.status(501).json({ message: 'Funcionalidad de recuperación de contraseña en desarrollo' });
});

app.get('/api/auth/verify-reset-token/:token', (req, res) => {
  res.status(501).json({ message: 'Verificación de token en desarrollo' });
});

app.post('/api/auth/reset-password', (req, res) => {
  res.status(501).json({ message: 'Reset de contraseña en desarrollo' });
});

// ==================== CATCH-ALL PARA FRONTEND ====================

// Todas las rutas que no sean API, servir el frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Sistema Taller Mecánico Full-Stack escuchando en puerto ${PORT}`);
  console.log(`🌐 Frontend: http://0.0.0.0:${PORT}`);
  console.log(`🌐 API: http://0.0.0.0:${PORT}/api`);
  console.log(`🌐 Health check: http://0.0.0.0:${PORT}/api/health`);
});
