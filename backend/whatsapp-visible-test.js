require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🧪 ========================================');
console.log('🧪 PRUEBA WHATSAPP CON NAVEGADOR VISIBLE');
console.log('🧪 ========================================');
console.log('📱 Se abrirá una ventana del navegador');
console.log('📱 Escanea el código QR en la ventana del navegador');
console.log('📱 Después de escanear, presiona Ctrl+C para cerrar');

async function testWhatsApp() {
  try {
    console.log('📱 Configurando cliente de WhatsApp...');
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'taller-mecanico-visible',
        dataPath: './whatsapp-session'
      }),
      puppeteer: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--disable-extensions',
          '--disable-plugins'
        ],
        headless: false, // Navegador visible
        timeout: 120000
      }
    });

    console.log('📱 Configurando eventos...');
    
    // Evento QR
    client.on('qr', (qr) => {
      console.log('📱 ¡CÓDIGO QR GENERADO!');
      console.log('📱 También puedes escanear este código en la terminal:');
      qrcode.generate(qr, { small: true });
    });

    // Evento ready
    client.on('ready', () => {
      console.log('✅ WhatsApp está listo y autenticado!');
      console.log('✅ Puedes cerrar la ventana del navegador');
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
    console.log('📱 Busca la ventana del navegador que se abrió');
    
    // Mantener el proceso vivo
    process.on('SIGINT', async () => {
      console.log('\n🔌 Cerrando cliente...');
      await client.destroy();
      console.log('✅ Prueba completada');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error('❌ Error completo:', error);
    process.exit(1);
  }
}

testWhatsApp();
