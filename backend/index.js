require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');  // <-- Importamos path para rutas
const nodemailer = require('nodemailer'); // <-- Importar nodemailer
const multer = require('multer'); // <-- Importar multer para manejo de archivos

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
  const { nombre_cliente, apellido_cliente, dpi_cliente, telefono_cliente, correo_cliente, direccion_cliente } = req.body;
  if (!nombre_cliente) {
    return res.status(400).json({ message: 'El nombre del cliente es requerido.' });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    // Insertar cliente
    await connection.execute(
      `INSERT INTO tbl_clientes (nombre_cliente, apellido_cliente, dpi_cliente, telefono_cliente, correo_cliente, direccion_cliente)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre_cliente, apellido_cliente, dpi_cliente, telefono_cliente, correo_cliente, direccion_cliente]
    );
    await connection.end();
    res.json({ message: 'Cliente registrado exitosamente.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'El DPI ya está registrado.' });
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
  const { nombre_cliente, apellido_cliente, dpi_cliente, telefono_cliente, correo_cliente, direccion_cliente } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `UPDATE tbl_clientes SET nombre_cliente = ?, apellido_cliente = ?, dpi_cliente = ?, telefono_cliente = ?, correo_cliente = ?, direccion_cliente = ? WHERE PK_id_cliente = ?`,
      [nombre_cliente, apellido_cliente, dpi_cliente, telefono_cliente, correo_cliente, direccion_cliente, id]
    );
    await connection.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }
    res.json({ message: 'Cliente actualizado correctamente.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'El DPI ya está registrado.' });
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor backend escuchando en puerto ${PORT}`);
});