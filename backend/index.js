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

const app = express();
app.use(cors());
app.use(express.json());

// Servir carpeta uploads como estática para acceder a imágenes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de almacenamiento para multer
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
const upload = multer({ storage });

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

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

    const token = jwt.sign(
      {
        id: usuario.pk_id_usuarios,
        nombre: usuario.nombre_usuario,
        email: usuario.email_usuario,
        foto: usuario.foto_perfil_usuario,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        nombre: usuario.nombre_usuario,
        email: usuario.email_usuario,
        foto: usuario.foto_perfil_usuario, // Este debe ser solo el nombre del archivo
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// ==================== ENDPOINTS DE RECUPERACIÓN DE CONTRASEÑA ====================

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
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
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

    // Configurar nodemailer (ejemplo con Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Debe estar en .env
        pass: process.env.EMAIL_PASS  // Contraseña de aplicación
      }
    });

    // Enviar correo de confirmación
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Contraseña restablecida',
      text: 'Tu contraseña ha sido restablecida exitosamente. Si no fuiste tú, contacta al administrador.'
    });

    res.json({ message: 'Contraseña actualizada y correo de confirmación enviado.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// Endpoint para actualizar nombre y foto de perfil
app.post('/api/actualizar-usuario', upload.single('foto'), async (req, res) => {
  const { email, nombre } = req.body;
  let nombreFoto = null;
  if (!email || !nombre) {
    return res.status(400).json({ message: 'Email y nombre requeridos.' });
  }
  if (req.file) {
    nombreFoto = req.file.filename;
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    let query = 'UPDATE tbl_usuarios SET nombre_usuario = ?';
    let params = [nombre];
    if (nombreFoto) {
      query += ', foto_perfil_usuario = ?';
      params.push(nombreFoto);
    }
    query += ' WHERE email_usuario = ?';
    params.push(email);
    await connection.execute(query, params);
    await connection.end();
    res.json({ message: 'Usuario actualizado correctamente.', foto: nombreFoto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// Endpoint para registrar un nuevo cliente
app.post('/api/clientes', async (req, res) => {
  const { nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente } = req.body;
  if (!nombre_cliente) {
    return res.status(400).json({ message: 'El nombre del cliente es requerido.' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    // Insertar cliente
    await connection.execute(
      `INSERT INTO tbl_clientes (nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente]
    );
    await connection.end();
    res.json({ message: 'Cliente registrado exitosamente.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'El DPI o NIT ya está registrado.' });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Error al registrar el cliente.' });
    }
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
app.put('/api/clientes/:id', async (req, res) => {
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
app.delete('/api/clientes/:id', async (req, res) => {
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
app.post('/api/vehiculos', async (req, res) => {
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
app.put('/api/vehiculos/:id', async (req, res) => {
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
app.delete('/api/vehiculos/:id', async (req, res) => {
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
app.post('/api/servicios', async (req, res) => {
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
      return res.status(404).json({ message: 'Servicio no encontrado.' });
    }
    res.json({ message: 'Servicio actualizado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el servicio.' });
  }
});

// Endpoint para eliminar un servicio
app.delete('/api/servicios/:id', async (req, res) => {
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
app.post('/api/estados', async (req, res) => {
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
      return res.status(404).json({ message: 'Estado no encontrado.' });
    }
    res.json({ message: 'Estado actualizado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el estado.' });
  }
});

// Endpoint para eliminar un estado
app.delete('/api/estados/:id', async (req, res) => {
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
          o.imagen_1,
          o.imagen_2,
          o.imagen_3,
          o.imagen_4,
          o.video,
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
app.post('/api/ordenes', upload.fields([
  { name: 'imagen_1', maxCount: 1 },
  { name: 'imagen_2', maxCount: 1 },
  { name: 'imagen_3', maxCount: 1 },
  { name: 'imagen_4', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
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

  // Validaciones (fk_id_cliente puede ser null para Consumidor Final)
  if (!fk_id_vehiculo || !fk_id_servicio || !fk_id_estado_orden) {
    return res.status(400).json({ message: 'Vehículo, servicio y estado son requeridos.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Procesar archivos
    const imagen_1 = req.files.imagen_1 ? req.files.imagen_1[0].filename : 'sin_imagen.jpg';
    const imagen_2 = req.files.imagen_2 ? req.files.imagen_2[0].filename : 'sin_imagen.jpg';
    const imagen_3 = req.files.imagen_3 ? req.files.imagen_3[0].filename : 'sin_imagen.jpg';
    const imagen_4 = req.files.imagen_4 ? req.files.imagen_4[0].filename : 'sin_imagen.jpg';
    const video = req.files.video ? req.files.video[0].filename : 'sin_video.mp4';

    // Asegurar que estado_vehiculo tenga un valor por defecto
    const estadoVehiculo = estado_vehiculo || 'Bueno';

    // Debug: verificar si es Consumidor Final
    console.log('🔍 Creando orden - fk_id_cliente:', fk_id_cliente);
    
    // Convertir valores vacíos o 'null' a null real para MySQL
    const fk_id_cliente_final = (fk_id_cliente === 'null' || fk_id_cliente === null || fk_id_cliente === '' || fk_id_cliente === undefined) ? null : fk_id_cliente;
    
    if (fk_id_cliente_final === null) {
      console.log('📝 Orden para Consumidor Final (sin cliente específico)');
    }

    const [result] = await connection.execute(
      `INSERT INTO tbl_ordenes (
        fk_id_cliente, fk_id_vehiculo, fk_id_servicio, comentario_cliente_orden,
        nivel_combustible_orden, odometro_auto_cliente_orden, fk_id_estado_orden,
        observaciones_orden, estado_vehiculo, imagen_1, imagen_2, imagen_3, imagen_4, video
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fk_id_cliente_final, fk_id_vehiculo, fk_id_servicio, comentario_cliente_orden,
        nivel_combustible_orden, odometro_auto_cliente_orden, fk_id_estado_orden,
        observaciones_orden, estadoVehiculo, imagen_1, imagen_2, imagen_3, imagen_4, video
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
    
    res.json({ 
      message: 'Orden registrada exitosamente.',
      orderId: result.insertId,
      notifications: 'Procesando notificaciones automáticas...'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar la orden.' });
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
    res.status(500).json({ 
      success: false, 
      message: 'Error al generar el PDF de la orden.' 
    });
  }
});

// Endpoint para actualizar una orden
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
    
    // Obtener orden actual para preservar archivos existentes y detectar cambios de estado
    const [currentOrder] = await connection.execute(
      'SELECT imagen_1, imagen_2, imagen_3, imagen_4, video, fk_id_estado_orden FROM tbl_ordenes WHERE pk_id_orden = ?',
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

    // Procesar archivos nuevos o mantener existentes
    const imagen_1 = req.files.imagen_1 ? req.files.imagen_1[0].filename : currentOrder[0].imagen_1;
    const imagen_2 = req.files.imagen_2 ? req.files.imagen_2[0].filename : currentOrder[0].imagen_2;
    const imagen_3 = req.files.imagen_3 ? req.files.imagen_3[0].filename : currentOrder[0].imagen_3;
    const imagen_4 = req.files.imagen_4 ? req.files.imagen_4[0].filename : currentOrder[0].imagen_4;
    const video = req.files.video ? req.files.video[0].filename : currentOrder[0].video;

    // Asegurar que estado_vehiculo tenga un valor por defecto
    const estadoVehiculo = estado_vehiculo || 'Bueno';

    // Convertir valores vacíos o 'null' a null real para MySQL
    const fk_id_cliente_final = (fk_id_cliente === 'null' || fk_id_cliente === null || fk_id_cliente === '' || fk_id_cliente === undefined) ? null : fk_id_cliente;

    const [result] = await connection.execute(
      `UPDATE tbl_ordenes SET 
        fk_id_cliente = ?, fk_id_vehiculo = ?, fk_id_servicio = ?, comentario_cliente_orden = ?,
        nivel_combustible_orden = ?, odometro_auto_cliente_orden = ?, fk_id_estado_orden = ?,
        observaciones_orden = ?, estado_vehiculo = ?, imagen_1 = ?, imagen_2 = ?, imagen_3 = ?, imagen_4 = ?, video = ?
      WHERE pk_id_orden = ?`,
      [
        fk_id_cliente_final, fk_id_vehiculo, fk_id_servicio, comentario_cliente_orden,
        nivel_combustible_orden, odometro_auto_cliente_orden, fk_id_estado_orden,
        observaciones_orden, estadoVehiculo, imagen_1, imagen_2, imagen_3, imagen_4, video, id
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
    res.json({ 
      message: 'Orden actualizada correctamente.',
      estadoCambio: estadoCambio,
      notificacionEnviada: estadoCambio
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la orden.' });
  }
});

// Endpoint para eliminar una orden
app.delete('/api/ordenes/:id', async (req, res) => {
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
      'SELECT pk_id_usuarios, nombre_usuario, email_usuario, foto_perfil_usuario, pregunta_seguridad_usuario FROM tbl_usuarios ORDER BY nombre_usuario'
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
      'SELECT pk_id_usuarios, nombre_usuario, email_usuario, foto_perfil_usuario, pregunta_seguridad_usuario FROM tbl_usuarios WHERE pk_id_usuarios = ?',
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

// Endpoint para registrar un nuevo usuario
app.post('/api/usuarios', upload.single('foto'), async (req, res) => {
  const { nombre_usuario, email_usuario, contrasenia_usuario, pregunta_seguridad_usuario } = req.body;
  
  if (!nombre_usuario || !email_usuario || !contrasenia_usuario || !pregunta_seguridad_usuario) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

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
    
    // Procesar foto si se subió
    let foto_perfil_usuario = '';
    if (req.file) {
      foto_perfil_usuario = req.file.filename;
    }

    // Insertar nuevo usuario
    const [result] = await connection.execute(
      `INSERT INTO tbl_usuarios (nombre_usuario, email_usuario, contrasenia_usuario, foto_perfil_usuario, pregunta_seguridad_usuario)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre_usuario, email_usuario, hashPassword, foto_perfil_usuario, pregunta_seguridad_usuario]
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
app.put('/api/usuarios/:id', upload.single('foto'), async (req, res) => {
  const { id } = req.params;
  const { nombre_usuario, email_usuario, pregunta_seguridad_usuario } = req.body;
  
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

    // Procesar foto si se subió
    let query = 'UPDATE tbl_usuarios SET nombre_usuario = ?, email_usuario = ?, pregunta_seguridad_usuario = ?';
    let params = [nombre_usuario, email_usuario, pregunta_seguridad_usuario];
    
    if (req.file) {
      query += ', foto_perfil_usuario = ?';
      params.push(req.file.filename);
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
app.delete('/api/usuarios/:id', async (req, res) => {
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

    // 2. Clientes por mes (últimos 12 meses)
    const [clientesPorMes] = await connection.execute(`
      SELECT 
        DATE_FORMAT(o.fecha_ingreso_orden, '%Y-%m') as mes,
        COUNT(DISTINCT o.fk_id_cliente) as cantidad_clientes,
        COUNT(o.pk_id_orden) as cantidad_ordenes
      FROM tbl_ordenes o
      WHERE o.fecha_ingreso_orden >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(o.fecha_ingreso_orden, '%Y-%m')
      ORDER BY mes ASC
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

    // 5. Órdenes por mes (últimos 12 meses)
    const [ordenesPorMes] = await connection.execute(`
      SELECT 
        DATE_FORMAT(fecha_ingreso_orden, '%Y-%m') as mes,
        COUNT(*) as cantidad_ordenes
      FROM tbl_ordenes
      WHERE fecha_ingreso_orden >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(fecha_ingreso_orden, '%Y-%m')
      ORDER BY mes ASC
    `);

    // 6. Estadísticas generales
    const [estadisticasGenerales] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM tbl_clientes) as total_clientes,
        (SELECT COUNT(*) FROM tbl_vehiculos) as total_vehiculos,
        (SELECT COUNT(*) FROM tbl_ordenes) as total_ordenes,
        (SELECT COUNT(*) FROM tbl_ordenes WHERE fecha_ingreso_orden >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as ordenes_mes_actual,
        (SELECT COUNT(*) FROM tbl_ordenes WHERE fk_id_estado_orden = (SELECT pk_id_estado FROM tbl_orden_estado WHERE estado_orden = 'Finalizado')) as ordenes_completadas,
        (SELECT COUNT(*) FROM tbl_ordenes WHERE fk_id_estado_orden = (SELECT pk_id_estado FROM tbl_orden_estado WHERE estado_orden = 'Recibido')) as ordenes_pendientes
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
      WHERE e.estado_orden = 'Finalizado'
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
        COUNT(CASE WHEN fk_id_estado_orden = (SELECT pk_id_estado FROM tbl_orden_estado WHERE estado_orden = 'Finalizado') THEN 1 END) as ordenes_completadas,
        COUNT(CASE WHEN fk_id_estado_orden = (SELECT pk_id_estado FROM tbl_orden_estado WHERE estado_orden = 'Recibido') THEN 1 END) as ordenes_pendientes,
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

// Endpoint para generar reportes en PDF
app.get('/api/reportes/pdf/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;
    const filtros = req.query;
    
    console.log(`📄 Generando reporte PDF: ${tipo}`, filtros);
    
    const pdfBuffer = await ReportService.generatePDFReport(tipo, filtros);
    
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
    
    const excelBuffer = await ReportService.generateExcelReport(tipo, filtros);
    
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

// ==================== ENDPOINTS DEL TRACKER PÚBLICO ====================

// Endpoint público para buscar orden por teléfono
app.get('/api/tracker/telefono/:telefono', async (req, res) => {
  try {
    const { telefono } = req.params;
    
    console.log(`🔍 Búsqueda pública por teléfono: ${telefono}`);
    
    const connection = await mysql.createConnection(dbConfig);
    
    const [ordenes] = await connection.execute(`
      SELECT 
        o.pk_id_orden,
        o.fecha_ingreso_orden,
        CONCAT(c.nombre_cliente, ' ', c.apellido_cliente) as cliente,
        c.telefono_cliente,
        CONCAT(v.marca_vehiculo, ' ', v.modelo_vehiculo) as vehiculo,
        v.placa_vehiculo,
        s.servicio,
        e.estado_orden,
        e.descripcion_estado,
        o.comentario_cliente_orden,
        o.observaciones_orden
      FROM tbl_ordenes o
      LEFT JOIN tbl_clientes c ON o.fk_id_cliente = c.PK_id_cliente
      LEFT JOIN tbl_vehiculos v ON o.fk_id_vehiculo = v.pk_id_vehiculo
      LEFT JOIN tbl_servicios s ON o.fk_id_servicio = s.pk_id_servicio
      LEFT JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
      WHERE c.telefono_cliente = ?
      ORDER BY o.fecha_ingreso_orden DESC
    `, [telefono]);
    
    await connection.end();
    
    if (ordenes.length === 0) {
      return res.json({ 
        encontrado: false, 
        mensaje: 'No se encontraron órdenes con ese número de teléfono.' 
      });
    }
    
    res.json({ 
      encontrado: true, 
      ordenes: ordenes,
      total: ordenes.length
    });
    
  } catch (error) {
    console.error('Error en búsqueda por teléfono:', error);
    res.status(500).json({ 
      encontrado: false, 
      mensaje: 'Error interno del servidor.' 
    });
  }
});

// Endpoint público para buscar orden por número de orden
app.get('/api/tracker/orden/:numero', async (req, res) => {
  try {
    const { numero } = req.params;
    
    console.log(`🔍 Búsqueda pública por número de orden: ${numero}`);
    
    const connection = await mysql.createConnection(dbConfig);
    
    const [ordenes] = await connection.execute(`
      SELECT 
        o.pk_id_orden,
        o.fecha_ingreso_orden,
        CONCAT(c.nombre_cliente, ' ', c.apellido_cliente) as cliente,
        c.telefono_cliente,
        CONCAT(v.marca_vehiculo, ' ', v.modelo_vehiculo) as vehiculo,
        v.placa_vehiculo,
        s.servicio,
        e.estado_orden,
        e.descripcion_estado,
        o.comentario_cliente_orden,
        o.observaciones_orden
      FROM tbl_ordenes o
      LEFT JOIN tbl_clientes c ON o.fk_id_cliente = c.PK_id_cliente
      LEFT JOIN tbl_vehiculos v ON o.fk_id_vehiculo = v.pk_id_vehiculo
      LEFT JOIN tbl_servicios s ON o.fk_id_servicio = s.pk_id_servicio
      LEFT JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
      WHERE o.pk_id_orden = ?
    `, [numero]);
    
    await connection.end();
    
    if (ordenes.length === 0) {
      return res.json({ 
        encontrado: false, 
        mensaje: 'No se encontró una orden con ese número.' 
      });
    }
    
    res.json({ 
      encontrado: true, 
      orden: ordenes[0]
    });
    
  } catch (error) {
    console.error('Error en búsqueda por número de orden:', error);
    res.status(500).json({ 
      encontrado: false, 
      mensaje: 'Error interno del servidor.' 
    });
  }
});

// Endpoint público para obtener historial de estados de una orden
app.get('/api/tracker/historial/:numero', async (req, res) => {
  try {
    const { numero } = req.params;
    
    console.log(`📋 Obteniendo historial real de orden: ${numero}`);
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar que la orden existe
    const [ordenExiste] = await connection.execute(`
      SELECT pk_id_orden FROM tbl_ordenes WHERE pk_id_orden = ?
    `, [numero]);
    
    if (ordenExiste.length === 0) {
      await connection.end();
      return res.json({ 
        encontrado: false, 
        mensaje: 'Orden no encontrada.' 
      });
    }
    
    // Obtener información actual de la orden
    const [ordenActual] = await connection.execute(`
      SELECT 
        o.pk_id_orden,
        o.fecha_ingreso_orden,
        CONCAT(c.nombre_cliente, ' ', c.apellido_cliente) as cliente,
        CONCAT(v.marca_vehiculo, ' ', v.modelo_vehiculo) as vehiculo,
        s.servicio,
        e.estado_orden,
        e.descripcion_estado
      FROM tbl_ordenes o
      LEFT JOIN tbl_clientes c ON o.fk_id_cliente = c.PK_id_cliente
      LEFT JOIN tbl_vehiculos v ON o.fk_id_vehiculo = v.pk_id_vehiculo
      LEFT JOIN tbl_servicios s ON o.fk_id_servicio = s.pk_id_servicio
      LEFT JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
      WHERE o.pk_id_orden = ?
    `, [numero]);
    
    // Obtener historial real de la tabla tbl_historial_estados
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
    `, [numero]);
    
    // Si no hay historial real, crear el estado inicial
    const historial = [];
    const orden = ordenActual[0];
    
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
          descripcion: registro.descripcion_estado || 'Cambio de estado',
          fecha: registro.fecha_cambio,
          activo: registro.estado_nuevo === orden.estado_orden,
          usuario: registro.usuario_cambio || 'Sistema',
          comentario: registro.comentario_cambio,
          estado_anterior: registro.estado_anterior
        });
      }
    }
    
    await connection.end();
    
    console.log(`✅ Historial obtenido: ${historial.length} registros para orden ${numero}`);
    
    res.json({ 
      encontrado: true, 
      orden: orden,
      historial: historial,
      total_registros: historial.length
    });
    
  } catch (error) {
    console.error('Error obteniendo historial real:', error);
    res.status(500).json({ 
      encontrado: false, 
      mensaje: 'Error interno del servidor.' 
    });
  }
});

// Endpoint para registrar cambio de estado manualmente
app.post('/api/tracker/cambiar-estado', async (req, res) => {
  try {
    const { 
      fk_id_orden, 
      fk_id_estado_nuevo, 
      fk_id_usuario_cambio, 
      comentario_cambio,
      ip_usuario,
      user_agent 
    } = req.body;
    
    console.log(`🔄 Registrando cambio de estado para orden: ${fk_id_orden}`);
    
    if (!fk_id_orden || !fk_id_estado_nuevo) {
      return res.status(400).json({ 
        success: false, 
        mensaje: 'ID de orden y nuevo estado son requeridos.' 
      });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar que la orden existe
    const [ordenExiste] = await connection.execute(`
      SELECT pk_id_orden, fk_id_estado_orden FROM tbl_ordenes WHERE pk_id_orden = ?
    `, [fk_id_orden]);
    
    if (ordenExiste.length === 0) {
      await connection.end();
      return res.status(404).json({ 
        success: false, 
        mensaje: 'Orden no encontrada.' 
      });
    }
    
    const estadoAnterior = ordenExiste[0].fk_id_estado_orden;
    
    // Verificar que el nuevo estado existe
    const [estadoExiste] = await connection.execute(`
      SELECT pk_id_estado, estado_orden FROM tbl_orden_estado WHERE pk_id_estado = ?
    `, [fk_id_estado_nuevo]);
    
    if (estadoExiste.length === 0) {
      await connection.end();
      return res.status(404).json({ 
        success: false, 
        mensaje: 'Estado no encontrado.' 
      });
    }
    
    // Actualizar el estado de la orden
    await connection.execute(`
      UPDATE tbl_ordenes SET fk_id_estado_orden = ? WHERE pk_id_orden = ?
    `, [fk_id_estado_nuevo, fk_id_orden]);
    
    // El trigger automáticamente registrará el cambio en el historial
    // Pero también podemos registrar información adicional manualmente
    if (comentario_cambio || ip_usuario || user_agent) {
      await connection.execute(`
        UPDATE tbl_historial_estados 
        SET comentario_cambio = ?, ip_usuario = ?, user_agent = ?, fk_id_usuario_cambio = ?
        WHERE fk_id_orden = ? AND fk_id_estado_nuevo = ?
        ORDER BY fecha_cambio DESC LIMIT 1
      `, [comentario_cambio, ip_usuario, user_agent, fk_id_usuario_cambio, fk_id_orden, fk_id_estado_nuevo]);
    }
    
    await connection.end();
    
    console.log(`✅ Estado cambiado de ${estadoAnterior} a ${fk_id_estado_nuevo} para orden ${fk_id_orden}`);
    
    res.json({ 
      success: true, 
      mensaje: 'Estado actualizado correctamente.',
      orden_id: fk_id_orden,
      estado_anterior: estadoAnterior,
      estado_nuevo: fk_id_estado_nuevo,
      estado_nombre: estadoExiste[0].estado_orden
    });
    
  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error interno del servidor.' 
    });
  }
});

// Endpoint para obtener estadísticas del historial
app.get('/api/tracker/estadisticas-historial', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Estadísticas generales del historial
    const [estadisticas] = await connection.execute(`
      SELECT 
        COUNT(*) as total_cambios,
        COUNT(DISTINCT fk_id_orden) as ordenes_con_historial,
        COUNT(DISTINCT fk_id_usuario_cambio) as usuarios_activos,
        MIN(fecha_cambio) as primer_cambio,
        MAX(fecha_cambio) as ultimo_cambio
      FROM tbl_historial_estados
    `);
    
    // Estados más frecuentes
    const [estadosFrecuentes] = await connection.execute(`
      SELECT 
        e.estado_orden,
        COUNT(*) as cantidad_cambios
      FROM tbl_historial_estados h
      JOIN tbl_orden_estado e ON h.fk_id_estado_nuevo = e.pk_id_estado
      GROUP BY e.estado_orden
      ORDER BY cantidad_cambios DESC
      LIMIT 5
    `);
    
    // Usuarios más activos
    const [usuariosActivos] = await connection.execute(`
      SELECT 
        u.nombre_usuario,
        COUNT(*) as cambios_realizados
      FROM tbl_historial_estados h
      JOIN tbl_usuarios u ON h.fk_id_usuario_cambio = u.pk_id_usuarios
      GROUP BY u.nombre_usuario
      ORDER BY cambios_realizados DESC
      LIMIT 5
    `);
    
    await connection.end();
    
    res.json({
      success: true,
      estadisticas: estadisticas[0],
      estados_frecuentes: estadosFrecuentes,
      usuarios_activos: usuariosActivos
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas del historial:', error);
    res.status(500).json({ 
      success: false, 
      mensaje: 'Error interno del servidor.' 
    });
  }
});

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`🟢 Servidor backend escuchando en puerto ${PORT}`);
  
  // Inicializar servicios de notificación
  await initializeServices();
});