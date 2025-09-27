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

// Verificar configuración de Cloudinary
try {
  console.log('🔍 Cloudinary configurado:', cloudinaryConfigured());
  if (cloudinaryConfigured()) {
    console.log('☁️ Cloudinary: ACTIVO');
  } else {
    console.log('📁 Almacenamiento: LOCAL');
  }
} catch (error) {
  console.log('❌ Error verificando Cloudinary:', error.message);
  console.log('📁 Usando almacenamiento local como fallback');
}

// Crear carpeta uploads si no existe
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'backend/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Carpeta uploads creada:', uploadsDir);
} else {
  console.log('📁 Carpeta uploads existe:', uploadsDir);
}

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
  
  console.log('🔍 LOGIN DEBUG - Email recibido:', email);
  console.log('🔍 LOGIN DEBUG - Password recibido:', password ? '[PRESENTE]' : '[VACÍO]');
  
  if (!email || !password) {
    console.log('❌ LOGIN DEBUG - Email o password faltantes');
    return res.status(400).json({ message: 'Email y contraseña requeridos.' });
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('🔍 LOGIN DEBUG - Conectado a la base de datos');
    
    const [rows] = await connection.execute(
      'SELECT * FROM tbl_usuarios WHERE email_usuario = ?',
      [email]
    );
    
    console.log('🔍 LOGIN DEBUG - Usuarios encontrados:', rows.length);
    console.log('🔍 LOGIN DEBUG - Query ejecutada: SELECT * FROM tbl_usuarios WHERE email_usuario = ?');
    console.log('🔍 LOGIN DEBUG - Email buscado:', email);
    
    await connection.end();
    
    if (rows.length === 0) {
      console.log('❌ LOGIN DEBUG - No se encontró usuario con email:', email);
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }
    
    const usuario = rows[0];
    console.log('🔍 LOGIN DEBUG - Usuario encontrado:', {
      id: usuario.pk_id_usuarios,
      email: usuario.email_usuario,
      nombre: usuario.nombre_usuario,
      password_hash: usuario.contrasenia_usuario ? '[PRESENTE]' : '[VACÍO]'
    });

    // Hasheamos la contraseña ingresada para compararla con la almacenada
    const hashPassword = crypto.createHash('sha256').update(password).digest('hex');
    console.log('🔍 LOGIN DEBUG - Hash de contraseña ingresada:', hashPassword);
    console.log('🔍 LOGIN DEBUG - Hash de contraseña almacenada:', usuario.contrasenia_usuario);
    
    if (hashPassword !== usuario.contrasenia_usuario) {
      console.log('❌ LOGIN DEBUG - Contraseñas no coinciden');
      console.log('❌ LOGIN DEBUG - Hash ingresado:', hashPassword);
      console.log('❌ LOGIN DEBUG - Hash almacenado:', usuario.contrasenia_usuario);
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    console.log('✅ LOGIN DEBUG - Contraseñas coinciden, generando token');

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

    console.log('✅ LOGIN DEBUG - Token generado exitosamente');
    console.log('✅ LOGIN DEBUG - Login exitoso para usuario:', usuario.email_usuario);

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
    console.error('❌ LOGIN DEBUG - Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ==================== ENDPOINTS DE DIAGNÓSTICO ====================

// Endpoint para configurar la base de datos (solo para diagnóstico)
app.post('/api/debug/setup-database', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Leer el archivo SQL
    const sqlFile = fs.readFileSync(path.join(__dirname, 'database_setup.sql'), 'utf8');
    
    // Dividir el archivo en consultas individuales
    const queries = sqlFile
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0);
    
    const connection = await mysql.createConnection(dbConfig);
    
    let executedQueries = 0;
    let errors = [];
    
    for (const query of queries) {
      try {
        await connection.execute(query);
        executedQueries++;
        console.log(`✅ Query ejecutada: ${query.substring(0, 50)}...`);
      } catch (error) {
        if (error.code !== 'ER_TABLE_EXISTS_ERROR' && error.code !== 'ER_DUP_ENTRY') {
          errors.push({
            query: query.substring(0, 50),
            error: error.message
          });
          console.log(`❌ Error en query: ${query.substring(0, 50)}... - ${error.message}`);
        }
      }
    }
    
    await connection.end();
    
    res.json({
      message: 'Configuración de base de datos completada',
      executedQueries: executedQueries,
      errors: errors,
      success: errors.length === 0
    });
  } catch (error) {
    console.error('Error configurando base de datos:', error);
    res.status(500).json({ message: 'Error configurando base de datos', error: error.message });
  }
});

// Endpoint para listar usuarios (solo para diagnóstico)
app.get('/api/debug/usuarios', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT pk_id_usuarios, email_usuario, nombre_usuario, contrasenia_usuario FROM tbl_usuarios');
    await connection.end();
    
    console.log('🔍 DEBUG - Usuarios en la base de datos:', rows.length);
    res.json({
      total: rows.length,
      usuarios: rows.map(u => ({
        id: u.pk_id_usuarios,
        email: u.email_usuario,
        nombre: u.nombre_usuario,
        password_hash: u.contrasenia_usuario ? '[PRESENTE]' : '[VACÍO]'
      }))
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error obteniendo usuarios' });
  }
});

// Endpoint temporal para actualizar contraseña (SOLO PARA DIAGNÓSTICO)
app.post('/api/debug/update-password', async (req, res) => {
  const { email, newPassword } = req.body;
  
  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email y nueva contraseña requeridos' });
  }
  
  try {
    const hashPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
    
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'UPDATE tbl_usuarios SET contrasenia_usuario = ? WHERE email_usuario = ?',
      [hashPassword, email]
    );
    
    await connection.end();
    
    console.log('🔍 DEBUG - Contraseña actualizada para:', email);
    console.log('🔍 DEBUG - Hash generado:', hashPassword);
    
    res.json({
      message: 'Contraseña actualizada exitosamente',
      email: email,
      hash: hashPassword
    });
  } catch (error) {
    console.error('Error actualizando contraseña:', error);
    res.status(500).json({ message: 'Error actualizando contraseña' });
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
app.post('/api/usuarios', upload.single('foto'), async (req, res) => {
  try {
    const { nombre_usuario, email_usuario, password_usuario } = req.body;
    const foto_perfil_usuario = req.file ? req.file.filename : null;
    
    // Validar que la contraseña no esté vacía
    if (!password_usuario) {
      return res.status(400).json({ message: 'La contraseña es requerida' });
    }
    
    const hashPassword = crypto.createHash('sha256').update(password_usuario).digest('hex');
    
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO tbl_usuarios (nombre_usuario, email_usuario, contrasenia_usuario, foto_perfil_usuario) VALUES (?, ?, ?, ?)',
      [nombre_usuario, email_usuario, hashPassword, foto_perfil_usuario]
    );
    await connection.end();
    
    res.status(201).json({ message: 'Usuario creado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ message: 'Error creando usuario' });
  }
});

// Actualizar usuario con foto (endpoint especial)
app.post('/api/actualizar-usuario', upload.single('foto'), async (req, res) => {
  try {
    const { id_usuario, nombre_usuario, email_usuario, telefono_usuario } = req.body;
    const foto_perfil_usuario = req.file ? req.file.filename : null;
    
    const connection = await mysql.createConnection(dbConfig);
    
    let query = 'UPDATE tbl_usuarios SET nombre_usuario = ?, email_usuario = ?, telefono_usuario = ?';
    let params = [nombre_usuario, email_usuario, telefono_usuario];
    
    if (foto_perfil_usuario) {
      query += ', foto_perfil_usuario = ?';
      params.push(foto_perfil_usuario);
    }
    
    query += ' WHERE pk_id_usuarios = ?';
    params.push(id_usuario);
    
    const [result] = await connection.execute(query, params);
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ message: 'Error actualizando usuario' });
  }
});

// Obtener un usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT pk_id_usuarios, nombre_usuario, apellido_usuario, email_usuario, telefono_usuario, foto_perfil_usuario FROM tbl_usuarios WHERE pk_id_usuarios = ?', [id]);
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
});

// Actualizar un usuario
app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_usuario, apellido_usuario, email_usuario, telefono_usuario, foto_perfil_usuario } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'UPDATE tbl_usuarios SET nombre_usuario = ?, apellido_usuario = ?, email_usuario = ?, telefono_usuario = ?, foto_perfil_usuario = COALESCE(?, foto_perfil_usuario) WHERE pk_id_usuarios = ?',
      [nombre_usuario, apellido_usuario, email_usuario, telefono_usuario, foto_perfil_usuario, id]
    );
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

// Eliminar un usuario
app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM tbl_usuarios WHERE pk_id_usuarios = ?', [id]);
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
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

// Obtener un cliente por ID
app.get('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_clientes WHERE PK_id_cliente = ?', [id]);
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ message: 'Error al obtener cliente' });
  }
});

// Actualizar un cliente
app.put('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'UPDATE tbl_clientes SET nombre_cliente = ?, apellido_cliente = ?, dpi_cliente = ?, NIT = ?, telefono_cliente = ?, correo_cliente = ?, direccion_cliente = ? WHERE PK_id_cliente = ?',
      [nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente, id]
    );
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ message: 'Error al actualizar cliente' });
  }
});

// Eliminar un cliente
app.delete('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM tbl_clientes WHERE PK_id_cliente = ?', [id]);
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ message: 'Error al eliminar cliente' });
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

// Obtener un vehículo por ID
app.get('/api/vehiculos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_vehiculos WHERE pk_id_vehiculo = ?', [id]);
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener vehículo:', error);
    res.status(500).json({ message: 'Error al obtener vehículo' });
  }
});

// Actualizar un vehículo
app.put('/api/vehiculos/:id', async (req, res) => {
  const { id } = req.params;
  const { placa_vehiculo, marca_vehiculo, modelo_vehiculo, anio_vehiculo, color_vehiculo } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'UPDATE tbl_vehiculos SET placa_vehiculo = ?, marca_vehiculo = ?, modelo_vehiculo = ?, anio_vehiculo = ?, color_vehiculo = ? WHERE pk_id_vehiculo = ?',
      [placa_vehiculo, marca_vehiculo, modelo_vehiculo, anio_vehiculo, color_vehiculo, id]
    );
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }
    res.json({ message: 'Vehículo actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar vehículo:', error);
    res.status(500).json({ message: 'Error al actualizar vehículo' });
  }
});

// Eliminar un vehículo
app.delete('/api/vehiculos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM tbl_vehiculos WHERE pk_id_vehiculo = ?', [id]);
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }
    res.json({ message: 'Vehículo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar vehículo:', error);
    res.status(500).json({ message: 'Error al eliminar vehículo' });
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

// Obtener un servicio por ID
app.get('/api/servicios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_servicios WHERE pk_id_servicio = ?', [id]);
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener servicio:', error);
    res.status(500).json({ message: 'Error al obtener servicio' });
  }
});

// Actualizar un servicio
app.put('/api/servicios/:id', async (req, res) => {
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
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    res.json({ message: 'Servicio actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    res.status(500).json({ message: 'Error al actualizar servicio' });
  }
});

// Eliminar un servicio
app.delete('/api/servicios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM tbl_servicios WHERE pk_id_servicio = ?', [id]);
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    res.json({ message: 'Servicio eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    res.status(500).json({ message: 'Error al eliminar servicio' });
  }
});

// ==================== ESTADOS ====================

// Obtener todos los estados
app.get('/api/estados', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_orden_estado ORDER BY pk_id_estado DESC');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo estados:', error);
    res.status(500).json({ message: 'Error obteniendo estados' });
  }
});

// Obtener un estado por ID
app.get('/api/estados/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_orden_estado WHERE pk_id_estado = ?', [id]);
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Estado no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener estado:', error);
    res.status(500).json({ message: 'Error al obtener estado' });
  }
});

// Crear un nuevo estado
app.post('/api/estados', async (req, res) => {
  try {
    const { estado_orden, descripcion_estado } = req.body;
    if (!estado_orden) {
      return res.status(400).json({ message: 'El nombre del estado es requerido' });
    }
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO tbl_orden_estado (estado_orden, descripcion_estado) VALUES (?, ?)',
      [estado_orden, descripcion_estado]
    );
    await connection.end();
    res.status(201).json({ message: 'Estado registrado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al registrar estado:', error);
    res.status(500).json({ message: 'Error al registrar estado' });
  }
});

// Actualizar un estado
app.put('/api/estados/:id', async (req, res) => {
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
      return res.status(404).json({ message: 'Estado no encontrado' });
    }
    res.json({ message: 'Estado actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
});

// Eliminar un estado
app.delete('/api/estados/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM tbl_orden_estado WHERE pk_id_estado = ?', [id]);
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Estado no encontrado' });
    }
    res.json({ message: 'Estado eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar estado:', error);
    res.status(500).json({ message: 'Error al eliminar estado' });
  }
});

// ==================== ÓRDENES ====================

// Buscar cliente por NIT para órdenes
app.get('/api/ordenes/buscar-cliente-nit/:nit', async (req, res) => {
  const { nit } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT PK_id_cliente, nombre_cliente, apellido_cliente, NIT FROM tbl_clientes WHERE NIT = ?', [nit]);
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al buscar cliente por NIT:', error);
    res.status(500).json({ message: 'Error al buscar cliente por NIT' });
  }
});

// Buscar vehículo por placa para órdenes
app.get('/api/ordenes/buscar-vehiculo/:placa', async (req, res) => {
  const { placa } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT pk_id_vehiculo, placa_vehiculo, marca_vehiculo, modelo_vehiculo, anio_vehiculo FROM tbl_vehiculos WHERE placa_vehiculo = ?', [placa]);
    await connection.end();
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al buscar vehículo por placa:', error);
    res.status(500).json({ message: 'Error al buscar vehículo por placa' });
  }
});

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
      LEFT JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
      ORDER BY o.pk_id_orden DESC
    `);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    res.status(500).json({ message: 'Error obteniendo órdenes' });
  }
});

// Obtener una orden por ID
app.get('/api/ordenes/:id', async (req, res) => {
  const { id } = req.params;
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
      LEFT JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
      WHERE o.pk_id_orden = ?
    `, [id]);
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener orden:', error);
    res.status(500).json({ message: 'Error al obtener orden' });
  }
});

// Crear una nueva orden
app.post('/api/ordenes', upload.fields([
  { name: 'imagen_1', maxCount: 1 },
  { name: 'imagen_2', maxCount: 1 },
  { name: 'imagen_3', maxCount: 1 },
  { name: 'imagen_4', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      fk_id_cliente,
      fk_id_vehiculo,
      fk_id_servicio,
      comentario_cliente_orden,
      nivel_combustible_orden,
      odometro_auto_cliente_orden,
      fk_id_estado_orden,
      observaciones_orden,
      estado_vehiculo
    } = req.body;

    const imagen_1 = req.files && req.files['imagen_1'] ? req.files['imagen_1'][0].filename : 'sin_imagen.jpg';
    const imagen_2 = req.files && req.files['imagen_2'] ? req.files['imagen_2'][0].filename : 'sin_imagen.jpg';
    const imagen_3 = req.files && req.files['imagen_3'] ? req.files['imagen_3'][0].filename : 'sin_imagen.jpg';
    const imagen_4 = req.files && req.files['imagen_4'] ? req.files['imagen_4'][0].filename : 'sin_imagen.jpg';
    const video = req.files && req.files['video'] ? req.files['video'][0].filename : 'sin_video.mp4';

    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `INSERT INTO tbl_ordenes (
        fk_id_cliente, fk_id_vehiculo, fk_id_servicio, comentario_cliente_orden,
        nivel_combustible_orden, odometro_auto_cliente_orden, fk_id_estado_orden,
        observaciones_orden, estado_vehiculo, imagen_1, imagen_2, imagen_3, imagen_4, video
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fk_id_cliente, fk_id_vehiculo, fk_id_servicio, comentario_cliente_orden,
        nivel_combustible_orden, odometro_auto_cliente_orden, fk_id_estado_orden,
        observaciones_orden, estado_vehiculo, imagen_1, imagen_2, imagen_3, imagen_4, video
      ]
    );
    await connection.end();

    res.status(201).json({ message: 'Orden registrada exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error al registrar orden:', error);
    res.status(500).json({ message: 'Error al registrar orden' });
  }
});

// Actualizar una orden
app.put('/api/ordenes/:id', upload.fields([
  { name: 'imagen_1', maxCount: 1 },
  { name: 'imagen_2', maxCount: 1 },
  { name: 'imagen_3', maxCount: 1 },
  { name: 'imagen_4', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  const { id } = req.params;
  const {
    fk_id_cliente,
    fk_id_vehiculo,
    fk_id_servicio,
    comentario_cliente_orden,
    nivel_combustible_orden,
    odometro_auto_cliente_orden,
    fk_id_estado_orden,
    observaciones_orden,
    estado_vehiculo
  } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    let query = `UPDATE tbl_ordenes SET
      fk_id_cliente = ?, fk_id_vehiculo = ?, fk_id_servicio = ?, comentario_cliente_orden = ?,
      nivel_combustible_orden = ?, odometro_auto_cliente_orden = ?, fk_id_estado_orden = ?,
      observaciones_orden = ?, estado_vehiculo = ?`;
    
    let params = [
      fk_id_cliente, fk_id_vehiculo, fk_id_servicio, comentario_cliente_orden,
      nivel_combustible_orden, odometro_auto_cliente_orden, fk_id_estado_orden,
      observaciones_orden, estado_vehiculo
    ];

    // Solo actualizar imágenes si se proporcionan
    if (req.files && req.files['imagen_1']) {
      query += ', imagen_1 = ?';
      params.push(req.files['imagen_1'][0].filename);
    }
    if (req.files && req.files['imagen_2']) {
      query += ', imagen_2 = ?';
      params.push(req.files['imagen_2'][0].filename);
    }
    if (req.files && req.files['imagen_3']) {
      query += ', imagen_3 = ?';
      params.push(req.files['imagen_3'][0].filename);
    }
    if (req.files && req.files['imagen_4']) {
      query += ', imagen_4 = ?';
      params.push(req.files['imagen_4'][0].filename);
    }
    if (req.files && req.files['video']) {
      query += ', video = ?';
      params.push(req.files['video'][0].filename);
    }

    query += ' WHERE pk_id_orden = ?';
    params.push(id);

    const [result] = await connection.execute(query, params);
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    res.json({ message: 'Orden actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    res.status(500).json({ message: 'Error al actualizar orden' });
  }
});

// Eliminar una orden
app.delete('/api/ordenes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute('DELETE FROM tbl_ordenes WHERE pk_id_orden = ?', [id]);
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }
    res.json({ message: 'Orden eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ message: 'Error al eliminar orden' });
  }
});

// Generar PDF de orden
app.get('/api/ordenes/:id/pdf', async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`🖨️ Generando PDF para orden #${id}...`);
    
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT 
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
      WHERE o.pk_id_orden = ?
    `, [id]);
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Orden no encontrada.' });
    }
    
    const ordenData = rows[0];
    
    // Generar PDF simple (sin servicios externos por ahora)
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="orden_${id}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Contenido del PDF
    doc.fontSize(20).text('ORDEN DE SERVICIO', 100, 100);
    doc.fontSize(14).text(`Orden #${ordenData.pk_id_orden}`, 100, 150);
    doc.text(`Fecha: ${new Date(ordenData.fecha_ingreso_orden).toLocaleDateString()}`, 100, 180);
    
    // Datos del cliente
    doc.fontSize(16).text('DATOS DEL CLIENTE', 100, 220);
    doc.fontSize(12).text(`Nombre: ${ordenData.nombre_cliente} ${ordenData.apellido_cliente}`, 100, 250);
    doc.text(`NIT: ${ordenData.NIT}`, 100, 270);
    doc.text(`Teléfono: ${ordenData.telefono_cliente}`, 100, 290);
    doc.text(`Correo: ${ordenData.correo_cliente}`, 100, 310);
    
    // Datos del vehículo
    doc.fontSize(16).text('DATOS DEL VEHÍCULO', 100, 350);
    doc.fontSize(12).text(`Placa: ${ordenData.placa_vehiculo}`, 100, 380);
    doc.text(`Marca: ${ordenData.marca_vehiculo}`, 100, 400);
    doc.text(`Modelo: ${ordenData.modelo_vehiculo}`, 100, 420);
    doc.text(`Año: ${ordenData.anio_vehiculo}`, 100, 440);
    doc.text(`Color: ${ordenData.color_vehiculo}`, 100, 460);
    
    // Datos del servicio
    doc.fontSize(16).text('DATOS DEL SERVICIO', 100, 500);
    doc.fontSize(12).text(`Servicio: ${ordenData.servicio}`, 100, 530);
    doc.text(`Estado: ${ordenData.estado_orden}`, 100, 550);
    doc.text(`Comentario: ${ordenData.comentario_cliente_orden || 'N/A'}`, 100, 570);
    doc.text(`Observaciones: ${ordenData.observaciones_orden || 'N/A'}`, 100, 590);
    
    // Finalizar PDF
    doc.end();
    
    console.log(`✅ PDF generado exitosamente para orden #${id}`);
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ message: 'Error generando PDF de la orden' });
  }
});

// Endpoint para enviar correo de orden
app.post('/api/ordenes/:id/enviar-correo', async (req, res) => {
  const { id } = req.params;
  const { correo_cliente } = req.body;
  
  try {
    console.log(`📧 Enviando correo para orden #${id} a ${correo_cliente}...`);
    
    // Obtener datos de la orden
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT 
        o.*,
        c.nombre_cliente,
        c.apellido_cliente,
        c.correo_cliente,
        v.placa_vehiculo,
        v.marca_vehiculo,
        v.modelo_vehiculo,
        s.servicio,
        e.estado_orden
      FROM tbl_ordenes o
      LEFT JOIN tbl_clientes c ON o.fk_id_cliente = c.PK_id_cliente
      LEFT JOIN tbl_vehiculos v ON o.fk_id_vehiculo = v.pk_id_vehiculo
      LEFT JOIN tbl_servicios s ON o.fk_id_servicio = s.pk_id_servicio
      LEFT JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
      WHERE o.pk_id_orden = ?
    `, [id]);
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }
    
    const ordenData = rows[0];
    
    // Usar el servicio de notificaciones
    try {
      await NotificationService.sendOrderNotification(ordenData, correo_cliente);
      
      res.json({ 
        message: 'Correo enviado exitosamente', 
        orden_id: id,
        correo: correo_cliente,
        status: 'Enviado'
      });
      
      console.log(`✅ Correo enviado exitosamente para orden #${id}`);
      
    } catch (notificationError) {
      console.error('Error en servicio de notificaciones:', notificationError);
      
      // Fallback: respuesta básica
      res.json({ 
        message: 'Correo procesado (servicio de notificaciones no disponible)', 
        orden_id: id,
        correo: correo_cliente,
        status: 'Procesado',
        warning: 'Servicio de notificaciones no disponible'
      });
    }
    
  } catch (error) {
    console.error('Error enviando correo:', error);
    res.status(500).json({ message: 'Error enviando correo' });
  }
});

// Endpoint para verificar imágenes de una orden
app.get('/api/ordenes/:id/imagenes', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT imagen_1, imagen_2, imagen_3, imagen_4, video 
      FROM tbl_ordenes 
      WHERE pk_id_orden = ?
    `, [id]);
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }
    
    const orden = rows[0];
    const imagenes = [];
    
    // Función helper para generar URL
    const getImageUrl = (filename) => {
      if (!filename || filename === 'sin_imagen.jpg') return null;
      
      if (cloudinaryConfigured()) {
        // Si es una URL de Cloudinary, devolverla tal como está
        if (filename.startsWith('http')) {
          return filename;
        }
        // Si es un public_id de Cloudinary, construir la URL
        return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/${filename}`;
      } else {
        // Almacenamiento local
        return `/uploads/${filename}`;
      }
    };
    
    // Verificar qué imágenes existen
    if (orden.imagen_1 && orden.imagen_1 !== 'sin_imagen.jpg') {
      imagenes.push({
        campo: 'imagen_1',
        archivo: orden.imagen_1,
        url: getImageUrl(orden.imagen_1)
      });
    }
    if (orden.imagen_2 && orden.imagen_2 !== 'sin_imagen.jpg') {
      imagenes.push({
        campo: 'imagen_2',
        archivo: orden.imagen_2,
        url: getImageUrl(orden.imagen_2)
      });
    }
    if (orden.imagen_3 && orden.imagen_3 !== 'sin_imagen.jpg') {
      imagenes.push({
        campo: 'imagen_3',
        archivo: orden.imagen_3,
        url: getImageUrl(orden.imagen_3)
      });
    }
    if (orden.imagen_4 && orden.imagen_4 !== 'sin_imagen.jpg') {
      imagenes.push({
        campo: 'imagen_4',
        archivo: orden.imagen_4,
        url: getImageUrl(orden.imagen_4)
      });
    }
    
    res.json({
      orden_id: id,
      imagenes: imagenes,
      video: orden.video !== 'sin_video.mp4' ? {
        archivo: orden.video,
        url: getImageUrl(orden.video)
      } : null,
      total_imagenes: imagenes.length,
      storage_type: cloudinaryConfigured() ? 'cloudinary' : 'local'
    });
    
  } catch (error) {
    console.error('Error obteniendo imágenes:', error);
    res.status(500).json({ message: 'Error obteniendo imágenes' });
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
