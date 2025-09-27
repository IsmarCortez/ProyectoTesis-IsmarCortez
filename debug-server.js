// Servidor de debug para verificar variables de entorno
console.log('🚀 Iniciando servidor de debug...');

const http = require('http');

const PORT = process.env.PORT || 8080;

console.log('🔍 Puerto:', PORT);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

// Mostrar todas las variables de entorno relacionadas con MySQL
console.log('🔍 Variables de entorno MySQL:');
console.log('MYSQLHOST:', process.env.MYSQLHOST);
console.log('MYSQLUSER:', process.env.MYSQLUSER);
console.log('MYSQLPASSWORD:', process.env.MYSQLPASSWORD ? '***CONFIGURADO***' : 'NO CONFIGURADO');
console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE);
console.log('MYSQLPORT:', process.env.MYSQLPORT);

// Mostrar todas las variables que empiecen con MYSQL
const mysqlVars = Object.keys(process.env).filter(key => key.startsWith('MYSQL'));
console.log('🔍 Todas las variables MYSQL:', mysqlVars);

const server = http.createServer((req, res) => {
  console.log('🔍 Petición:', req.method, req.url);
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.url === '/api/debug') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'OK',
      variables: {
        MYSQLHOST: process.env.MYSQLHOST,
        MYSQLUSER: process.env.MYSQLUSER,
        MYSQLPASSWORD: process.env.MYSQLPASSWORD ? '***CONFIGURADO***' : 'NO CONFIGURADO',
        MYSQLDATABASE: process.env.MYSQLDATABASE,
        MYSQLPORT: process.env.MYSQLPORT
      },
      allMysqlVars: mysqlVars,
      message: 'Variables de entorno MySQL'
    }));
  } else if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      port: PORT
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Servidor de debug funcionando',
      endpoints: [
        'GET /api/health - Health check',
        'GET /api/debug - Variables de entorno MySQL'
      ]
    }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Servidor de debug escuchando en puerto ${PORT}`);
  console.log(`🌐 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🌐 Debug: http://0.0.0.0:${PORT}/api/debug`);
});
