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
   * Envía notificación de cambio de estado de una orden
   * @param {string} email - Email del cliente
   * @param {Object} orderData - Datos de la orden
   * @param {string} estadoAnterior - Estado anterior
   * @param {string} estadoNuevo - Estado nuevo
   * @param {Buffer} pdfBuffer - Buffer del PDF actualizado
   * @returns {Promise<Object>} - Resultado del envío
   */
  async sendStateChangeEmail(email, orderData, estadoAnterior, estadoNuevo, pdfBuffer) {
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
      if (!email) {
        return {
          success: false,
          error: 'Client has no email address'
        };
      }

      // Preparar datos para el template
      const templateData = this.prepareTemplateData(orderData);
      
      // Generar contenido del email de cambio de estado
      const emailContent = this.generateStateChangeEmailContent(templateData, estadoAnterior, estadoNuevo);

      // Configurar el email
      const mailOptions = {
        from: this.config.from,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        attachments: [
          {
            filename: `Orden_Servicio_${orderData.pk_id_orden}_Actualizada.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      // Enviar email
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 State change email sent successfully to ${email}`);
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: email,
        estadoAnterior,
        estadoNuevo
      };

    } catch (error) {
      console.error('❌ State change email sending failed:', error.message);
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
    const { nombre: empresa, telefono, email, direccion } = config.empresa;
    
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
      servicioNombre: orderData.servicio || '',
      servicioDescripcion: orderData.servicio || '',
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
   * Genera el contenido del email de cambio de estado
   * @param {Object} templateData - Datos del template
   * @param {string} estadoAnterior - Estado anterior
   * @param {string} estadoNuevo - Estado nuevo
   * @returns {Object} - Contenido del email
   */
  generateStateChangeEmailContent(templateData, estadoAnterior, estadoNuevo) {
    const subject = `Actualización de Orden #${templateData.orderId} - ${estadoNuevo}`;
    
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Actualización de Orden de Servicio</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #007bff;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #007bff;
                margin: 0;
                font-size: 28px;
            }
            .header p {
                color: #666;
                margin: 5px 0 0 0;
                font-size: 16px;
            }
            .status-change {
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
            }
            .status-change h2 {
                margin: 0 0 10px 0;
                font-size: 24px;
            }
            .status-change p {
                margin: 0;
                font-size: 18px;
                font-weight: bold;
            }
            .order-info {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .order-info h3 {
                color: #007bff;
                margin-top: 0;
                border-bottom: 2px solid #007bff;
                padding-bottom: 10px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }
            .info-label {
                font-weight: bold;
                color: #495057;
            }
            .info-value {
                color: #212529;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #e9ecef;
                color: #6c757d;
            }
            .footer p {
                margin: 5px 0;
            }
            .highlight {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${templateData.empresa}</h1>
                <p>Actualización de Orden de Servicio</p>
            </div>

            <div class="status-change">
                <h2>🔄 Estado Actualizado</h2>
                <p>${estadoAnterior} → ${estadoNuevo}</p>
            </div>

            <div class="highlight">
                <strong>Estimado/a ${templateData.clienteNombre} ${templateData.clienteApellido},</strong><br>
                Le informamos que el estado de su orden de servicio ha sido actualizado. Adjunto encontrará el documento actualizado con toda la información.
            </div>

            <div class="order-info">
                <h3>📋 Información de la Orden</h3>
                <div class="info-row">
                    <span class="info-label">Número de Orden:</span>
                    <span class="info-value">#${templateData.orderId}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Estado Anterior:</span>
                    <span class="info-value">${estadoAnterior}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Estado Actual:</span>
                    <span class="info-value"><strong>${estadoNuevo}</strong></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Fecha de Actualización:</span>
                    <span class="info-value">${new Date().toLocaleDateString('es-GT')}</span>
                </div>
            </div>

            <div class="order-info">
                <h3>🚗 Información del Vehículo</h3>
                <div class="info-row">
                    <span class="info-label">Placa:</span>
                    <span class="info-value">${templateData.vehiculoPlaca}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Marca y Modelo:</span>
                    <span class="info-value">${templateData.vehiculoMarca} ${templateData.vehiculoModelo}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Año:</span>
                    <span class="info-value">${templateData.vehiculoAnio}</span>
                </div>
            </div>

            <div class="order-info">
                <h3>🔧 Servicio Solicitado</h3>
                <div class="info-row">
                    <span class="info-label">Tipo de Servicio:</span>
                    <span class="info-value">${templateData.servicioNombre}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Descripción:</span>
                    <span class="info-value">${templateData.servicioDescripcion}</span>
                </div>
            </div>

            <div class="footer">
                <p><strong>${templateData.empresa}</strong></p>
                <p>📞 ${templateData.empresaTelefono}</p>
                <p>📧 ${templateData.empresaEmail}</p>
                <p>📍 ${templateData.empresaDireccion}</p>
                <p style="margin-top: 20px; font-size: 12px; color: #999;">
                    Este es un mensaje automático. Por favor, no responda a este correo.
                </p>
            </div>
        </div>
    </body>
    </html>`;

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
