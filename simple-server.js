// Servidor ultra simple para diagnosticar Railway
console.log('🚀 Iniciando servidor ultra simple...');
console.log('🔍 Puerto:', process.env.PORT);

const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  console.log('🔍 Petición recibida:', req.method, req.url);
  
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK' }));
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Servidor funcionando' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Servidor escuchando en puerto ${PORT}`);
});

server.on('error', (error) => {
  console.error('❌ Error del servidor:', error);
  process.exit(1);
});
