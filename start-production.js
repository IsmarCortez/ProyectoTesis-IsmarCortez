#!/usr/bin/env node

// Script de inicio robusto para Railway
console.log('🚀 Iniciando aplicación en modo producción...');

// Verificar variables de entorno
console.log('🔍 Variables de entorno:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST ? 'Configurado' : 'No configurado');

// Intentar iniciar el servidor mínimo primero
try {
  console.log('📦 Iniciando servidor mínimo...');
  require('./server-minimal.js');
} catch (error) {
  console.error('❌ Error iniciando servidor mínimo:', error);
  
  // Si falla, intentar el servidor completo
  try {
    console.log('📦 Intentando servidor completo...');
    require('./backend/index.js');
  } catch (error2) {
    console.error('❌ Error iniciando servidor completo:', error2);
    process.exit(1);
  }
}
