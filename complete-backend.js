// Servidor completo del Sistema Taller Mecánico para Railway
console.log('🚀 Iniciando Sistema Taller Mecánico...');

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

console.log('🔍 Puerto:', PORT);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

// Configuración de base de datos
const dbConfig = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT || 3306,
};

console.log('🔍 DB Config:', {
  host: dbConfig.host ? 'Configurado' : 'No configurado',
  user: dbConfig.user ? 'Configurado' : 'No configurado',
  database: dbConfig.database ? 'Configurado' : 'No configurado',
  port: dbConfig.port
});

// Configurar CORS para Railway
app.use(cors({
  origin: true, // Permitir todos los orígenes para Railway
  credentials: true
}));

app.use(express.json());

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

// Test de conexión a base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('🔍 Probando conexión a base de datos...');
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_time');
    await connection.end();
    
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      test: rows[0],
      message: 'Conexión a MySQL exitosa'
    });
  } catch (error) {
    console.error('❌ Error de base de datos:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message,
      message: 'Error conectando a MySQL'
    });
  }
});

// ==================== RUTAS DE USUARIOS ====================

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
    if (usuario.password_usuario !== password) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }
    
    res.json({
      message: 'Login exitoso',
      usuario: {
        id: usuario.pk_id_usuarios,
        nombre: usuario.nombre_usuario,
        email: usuario.email_usuario,
        rol: usuario.rol_usuario
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ==================== RUTAS DE CLIENTES ====================

// Obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_clientes ORDER BY PK_id_cliente DESC');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ message: 'Error al obtener los clientes.' });
  }
});

// Crear cliente
app.post('/api/clientes', async (req, res) => {
  const { nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente } = req.body;
  
  if (!nombre_cliente) {
    return res.status(400).json({ message: 'El nombre del cliente es requerido.' });
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `INSERT INTO tbl_clientes (nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente]
    );
    await connection.end();
    res.json({ message: 'Cliente registrado exitosamente.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Ya existe un cliente con ese DPI o NIT.' });
    } else {
      console.error('Error creando cliente:', error);
      res.status(500).json({ message: 'Error al registrar el cliente.' });
    }
  }
});

// ==================== RUTAS DE VEHÍCULOS ====================

// Obtener todos los vehículos
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
    console.error('Error obteniendo vehículos:', error);
    res.status(500).json({ message: 'Error al obtener los vehículos.' });
  }
});

// Crear vehículo
app.post('/api/vehiculos', async (req, res) => {
  const { placa_vehiculo, marca_vehiculo, modelo_vehiculo, anio_vehiculo, color_vehiculo, fk_id_cliente } = req.body;
  
  if (!placa_vehiculo || !marca_vehiculo || !modelo_vehiculo) {
    return res.status(400).json({ message: 'Placa, marca y modelo son requeridos.' });
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `INSERT INTO tbl_vehiculos (placa_vehiculo, marca_vehiculo, modelo_vehiculo, anio_vehiculo, color_vehiculo, fk_id_cliente)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [placa_vehiculo, marca_vehiculo, modelo_vehiculo, anio_vehiculo, color_vehiculo, fk_id_cliente]
    );
    await connection.end();
    res.json({ message: 'Vehículo registrado exitosamente.' });
  } catch (error) {
    console.error('Error creando vehículo:', error);
    res.status(500).json({ message: 'Error al registrar el vehículo.' });
  }
});

// ==================== RUTAS DE SERVICIOS ====================

// Obtener todos los servicios
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
    console.error('Error obteniendo servicios:', error);
    res.status(500).json({ message: 'Error al obtener los servicios.' });
  }
});

// Crear servicio
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
    console.error('Error creando servicio:', error);
    res.status(500).json({ message: 'Error al registrar el servicio.' });
  }
});

// ==================== RUTAS DE ÓRDENES ====================

// Obtener todas las órdenes
app.get('/api/ordenes', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT o.*, c.nombre_cliente, c.apellido_cliente, v.placa_vehiculo, v.marca_vehiculo, v.modelo_vehiculo
      FROM tbl_ordenes o
      LEFT JOIN tbl_clientes c ON o.fk_id_cliente = c.PK_id_cliente
      LEFT JOIN tbl_vehiculos v ON o.fk_id_vehiculo = v.pk_id_vehiculo
      ORDER BY o.pk_id_orden DESC
    `);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    res.status(500).json({ message: 'Error al obtener las órdenes.' });
  }
});

// Crear orden
app.post('/api/ordenes', async (req, res) => {
  const { fk_id_cliente, fk_id_vehiculo, fk_id_servicio, descripcion_orden, fecha_orden } = req.body;
  
  if (!fk_id_cliente || !fk_id_vehiculo || !fk_id_servicio) {
    return res.status(400).json({ message: 'Cliente, vehículo y servicio son requeridos.' });
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `INSERT INTO tbl_ordenes (fk_id_cliente, fk_id_vehiculo, fk_id_servicio, descripcion_orden, fecha_orden, estado_orden)
       VALUES (?, ?, ?, ?, ?, 'Pendiente')`,
      [fk_id_cliente, fk_id_vehiculo, fk_id_servicio, descripcion_orden, fecha_orden || new Date()]
    );
    await connection.end();
    res.json({ message: 'Orden registrada exitosamente.' });
  } catch (error) {
    console.error('Error creando orden:', error);
    res.status(500).json({ message: 'Error al registrar la orden.' });
  }
});

// ==================== RUTAS DE ESTADOS ====================

// Obtener todos los estados
app.get('/api/estados', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM tbl_estados ORDER BY pk_id_estado');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo estados:', error);
    res.status(500).json({ message: 'Error al obtener los estados.' });
  }
});

// ==================== DASHBOARD ====================

// Estadísticas del dashboard
app.get('/api/dashboard', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Contar totales
    const [clientes] = await connection.execute('SELECT COUNT(*) as total FROM tbl_clientes');
    const [vehiculos] = await connection.execute('SELECT COUNT(*) as total FROM tbl_vehiculos');
    const [ordenes] = await connection.execute('SELECT COUNT(*) as total FROM tbl_ordenes');
    const [servicios] = await connection.execute('SELECT COUNT(*) as total FROM tbl_servicios');
    
    // Órdenes por estado
    const [ordenesPorEstado] = await connection.execute(`
      SELECT estado_orden, COUNT(*) as total 
      FROM tbl_ordenes 
      GROUP BY estado_orden
    `);
    
    await connection.end();
    
    res.json({
      totales: {
        clientes: clientes[0].total,
        vehiculos: vehiculos[0].total,
        ordenes: ordenes[0].total,
        servicios: servicios[0].total
      },
      ordenesPorEstado: ordenesPorEstado
    });
  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas.' });
  }
});

// Ruta básica
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sistema Taller Mecánico - Backend completo funcionando', 
    timestamp: new Date().toISOString(),
    port: PORT,
    endpoints: [
      'GET /api/health - Health check',
      'GET /api/test-db - Test de base de datos',
      'POST /api/login - Login de usuarios',
      'GET /api/clientes - Obtener clientes',
      'POST /api/clientes - Crear cliente',
      'GET /api/vehiculos - Obtener vehículos',
      'POST /api/vehiculos - Crear vehículo',
      'GET /api/servicios - Obtener servicios',
      'POST /api/servicios - Crear servicio',
      'GET /api/ordenes - Obtener órdenes',
      'POST /api/ordenes - Crear orden',
      'GET /api/estados - Obtener estados',
      'GET /api/dashboard - Estadísticas'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Sistema Taller Mecánico escuchando en puerto ${PORT}`);
  console.log(`🌐 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🌐 Test DB: http://0.0.0.0:${PORT}/api/test-db`);
  console.log(`🌐 API completa disponible`);
});

// Manejar errores
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada:', reason);
  process.exit(1);
});
