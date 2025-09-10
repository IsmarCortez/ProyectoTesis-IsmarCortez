const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const crypto = require('crypto');
const dbConfig = require('../config/database');

const router = express.Router();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ storage: storage });

// Endpoint para obtener todos los usuarios
router.get('/', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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
router.post('/', upload.single('foto'), async (req, res) => {
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
router.put('/:id', upload.single('foto'), async (req, res) => {
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
router.put('/:id/cambiar-contrasena', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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

module.exports = router;
