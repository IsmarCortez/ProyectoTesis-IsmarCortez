require('dotenv').config();
const axios = require('axios');

console.log('🧪 ========================================');
console.log('🧪 WHATSAPP BUSINESS API - ENVÍO DE MENSAJES');
console.log('🧪 ========================================');
console.log('📱 Este script usa la API oficial de WhatsApp Business');
console.log('📱 Necesitas configurar las variables en tu .env:');
console.log('📱 - WHATSAPP_BUSINESS_TOKEN');
console.log('📱 - WHATSAPP_PHONE_NUMBER_ID');
console.log('📱 ========================================');

class WhatsAppBusinessAPI {
    constructor() {
        this.token = process.env.WHATSAPP_BUSINESS_TOKEN;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        this.baseURL = 'https://graph.facebook.com/v18.0';
        
        if (!this.token || !this.phoneNumberId) {
            console.error('❌ Error: Faltan variables de entorno');
            console.error('❌ WHATSAPP_BUSINESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID son requeridos');
            process.exit(1);
        }
    }

    async sendMessage(phoneNumber, message) {
        try {
            console.log(`📱 Enviando mensaje a ${phoneNumber}...`);
            
            const url = `${this.baseURL}/${this.phoneNumberId}/messages`;
            const data = {
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'text',
                text: {
                    body: message
                }
            };

            const response = await axios.post(url, data, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Mensaje enviado correctamente');
            console.log('✅ ID del mensaje:', response.data.messages[0].id);
            return response.data;

        } catch (error) {
            console.error('❌ Error al enviar mensaje:', error.response?.data || error.message);
            throw error;
        }
    }

    async sendTemplateMessage(phoneNumber, templateName, language = 'es') {
        try {
            console.log(`📱 Enviando plantilla ${templateName} a ${phoneNumber}...`);
            
            const url = `${this.baseURL}/${this.phoneNumberId}/messages`;
            const data = {
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: language
                    }
                }
            };

            const response = await axios.post(url, data, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Plantilla enviada correctamente');
            return response.data;

        } catch (error) {
            console.error('❌ Error al enviar plantilla:', error.response?.data || error.message);
            throw error;
        }
    }

    async getWebhookInfo() {
        try {
            const url = `${this.baseURL}/${this.phoneNumberId}`;
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            console.log('📱 Información del número de WhatsApp Business:');
            console.log('📱 Número:', response.data.phone_number);
            console.log('📱 Nombre:', response.data.verified_name);
            console.log('📱 Estado:', response.data.code_verification_status);
            return response.data;

        } catch (error) {
            console.error('❌ Error al obtener información:', error.response?.data || error.message);
            throw error;
        }
    }
}

// Función principal de prueba
async function testWhatsAppBusiness() {
    const whatsapp = new WhatsAppBusinessAPI();
    
    try {
        // Obtener información del número
        console.log('📱 Obteniendo información del número...');
        await whatsapp.getWebhookInfo();
        
        console.log('\n📱 ========================================');
        console.log('📱 PRUEBA DE ENVÍO DE MENSAJE');
        console.log('📱 ========================================');
        
        // Mensaje de prueba (reemplaza con tu número)
        const testNumber = '50212345678'; // Reemplaza con tu número
        const testMessage = '🧪 Prueba del sistema de notificaciones del taller mecánico\n\nEste es un mensaje de prueba enviado desde la API de WhatsApp Business.';
        
        await whatsapp.sendMessage(testNumber, testMessage);
        
        console.log('\n✅ Prueba completada exitosamente');
        console.log('✅ El sistema está listo para enviar notificaciones');
        
    } catch (error) {
        console.error('\n❌ Error en la prueba:', error.message);
        console.log('\n📱 Para configurar WhatsApp Business API:');
        console.log('📱 1. Ve a https://developers.facebook.com/');
        console.log('📱 2. Crea una aplicación de WhatsApp Business');
        console.log('📱 3. Obtén el token de acceso y el ID del número');
        console.log('📱 4. Configúralos en tu archivo .env');
    }
}

// Ejecutar prueba
testWhatsAppBusiness();
