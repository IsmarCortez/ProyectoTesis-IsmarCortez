require('dotenv').config();
const WhatsAppService = require('./services/whatsappService');

async function testWhatsApp() {
  console.log('🧪 ========================================');
  console.log('🧪 PRUEBA ESPECÍFICA DE WHATSAPP');
  console.log('🧪 ========================================');

  try {
    console.log('📱 Inicializando WhatsApp...');
    await WhatsAppService.initialize();
    
    console.log('📊 Estado de WhatsApp:');
    const status = WhatsAppService.getStatus();
    console.log(JSON.stringify(status, null, 2));
    
    if (status.authenticated) {
      console.log('✅ WhatsApp autenticado correctamente');
      
      // Probar envío de mensaje
      const testPhone = '+502-5555-1234'; // Cambia por tu número
      console.log(`📱 Enviando mensaje de prueba a ${testPhone}...`);
      
      const result = await WhatsAppService.sendTestMessage(testPhone);
      console.log('📊 Resultado del envío:');
      console.log(JSON.stringify(result, null, 2));
      
    } else if (status.hasQRCode) {
      console.log('📱 Código QR generado. Escanea con tu WhatsApp móvil.');
      console.log('📱 El código QR debería aparecer arriba en la terminal.');
    } else {
      console.log('❌ WhatsApp no está listo');
    }
    
  } catch (error) {
    console.error('❌ Error en prueba de WhatsApp:', error.message);
  } finally {
    console.log('🔌 Cerrando WhatsApp...');
    await WhatsAppService.destroy();
    console.log('✅ Prueba completada');
  }
}

testWhatsApp();
