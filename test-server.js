// Servidor de prueba ultra simple para Railway
const express = require('express');
const app = express();

const PORT = process.env.PORT || 8080;

console.log('🚀 Iniciando servidor de prueba...');
console.log('🔍 Puerto:', PORT);

// Health check mínimo
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Ruta básica
app.get('/', (req, res) => {
  res.json({ message: 'Servidor funcionando' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Servidor escuchando en puerto ${PORT}`);
});
