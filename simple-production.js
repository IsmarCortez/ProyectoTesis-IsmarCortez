// Servidor de producción simple sin Express
console.log('🚀 Iniciando servidor de producción simple...');

const http = require('http');
const mysql = require('mysql2/promise');

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

const server = http.createServer(async (req, res) => {
  console.log('🔍 Petición:', req.method, req.url);
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    }));
  } else if (req.url === '/api/test') {
    try {
      console.log('🔍 Probando conexión a base de datos...');
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute('SELECT 1 as test');
      await connection.end();
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'OK', 
        database: 'Connected',
        test: rows[0]
      }));
    } catch (error) {
      console.error('❌ Error de base de datos:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'ERROR', 
        error: error.message 
      }));
    }
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Sistema Taller Mecánico - Backend funcionando', 
      timestamp: new Date().toISOString(),
      port: PORT
    }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
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
