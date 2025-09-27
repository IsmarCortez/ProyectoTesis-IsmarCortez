#!/usr/bin/env node

// Servidor mínimo para probar Railway
const express = require('express');
const app = express();

const PORT = process.env.PORT || 8080;

console.log('🚀 Iniciando servidor mínimo...');
console.log('🔍 Puerto:', PORT);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 Todas las variables de entorno:', Object.keys(process.env).length);

// Middleware básico
app.use(express.json());

// Health check simple
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check recibido desde:', req.get('host'));
  console.log('🔍 User-Agent:', req.get('user-agent'));
  
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta básica
app.get('/', (req, res) => {
  res.json({ 
    message: 'Servidor funcionando', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Servidor mínimo escuchando en puerto ${PORT}`);
  console.log(`🌐 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🌐 Servidor disponible en: http://0.0.0.0:${PORT}`);
});

// Manejar errores del servidor
server.on('error', (error) => {
  console.error('❌ Error del servidor:', error);
  process.exit(1);
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
