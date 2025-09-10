const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('../config/notifications');

class WhatsAppService {
  constructor() {
    this.config = config.whatsapp;
    this.client = null;
    this.isInitialized = false;
    this.isAuthenticated = false;
    this.qrCode = null;
  }

  /**
   * Inicializa el servicio de WhatsApp
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      if (!this.config.enabled) {
        console.log('📱 WhatsApp service is disabled');
        return;
      }

      console.log('📱 Creating WhatsApp client...');
      
      // Crear cliente de WhatsApp
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: this.config.clientId,
          dataPath: this.config.sessionPath
        }),
        puppeteer: {
          args: this.config.puppeteerArgs,
          headless: true,
          timeout: 120000,
          protocolTimeout: 120000
        }
      });

      console.log('📱 Setting up WhatsApp events...');
      // Configurar eventos
      this.setupEvents();

      console.log('📱 Initializing WhatsApp client...');
      // Inicializar cliente
      await this.client.initialize();
      this.isInitialized = true;
      console.log('✅ WhatsApp service initialized successfully');

    } catch (error) {
      console.error('❌ WhatsApp service initialization failed:', error.message);
      console.error('❌ Full error:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Configura los eventos del cliente de WhatsApp
   */
  setupEvents() {
    // Evento cuando se genera el código QR
    this.client.on('qr', (qr) => {
      this.qrCode = qr;
      console.log('📱 WhatsApp QR Code generated:');
      qrcode.generate(qr, { small: true });
      console.log('📱 Please scan the QR code above with your WhatsApp mobile app');
    });

    // Evento cuando se autentica exitosamente
    this.client.on('ready', () => {
      this.isAuthenticated = true;
      this.qrCode = null;
      console.log('✅ WhatsApp client is ready and authenticated');
    });

    // Evento cuando se autentica
    this.client.on('authenticated', () => {
      this.isAuthenticated = true;
      this.qrCode = null;
      console.log('✅ WhatsApp authentication successful');
    });

    // Evento cuando se desautentica
    this.client.on('auth_failure', (msg) => {
      this.isAuthenticated = false;
      console.error('❌ WhatsApp authentication failed:', msg);
    });

    // Evento cuando se desconecta
    this.client.on('disconnected', (reason) => {
      this.isAuthenticated = false;
      console.log('📱 WhatsApp client disconnected:', reason);
    });

    // Evento de error
    this.client.on('error', (error) => {
      console.error('❌ WhatsApp client error:', error);
    });
  }

  /**
   * Envía una notificación por WhatsApp
   * @param {Object} orderData - Datos de la orden
   * @returns {Promise<Object>} - Resultado del envío
   */
  async sendOrderNotification(orderData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isInitialized) {
        return {
          success: false,
          error: 'WhatsApp service not available'
        };
      }

      if (!this.isAuthenticated) {
        return {
          success: false,
          error: 'WhatsApp not authenticated. Please scan QR code first.'
        };
      }

      // Verificar que el cliente tenga teléfono
      if (!orderData.telefono_cliente) {
        return {
          success: false,
          error: 'Client has no phone number'
        };
      }

      // Formatear número de teléfono
      const phoneNumber = this.formatPhoneForWhatsApp(orderData.telefono_cliente);
      
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      // Preparar datos para el template
      const templateData = this.prepareTemplateData(orderData);
      
      // Generar mensaje
      const message = this.generateMessage(templateData);

      // Enviar mensaje
      const result = await this.client.sendMessage(phoneNumber, message);
      
      console.log(`📱 WhatsApp message sent successfully to ${phoneNumber}`);
      
      return {
        success: true,
        messageId: result.id._serialized,
        recipient: phoneNumber
      };

    } catch (error) {
      console.error('❌ WhatsApp sending failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prepara los datos para el template del mensaje
   */
  prepareTemplateData(orderData) {
    const { empresa, telefono, email, direccion } = config.empresa;
    
    return {
      orderId: orderData.pk_id_orden,
      empresa: empresa,
      empresaTelefono: telefono,
      empresaEmail: email,
      empresaDireccion: direccion,
      clienteNombre: orderData.nombre_cliente || '',
      clienteApellido: orderData.apellido_cliente || '',
      clienteDpi: orderData.dpi_cliente || 'No especificado',
      clienteTelefono: this.formatPhone(orderData.telefono_cliente),
      vehiculoPlaca: orderData.placa_vehiculo || '',
      vehiculoMarca: orderData.marca_vehiculo || '',
      vehiculoModelo: orderData.modelo_vehiculo || '',
      vehiculoAnio: orderData.anio_vehiculo || 'No especificado',
      vehiculoColor: orderData.color_vehiculo || 'No especificado',
      servicio: orderData.servicio || '',
      estado: orderData.estado_orden || '',
      fechaIngreso: this.formatDate(orderData.fecha_ingreso_orden),
      comentario: orderData.comentario_cliente_orden || ''
    };
  }

  /**
   * Genera el mensaje usando el template
   */
  generateMessage(templateData) {
    // Usar la plantilla como función
    const message = config.templates.whatsapp.message(templateData);
    return message;
  }

  /**
   * Envía un mensaje de prueba
   * @param {string} testPhone - Número de teléfono de prueba
   * @returns {Promise<Object>} - Resultado del envío
   */
  async sendTestMessage(testPhone) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isInitialized) {
        return {
          success: false,
          error: 'WhatsApp service not available'
        };
      }

      if (!this.isAuthenticated) {
        return {
          success: false,
          error: 'WhatsApp not authenticated. Please scan QR code first.'
        };
      }

      // Formatear número de teléfono
      const phoneNumber = this.formatPhoneForWhatsApp(testPhone);
      
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      const testMessage = `🧪 *PRUEBA DE WHATSAPP*

✅ *Sistema de Notificaciones - Taller Mecánico*

📱 *Información de la Prueba:*
• Servicio: WhatsApp
• Estado: Funcionando correctamente
• Fecha: ${this.formatDate(new Date())}
• Configuración: WhatsApp Web

Este mensaje confirma que el sistema de notificaciones por WhatsApp está configurado y funcionando correctamente.

📞 *Contacto:*
${config.empresa.nombre}
Teléfono: ${config.empresa.telefono}
Email: ${config.empresa.email}

📍 *Dirección:*
${config.empresa.direccion}`;

      // Enviar mensaje
      const result = await this.client.sendMessage(phoneNumber, testMessage);
      
      return {
        success: true,
        messageId: result.id._serialized,
        recipient: phoneNumber
      };

    } catch (error) {
      console.error('❌ Test WhatsApp message failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene el estado del servicio de WhatsApp
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      initialized: this.isInitialized,
      authenticated: this.isAuthenticated,
      hasQRCode: !!this.qrCode,
      qrCode: this.qrCode
    };
  }

  /**
   * Formatea un número de teléfono para WhatsApp
   */
  formatPhoneForWhatsApp(phone) {
    if (!phone) return null;
    
    // Remover espacios y caracteres especiales
    let clean = phone.replace(/\D/g, '');
    
    // Si empieza con 502, removerlo para formato nacional
    if (clean.startsWith('502')) {
      clean = clean.substring(3);
    }
    
    // Verificar que tenga 8 dígitos (formato de Guatemala)
    if (clean.length === 8) {
      return `502${clean}@c.us`;
    }
    
    return null; // Formato inválido
  }

  /**
   * Formatea un número de teléfono para mostrar
   */
  formatPhone(phone) {
    if (!phone) return 'No especificado';
    
    // Remover espacios y caracteres especiales
    const clean = phone.replace(/\D/g, '');
    
    // Si empieza con 502, formatear como internacional
    if (clean.startsWith('502')) {
      return `+502 ${clean.substring(3, 7)}-${clean.substring(7)}`;
    }
    
    // Si tiene 8 dígitos, formatear como nacional
    if (clean.length === 8) {
      return `${clean.substring(0, 4)}-${clean.substring(4)}`;
    }
    
    return phone; // Retornar original si no se puede formatear
  }

  /**
   * Formatea una fecha para mostrar
   */
  formatDate(date) {
    if (!date) return 'No especificada';
    
    const d = new Date(date);
    return d.toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Cierra la conexión de WhatsApp
   */
  async destroy() {
    if (this.client) {
      await this.client.destroy();
      this.isInitialized = false;
      this.isAuthenticated = false;
      console.log('📱 WhatsApp client destroyed');
    }
  }
}

module.exports = new WhatsAppService();
