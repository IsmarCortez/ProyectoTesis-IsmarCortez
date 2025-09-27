// Servidor hello world para Railway
console.log('🚀 Iniciando servidor hello world...');

const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  console.log('🔍 Petición:', req.url);
  
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"status":"OK"}');
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World from Railway!');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Servidor escuchando en puerto ${PORT}`);
});
