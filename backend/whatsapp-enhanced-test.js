require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🧪 ========================================');
console.log('🧪 WHATSAPP ENHANCED TEST - VERSIÓN MEJORADA');
console.log('🧪 ========================================');
console.log('📱 Configuración optimizada para Windows');
console.log('📱 Presiona Ctrl+C para cerrar');

// Configuración mejorada para Windows
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'taller-mecanico-client',
        dataPath: './whatsapp-session'
    }),
    puppeteer: {
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--window-size=800,600'
        ],
        timeout: 120000,
        protocolTimeout: 120000,
        browserWSEndpoint: null
    },
    webVersion: '2.2402.5',
    webVersionCache: {
        type: 'local'
    }
});

// Eventos mejorados
client.on('qr', (qr) => {
    console.log('📱 ========================================');
    console.log('📱 CÓDIGO QR GENERADO - ESCANEA CON TU MÓVIL');
    console.log('📱 ========================================');
    console.log('📱 Si no ves el QR en la terminal, míralo en la ventana del navegador');
    qrcode.generate(qr, { small: true });
    console.log('📱 ========================================');
});

client.on('ready', () => {
    console.log('✅ ========================================');
    console.log('✅ WHATSAPP CONECTADO Y LISTO');
    console.log('✅ ========================================');
    console.log('✅ Cliente autenticado correctamente');
    console.log('✅ Puedes cerrar esta ventana con Ctrl+C');
    console.log('✅ La sesión se guardará automáticamente');
});

client.on('authenticated', () => {
    console.log('🔐 Cliente autenticado');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación:', msg);
});

client.on('disconnected', (reason) => {
    console.log('🔌 Cliente desconectado:', reason);
});

client.on('loading_screen', (percent, message) => {
    console.log(`📱 Cargando: ${percent}% - ${message}`);
});

// Manejo de errores mejorado
process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando cliente de WhatsApp...');
    try {
        await client.destroy();
        console.log('✅ Cliente cerrado correctamente');
    } catch (error) {
        console.error('❌ Error al cerrar cliente:', error.message);
    }
    process.exit(0);
});

// Inicializar cliente
console.log('📱 Iniciando cliente de WhatsApp...');
client.initialize().catch(error => {
    console.error('❌ Error al inicializar cliente:', error.message);
    console.error('❌ Detalles completos:', error);
    process.exit(1);
});
