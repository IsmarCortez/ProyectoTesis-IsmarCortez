require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');  // <-- Importamos path para rutas
const nodemailer = require('nodemailer'); // <-- Importar nodemailer
const multer = require('multer'); //s <-- Importar multer para manejo de archivos

// ==================== SISTEMA DE NOTIFICACIONES ====================
const NotificationService = require('./services/notificationService');

// ==================== SISTEMA DE CLOUDINARY ====================
const { upload: cloudinaryUpload, isConfigured: cloudinaryConfigured } = require('./services/cloudinaryService');

const app = express();

// Configurar timeouts extendidos para uploads de archivos grandes (especialmente videos)
// Timeout de 15 minutos (900000ms) para requests con archivos
app.timeout = 900000; // 15 minutos

// Configurar CORS para Railway
app.use(cors({
  origin: true, // Permitir todos los orígenes para Railway
  credentials: true
}));

// Configurar límites de tamaño para JSON y URL-encoded (aunque usamos FormData, es bueno tenerlo)
// Aumentado a 150mb para coincidir con el límite de videos
app.use(express.json({ 
  limit: '150mb',
  verify: (req, res, buf) => {
    // Log del tamaño del body recibido
    if (buf && buf.length > 0) {
      const sizeMB = (buf.length / (1024 * 1024)).toFixed(2);
      console.log(`📦 Body recibido: ${sizeMB} MB (${req.method} ${req.path})`);
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '150mb',
  parameterLimit: 50000 // Aumentar límite de parámetros
}));

// Middleware para capturar errores de tamaño de payload antes de que lleguen a Multer
// Este debe estar DESPUÉS de express.json y express.urlencoded
app.use((err, req, res, next) => {
  // Log detallado del error
  console.error('❌ Error capturado en middleware global:', err.status || err.statusCode, err.type, err.message);
  console.error('📊 Request method:', req.method);
  console.error('📊 Request path:', req.path);
  console.error('📋 Content-Type:', req.get('Content-Type'));
  console.error('📏 Content-Length:', req.get('Content-Length'));
  console.error('📋 Error stack:', err.stack);
  
  if (err.status === 413 || err.statusCode === 413 || err.type === 'entity.too.large' || err.message?.includes('too large') || err.message?.includes('413')) {
    console.error('❌ Error 413 detectado antes de Multer:', err.message);
    
    return res.status(413).json({ 
      message: 'El archivo es demasiado grande. Límites: Imágenes 10MB, Videos 100MB (límite de Cloudinary). Si el archivo es menor a 100MB, puede ser un límite del servidor (Railway). Por favor, intenta con un archivo más pequeño o contacta al administrador.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      method: req.method,
      path: req.path
    });
  }
  next(err);
});

// Servir carpeta uploads como estática para acceder a imágenes (fallback)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de almacenamiento para multer (fallback local)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});

// Usar Cloudinary si está configurado, sino usar almacenamiento local
// NOTA: Si usamos Cloudinary, el límite es 100MB (límite de Cloudinary)
// Si usamos almacenamiento local, podemos usar 150MB
const upload = cloudinaryConfigured() ? cloudinaryUpload : multer({ 
  storage,
  limits: {
    fileSize: 150 * 1024 * 1024, // 150MB máximo solo para almacenamiento local (Cloudinary tiene límite de 100MB)
    files: 11 // Máximo 11 archivos por request (10 imágenes + 1 video)
  },
  onError: (err, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const error = new Error('Archivo demasiado grande. Límites: Imágenes 10MB, Videos 100MB (Cloudinary) o 150MB (local)');
      error.status = 413;
      return next(error);
    }
    next(err);
  }
});

// Función helper para procesar archivos (Cloudinary o local)
const processFiles = (files, fieldName) => {
  if (!files || !files[fieldName] || files[fieldName].length === 0) {
    // No devolver valores por defecto, devolver null para indicar que no hay archivo nuevo
    return null;
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

const dbConfig = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT || 3306,
};

console.log('🔍 DB Config Railway:', {
  host: dbConfig.host ? 'Configurado' : 'No configurado',
  user: dbConfig.user ? 'Configurado' : 'No configurado', 
  password: dbConfig.password ? 'Configurado' : 'No configurado',
  database: dbConfig.database ? 'Configurado' : 'No configurado',
  port: dbConfig.port
});

console.log('🔍 JWT Config:', {
  jwt_secret: process.env.JWT_SECRET ? 'Configurado' : 'Usando fallback',
  jwt_value: process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 5) + '...' : 'undefined'
});

console.log('🔍 Todas las variables JWT:', {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_SECRET_LENGTH: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined'
});

// ==================== MIDDLEWARE DE AUTENTICACIÓN JWT ====================

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Token de autenticación requerido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret_key_default_railway', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado.' });
    }
    req.user = user; // Agregar información del usuario al request
    next();
  });
};

// Lista de rutas públicas que no requieren autenticación
const publicRoutes = [
  '/api/login',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-reset-token',
  '/api/recuperar-contrasena',
  '/api/orden/publica/', // Rutas que empiezan con esto son públicas
  '/api/health'
];

// Middleware para aplicar autenticación solo a rutas protegidas
const requireAuth = (req, res, next) => {
  // Verificar si la ruta es pública
  let isPublicRoute = false;
  
  for (const route of publicRoutes) {
    // Para rutas con parámetros dinámicos (que terminan en /)
    if (route.endsWith('/')) {
      if (req.path.startsWith(route)) {
        isPublicRoute = true;
        break;
      }
    } 
    // Para rutas exactas
    else if (req.path === route || req.path.startsWith(route + '/')) {
      isPublicRoute = true;
      break;
    }
  }
  
  if (isPublicRoute) {
    // Log para debug de rutas públicas
    if (req.path === '/api/login' || req.path === '/api/health') {
      console.log(`✅ Ruta pública detectada: ${req.path} - permitiendo acceso sin autenticación`);
    }
    return next(); // Continuar sin autenticación
  }
  
  // Aplicar autenticación a rutas protegidas
  console.log(`🔒 Ruta protegida detectada: ${req.path} - verificando autenticación`);
  authenticateToken(req, res, next);
};

// ==================== MIDDLEWARES DE AUTORIZACIÓN POR ROLES ====================

// Middleware para requerir rol de administrador
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Autenticación requerida.' });
  }
  
  if (req.user.rol !== 'admin') {
    console.log(`❌ Acceso denegado: Usuario ${req.user.email} (rol: ${req.user.rol}) intentó acceder a ${req.path} - Se requiere rol 'admin'`);
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  
  next();
};

// Middleware para requerir rol de administrador o editor
const requireAdminOrEditor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Autenticación requerida.' });
  }
  
  if (req.user.rol !== 'admin' && req.user.rol !== 'editor') {
    console.log(`❌ Acceso denegado: Usuario ${req.user.email} (rol: ${req.user.rol}) intentó acceder a ${req.path} - Se requiere rol 'admin' o 'editor'`);
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador o editor.' });
  }
  
  next();
};

// ==================== ENDPOINTS PÚBLICOS (ANTES DEL MIDDLEWARE) ====================
// Estos endpoints NO requieren autenticación y deben estar ANTES del middleware

// Health check para Railway
app.get('/api/health', (req, res) => {
  console.log('✅ Health check recibido desde:', req.get('host') || req.ip);
  console.log('🔍 User-Agent:', req.get('user-agent'));
  console.log('🔍 Puerto del servidor:', process.env.PORT || 8080);
  
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 8080,
    environment: process.env.NODE_ENV || 'development'
  });
});

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

    if (hashPassword !== usuario.contrasenia_usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    console.log('🔍 Generando JWT con secret:', process.env.JWT_SECRET ? 'Configurado' : 'Fallback');
    
    // Incluir el rol en el token JWT
    const token = jwt.sign(
      {
        id: usuario.pk_id_usuarios,
        nombre: usuario.nombre_usuario,
        email: usuario.email_usuario,
        foto: usuario.foto_perfil_usuario,
        rol: usuario.rol_usuario || 'mecanico', // Incluir rol en el token
      },
      process.env.JWT_SECRET || 'secret_key_default_railway',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        nombre: usuario.nombre_usuario,
        email: usuario.email_usuario,
        foto: usuario.foto_perfil_usuario, // Este debe ser solo el nombre del archivo
        rol: usuario.rol_usuario || 'mecanico', // Incluir rol en la respuesta
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// ==================== ENDPOINTS DE RECUPERACIÓN DE CONTRASEÑA (PÚBLICOS) ====================

// Endpoint para solicitar recuperación de contraseña
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email es requerido.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar si el usuario existe
    const [users] = await connection.execute(
      'SELECT pk_id_usuarios, nombre_usuario, email_usuario FROM tbl_usuarios WHERE email_usuario = ?',
      [email]
    );

    if (users.length === 0) {
      await connection.end();
      // Por seguridad, no revelamos si el email existe o no
      return res.json({ 
        message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.' 
      });
    }

    const user = users[0];

    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expirationTime = new Date(Date.now() + 3600000); // 1 hora

    // Invalidar tokens anteriores del usuario
    await connection.execute(
      'UPDATE tbl_password_reset_tokens SET usado = TRUE WHERE fk_id_usuario = ? AND usado = FALSE',
      [user.pk_id_usuarios]
    );

    // Insertar nuevo token
    await connection.execute(
      'INSERT INTO tbl_password_reset_tokens (fk_id_usuario, token, email_usuario, fecha_expiracion) VALUES (?, ?, ?, ?)',
      [user.pk_id_usuarios, resetToken, email, expirationTime]
    );

    await connection.end();

    // Enviar email con el enlace de recuperación
    const frontendUrl = process.env.FRONTEND_URL || 'https://proyectotesis-ismarcortez-production.up.railway.app';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    // Usar el servicio de notificaciones existente para enviar el email
    try {
      await NotificationService.sendPasswordResetEmail(email, user.nombre_usuario, resetLink);
    } catch (emailError) {
      console.error('Error enviando email de recuperación:', emailError);
      // No fallar la operación si el email no se puede enviar
    }

    res.json({ 
      message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.' 
    });

  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Endpoint para resetear contraseña con token
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token y nueva contraseña son requeridos.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Buscar token válido
    const [tokens] = await connection.execute(
      `SELECT prt.*, u.nombre_usuario, u.email_usuario 
       FROM tbl_password_reset_tokens prt 
       JOIN tbl_usuarios u ON prt.fk_id_usuario = u.pk_id_usuarios 
       WHERE prt.token = ? AND prt.usado = FALSE AND prt.fecha_expiracion > NOW()`,
      [token]
    );

    if (tokens.length === 0) {
      await connection.end();
      return res.status(400).json({ message: 'Token inválido o expirado.' });
    }

    const resetToken = tokens[0];

    // Hashear nueva contraseña
    const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

    // Actualizar contraseña del usuario
    await connection.execute(
      'UPDATE tbl_usuarios SET contrasenia_usuario = ? WHERE pk_id_usuarios = ?',
      [hashedPassword, resetToken.fk_id_usuario]
    );

    // Marcar token como usado
    await connection.execute(
      'UPDATE tbl_password_reset_tokens SET usado = TRUE WHERE pk_id_token = ?',
      [resetToken.pk_id_token]
    );

    await connection.end();

    res.json({ message: 'Contraseña actualizada exitosamente.' });

  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Endpoint para verificar si un token es válido
app.get('/api/auth/verify-reset-token/:token', async (req, res) => {
  const { token } = req.params;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [tokens] = await connection.execute(
      'SELECT * FROM tbl_password_reset_tokens WHERE token = ? AND usado = FALSE AND fecha_expiracion > NOW()',
      [token]
    );

    await connection.end();

    if (tokens.length === 0) {
      return res.status(400).json({ message: 'Token inválido o expirado.' });
    }

    res.json({ message: 'Token válido.' });

  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

/********************************************************************************** */

app.post('/api/recuperar-contrasena', async (req, res) => {
  const { email, password, confirmPassword, mascota } = req.body;
  if (!email || !password || !confirmPassword || !mascota) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Las contraseñas no coinciden.' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM tbl_usuarios WHERE email_usuario = ?',
      [email]
    );
    if (rows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'No existe un usuario con ese correo.' });
    }
    const usuario = rows[0];
    // Verificar la respuesta de la pregunta de seguridad (ignorando mayúsculas/minúsculas y espacios)
    if (
      usuario.pregunta_seguridad_usuario.trim().toLowerCase() !==
      mascota.trim().toLowerCase()
    ) {
      await connection.end();
      return res.status(401).json({ message: 'La respuesta de seguridad es incorrecta.' });
    }
    // Hashear la nueva contraseña
    const hashPassword = crypto.createHash('sha256').update(password).digest('hex');
    await connection.execute(
      'UPDATE tbl_usuarios SET contrasenia_usuario = ? WHERE email_usuario = ?',
      [hashPassword, email]
    );
    await connection.end();

    // Email deshabilitado - no se envía correo de confirmación
    // El sistema de correos no está en uso según requerimientos del usuario

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// Endpoint público para obtener orden completa por token único
// DEBE estar ANTES del middleware para funcionar correctamente
app.get('/api/orden/publica/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log(`🔍 Búsqueda pública por token: ${token}`);
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Obtener información completa de la orden
    const [ordenes] = await connection.execute(`
      SELECT 
        o.pk_id_orden,
        o.fecha_ingreso_orden,
        o.token_publico,
        CONCAT(c.nombre_cliente, ' ', c.apellido_cliente) as cliente,
        c.telefono_cliente,
        c.NIT,
        CONCAT(v.marca_vehiculo, ' ', v.modelo_vehiculo) as vehiculo,
        v.placa_vehiculo,
        v.anio_vehiculo,
        s.servicio,
        e.estado_orden,
        e.descripcion_estado,
        o.comentario_cliente_orden,
        o.observaciones_orden,
        o.nivel_combustible_orden,
        o.odometro_auto_cliente_orden,
        o.unidad_odometro,
        o.estado_vehiculo,
        o.imagen_1,
        o.imagen_2,
        o.imagen_3,
        o.imagen_4,
        o.imagen_5,
        o.imagen_6,
        o.imagen_7,
        o.imagen_8,
        o.imagen_9,
        o.imagen_10,
        o.video
      FROM tbl_ordenes o
      LEFT JOIN tbl_clientes c ON o.fk_id_cliente = c.PK_id_cliente
      LEFT JOIN tbl_vehiculos v ON o.fk_id_vehiculo = v.pk_id_vehiculo
      LEFT JOIN tbl_servicios s ON o.fk_id_servicio = s.pk_id_servicio
      LEFT JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
      WHERE o.token_publico = ?
    `, [token]);
    
    if (ordenes.length === 0) {
      await connection.end();
      return res.status(404).json({ 
        encontrado: false, 
        mensaje: 'Orden no encontrada o token inválido.' 
      });
    }
    
    const orden = ordenes[0];
    
    // Obtener historial de estados
    const [historialReal] = await connection.execute(`
      SELECT 
        h.pk_id_historial,
        h.fecha_cambio,
        h.comentario_cambio,
        ea.estado_orden AS estado_anterior,
        en.estado_orden AS estado_nuevo,
        en.descripcion_estado AS descripcion_estado,
        u.nombre_usuario AS usuario_cambio
      FROM tbl_historial_estados h
      LEFT JOIN tbl_orden_estado ea ON h.fk_id_estado_anterior = ea.pk_id_estado
      LEFT JOIN tbl_orden_estado en ON h.fk_id_estado_nuevo = en.pk_id_estado
      LEFT JOIN tbl_usuarios u ON h.fk_id_usuario_cambio = u.pk_id_usuarios
      WHERE h.fk_id_orden = ?
      ORDER BY h.fecha_cambio ASC
    `, [orden.pk_id_orden]);
    
    // Procesar historial
    const historial = [];
    
    if (historialReal.length === 0) {
      // No hay historial registrado, crear estado inicial
      historial.push({
        estado: orden.estado_orden,
        descripcion: orden.descripcion_estado || 'Estado inicial de la orden',
        fecha: orden.fecha_ingreso_orden,
        activo: true,
        usuario: 'Sistema',
        comentario: 'Orden creada inicialmente'
      });
    } else {
      // Procesar historial real
      for (const registro of historialReal) {
        historial.push({
          estado: registro.estado_nuevo,
          descripcion: registro.descripcion_estado || '',
          fecha: registro.fecha_cambio,
          activo: false,
          usuario: registro.usuario_cambio || 'Sistema',
          comentario: registro.comentario_cambio || ''
        });
      }
      
      // Marcar el último estado como activo
      if (historial.length > 0) {
        historial[historial.length - 1].activo = true;
      }
    }
    
    await connection.end();
    
    res.json({ 
      encontrado: true,
      orden: orden,
      historial: historial
    });
    
  } catch (error) {
    console.error('Error en búsqueda por token:', error);
    res.status(500).json({ 
      encontrado: false, 
      mensaje: 'Error al buscar la orden.' 
    });
  }
});

// ==================== APLICAR MIDDLEWARE DE AUTENTICACIÓN ====================
// IMPORTANTE: Todos los endpoints públicos deben estar ANTES de esta línea
// Endpoints públicos ya definidos:
// - /api/health
// - /api/login
// - /api/auth/forgot-password
// - /api/auth/reset-password
// - /api/auth/verify-reset-token/:token
// - /api/recuperar-contrasena
// - /api/orden/publica/:token
// Todos los endpoints definidos DESPUÉS de esta línea requerirán autenticación
app.use('/api', requireAuth);

// Endpoint para actualizar nombre y foto de perfil
app.post('/api/actualizar-usuario', upload.single('foto'), async (req, res) => {
  const { email, nombre } = req.body;
  let fotoUrl = null;
  
  if (!email || !nombre) {
    return res.status(400).json({ message: 'Email y nombre requeridos.' });
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    let query = 'UPDATE tbl_usuarios SET nombre_usuario = ?';
    let params = [nombre];
    
    if (req.file) {
      // Procesar foto usando Cloudinary
      if (cloudinaryConfigured()) {
        fotoUrl = req.file.path || req.file.secure_url;
      } else {
        fotoUrl = req.file.filename;
      }
      
      query += ', foto_perfil_usuario = ?';
      params.push(fotoUrl);
    }
    
    query += ' WHERE email_usuario = ?';
    params.push(email);
    
    const [result] = await connection.execute(query, params);
    
    if (result.affectedRows === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    await connection.end();
    res.json({ 
      message: 'Usuario actualizado correctamente.', 
      foto: fotoUrl,
      success: true 
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// Endpoint para registrar un nuevo cliente
app.post('/api/clientes', requireAdminOrEditor, async (req, res) => {
  const { nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente } = req.body;
  if (!nombre_cliente) {
    return res.status(400).json({ message: 'El nombre del cliente es requerido.' });
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Validar que DPI y NIT no estén duplicados (solo si no están vacíos)
    if (dpi_cliente && dpi_cliente.trim() !== '') {
      const [dpiExists] = await connection.execute(
        'SELECT PK_id_cliente FROM tbl_clientes WHERE dpi_cliente = ?',
        [dpi_cliente]
      );
      if (dpiExists.length > 0) {
        await connection.end();
        return res.status(409).json({ message: 'El DPI ya está registrado.' });
      }
    }
    
    if (NIT && NIT.trim() !== '') {
      const [nitExists] = await connection.execute(
        'SELECT PK_id_cliente FROM tbl_clientes WHERE NIT = ?',
        [NIT]
      );
      if (nitExists.length > 0) {
        await connection.end();
        return res.status(409).json({ message: 'El NIT ya está registrado.' });
      }
    }
    
    // Convertir campos vacíos a NULL para evitar problemas con UNIQUE
    const dpiValue = (dpi_cliente && dpi_cliente.trim() !== '') ? dpi_cliente : null;
    const nitValue = (NIT && NIT.trim() !== '') ? NIT : null;
    
    // Insertar cliente
    await connection.execute(
      `INSERT INTO tbl_clientes (nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre_cliente, apellido_cliente, dpiValue, nitValue, telefono_cliente, correo_cliente, direccion_cliente]
    );
    await connection.end();
    res.json({ message: 'Cliente registrado exitosamente.' });
  } catch (error) {
    console.error('Error registrando cliente:', error);
    res.status(500).json({ message: 'Error al registrar el cliente.' });
  }
});

// Endpoint para obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_clientes');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los clientes.' });
  }
});

// Endpoint para buscar/verificar cliente por DPI
app.get('/api/clientes/dpi/:dpi', async (req, res) => {
  const { dpi } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_clientes WHERE dpi_cliente = ?', [dpi]);
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No existe un cliente con ese DPI.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al buscar el cliente.' });
  }
});

// Endpoint para buscar cliente por NIT
app.get('/api/clientes/nit/:nit', async (req, res) => {
  const { nit } = req.params;
  console.log('🔍 Buscando cliente por NIT:', nit);
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_clientes WHERE NIT = ?', [nit]);
    console.log('📊 Resultados de la búsqueda:', rows);
    await connection.end();
    if (rows.length === 0) {
      console.log('❌ No se encontró cliente con NIT:', nit);
      return res.status(404).json({ message: 'No existe un cliente con ese NIT.' });
    }
    console.log('✅ Cliente encontrado:', rows[0]);
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ Error en búsqueda por NIT:', error);
    res.status(500).json({ message: 'Error al buscar el cliente.' });
  }
});

// Endpoint para actualizar un cliente
app.put('/api/clientes/:id', requireAdminOrEditor, async (req, res) => {
  const { id } = req.params;
  const { nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `UPDATE tbl_clientes SET nombre_cliente = ?, apellido_cliente = ?, dpi_cliente = ?, NIT = ?, telefono_cliente = ?, correo_cliente = ?, direccion_cliente = ? WHERE PK_id_cliente = ?`,
      [nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente, id]
    );
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }
    res.json({ message: 'Cliente actualizado correctamente.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'El DPI o NIT ya está registrado.' });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Error al actualizar el cliente.' });
    }
  }
});

// Endpoint para eliminar un cliente
app.delete('/api/clientes/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM tbl_clientes WHERE PK_id_cliente = ?', [id]);
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }
    res.json({ message: 'Cliente eliminado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el cliente.' });
  }
});

// ==================== ENDPOINTS PARA VEHÍCULOS ====================

// Endpoint para obtener todos los vehículos
app.get('/api/vehiculos', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT * FROM tbl_vehiculos
      ORDER BY pk_id_vehiculo DESC
    `);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los vehículos.' });
  }
});

// Endpoint para buscar cliente por DPI para asociar vehículo
app.get('/api/vehiculos/buscar-cliente/:dpi', async (req, res) => {
  const { dpi } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT PK_id_cliente, nombre_cliente, apellido_cliente, dpi_cliente FROM tbl_clientes WHERE dpi_cliente = ?', 
      [dpi]
    );
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No existe un cliente con ese DPI.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al buscar el cliente.' });
  }
});

// Endpoint para registrar un nuevo vehículo
app.post('/api/vehiculos', requireAdminOrEditor, async (req, res) => {
  const { 
    placa_vehiculo, 
    marca_vehiculo, 
    modelo_vehiculo, 
    anio_vehiculo, 
    color_vehiculo 
  } = req.body;

  if (!placa_vehiculo || !marca_vehiculo || !modelo_vehiculo) {
    return res.status(400).json({ message: 'Placa, marca y modelo son requeridos.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Insertar vehículo
    await connection.execute(
      `INSERT INTO tbl_vehiculos (placa_vehiculo, marca_vehiculo, modelo_vehiculo, anio_vehiculo, color_vehiculo)
       VALUES (?, ?, ?, ?, ?)`,
      [placa_vehiculo, marca_vehiculo, modelo_vehiculo, anio_vehiculo, color_vehiculo]
    );
    await connection.end();
    res.json({ message: 'Vehículo registrado exitosamente.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'La placa ya está registrada.' });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Error al registrar el vehículo.' });
    }
  }
});

// Endpoint para obtener un vehículo específico
app.get('/api/vehiculos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM tbl_vehiculos WHERE pk_id_vehiculo = ?',
      [id]
    );
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Vehículo no encontrado.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el vehículo.' });
  }
});

// Endpoint para actualizar un vehículo
app.put('/api/vehiculos/:id', requireAdminOrEditor, async (req, res) => {
  const { id } = req.params;
  const { 
    placa_vehiculo, 
    marca_vehiculo, 
    modelo_vehiculo, 
    anio_vehiculo, 
    color_vehiculo 
  } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Actualizar vehículo
    const [result] = await connection.execute(
      `UPDATE tbl_vehiculos SET placa_vehiculo = ?, marca_vehiculo = ?, modelo_vehiculo = ?, anio_vehiculo = ?, color_vehiculo = ? WHERE pk_id_vehiculo = ?`,
      [placa_vehiculo, marca_vehiculo, modelo_vehiculo, anio_vehiculo, color_vehiculo, id]
    );
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vehículo no encontrado.' });
    }
    res.json({ message: 'Vehículo actualizado correctamente.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'La placa ya está registrada.' });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Error al actualizar el vehículo.' });
    }
  }
});

// Endpoint para eliminar un vehículo
app.delete('/api/vehiculos/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM tbl_vehiculos WHERE pk_id_vehiculo = ?', [id]);
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vehículo no encontrado.' });
    }
    res.json({ message: 'Vehículo eliminado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el vehículo.' });
  }
});

// ==================== ENDPOINTS PARA SERVICIOS ====================

// Endpoint para obtener todos los servicios
app.get('/api/servicios', async (req, res) => {
  try {
    console.log('🔍 Intentando obtener servicios...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a BD establecida');
    const [rows] = await connection.execute('SELECT * FROM tbl_servicios ORDER BY pk_id_servicio DESC');
    console.log('📊 Servicios obtenidos:', rows.length);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('❌ Error al obtener servicios:', error);
    res.status(500).json({ message: 'Error al obtener los servicios.', error: error.message });
  }
});

// Endpoint para registrar un nuevo servicio
app.post('/api/servicios', requireAdminOrEditor, async (req, res) => {
  const { servicio, descripcion_servicios } = req.body;
  if (!servicio) {
    return res.status(400).json({ message: 'El nombre del servicio es requerido.' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'INSERT INTO tbl_servicios (servicio, descripcion_servicios) VALUES (?, ?)',
      [servicio, descripcion_servicios]
    );
    await connection.end();
    res.json({ message: 'Servicio registrado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar el servicio.' });
  }
});

// Endpoint para actualizar un servicio
app.put('/api/servicios/:id', requireAdminOrEditor, async (req, res) => {
  const { id } = req.params;
  const { servicio, descripcion_servicios } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'UPDATE tbl_servicios SET servicio = ?, descripcion_servicios = ? WHERE pk_id_servicio = ?',
      [servicio, descripcion_servicios, id]
    );
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado.' });
    }
    res.json({ message: 'Servicio actualizado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el servicio.' });
  }
});

// Endpoint para eliminar un servicio
app.delete('/api/servicios/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM tbl_servicios WHERE pk_id_servicio = ?', [id]);
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado.' });
    }
    res.json({ message: 'Servicio eliminado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el servicio.' });
  }
});

// ==================== ENDPOINTS PARA ESTADOS ====================

// Endpoint para obtener todos los estados
app.get('/api/estados', async (req, res) => {
  try {
    console.log('🔍 Intentando obtener estados...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a BD establecida');
    const [rows] = await connection.execute('SELECT * FROM tbl_orden_estado ORDER BY pk_id_estado DESC');
    console.log('📊 Estados obtenidos:', rows.length);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('❌ Error al obtener estados:', error);
    res.status(500).json({ message: 'Error al obtener los estados.', error: error.message });
  }
});

// Endpoint para registrar un nuevo estado
app.post('/api/estados', requireAdminOrEditor, async (req, res) => {
  const { estado_orden, descripcion_estado } = req.body;
  if (!estado_orden) {
    return res.status(400).json({ message: 'El nombre del estado es requerido.' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'INSERT INTO tbl_orden_estado (estado_orden, descripcion_estado) VALUES (?, ?)',
      [estado_orden, descripcion_estado]
    );
    await connection.end();
    res.json({ message: 'Estado registrado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar el estado.' });
  }
});

// Endpoint para actualizar un estado
app.put('/api/estados/:id', requireAdminOrEditor, async (req, res) => {
  const { id } = req.params;
  const { estado_orden, descripcion_estado } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'UPDATE tbl_orden_estado SET estado_orden = ?, descripcion_estado = ? WHERE pk_id_estado = ?',
      [estado_orden, descripcion_estado, id]
    );
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Estado no encontrado.' });
    }
    res.json({ message: 'Estado actualizado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el estado.' });
  }
});

// Endpoint para eliminar un estado
app.delete('/api/estados/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM tbl_orden_estado WHERE pk_id_estado = ?', [id]);
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Estado no encontrado.' });
    }
    res.json({ message: 'Estado eliminado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el estado.' });
  }
});

// ==================== ENDPOINTS PARA ÓRDENES ====================

// Endpoint para obtener todas las órdenes con información relacionada
app.get('/api/ordenes', async (req, res) => {
  try {
    console.log('🔍 Intentando obtener órdenes...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a BD establecida');
    
          const query = `
        SELECT 
          o.pk_id_orden,
          o.fecha_ingreso_orden,
          o.comentario_cliente_orden,
          o.nivel_combustible_orden,
          o.odometro_auto_cliente_orden,
          o.unidad_odometro,
          o.imagen_1,
          o.imagen_2,
          o.imagen_3,
          o.imagen_4,
          o.imagen_5,
          o.imagen_6,
          o.imagen_7,
          o.imagen_8,
          o.imagen_9,
          o.imagen_10,
          o.video,
          o.token_publico,
          o.observaciones_orden,
          o.estado_vehiculo,
          c.dpi_cliente,
          c.NIT,
          c.nombre_cliente,
          c.apellido_cliente,
          c.telefono_cliente,
          v.placa_vehiculo,
          v.marca_vehiculo,
          v.modelo_vehiculo,
          v.anio_vehiculo,
          s.servicio,
          e.estado_orden
        FROM tbl_ordenes o
        LEFT JOIN tbl_clientes c ON o.fk_id_cliente = c.PK_id_cliente
        LEFT JOIN tbl_vehiculos v ON o.fk_id_vehiculo = v.pk_id_vehiculo
        LEFT JOIN tbl_servicios s ON o.fk_id_servicio = s.pk_id_servicio
        LEFT JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
        ORDER BY o.fecha_ingreso_orden DESC
      `;
    
    const [rows] = await connection.execute(query);
    console.log('📊 Órdenes obtenidas:', rows.length);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('❌ Error al obtener órdenes:', error);
    res.status(500).json({ message: 'Error al obtener las órdenes.', error: error.message });
  }
});

// Endpoint para buscar cliente por DPI para asociar a orden
app.get('/api/ordenes/buscar-cliente/:dpi', async (req, res) => {
  const { dpi } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT PK_id_cliente, dpi_cliente, nombre_cliente, apellido_cliente FROM tbl_clientes WHERE dpi_cliente = ?',
      [dpi]
    );
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al buscar el cliente.' });
  }
});

// Endpoint para buscar cliente por NIT
app.get('/api/ordenes/buscar-cliente-nit/:nit', async (req, res) => {
  const { nit } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT PK_id_cliente, NIT, nombre_cliente, apellido_cliente FROM tbl_clientes WHERE NIT = ?',
      [nit]
    );
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al buscar el cliente.' });
  }
});

// Endpoint para búsqueda flexible de clientes (nombre, NIT o CF)
app.get('/api/clientes/buscar/:termino', async (req, res) => {
  const { termino } = req.params;
  
  try {
    // Caso especial: Consumidor Final
    if (termino.toUpperCase() === 'CF') {
      return res.json([{
        PK_id_cliente: null,
        nombre_cliente: 'Consumidor Final',
        apellido_cliente: '',
        NIT: 'CF',
        dpi_cliente: null,
        telefono_cliente: null,
        tipo: 'CF'
      }]);
    }
    
    // Búsqueda por nombre, apellido o NIT
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT 
        PK_id_cliente, 
        nombre_cliente, 
        apellido_cliente, 
        NIT, 
        dpi_cliente,
        telefono_cliente
      FROM tbl_clientes 
      WHERE 
        nombre_cliente LIKE ? OR 
        apellido_cliente LIKE ? OR 
        NIT LIKE ? OR
        CONCAT(nombre_cliente, ' ', apellido_cliente) LIKE ?
      ORDER BY nombre_cliente
      LIMIT 10
    `, [`%${termino}%`, `%${termino}%`, `%${termino}%`, `%${termino}%`]);
    
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error en búsqueda de clientes:', error);
    res.status(500).json({ message: 'Error al buscar clientes.' });
  }
});

// Endpoint para buscar vehículo por placa para asociar a orden
app.get('/api/ordenes/buscar-vehiculo/:placa', async (req, res) => {
  const { placa } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT pk_id_vehiculo, placa_vehiculo, marca_vehiculo, modelo_vehiculo, anio_vehiculo FROM tbl_vehiculos WHERE placa_vehiculo = ?',
      [placa]
    );
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Vehículo no encontrado.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al buscar el vehículo.' });
  }
});

// Endpoint para registrar una nueva orden
app.post('/api/ordenes', requireAdminOrEditor, upload.fields([
  { name: 'imagen_1', maxCount: 1 },
  { name: 'imagen_2', maxCount: 1 },
  { name: 'imagen_3', maxCount: 1 },
  { name: 'imagen_4', maxCount: 1 },
  { name: 'imagen_5', maxCount: 1 },
  { name: 'imagen_6', maxCount: 1 },
  { name: 'imagen_7', maxCount: 1 },
  { name: 'imagen_8', maxCount: 1 },
  { name: 'imagen_9', maxCount: 1 },
  { name: 'imagen_10', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), (err, req, res, next) => {
  // Manejar errores de Multer
  if (err) {
    console.error('❌ Error de Multer en POST /api/ordenes:', err.code, err.message);
    console.error('📋 Stack:', err.stack);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      // Log detallado del error de tamaño
      console.error('❌ Error LIMIT_FILE_SIZE detectado en POST');
      if (req.files) {
        Object.keys(req.files).forEach(fieldName => {
          req.files[fieldName].forEach(file => {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            console.error(`📁 Archivo problemático: ${fieldName} - ${file.originalname || file.filename}`);
            console.error(`📊 Tamaño recibido: ${fileSizeMB} MB`);
            console.error(`📋 Tipo MIME: ${file.mimetype}`);
          });
        });
      }
      return res.status(413).json({ 
        message: 'Archivo demasiado grande. Límites: Imágenes 10MB, Videos 100MB (límite de Cloudinary)' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({ 
        message: 'Demasiados archivos. Máximo 11 archivos por orden (10 imágenes + 1 video)' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Campo de archivo no esperado' 
      });
    }
    return res.status(400).json({ 
      message: 'Error al procesar archivos: ' + err.message 
    });
  }
  next();
}, async (req, res) => {
  // Configurar timeout extendido para este request específico (15 minutos)
  req.setTimeout(900000);
  res.setTimeout(900000);
  
  const startTime = Date.now();
  console.log('📤 Iniciando registro de orden...');
  
  // Log detallado de todos los archivos recibidos
  if (req.files) {
    console.log('📦 Archivos recibidos:');
    Object.keys(req.files).forEach(fieldName => {
      req.files[fieldName].forEach(file => {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.log(`  - ${fieldName}: ${file.originalname || file.filename}`);
        console.log(`    Tamaño: ${fileSizeMB} MB`);
        console.log(`    Tipo: ${file.mimetype}`);
        console.log(`    Campo: ${file.fieldname}`);
      });
    });
  }
  
  // Detectar si hay video
  const tieneVideo = req.files && req.files.video && req.files.video.length > 0;
  if (tieneVideo) {
    const videoSize = (req.files.video[0].size / (1024 * 1024)).toFixed(2);
    console.log(`🎥 Video detectado: ${videoSize} MB - Esto puede tardar varios minutos`);
  }
  
  const {
    fk_id_cliente,
    fk_id_vehiculo,
    fk_id_servicio,
    comentario_cliente_orden,
    nivel_combustible_orden,
    odometro_auto_cliente_orden,
    unidad_odometro,
    fk_id_estado_orden,
    observaciones_orden,
    estado_vehiculo
  } = req.body;

  // Validaciones (fk_id_cliente puede ser null para Consumidor Final)
  if (!fk_id_vehiculo || !fk_id_servicio || !fk_id_estado_orden) {
    return res.status(400).json({ message: 'Vehículo, servicio y estado son requeridos.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Procesar archivos (Cloudinary o local) - usar valores por defecto si no hay archivos
    const imagen_1 = processFiles(req.files, 'imagen_1') || 'sin_imagen.jpg';
    const imagen_2 = processFiles(req.files, 'imagen_2') || 'sin_imagen.jpg';
    const imagen_3 = processFiles(req.files, 'imagen_3') || 'sin_imagen.jpg';
    const imagen_4 = processFiles(req.files, 'imagen_4') || 'sin_imagen.jpg';
    const imagen_5 = processFiles(req.files, 'imagen_5') || 'sin_imagen.jpg';
    const imagen_6 = processFiles(req.files, 'imagen_6') || 'sin_imagen.jpg';
    const imagen_7 = processFiles(req.files, 'imagen_7') || 'sin_imagen.jpg';
    const imagen_8 = processFiles(req.files, 'imagen_8') || 'sin_imagen.jpg';
    const imagen_9 = processFiles(req.files, 'imagen_9') || 'sin_imagen.jpg';
    const imagen_10 = processFiles(req.files, 'imagen_10') || 'sin_imagen.jpg';
    const video = processFiles(req.files, 'video') || 'sin_video.mp4';

    // Asegurar que estado_vehiculo tenga un valor por defecto
    const estadoVehiculo = estado_vehiculo || 'Bueno';

    // Validar y convertir odómetro (manejar campos vacíos)
    const odometroValue = (odometro_auto_cliente_orden && odometro_auto_cliente_orden.trim() !== '') 
      ? parseFloat(odometro_auto_cliente_orden) 
      : 0;

    // Validar unidad de odómetro (valor por defecto: 'km')
    const unidadOdometro = unidad_odometro || 'km';

    // Generar token público único para la orden
    const tokenPublico = crypto.randomUUID();

    // Debug: verificar si es Consumidor Final
    console.log('🔍 Creando orden - fk_id_cliente:', fk_id_cliente);
    console.log('🔍 Odómetro procesado:', odometroValue, unidadOdometro);
    console.log('🔗 Token público generado:', tokenPublico);
    
    // Convertir valores vacíos o 'null' a null real para MySQL
    const fk_id_cliente_final = (fk_id_cliente === 'null' || fk_id_cliente === null || fk_id_cliente === '' || fk_id_cliente === undefined) ? null : fk_id_cliente;
    
    if (fk_id_cliente_final === null) {
      console.log('📝 Orden para Consumidor Final (sin cliente específico)');
    }

    const [result] = await connection.execute(
      `INSERT INTO tbl_ordenes (
        fk_id_cliente, fk_id_vehiculo, fk_id_servicio, comentario_cliente_orden,
        nivel_combustible_orden, odometro_auto_cliente_orden, unidad_odometro, fk_id_estado_orden,
        observaciones_orden, estado_vehiculo, imagen_1, imagen_2, imagen_3, imagen_4, imagen_5, imagen_6, imagen_7, imagen_8, imagen_9, imagen_10, video, token_publico
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fk_id_cliente_final, fk_id_vehiculo, fk_id_servicio, comentario_cliente_orden,
        nivel_combustible_orden, odometroValue, unidadOdometro, fk_id_estado_orden,
        observaciones_orden, estadoVehiculo, imagen_1, imagen_2, imagen_3, imagen_4, imagen_5, imagen_6, imagen_7, imagen_8, imagen_9, imagen_10, video, tokenPublico
      ]
    );
    
    await connection.end();
    
    // Procesar notificaciones automáticas en segundo plano (no bloqueante)
    if (result.insertId) {
      setImmediate(async () => {
        try {
          console.log(`📧 Procesando notificaciones automáticas para orden #${result.insertId}`);
          const notificationResults = await NotificationService.processOrderNotifications(result.insertId);
          console.log(`✅ Notificaciones procesadas para orden #${result.insertId}:`, {
            pdf: notificationResults.pdf.success ? '✅' : '❌',
            email: notificationResults.email.success ? '✅' : '❌',
            whatsapp: notificationResults.whatsapp.success ? '✅' : '❌',
            processingTime: `${notificationResults.processingTime}ms`
          });
        } catch (error) {
          console.error(`❌ Error procesando notificaciones para orden #${result.insertId}:`, error.message);
        }
      });
    }
    
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Orden registrada exitosamente en ${elapsedTime} segundos (ID: ${result.insertId})`);
    
    res.json({ 
      message: 'Orden registrada exitosamente.',
      orderId: result.insertId,
      notifications: 'Procesando notificaciones automáticas...'
    });
  } catch (error) {
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Error después de ${elapsedTime} segundos:`, error);
    
    // Mensajes de error más específicos
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      res.status(504).json({ 
        message: 'La carga del archivo está tardando demasiado. Por favor, intenta con un archivo más pequeño o verifica tu conexión a internet.' 
      });
    } else {
      res.status(500).json({ 
        message: 'Error al registrar la orden: ' + (error.message || 'Error desconocido') 
      });
    }
  }
});

// Endpoint para obtener una orden específica
app.get('/api/ordenes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT 
        o.*,
        c.dpi_cliente,
        c.nombre_cliente,
        c.apellido_cliente,
        v.placa_vehiculo,
        v.marca_vehiculo,
        v.modelo_vehiculo,
        v.anio_vehiculo,
        s.servicio,
        e.estado_orden
      FROM tbl_ordenes o
      LEFT JOIN tbl_clientes c ON o.fk_id_cliente = c.PK_id_cliente
      LEFT JOIN tbl_vehiculos v ON o.fk_id_vehiculo = v.pk_id_vehiculo
      LEFT JOIN tbl_servicios s ON o.fk_id_servicio = s.pk_id_servicio
      LEFT JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
      WHERE o.pk_id_orden = ?`,
      [id]
    );
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Orden no encontrada.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener la orden.' });
  }
});

// Endpoint para generar PDF de una orden específica
app.get('/api/ordenes/:id/pdf', async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`🖨️ Generando PDF para orden #${id}...`);
    
    // Obtener datos de la orden
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT 
        o.*,
        c.dpi_cliente,
        c.NIT,
        c.nombre_cliente,
        c.apellido_cliente,
        c.correo_cliente,
        c.telefono_cliente,
        v.placa_vehiculo,
        v.marca_vehiculo,
        v.modelo_vehiculo,
        v.anio_vehiculo,
        v.color_vehiculo,
        s.servicio,
        e.estado_orden
      FROM tbl_ordenes o
      LEFT JOIN tbl_clientes c ON o.fk_id_cliente = c.PK_id_cliente
      LEFT JOIN tbl_vehiculos v ON o.fk_id_vehiculo = v.pk_id_vehiculo
      LEFT JOIN tbl_servicios s ON o.fk_id_servicio = s.pk_id_servicio
      LEFT JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
      WHERE o.pk_id_orden = ?`,
      [id]
    );
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Orden no encontrada.' });
    }
    
    const ordenData = rows[0];
    
    // Generar PDF usando el servicio
    const PDFGenerator = require('./services/pdfGenerator');
    const pdfBuffer = await PDFGenerator.generateOrderPDF(ordenData);
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="orden_${id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    console.log(`✅ PDF generado exitosamente para orden #${id} (${pdfBuffer.length} bytes)`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Si el error tiene un mensaje específico, incluirlo
    const errorMessage = error.message || 'Error al generar el PDF de la orden.';
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Endpoint para actualizar una orden
app.put('/api/ordenes/:id', requireAdminOrEditor, upload.fields([
  { name: 'imagen_1', maxCount: 1 },
  { name: 'imagen_2', maxCount: 1 },
  { name: 'imagen_3', maxCount: 1 },
  { name: 'imagen_4', maxCount: 1 },
  { name: 'imagen_5', maxCount: 1 },
  { name: 'imagen_6', maxCount: 1 },
  { name: 'imagen_7', maxCount: 1 },
  { name: 'imagen_8', maxCount: 1 },
  { name: 'imagen_9', maxCount: 1 },
  { name: 'imagen_10', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), (err, req, res, next) => {
  // Manejar errores de Multer
  if (err) {
    console.error('❌ Error de Multer en PUT /api/ordenes/:id:', err.code, err.message);
    console.error('📋 Stack:', err.stack);
    console.error('📊 Request method:', req.method);
    console.error('📊 Request path:', req.path);
    console.error('📊 Content-Type:', req.get('Content-Type'));
    console.error('📏 Content-Length:', req.get('Content-Length'));
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      // Log detallado del error de tamaño
      console.error('❌ Error LIMIT_FILE_SIZE detectado en actualización');
      if (req.files) {
        Object.keys(req.files).forEach(fieldName => {
          req.files[fieldName].forEach(file => {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            console.error(`📁 Archivo problemático: ${fieldName} - ${file.originalname || file.filename}`);
            console.error(`📊 Tamaño recibido: ${fileSizeMB} MB`);
            console.error(`📋 Tipo MIME: ${file.mimetype}`);
            console.error(`📋 Campo: ${file.fieldname}`);
          });
        });
      } else {
        console.error('⚠️ No se recibieron archivos en req.files');
      }
      return res.status(413).json({ 
        message: 'Archivo demasiado grande. Límites: Imágenes 10MB, Videos 100MB (límite de Cloudinary)' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({ 
        message: 'Demasiados archivos. Máximo 11 archivos por orden' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Campo de archivo no esperado' 
      });
    }
    
    // Manejar errores de Cloudinary específicamente
    if (err.name === 'UnexpectedResponse' && err.http_code === 413) {
      console.error('❌ Cloudinary rechazó el archivo (límite de 100MB):', err.message);
      console.error('📊 Detalles del error de Cloudinary:', JSON.stringify(err, null, 2));
      return res.status(413).json({ 
        message: 'El archivo es demasiado grande. Cloudinary tiene un límite de 100MB para videos. Por favor, comprime el video a menos de 100MB e intenta nuevamente.',
        cloudinaryError: true,
        limit: '100MB'
      });
    }
    
    // Log para cualquier otro error de Multer
    console.error('❌ Otro error de Multer:', err);
    console.error('❌ Error completo:', JSON.stringify(err, null, 2));
    return res.status(400).json({ 
      message: 'Error al procesar archivos: ' + (err.message || 'Error desconocido')
    });
  }
  next();
}, async (req, res) => {
  // Configurar timeout extendido para este request específico (15 minutos)
  req.setTimeout(900000);
  res.setTimeout(900000);
  
  const startTime = Date.now();
  const { id } = req.params;
  console.log(`📤 Iniciando actualización de orden #${id}...`);
  console.log(`📊 Request method: ${req.method}`);
  console.log(`📊 Content-Type: ${req.get('Content-Type')}`);
  console.log(`📏 Content-Length: ${req.get('Content-Length')}`);
  console.log(`📋 Headers:`, JSON.stringify(req.headers, null, 2));
  
  // Log detallado de todos los archivos recibidos
  if (req.files) {
    console.log('📦 Archivos recibidos para actualización:');
    Object.keys(req.files).forEach(fieldName => {
      req.files[fieldName].forEach(file => {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.log(`  - ${fieldName}: ${file.originalname || file.filename}`);
        console.log(`    Tamaño: ${fileSizeMB} MB`);
        console.log(`    Tipo: ${file.mimetype}`);
        console.log(`    Campo: ${file.fieldname}`);
      });
    });
  } else {
    console.log('⚠️ No se recibieron archivos en req.files');
  }
  
  // Detectar si hay video
  const tieneVideo = req.files && req.files.video && req.files.video.length > 0;
  if (tieneVideo) {
    const videoSize = (req.files.video[0].size / (1024 * 1024)).toFixed(2);
    console.log(`🎥 Video detectado en actualización: ${videoSize} MB - Esto puede tardar varios minutos`);
  }
  
  const {
    fk_id_cliente,
    fk_id_vehiculo,
    fk_id_servicio,
    comentario_cliente_orden,
    nivel_combustible_orden,
    odometro_auto_cliente_orden,
    unidad_odometro,
    fk_id_estado_orden,
    observaciones_orden,
    estado_vehiculo
  } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Obtener orden actual para preservar archivos existentes y detectar cambios de estado
    const [currentOrder] = await connection.execute(
      'SELECT imagen_1, imagen_2, imagen_3, imagen_4, imagen_5, imagen_6, imagen_7, imagen_8, imagen_9, imagen_10, video, fk_id_estado_orden, unidad_odometro FROM tbl_ordenes WHERE pk_id_orden = ?',
      [id]
    );
    
    if (currentOrder.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Orden no encontrada.' });
    }

    // Detectar si el estado cambió
    const estadoAnterior = currentOrder[0].fk_id_estado_orden;
    const estadoNuevo = parseInt(fk_id_estado_orden);
    const estadoCambio = estadoAnterior !== estadoNuevo;

    // Procesar archivos nuevos o mantener existentes (Cloudinary o local)
    const imagen_1 = processFiles(req.files, 'imagen_1') !== null ? processFiles(req.files, 'imagen_1') : currentOrder[0].imagen_1;
    const imagen_2 = processFiles(req.files, 'imagen_2') !== null ? processFiles(req.files, 'imagen_2') : currentOrder[0].imagen_2;
    const imagen_3 = processFiles(req.files, 'imagen_3') !== null ? processFiles(req.files, 'imagen_3') : currentOrder[0].imagen_3;
    const imagen_4 = processFiles(req.files, 'imagen_4') !== null ? processFiles(req.files, 'imagen_4') : currentOrder[0].imagen_4;
    const imagen_5 = processFiles(req.files, 'imagen_5') !== null ? processFiles(req.files, 'imagen_5') : currentOrder[0].imagen_5;
    const imagen_6 = processFiles(req.files, 'imagen_6') !== null ? processFiles(req.files, 'imagen_6') : currentOrder[0].imagen_6;
    const imagen_7 = processFiles(req.files, 'imagen_7') !== null ? processFiles(req.files, 'imagen_7') : currentOrder[0].imagen_7;
    const imagen_8 = processFiles(req.files, 'imagen_8') !== null ? processFiles(req.files, 'imagen_8') : currentOrder[0].imagen_8;
    const imagen_9 = processFiles(req.files, 'imagen_9') !== null ? processFiles(req.files, 'imagen_9') : currentOrder[0].imagen_9;
    const imagen_10 = processFiles(req.files, 'imagen_10') !== null ? processFiles(req.files, 'imagen_10') : currentOrder[0].imagen_10;
    const video = processFiles(req.files, 'video') !== null ? processFiles(req.files, 'video') : currentOrder[0].video;

    // Asegurar que estado_vehiculo tenga un valor por defecto
    const estadoVehiculo = estado_vehiculo || 'Bueno';

    // Preservar unidad de odómetro existente si no se proporciona una nueva
    const unidadOdometro = unidad_odometro || currentOrder[0].unidad_odometro || 'km';

    // Validar y convertir odómetro (manejar campos vacíos) - igual que en POST
    const odometroValue = (odometro_auto_cliente_orden && odometro_auto_cliente_orden.toString().trim() !== '') 
      ? parseFloat(odometro_auto_cliente_orden) 
      : 0;

    // Convertir valores vacíos o 'null' a null real para MySQL
    const fk_id_cliente_final = (fk_id_cliente === 'null' || fk_id_cliente === null || fk_id_cliente === '' || fk_id_cliente === undefined) ? null : fk_id_cliente;

    const [result] = await connection.execute(
      `UPDATE tbl_ordenes SET 
        fk_id_cliente = ?, fk_id_vehiculo = ?, fk_id_servicio = ?, comentario_cliente_orden = ?,
        nivel_combustible_orden = ?, odometro_auto_cliente_orden = ?, unidad_odometro = ?, fk_id_estado_orden = ?,
        observaciones_orden = ?, estado_vehiculo = ?, imagen_1 = ?, imagen_2 = ?, imagen_3 = ?, imagen_4 = ?, imagen_5 = ?, imagen_6 = ?, imagen_7 = ?, imagen_8 = ?, imagen_9 = ?, imagen_10 = ?, video = ?
      WHERE pk_id_orden = ?`,
      [
        fk_id_cliente_final, fk_id_vehiculo, fk_id_servicio, comentario_cliente_orden,
        nivel_combustible_orden, odometroValue, unidadOdometro, fk_id_estado_orden,
        observaciones_orden, estadoVehiculo, imagen_1, imagen_2, imagen_3, imagen_4, imagen_5, imagen_6, imagen_7, imagen_8, imagen_9, imagen_10, video, id
      ]
    );
    
    if (result.affectedRows === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Orden no encontrada.' });
    }

    // Si el estado cambió, enviar notificación por email
    if (estadoCambio) {
      try {
        console.log(`🔄 Estado de orden #${id} cambió de ${estadoAnterior} a ${estadoNuevo}`);
        
        // Obtener nombres de los estados para la notificación
        const [estadoAnteriorData] = await connection.execute(
          'SELECT estado_orden FROM tbl_orden_estado WHERE pk_id_estado = ?',
          [estadoAnterior]
        );
        const [estadoNuevoData] = await connection.execute(
          'SELECT estado_orden FROM tbl_orden_estado WHERE pk_id_estado = ?',
          [estadoNuevo]
        );

        const nombreEstadoAnterior = estadoAnteriorData.length > 0 ? estadoAnteriorData[0].estado_orden : 'Desconocido';
        const nombreEstadoNuevo = estadoNuevoData.length > 0 ? estadoNuevoData[0].estado_orden : 'Desconocido';

        // Enviar notificación de cambio de estado
        const notificationResult = await NotificationService.sendStateChangeNotification(
          parseInt(id),
          nombreEstadoAnterior,
          nombreEstadoNuevo
        );

        if (notificationResult.email.success) {
          console.log(`✅ Notificación de cambio de estado enviada exitosamente para orden #${id}`);
        } else {
          console.log(`❌ Error enviando notificación de cambio de estado: ${notificationResult.email.error}`);
        }

      } catch (notificationError) {
        console.error('❌ Error en notificación de cambio de estado:', notificationError.message);
        // No fallar la actualización si la notificación falla
      }
    }

    await connection.end();
    
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Orden #${id} actualizada exitosamente en ${elapsedTime} segundos`);
    
    res.json({ 
      message: 'Orden actualizada correctamente.',
      estadoCambio: estadoCambio,
      notificacionEnviada: estadoCambio
    });
  } catch (error) {
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Error actualizando orden #${id} después de ${elapsedTime} segundos:`, error);
    
    // Mensajes de error más específicos
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      res.status(504).json({ 
        message: 'La carga del archivo está tardando demasiado. Por favor, intenta con un archivo más pequeño o verifica tu conexión a internet.' 
      });
    } else {
      res.status(500).json({ 
        message: 'Error al actualizar la orden: ' + (error.message || 'Error desconocido') 
      });
    }
  }
});

// Endpoint para eliminar una orden
app.delete('/api/ordenes/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM tbl_ordenes WHERE pk_id_orden = ?', [id]);
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Orden no encontrada.' });
    }
    res.json({ message: 'Orden eliminada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la orden.' });
  }
});

// ==================== ENDPOINTS DE GESTIÓN DE NOTIFICACIONES ====================

// Endpoint para obtener el estado de los servicios de notificación
app.get('/api/notifications/status', async (req, res) => {
  try {
    const status = NotificationService.getServicesStatus();
    res.json(status);
  } catch (error) {
    console.error('❌ Error getting notification status:', error);
    res.status(500).json({ message: 'Error al obtener estado de notificaciones.' });
  }
});

// Endpoint para enviar notificaciones de prueba
app.post('/api/notifications/test', async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email && !phone) {
      return res.status(400).json({ message: 'Se requiere email o teléfono para la prueba.' });
    }
    
    const results = await NotificationService.sendTestNotifications(email, phone);
    res.json(results);
  } catch (error) {
    console.error('❌ Error sending test notifications:', error);
    res.status(500).json({ message: 'Error al enviar notificaciones de prueba.' });
  }
});

// Endpoint para reenviar notificaciones de una orden específica
app.post('/api/notifications/resend/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ message: 'ID de orden válido requerido.' });
    }
    
    const results = await NotificationService.processOrderNotifications(parseInt(orderId));
    res.json(results);
  } catch (error) {
    console.error('❌ Error resending notifications:', error);
    res.status(500).json({ message: 'Error al reenviar notificaciones.' });
  }
});

// ==================== ENDPOINTS DE GESTIÓN DE USUARIOS ====================

// Endpoint para obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT pk_id_usuarios, nombre_usuario, email_usuario, foto_perfil_usuario, pregunta_seguridad_usuario, rol_usuario FROM tbl_usuarios ORDER BY nombre_usuario'
    );
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los usuarios.' });
  }
});

// Endpoint para obtener un usuario específico
app.get('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT pk_id_usuarios, nombre_usuario, email_usuario, foto_perfil_usuario, pregunta_seguridad_usuario, rol_usuario FROM tbl_usuarios WHERE pk_id_usuarios = ?',
      [id]
    );
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el usuario.' });
  }
});

// Endpoint para obtener usuario por email (para perfil)
app.get('/api/usuario/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT pk_id_usuarios, nombre_usuario, email_usuario, foto_perfil_usuario, pregunta_seguridad_usuario, rol_usuario FROM tbl_usuarios WHERE email_usuario = ?',
      [email]
    );
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el usuario.' });
  }
});

// Endpoint para registrar un nuevo usuario
app.post('/api/usuarios', requireAdmin, upload.single('foto'), async (req, res) => {
  const { nombre_usuario, email_usuario, contrasenia_usuario, pregunta_seguridad_usuario, rol_usuario } = req.body;
  
  if (!nombre_usuario || !email_usuario || !contrasenia_usuario) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });
  }
  
  // Establecer valor por defecto para pregunta de seguridad si no se proporciona
  const preguntaSeguridad = pregunta_seguridad_usuario && pregunta_seguridad_usuario.trim() !== '' 
    ? pregunta_seguridad_usuario 
    : 'Sin pregunta de seguridad';

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email_usuario)) {
    return res.status(400).json({ message: 'Formato de email inválido.' });
  }

  // Validar longitud de contraseña
  if (contrasenia_usuario.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar si el email ya existe
    const [existingUsers] = await connection.execute(
      'SELECT pk_id_usuarios FROM tbl_usuarios WHERE email_usuario = ?',
      [email_usuario]
    );
    
    if (existingUsers.length > 0) {
      await connection.end();
      return res.status(409).json({ message: 'El email ya está registrado.' });
    }

    // Hashear la contraseña
    const hashPassword = crypto.createHash('sha256').update(contrasenia_usuario).digest('hex');
    
    // Procesar foto si se subió usando Cloudinary
    let foto_perfil_usuario = 'sin_foto.jpg'; // Valor por defecto
    if (req.file) {
      if (cloudinaryConfigured()) {
        foto_perfil_usuario = req.file.path || req.file.secure_url;
      } else {
        foto_perfil_usuario = req.file.filename;
      }
    }

    // Obtener rol del body (por defecto 'mecanico' si no se proporciona)
    const rol = rol_usuario || 'mecanico';
    
    // Validar que el rol sea válido
    if (!['admin', 'editor', 'mecanico'].includes(rol)) {
      await connection.end();
      return res.status(400).json({ message: 'Rol inválido. Los roles válidos son: admin, editor, mecanico.' });
    }
    
    // Insertar nuevo usuario
    const [result] = await connection.execute(
      `INSERT INTO tbl_usuarios (nombre_usuario, email_usuario, contrasenia_usuario, foto_perfil_usuario, pregunta_seguridad_usuario, rol_usuario)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre_usuario, email_usuario, hashPassword, foto_perfil_usuario, preguntaSeguridad, rol]
    );
    
    await connection.end();
    
    res.status(201).json({ 
      message: 'Usuario registrado exitosamente.',
      id: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar el usuario.' });
  }
});

// Endpoint para actualizar un usuario
app.put('/api/usuarios/:id', requireAdmin, upload.single('foto'), async (req, res) => {
  const { id } = req.params;
  const { nombre_usuario, email_usuario, pregunta_seguridad_usuario, rol_usuario } = req.body;
  
  if (!nombre_usuario || !email_usuario || !pregunta_seguridad_usuario) {
    return res.status(400).json({ message: 'Nombre, email y pregunta de seguridad son requeridos.' });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email_usuario)) {
    return res.status(400).json({ message: 'Formato de email inválido.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar si el usuario existe
    const [existingUser] = await connection.execute(
      'SELECT pk_id_usuarios FROM tbl_usuarios WHERE pk_id_usuarios = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Verificar si el email ya existe en otro usuario
    const [existingEmail] = await connection.execute(
      'SELECT pk_id_usuarios FROM tbl_usuarios WHERE email_usuario = ? AND pk_id_usuarios != ?',
      [email_usuario, id]
    );
    
    if (existingEmail.length > 0) {
      await connection.end();
      return res.status(409).json({ message: 'El email ya está registrado por otro usuario.' });
    }

    // Validar rol si se proporciona
    if (rol_usuario && !['admin', 'editor', 'mecanico'].includes(rol_usuario)) {
      await connection.end();
      return res.status(400).json({ message: 'Rol inválido. Los roles válidos son: admin, editor, mecanico.' });
    }
    
    // Construir query dinámicamente
    let query = 'UPDATE tbl_usuarios SET nombre_usuario = ?, email_usuario = ?, pregunta_seguridad_usuario = ?';
    let params = [nombre_usuario, email_usuario, pregunta_seguridad_usuario];
    
    // Agregar rol si se proporciona
    if (rol_usuario) {
      query += ', rol_usuario = ?';
      params.push(rol_usuario);
    }
    
    // Procesar foto si se subió usando Cloudinary
    if (req.file) {
      let fotoUrl = '';
      if (cloudinaryConfigured()) {
        fotoUrl = req.file.path || req.file.secure_url;
      } else {
        fotoUrl = req.file.filename;
      }
      
      query += ', foto_perfil_usuario = ?';
      params.push(fotoUrl);
    }
    
    query += ' WHERE pk_id_usuarios = ?';
    params.push(id);

    await connection.execute(query, params);
    await connection.end();
    
    res.json({ message: 'Usuario actualizado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el usuario.' });
  }
});

// Endpoint para cambiar contraseña de usuario
app.put('/api/usuarios/:id/cambiar-contrasena', async (req, res) => {
  const { id } = req.params;
  const { contrasenia_usuario } = req.body;
  
  if (!contrasenia_usuario) {
    return res.status(400).json({ message: 'La nueva contraseña es requerida.' });
  }

  // Validar longitud de contraseña
  if (contrasenia_usuario.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar si el usuario existe
    const [existingUser] = await connection.execute(
      'SELECT pk_id_usuarios FROM tbl_usuarios WHERE pk_id_usuarios = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Hashear la nueva contraseña
    const hashPassword = crypto.createHash('sha256').update(contrasenia_usuario).digest('hex');
    
    await connection.execute(
      'UPDATE tbl_usuarios SET contrasenia_usuario = ? WHERE pk_id_usuarios = ?',
      [hashPassword, id]
    );
    
    await connection.end();
    
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al cambiar la contraseña.' });
  }
});

// Endpoint para eliminar un usuario
app.delete('/api/usuarios/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar si el usuario existe
    const [existingUser] = await connection.execute(
      'SELECT pk_id_usuarios, nombre_usuario FROM tbl_usuarios WHERE pk_id_usuarios = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // No permitir eliminar el usuario admin principal
    if (existingUser[0].nombre_usuario.toLowerCase() === 'admin') {
      await connection.end();
      return res.status(403).json({ message: 'No se puede eliminar el usuario administrador principal.' });
    }

    const [result] = await connection.execute(
      'DELETE FROM tbl_usuarios WHERE pk_id_usuarios = ?',
      [id]
    );
    
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el usuario.' });
  }
});

// ==================== ENDPOINTS DE ESTADÍSTICAS ====================

// Endpoint para obtener estadísticas generales del dashboard
app.get('/api/dashboard/estadisticas', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // 1. Vehículos más ingresados
    const [vehiculosStats] = await connection.execute(`
      SELECT 
        CONCAT(v.marca_vehiculo, ' ', v.modelo_vehiculo) as modelo_completo,
        v.marca_vehiculo,
        v.modelo_vehiculo,
        COUNT(o.pk_id_orden) as cantidad_ordenes
      FROM tbl_vehiculos v
      LEFT JOIN tbl_ordenes o ON v.pk_id_vehiculo = o.fk_id_vehiculo
      GROUP BY v.marca_vehiculo, v.modelo_vehiculo
      ORDER BY cantidad_ordenes DESC
      LIMIT 10
    `);

    // 2. Clientes por mes (desde 29 de septiembre 2025)
    const [clientesPorMes] = await connection.execute(`
      WITH RECURSIVE meses AS (
        SELECT '2025-09' as mes
        UNION ALL
        SELECT DATE_FORMAT(DATE_ADD(CONCAT(mes, '-01'), INTERVAL 1 MONTH), '%Y-%m')
        FROM meses
        WHERE mes < DATE_FORMAT(NOW(), '%Y-%m')
      )
      SELECT 
        m.mes,
        COALESCE(COUNT(DISTINCT o.fk_id_cliente), 0) as cantidad_clientes,
        COALESCE(COUNT(o.pk_id_orden), 0) as cantidad_ordenes
      FROM meses m
      LEFT JOIN tbl_ordenes o ON DATE_FORMAT(o.fecha_ingreso_orden, '%Y-%m') = m.mes 
        AND o.fecha_ingreso_orden >= '2025-09-29 00:00:00'
      GROUP BY m.mes
      ORDER BY m.mes ASC
    `);

    // 3. Servicios más solicitados
    const [serviciosStats] = await connection.execute(`
      SELECT 
        s.servicio,
        COUNT(o.pk_id_orden) as cantidad_ordenes,
        ROUND((COUNT(o.pk_id_orden) * 100.0 / (SELECT COUNT(*) FROM tbl_ordenes)), 2) as porcentaje
      FROM tbl_servicios s
      LEFT JOIN tbl_ordenes o ON s.pk_id_servicio = o.fk_id_servicio
      GROUP BY s.pk_id_servicio, s.servicio
      ORDER BY cantidad_ordenes DESC
    `);

    // 4. Estados de órdenes
    const [estadosStats] = await connection.execute(`
      SELECT 
        e.estado_orden,
        COUNT(o.pk_id_orden) as cantidad_ordenes,
        ROUND((COUNT(o.pk_id_orden) * 100.0 / (SELECT COUNT(*) FROM tbl_ordenes)), 2) as porcentaje
      FROM tbl_orden_estado e
      LEFT JOIN tbl_ordenes o ON e.pk_id_estado = o.fk_id_estado_orden
      GROUP BY e.pk_id_estado, e.estado_orden
      ORDER BY cantidad_ordenes DESC
    `);

    // 5. Órdenes por mes (desde 29 de septiembre 2025)
    const [ordenesPorMes] = await connection.execute(`
      WITH RECURSIVE meses AS (
        SELECT '2025-09' as mes
        UNION ALL
        SELECT DATE_FORMAT(DATE_ADD(CONCAT(mes, '-01'), INTERVAL 1 MONTH), '%Y-%m')
        FROM meses
        WHERE mes < DATE_FORMAT(NOW(), '%Y-%m')
      )
      SELECT 
        m.mes,
        COALESCE(COUNT(o.pk_id_orden), 0) as cantidad_ordenes
      FROM meses m
      LEFT JOIN tbl_ordenes o ON DATE_FORMAT(o.fecha_ingreso_orden, '%Y-%m') = m.mes
        AND o.fecha_ingreso_orden >= '2025-09-29 00:00:00'
      GROUP BY m.mes
      ORDER BY m.mes ASC
    `);

    // 6. Estadísticas generales
    const [estadisticasGenerales] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM tbl_clientes) as total_clientes,
        (SELECT COUNT(*) FROM tbl_vehiculos) as total_vehiculos,
        (SELECT COUNT(*) FROM tbl_ordenes) as total_ordenes,
        (SELECT COUNT(*) FROM tbl_ordenes 
         WHERE YEAR(fecha_ingreso_orden) = YEAR(NOW()) 
           AND MONTH(fecha_ingreso_orden) = MONTH(NOW())) as ordenes_mes_actual,
        (SELECT COUNT(*) FROM tbl_ordenes 
         WHERE fk_id_estado_orden = (SELECT pk_id_estado FROM tbl_orden_estado WHERE estado_orden = 'Entregado')) as ordenes_completadas,
        (SELECT COUNT(*) FROM tbl_ordenes 
         WHERE fk_id_estado_orden IN (SELECT pk_id_estado FROM tbl_orden_estado WHERE estado_orden NOT IN ('Entregado', 'Cancelado'))) as ordenes_pendientes,
        (SELECT COUNT(*) FROM tbl_ordenes 
         WHERE fk_id_estado_orden IN (SELECT pk_id_estado FROM tbl_orden_estado WHERE estado_orden IN ('Finalizado', 'Finalizado Listo para Entrega', 'Revisión y Limpieza Final'))) as ordenes_listas_entrega
    `);

    // 7. Marcas de vehículos más populares
    const [marcasStats] = await connection.execute(`
      SELECT 
        v.marca_vehiculo,
        COUNT(DISTINCT v.pk_id_vehiculo) as cantidad_vehiculos,
        COUNT(o.pk_id_orden) as cantidad_ordenes
      FROM tbl_vehiculos v
      LEFT JOIN tbl_ordenes o ON v.pk_id_vehiculo = o.fk_id_vehiculo
      GROUP BY v.marca_vehiculo
      ORDER BY cantidad_ordenes DESC
      LIMIT 8
    `);

    // 8. Ingresos por mes (simulado - basado en órdenes completadas)
    const [ingresosPorMes] = await connection.execute(`
      SELECT 
        DATE_FORMAT(o.fecha_ingreso_orden, '%Y-%m') as mes,
        COUNT(*) as cantidad_ordenes,
        (COUNT(*) * 500) as ingresos_estimados
      FROM tbl_ordenes o
      INNER JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
      WHERE e.estado_orden = 'Entregado'
      GROUP BY DATE_FORMAT(o.fecha_ingreso_orden, '%Y-%m')
      ORDER BY mes ASC
    `);

    await connection.end();

    res.json({
      vehiculos_mas_ingresados: vehiculosStats,
      clientes_por_mes: clientesPorMes,
      servicios_mas_solicitados: serviciosStats,
      estados_ordenes: estadosStats,
      ordenes_por_mes: ordenesPorMes,
      estadisticas_generales: estadisticasGenerales[0],
      marcas_populares: marcasStats,
      ingresos_por_mes: ingresosPorMes
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas del dashboard.' });
  }
});

// Endpoint para obtener estadísticas de un período específico
app.get('/api/dashboard/estadisticas/:periodo', async (req, res) => {
  const { periodo } = req.params;
  let fechaInicio;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Determinar el período
    switch (periodo) {
      case 'hoy':
        fechaInicio = 'CURDATE()';
        break;
      case 'semana':
        fechaInicio = 'DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case 'mes':
        fechaInicio = 'DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case 'año':
        fechaInicio = 'DATE_SUB(NOW(), INTERVAL 365 DAY)';
        break;
      default:
        fechaInicio = 'DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    // Estadísticas del período
    const [estadisticasPeriodo] = await connection.execute(`
      SELECT 
        COUNT(*) as total_ordenes,
        COUNT(DISTINCT fk_id_cliente) as clientes_unicos,
        COUNT(DISTINCT fk_id_vehiculo) as vehiculos_unicos,
        COUNT(CASE WHEN fk_id_estado_orden = (SELECT pk_id_estado FROM tbl_orden_estado WHERE estado_orden = 'Entregado') THEN 1 END) as ordenes_completadas,
        COUNT(CASE WHEN fk_id_estado_orden IN (SELECT pk_id_estado FROM tbl_orden_estado WHERE estado_orden NOT IN ('Entregado', 'Cancelado')) THEN 1 END) as ordenes_pendientes,
        COUNT(CASE WHEN fk_id_estado_orden = (SELECT pk_id_estado FROM tbl_orden_estado WHERE estado_orden = 'En proceso') THEN 1 END) as ordenes_en_proceso
      FROM tbl_ordenes 
      WHERE fecha_ingreso_orden >= ${fechaInicio}
    `);

    await connection.end();

    res.json({
      periodo: periodo,
      estadisticas: estadisticasPeriodo[0]
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas del período:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas del período.' });
  }
});

// ==================== ENDPOINTS DE REPORTES ====================

const ReportService = require('./services/reportService');
const reportService = new ReportService();

// Endpoint para generar reportes en PDF
app.get('/api/reportes/pdf/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;
    const filtros = req.query;
    
    console.log(`📄 Generando reporte PDF: ${tipo}`, filtros);
    
    const pdfBuffer = await reportService.generatePDFReport(tipo, filtros);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_${tipo}_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generando reporte PDF:', error);
    res.status(500).json({ message: 'Error al generar el reporte PDF.' });
  }
});

// Endpoint para generar reportes en Excel
app.get('/api/reportes/excel/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;
    const filtros = req.query;
    
    console.log(`📊 Generando reporte Excel: ${tipo}`, filtros);
    
    const excelBuffer = await reportService.generateExcelReport(tipo, filtros);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(excelBuffer);
    
  } catch (error) {
    console.error('Error generando reporte Excel:', error);
    res.status(500).json({ message: 'Error al generar el reporte Excel.' });
  }
});

// Endpoint para obtener tipos de reportes disponibles
app.get('/api/reportes/tipos', async (req, res) => {
  try {
    const tiposReportes = [
      {
        id: 'ordenes',
        nombre: 'Órdenes de Servicio',
        descripcion: 'Reporte completo de todas las órdenes de servicio',
        filtros: ['fechaInicio', 'fechaFin', 'estado', 'servicio']
      },
      {
        id: 'clientes',
        nombre: 'Clientes',
        descripcion: 'Listado completo de clientes registrados',
        filtros: []
      },
      {
        id: 'vehiculos',
        nombre: 'Vehículos',
        descripcion: 'Inventario de vehículos registrados',
        filtros: []
      },
      {
        id: 'servicios',
        nombre: 'Servicios',
        descripcion: 'Catálogo de servicios y estadísticas de uso',
        filtros: []
      },
      {
        id: 'estadisticas',
        nombre: 'Estadísticas Generales',
        descripcion: 'Resumen estadístico del taller',
        filtros: []
      }
    ];
    
    res.json(tiposReportes);
    
  } catch (error) {
    console.error('Error obteniendo tipos de reportes:', error);
    res.status(500).json({ message: 'Error al obtener tipos de reportes.' });
  }
});

// Endpoint para obtener opciones de filtros
app.get('/api/reportes/filtros', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Obtener estados disponibles
    const [estados] = await connection.execute('SELECT estado_orden FROM tbl_orden_estado ORDER BY estado_orden');
    
    // Obtener servicios disponibles
    const [servicios] = await connection.execute('SELECT servicio FROM tbl_servicios ORDER BY servicio');
    
    await connection.end();
    
    res.json({
      estados: estados.map(e => e.estado_orden),
      servicios: servicios.map(s => s.servicio)
    });
    
  } catch (error) {
    console.error('Error obteniendo filtros:', error);
    res.status(500).json({ message: 'Error al obtener filtros.' });
  }
});

// El endpoint de orden pública ya está definido antes del primer middleware (línea ~430)
// No es necesario duplicarlo aquí - eliminado para evitar conflictos

// ==================== ENDPOINTS DEL TRACKER PÚBLICO (ELIMINADOS - REEMPLAZADOS POR TOKEN ÚNICO) ====================
// Los siguientes endpoints han sido eliminados. Ahora se usa el sistema de tokens únicos por orden.
// Endpoint actual: GET /api/orden/publica/:token
// 
// Endpoints eliminados:
// - GET /api/tracker/telefono/:telefono
// - GET /api/tracker/placa/:placa
// - GET /api/tracker/orden/:numero
// - GET /api/tracker/historial/:numero
// - POST /api/tracker/cambiar-estado
// - GET /api/tracker/estadisticas-historial

// ==================== HEALTH CHECK ENDPOINT ====================
// El endpoint de health check está definido ANTES del middleware de autenticación
// (línea ~167) para evitar problemas con el healthcheck de Railway

// ==================== EMAIL SERVICE ====================
// ✅ SendGrid API configurado y funcionando correctamente
console.log('✅ SendGrid API configurado y funcionando correctamente');

// ==================== INICIALIZACIÓN DEL SISTEMA ====================

// Inicializar servicios de notificación al arrancar el servidor
async function initializeServices() {
  try {
    await NotificationService.initialize();
    console.log('✅ Sistema de notificaciones inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando sistema de notificaciones:', error);
  }
}

// Servir archivos estáticos del frontend en producción
if (process.env.NODE_ENV === 'production') {
  console.log('🌐 Configurando para servir frontend en producción...');
  
  const frontendBuildPath = path.join(__dirname, '../frontend/build');
  console.log('📁 Ruta del build del frontend:', frontendBuildPath);
  
  // Verificar que el directorio existe
  const fs = require('fs');
  if (!fs.existsSync(frontendBuildPath)) {
    console.error('❌ ERROR: El directorio del build no existe:', frontendBuildPath);
    console.error('⚠️  Asegúrate de ejecutar "npm run build" en el directorio frontend antes de desplegar');
  } else {
    console.log('✅ Directorio del build encontrado');
  }
  
  // Servir archivos estáticos del frontend (JS, CSS, imágenes, etc.)
  // Esto debe ir ANTES del catch-all para que los archivos estáticos se sirvan primero
  app.use(express.static(frontendBuildPath, {
    // No servir index.html automáticamente para rutas raíz
    index: false,
    // Configurar headers para archivos estáticos
    setHeaders: (res, filePath) => {
      // Cachear archivos estáticos en producción
      if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    }
  }));
  
  // Manejar rutas de React (SPA) - debe ir al final, después de todos los endpoints y archivos estáticos
  app.get('*', (req, res, next) => {
    // Si es una ruta de API, no servir el frontend
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    
    // Si tiene extensión de archivo (JS, CSS, imágenes, etc.), ya debería haber sido servido por express.static
    // Si llegamos aquí y tiene extensión, significa que el archivo no existe
    const ext = path.extname(req.path);
    if (ext && ext !== '.html') {
      return res.status(404).send('File not found');
    }
    
    // Para todas las demás rutas (SPA routes como /orden/:token), servir el index.html
    // Esto permite que React Router maneje el routing del lado del cliente
    res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
      if (err) {
        console.error('Error sirviendo index.html:', err);
        res.status(500).send('Error loading application');
      }
    });
  });
}

const PORT = process.env.PORT || 8080;

console.log('🚀 Iniciando servidor...');
console.log('🔍 Puerto de aplicación:', PORT);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 DB_HOST:', process.env.DB_HOST);
console.log('🔍 DB_PORT:', process.env.DB_PORT);
console.log('🔍 DB_NAME:', process.env.DB_NAME);


// ✅ Endpoint POST eliminado - Gmail API configurado correctamente

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Servidor escuchando en puerto ${PORT}`);
  console.log(`🌐 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🌐 Servidor disponible en: http://0.0.0.0:${PORT}`);
});