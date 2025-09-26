// Script para probar el despliegue
const axios = require('axios');

const BASE_URL = process.env.RAILWAY_URL || 'http://localhost:4000';

async function testDeployment() {
  console.log('🧪 Probando despliegue...');
  
  try {
    // Probar health check
    console.log('1. Probando health check...');
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health check:', health.data);
    
    // Probar API de servicios
    console.log('2. Probando API de servicios...');
    const servicios = await axios.get(`${BASE_URL}/api/servicios`);
    console.log('✅ Servicios:', servicios.data.length, 'servicios encontrados');
    
    // Probar frontend
    console.log('3. Probando frontend...');
    const frontend = await axios.get(`${BASE_URL}/`);
    console.log('✅ Frontend:', frontend.status === 200 ? 'OK' : 'ERROR');
    
    console.log('🎉 ¡Despliegue funcionando correctamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

testDeployment();
