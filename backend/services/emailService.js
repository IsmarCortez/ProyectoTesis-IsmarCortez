const nodemailer = require('nodemailer');
const config = require('../config/notifications');

class EmailService {
  constructor() {
    this.config = config.email;
    this.transporter = null;
    this.isInitialized = false;
  }

  /**
   * Inicializa el servicio de email
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      if (!this.config.enabled) {
        console.log('📧 Email service is disabled');
        return;
      }

      if (!this.config.user || !this.config.pass) {
        throw new Error('Email credentials not configured');
      }

      // Configurar el transportador
      this.transporter = nodemailer.createTransport({
        service: this.config.service,
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verificar conexión
      await this.transporter.verify();
      this.isInitialized = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      this.isInitialized = false;
    }
  }

  /**
   * Envía una notificación por email
   * @param {Object} orderData - Datos de la orden
   * @param {Buffer} pdfBuffer - Buffer del PDF adjunto
   * @returns {Promise<Object>} - Resultado del envío
   */
  async sendOrderNotification(orderData, pdfBuffer) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isInitialized) {
        return {
          success: false,
          error: 'Email service not available'
        };
      }

      // Verificar que el cliente tenga email
      if (!orderData.correo_cliente) {
        return {
          success: false,
          error: 'Client has no email address'
        };
      }

      // Preparar datos para el template
      const templateData = this.prepareTemplateData(orderData);
      
      // Generar contenido del email
      const emailContent = this.generateEmailContent(templateData);

      // Configurar el email
      const mailOptions = {
        from: this.config.from,
        to: orderData.correo_cliente,
        subject: emailContent.subject,
        html: emailContent.html,
        attachments: [
          {
            filename: `Orden_Servicio_${orderData.pk_id_orden}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      // Enviar email
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 Email sent successfully to ${orderData.correo_cliente}`);
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: orderData.correo_cliente
      };

    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prepara los datos para el template del email
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
   * Genera el contenido del email usando el template
   */
  generateEmailContent(templateData) {
    // Usar las plantillas como funciones
    const subject = config.templates.email.subject(templateData);
    const html = config.templates.email.html(templateData);

    return { subject, html };
  }

  /**
   * Envía un email de prueba
   * @param {string} testEmail - Email de prueba
   * @returns {Promise<Object>} - Resultado del envío
   */
  async sendTestEmail(testEmail) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isInitialized) {
        return {
          success: false,
          error: 'Email service not available'
        };
      }

      const mailOptions = {
        from: this.config.from,
        to: testEmail,
        subject: 'Prueba de Sistema de Notificaciones - Taller Mecánico',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2c3e50; color: white; padding: 20px; text-align: center;">
              <h1>✅ Prueba de Email Exitosa</h1>
              <p>Sistema de Notificaciones - Taller Mecánico</p>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <h3>Información de la Prueba:</h3>
              <ul>
                <li><strong>Servicio:</strong> Email</li>
                <li><strong>Estado:</strong> Funcionando correctamente</li>
                <li><strong>Fecha:</strong> ${this.formatDate(new Date())}</li>
                <li><strong>Configuración:</strong> ${this.config.service}</li>
              </ul>
              <p>Este email confirma que el sistema de notificaciones por email está configurado y funcionando correctamente.</p>
            </div>
            <div style="background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px;">
              <p>${config.empresa.nombre}</p>
              <p>Teléfono: ${config.empresa.telefono} | Email: ${config.empresa.email}</p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: testEmail
      };

    } catch (error) {
      console.error('❌ Test email failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene el estado del servicio de email
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      initialized: this.isInitialized,
      service: this.config.service,
      user: this.config.user ? `${this.config.user.substring(0, 3)}***@${this.config.user.split('@')[1]}` : null
    };
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
   * Formatea un número de teléfono de Guatemala
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
}

module.exports = new EmailService();
