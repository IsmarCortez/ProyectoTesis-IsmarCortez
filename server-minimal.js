#!/usr/bin/env node

// Servidor mínimo para probar Railway
const express = require('express');
const app = express();

const PORT = process.env.PORT || 8080;

console.log('🚀 Iniciando servidor mínimo...');
console.log('🔍 Puerto:', PORT);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

// Middleware básico
app.use(express.json());

// Health check simple
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check recibido');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Ruta básica
app.get('/', (req, res) => {
  res.json({ 
    message: 'Servidor funcionando', 
    timestamp: new Date().toISOString() 
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Servidor mínimo escuchando en puerto ${PORT}`);
  console.log(`🌐 Health check: http://0.0.0.0:${PORT}/api/health`);
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
