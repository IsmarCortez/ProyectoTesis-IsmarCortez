// Servidor de producción para Railway
console.log('🚀 Iniciando servidor de producción...');

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

console.log('🔍 Puerto:', PORT);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

// Configurar CORS para Railway
app.use(cors({
  origin: true, // Permitir todos los orígenes para Railway
  credentials: true
}));

app.use(express.json());

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

// Endpoint básico para probar
app.get('/api/test', async (req, res) => {
  try {
    console.log('🔍 Probando conexión a base de datos...');
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT 1 as test');
    await connection.end();
    
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      test: rows[0]
    });
  } catch (error) {
    console.error('❌ Error de base de datos:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message 
    });
  }
});

// Ruta básica
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sistema Taller Mecánico - Backend funcionando', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Servidor de producción escuchando en puerto ${PORT}`);
  console.log(`🌐 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🌐 Test DB: http://0.0.0.0:${PORT}/api/test`);
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
