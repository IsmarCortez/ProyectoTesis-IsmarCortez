// Servidor completo del Sistema Taller Mecánico con variables corregidas
console.log('🚀 Iniciando Sistema Taller Mecánico...');

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

console.log('🔍 Puerto:', PORT);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

// Configuración de base de datos CORREGIDA
const dbConfig = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQL_ROOT_PASSWORD, // ← CORREGIDO: usar MYSQL_ROOT_PASSWORD
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
    console.log('🔍 Configuración:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port,
      password: dbConfig.password ? '***CONFIGURADO***' : 'NO CONFIGURADO'
    });
    
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
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas.' });
  }
});

// Ruta básica
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sistema Taller Mecánico - Backend funcionando', 
    timestamp: new Date().toISOString(),
    port: PORT,
    status: 'Variables de entorno corregidas',
    endpoints: [
      'GET /api/health - Health check',
      'GET /api/test-db - Test de base de datos',
      'POST /api/login - Login de usuarios',
      'GET /api/clientes - Obtener clientes',
      'POST /api/clientes - Crear cliente',
      'GET /api/servicios - Obtener servicios',
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
