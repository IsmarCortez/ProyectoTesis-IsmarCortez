// Servidor mínimo que acepta health checks de Railway
console.log('🚀 Iniciando servidor para Railway...');

const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  console.log('🔍 Petición recibida:', req.method, req.url);
  console.log('🔍 Host:', req.headers.host);
  console.log('🔍 User-Agent:', req.headers['user-agent']);
  
  // Permitir CORS para Railway
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Servidor funcionando', port: PORT }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Servidor escuchando en puerto ${PORT}`);
  console.log(`🌐 Health check: http://0.0.0.0:${PORT}/api/health`);
});

server.on('error', (error) => {
  console.error('❌ Error del servidor:', error);
  process.exit(1);
});
