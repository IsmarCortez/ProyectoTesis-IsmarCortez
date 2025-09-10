require('dotenv').config();
const { Client, RemoteAuth } = require('whatsapp-web.js');

console.log('🧪 ========================================');
console.log('🧪 WHATSAPP WEB SESSION - CONEXIÓN EXISTENTE');
console.log('🧪 ========================================');
console.log('📱 INSTRUCCIONES:');
console.log('📱 1. Abre WhatsApp Web en tu navegador');
console.log('📱 2. Ve a https://web.whatsapp.com');
console.log('📱 3. Asegúrate de estar conectado');
console.log('📱 4. Presiona F12 para abrir las herramientas de desarrollador');
console.log('📱 5. Ve a la pestaña "Console"');
console.log('📱 6. Copia y pega el siguiente código:');
console.log('📱 ========================================');
console.log('📱 localStorage.getItem("WAToken1")');
console.log('📱 ========================================');
console.log('📱 7. Copia el resultado (será algo como "..."..."...")');
console.log('📱 8. Pega ese valor cuando te lo pida este script');
console.log('📱 ========================================');

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('📱 Pega el token de WhatsApp Web aquí: ', (token) => {
    if (!token || token.trim() === '') {
        console.log('❌ Token no válido. Saliendo...');
        rl.close();
        return;
    }

    console.log('📱 Conectando con WhatsApp Web...');
    
    // Configurar cliente con RemoteAuth
    const client = new Client({
        authStrategy: new RemoteAuth({
            clientId: 'taller-mecanico-client',
            dataPath: './whatsapp-session',
            backupSyncIntervalMs: 300000, // 5 minutos
            dataPath: './whatsapp-session'
        }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    // Eventos
    client.on('qr', (qr) => {
        console.log('📱 QR generado (no debería aparecer si ya estás conectado)');
    });

    client.on('ready', () => {
        console.log('✅ ========================================');
        console.log('✅ WHATSAPP CONECTADO Y LISTO');
        console.log('✅ ========================================');
        console.log('✅ Cliente autenticado correctamente');
        console.log('✅ Sesión vinculada con WhatsApp Web');
        console.log('✅ Puedes cerrar esta ventana con Ctrl+C');
        console.log('✅ ========================================');
        
        // Probar envío de mensaje
        testMessage();
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

    // Función para probar envío de mensaje
    async function testMessage() {
        try {
            console.log('📱 Probando envío de mensaje...');
            
            // Obtener información del cliente
            const info = client.info;
            console.log('📱 Número conectado:', info.wid.user);
            console.log('📱 Nombre:', info.pushname);
            
            // Enviar mensaje de prueba (reemplaza con tu número)
            const testNumber = '50212345678'; // Reemplaza con tu número
            const message = '🧪 Prueba del sistema de notificaciones del taller mecánico';
            
            console.log(`📱 Enviando mensaje de prueba a ${testNumber}...`);
            
            const chatId = `${testNumber}@c.us`;
            const result = await client.sendMessage(chatId, message);
            
            console.log('✅ Mensaje enviado correctamente');
            console.log('✅ ID del mensaje:', result.id._serialized);
            
        } catch (error) {
            console.error('❌ Error al enviar mensaje:', error.message);
        }
    }

    // Manejo de errores
    process.on('SIGINT', async () => {
        console.log('\n🛑 Cerrando cliente de WhatsApp...');
        try {
            await client.destroy();
            console.log('✅ Cliente cerrado correctamente');
        } catch (error) {
            console.error('❌ Error al cerrar cliente:', error.message);
        }
        rl.close();
        process.exit(0);
    });

    // Inicializar cliente
    client.initialize().catch(error => {
        console.error('❌ Error al inicializar cliente:', error.message);
        rl.close();
        process.exit(1);
    });

    rl.close();
});
