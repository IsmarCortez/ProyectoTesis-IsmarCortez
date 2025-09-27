// Servidor mínimo absoluto
console.log('🚀 Iniciando...');

const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end('{"status":"OK"}');
});

server.listen(PORT, () => {
  console.log(`🟢 Puerto: ${PORT}`);
});
