const PDFGenerator = require('./pdfGenerator');
const EmailService = require('./emailService');
const WhatsAppService = require('./whatsappService');
const mysql = require('mysql2/promise');
const config = require('../config/notifications');

class NotificationService {
  constructor() {
    this.pdfGenerator = PDFGenerator;
    this.emailService = EmailService;
    this.whatsappService = WhatsAppService;
    this.dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };
  }

  /**
   * Inicializa todos los servicios de notificación
   */
  async initialize() {
    console.log('🚀 Initializing notification services...');
    
    try {
      // Inicializar solo el servicio de email
      await this.emailService.initialize();
      
      console.log('✅ Email notification service initialized');
      console.log('📧 WhatsApp service disabled (temporarily)');
    } catch (error) {
      console.error('❌ Error initializing notification services:', error.message);
    }
  }

  /**
   * Procesa las notificaciones para una orden específica
   * @param {number} orderId - ID de la orden
   * @returns {Promise<Object>} - Resultado del procesamiento
   */
  async processOrderNotifications(orderId) {
    const startTime = Date.now();
    const results = {
      orderId,
      timestamp: new Date().toISOString(),
      processingTime: 0,
      pdf: { success: false, error: null },
      email: { success: false, error: null },
      whatsapp: { success: false, error: null },
      summary: {
        totalServices: 0,
        successfulServices: 0,
        failedServices: 0
      }
    };

    try {
      console.log(`📋 Processing notifications for order #${orderId}`);
      
      // Obtener datos completos de la orden
      const orderData = await this.getOrderData(orderId);
      
      if (!orderData) {
        throw new Error(`Order #${orderId} not found`);
      }

      results.summary.totalServices = 2; // PDF, Email (WhatsApp deshabilitado)

      // 1. Generar PDF
      console.log(`📄 Generating PDF for order #${orderId}`);
      const pdfResult = await this.generatePDF(orderData);
      results.pdf = pdfResult;
      
      if (pdfResult.success) {
        results.summary.successfulServices++;
      } else {
        results.summary.failedServices++;
      }

      // 2. Enviar notificación por Email (si hay PDF y email del cliente)
      if (pdfResult.success && orderData.correo_cliente) {
        console.log(`📧 Sending email notification for order #${orderId}`);
        const emailResult = await this.emailService.sendOrderNotification(orderData, pdfResult.buffer);
        results.email = emailResult;
        
        if (emailResult.success) {
          results.summary.successfulServices++;
        } else {
          results.summary.failedServices++;
        }
      } else {
        results.email.error = !pdfResult.success ? 'PDF generation failed' : 'Client has no email';
        results.summary.failedServices++;
      }

      // 3. WhatsApp deshabilitado temporalmente
      console.log(`📱 WhatsApp notifications disabled (temporarily)`);
      results.whatsapp = { success: false, error: 'WhatsApp service disabled' };
      results.summary.failedServices++;

      // Calcular tiempo de procesamiento
      results.processingTime = Date.now() - startTime;
      
      // Log del resultado
      this.logNotificationResults(results);
      
      console.log(`✅ Notifications processed for order #${orderId} in ${results.processingTime}ms`);
      
      return results;

    } catch (error) {
      console.error(`❌ Error processing notifications for order #${orderId}:`, error.message);
      
      results.processingTime = Date.now() - startTime;
      results.pdf.error = error.message;
      results.email.error = error.message;
      results.whatsapp.error = error.message;
      results.summary.failedServices = results.summary.totalServices;
      
      return results;
    }
  }

  /**
   * Obtiene los datos completos de una orden desde la base de datos
   * @param {number} orderId - ID de la orden
   * @returns {Promise<Object|null>} - Datos de la orden
   */
  async getOrderData(orderId) {
    try {
      const connection = await mysql.createConnection(this.dbConfig);
      
      const query = `
        SELECT 
          o.pk_id_orden,
          o.fecha_ingreso_orden,
          o.comentario_cliente_orden,
          o.nivel_combustible_orden,
          o.odometro_auto_cliente_orden,
          o.observaciones_orden,
          c.dpi_cliente,
          c.nombre_cliente,
          c.apellido_cliente,
          c.telefono_cliente,
          c.correo_cliente,
          v.placa_vehiculo,
          v.marca_vehiculo,
          v.modelo_vehiculo,
          v.anio_vehiculo,
          v.color_vehiculo,
          s.servicio,
          e.estado_orden
        FROM tbl_ordenes o
        LEFT JOIN tbl_clientes c ON o.fk_id_cliente = c.PK_id_cliente
        LEFT JOIN tbl_vehiculos v ON o.fk_id_vehiculo = v.pk_id_vehiculo
        LEFT JOIN tbl_servicios s ON o.fk_id_servicio = s.pk_id_servicio
        LEFT JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
        WHERE o.pk_id_orden = ?
      `;
      
      const [rows] = await connection.execute(query, [orderId]);
      await connection.end();
      
      return rows.length > 0 ? rows[0] : null;
      
    } catch (error) {
      console.error('❌ Error getting order data:', error.message);
      throw error;
    }
  }

  /**
   * Genera el PDF de la orden
   * @param {Object} orderData - Datos de la orden
   * @returns {Promise<Object>} - Resultado de la generación
   */
  async generatePDF(orderData) {
    try {
      if (!config.pdf.enabled) {
        return {
          success: false,
          error: 'PDF generation is disabled'
        };
      }

      const buffer = await this.pdfGenerator.generateOrderPDF(orderData);
      
      return {
        success: true,
        buffer: buffer,
        size: buffer.length
      };
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envía notificación de cambio de estado de una orden
   * @param {number} orderId - ID de la orden
   * @param {string} estadoAnterior - Estado anterior
   * @param {string} estadoNuevo - Estado nuevo
   * @returns {Promise<Object>} - Resultado del envío
   */
  async sendStateChangeNotification(orderId, estadoAnterior, estadoNuevo) {
    const startTime = Date.now();
    const results = {
      orderId,
      estadoAnterior,
      estadoNuevo,
      timestamp: new Date().toISOString(),
      processingTime: 0,
      email: { success: false, error: null },
      summary: {
        totalServices: 1,
        successfulServices: 0,
        failedServices: 0
      }
    };

    try {
      console.log(`📧 Sending state change notification for order #${orderId}: ${estadoAnterior} → ${estadoNuevo}`);
      
      // Obtener datos completos de la orden
      const orderData = await this.getOrderData(orderId);
      
      if (!orderData) {
        throw new Error(`Order #${orderId} not found`);
      }

      // Verificar que el cliente tiene email
      if (!orderData.correo_cliente) {
        throw new Error(`Client has no email address`);
      }

      // 1. Generar PDF actualizado
      console.log(`📄 Generating updated PDF for order #${orderId}`);
      const pdfResult = await this.generatePDF(orderData);
      
      if (pdfResult.success) {
        results.pdf = pdfResult;
        console.log(`✅ PDF generated successfully: ${pdfResult.size} bytes`);
      } else {
        console.log(`❌ PDF generation failed: ${pdfResult.error}`);
        results.pdf = pdfResult;
      }

      // 2. Enviar email de cambio de estado
      console.log(`📧 Sending state change email to ${orderData.correo_cliente}`);
      const emailResult = await this.emailService.sendStateChangeEmail(
        orderData.correo_cliente,
        orderData,
        estadoAnterior,
        estadoNuevo,
        pdfResult.buffer
      );
      
      results.email = emailResult;
      
      if (emailResult.success) {
        console.log(`✅ State change email sent successfully to ${orderData.correo_cliente}`);
        results.summary.successfulServices++;
      } else {
        console.log(`❌ State change email failed: ${emailResult.error}`);
        results.summary.failedServices++;
      }

      results.processingTime = Date.now() - startTime;
      
      console.log(`📊 State change notification completed in ${results.processingTime}ms`);
      console.log(`✅ Successful: ${results.summary.successfulServices}/${results.summary.totalServices}`);
      
      return results;

    } catch (error) {
      console.error('❌ State change notification failed:', error.message);
      results.processingTime = Date.now() - startTime;
      results.email.error = error.message;
      results.summary.failedServices = results.summary.totalServices;
      return results;
    }
  }

  /**
   * Envía notificaciones de prueba
   * @param {string} testEmail - Email de prueba
   * @param {string} testPhone - Teléfono de prueba
   * @returns {Promise<Object>} - Resultado de las pruebas
   */
  async sendTestNotifications(testEmail, testPhone) {
    const results = {
      timestamp: new Date().toISOString(),
      email: { success: false, error: null },
      whatsapp: { success: false, error: null }
    };

    try {
      // Probar email
      if (testEmail) {
        console.log('📧 Sending test email...');
        results.email = await this.emailService.sendTestEmail(testEmail);
      }

      // Probar WhatsApp
      if (testPhone) {
        console.log('📱 Sending test WhatsApp message...');
        results.whatsapp = await this.whatsappService.sendTestMessage(testPhone);
      }

      return results;

    } catch (error) {
      console.error('❌ Test notifications failed:', error.message);
      results.email.error = error.message;
      results.whatsapp.error = error.message;
      return results;
    }
  }

  /**
   * Obtiene el estado de todos los servicios
   * @returns {Object} - Estado de los servicios
   */
  getServicesStatus() {
    return {
      timestamp: new Date().toISOString(),
      pdf: {
        enabled: config.pdf.enabled
      },
      email: this.emailService.getStatus(),
      whatsapp: this.whatsappService.getStatus()
    };
  }

  /**
   * Registra los resultados de las notificaciones
   * @param {Object} results - Resultados del procesamiento
   */
  logNotificationResults(results) {
    const { orderId, summary, processingTime } = results;
    
    console.log(`📊 Notification Summary for Order #${orderId}:`);
    console.log(`   ⏱️  Processing time: ${processingTime}ms`);
    console.log(`   📄 PDF: ${results.pdf.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   📧 Email: ${results.email.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   📱 WhatsApp: ${results.whatsapp.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   📈 Success rate: ${summary.successfulServices}/${summary.totalServices} (${Math.round((summary.successfulServices/summary.totalServices)*100)}%)`);
    
    // Log de errores si los hay
    if (results.pdf.error) console.log(`   ❌ PDF Error: ${results.pdf.error}`);
    if (results.email.error) console.log(`   ❌ Email Error: ${results.email.error}`);
    if (results.whatsapp.error) console.log(`   ❌ WhatsApp Error: ${results.whatsapp.error}`);
  }

  /**
   * Cierra todos los servicios
   */
  async destroy() {
    try {
      await this.whatsappService.destroy();
      console.log('🔌 All notification services destroyed');
    } catch (error) {
      console.error('❌ Error destroying notification services:', error.message);
    }
  }
}

module.exports = new NotificationService();
