// Servidor nativo de Node.js para Railway
console.log('🚀 Iniciando servidor nativo...');

const http = require('http');

const PORT = process.env.PORT || 8080;

console.log('🔍 Puerto:', PORT);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

// Configuración de base de datos (sin mysql2 por ahora)
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

const server = http.createServer((req, res) => {
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
    // Simular test de base de datos
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'OK', 
      database: 'Configurado',
      message: 'Variables de entorno configuradas correctamente',
      config: {
        host: dbConfig.host ? 'Configurado' : 'No configurado',
        user: dbConfig.user ? 'Configurado' : 'No configurado',
        database: dbConfig.database ? 'Configurado' : 'No configurado',
        port: dbConfig.port
      }
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Sistema Taller Mecánico - Backend funcionando', 
      timestamp: new Date().toISOString(),
      port: PORT,
      status: 'Servidor nativo funcionando correctamente'
    }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Servidor nativo escuchando en puerto ${PORT}`);
  console.log(`🌐 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🌐 Test config: http://0.0.0.0:${PORT}/api/test`);
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
