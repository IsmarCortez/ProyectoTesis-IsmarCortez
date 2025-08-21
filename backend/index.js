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
    }0.

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
          c.dpi_cliente,
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
    observaciones_orden
  } = req.body;

  // Validaciones
  if (!fk_id_cliente || !fk_id_vehiculo || !fk_id_servicio || !fk_id_estado_orden) {
    return res.status(400).json({ message: 'Cliente, vehículo, servicio y estado son requeridos.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Procesar archivos
    const imagen_1 = req.files.imagen_1 ? req.files.imagen_1[0].filename : 'sin_imagen.jpg';
    const imagen_2 = req.files.imagen_2 ? req.files.imagen_2[0].filename : 'sin_imagen.jpg';
    const imagen_3 = req.files.imagen_3 ? req.files.imagen_3[0].filename : 'sin_imagen.jpg';
    const imagen_4 = req.files.imagen_4 ? req.files.imagen_4[0].filename : 'sin_imagen.jpg';
    const video = req.files.video ? req.files.video[0].filename : 'sin_video.mp4';

    const [result] = await connection.execute(
      `INSERT INTO tbl_ordenes (
        fk_id_cliente, fk_id_vehiculo, fk_id_servicio, comentario_cliente_orden,
        nivel_combustible_orden, odometro_auto_cliente_orden, fk_id_estado_orden,
        observaciones_orden, imagen_1, imagen_2, imagen_3, imagen_4, video
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fk_id_cliente, fk_id_vehiculo, fk_id_servicio, comentario_cliente_orden,
        nivel_combustible_orden, odometro_auto_cliente_orden, fk_id_estado_orden,
        observaciones_orden, imagen_1, imagen_2, imagen_3, imagen_4, video
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
    observaciones_orden
  } = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Obtener orden actual para preservar archivos existentes
    const [currentOrder] = await connection.execute(
      'SELECT imagen_1, imagen_2, imagen_3, imagen_4, video FROM tbl_ordenes WHERE pk_id_orden = ?',
      [id]
    );
    
    if (currentOrder.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Orden no encontrada.' });
    }

    // Procesar archivos nuevos o mantener existentes
    const imagen_1 = req.files.imagen_1 ? req.files.imagen_1[0].filename : currentOrder[0].imagen_1;
    const imagen_2 = req.files.imagen_2 ? req.files.imagen_2[0].filename : currentOrder[0].imagen_2;
    const imagen_3 = req.files.imagen_3 ? req.files.imagen_3[0].filename : currentOrder[0].imagen_3;
    const imagen_4 = req.files.imagen_4 ? req.files.imagen_4[0].filename : currentOrder[0].imagen_4;
    const video = req.files.video ? req.files.video[0].filename : currentOrder[0].video;

    const [result] = await connection.execute(
      `UPDATE tbl_ordenes SET 
        fk_id_cliente = ?, fk_id_vehiculo = ?, fk_id_servicio = ?, comentario_cliente_orden = ?,
        nivel_combustible_orden = ?, odometro_auto_cliente_orden = ?, fk_id_estado_orden = ?,
        observaciones_orden = ?, imagen_1 = ?, imagen_2 = ?, imagen_3 = ?, imagen_4 = ?, video = ?
      WHERE pk_id_orden = ?`,
      [
        fk_id_cliente, fk_id_vehiculo, fk_id_servicio, comentario_cliente_orden,
        nivel_combustible_orden, odometro_auto_cliente_orden, fk_id_estado_orden,
        observaciones_orden, imagen_1, imagen_2, imagen_3, imagen_4, video, id
      ]
    );
    
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Orden no encontrada.' });
    }
    res.json({ message: 'Orden actualizada correctamente.' });
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