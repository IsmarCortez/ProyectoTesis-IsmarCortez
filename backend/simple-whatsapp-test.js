require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🧪 ========================================');
console.log('🧪 PRUEBA SIMPLE DE WHATSAPP');
console.log('🧪 ========================================');

async function testWhatsApp() {
  try {
    console.log('📱 Configurando cliente de WhatsApp...');
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'taller-mecanico-test',
        dataPath: './whatsapp-session'
      }),
      puppeteer: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run'
        ],
        headless: true,
        timeout: 120000
      }
    });

    console.log('📱 Configurando eventos...');
    
    // Evento QR
    client.on('qr', (qr) => {
      console.log('📱 ¡CÓDIGO QR GENERADO!');
      console.log('📱 Escanea este código con tu WhatsApp móvil:');
      qrcode.generate(qr, { small: true });
    });

    // Evento ready
    client.on('ready', () => {
      console.log('✅ WhatsApp está listo y autenticado!');
    });

    // Evento authenticated
    client.on('authenticated', () => {
      console.log('✅ WhatsApp autenticado exitosamente');
    });

    // Evento auth_failure
    client.on('auth_failure', (msg) => {
      console.error('❌ Fallo de autenticación:', msg);
    });

    // Evento disconnected
    client.on('disconnected', (reason) => {
      console.log('📱 WhatsApp desconectado:', reason);
    });

    // Evento error
    client.on('error', (error) => {
      console.error('❌ Error de WhatsApp:', error);
    });

    console.log('📱 Inicializando cliente...');
    await client.initialize();
    
    console.log('✅ Cliente inicializado correctamente');
    
    // Mantener el proceso vivo por 30 segundos
    setTimeout(async () => {
      console.log('🔌 Cerrando cliente...');
      await client.destroy();
      console.log('✅ Prueba completada');
      process.exit(0);
    }, 30000);

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error('❌ Error completo:', error);
    process.exit(1);
  }
}

testWhatsApp();
