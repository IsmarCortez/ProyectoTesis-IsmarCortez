#!/usr/bin/env node

// Script de inicio robusto para Railway
console.log('🚀 Iniciando aplicación...');

// Verificar variables de entorno críticas
const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars);
  process.exit(1);
}

console.log('✅ Variables de entorno verificadas');

// Iniciar el servidor
try {
  require('./backend/index.js');
} catch (error) {
  console.error('❌ Error iniciando servidor:', error);
  process.exit(1);
}
