const PDFDocument = require('pdfkit');
const config = require('../config/notifications');

class PDFGenerator {
  constructor() {
    this.config = config.pdf;
  }

  /**
   * Genera un PDF profesional de la orden de servicio
   * @param {Object} orderData - Datos completos de la orden
   * @returns {Promise<Buffer>} - Buffer del PDF generado
   */
  async generateOrderPDF(orderData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: this.config.margins,
          bufferPages: true
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Configurar fuentes y colores
        this.setupDocument(doc);
        
        // Generar contenido
        this.generateHeader(doc, orderData);
        this.generateClientInfo(doc, orderData);
        this.generateVehicleInfo(doc, orderData);
        this.generateServiceInfo(doc, orderData);
        this.generateFooter(doc, orderData);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Configura el documento PDF con fuentes y colores
   */
  setupDocument(doc) {
    // Configurar colores
    doc.colors = this.config.colors;
    
    // Configurar fuentes
    doc.fontSize(this.config.fontSize);
    doc.lineGap(this.config.lineHeight);
  }

  /**
   * Genera el encabezado del PDF
   */
  generateHeader(doc, orderData) {
    const { empresa } = config.empresa;
    
    // Título principal
    doc.fontSize(24)
       .fillColor(this.config.colors.primary)
       .text('ORDEN DE SERVICIO', { align: 'center' });
    
    doc.fontSize(18)
       .fillColor(this.config.colors.secondary)
       .text(`#${orderData.pk_id_orden}`, { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Información de la empresa
    doc.fontSize(14)
       .fillColor(this.config.colors.accent)
       .text(empresa, { align: 'center' });
    
    doc.fontSize(10)
       .fillColor(this.config.colors.secondary)
       .text(`Fecha: ${this.formatDate(orderData.fecha_ingreso_orden)}`, { align: 'center' });
    
    doc.moveDown(2);
    
    // Línea separadora
    this.drawSeparator(doc);
  }

  /**
   * Genera la sección de información del cliente
   */
  generateClientInfo(doc, orderData) {
    doc.fontSize(16)
       .fillColor(this.config.colors.primary)
       .text('INFORMACIÓN DEL CLIENTE');
    
    doc.moveDown(0.5);
    
    const clientInfo = [
      { label: 'Nombre:', value: `${orderData.nombre_cliente} ${orderData.apellido_cliente}` },
      { label: 'DPI:', value: orderData.dpi_cliente || 'No especificado' },
      { label: 'Teléfono:', value: orderData.telefono_cliente || 'No especificado' },
      { label: 'Correo:', value: orderData.correo_cliente || 'No especificado' }
    ];

    this.generateInfoTable(doc, clientInfo);
    doc.moveDown(1);
  }

  /**
   * Genera la sección de información del vehículo
   */
  generateVehicleInfo(doc, orderData) {
    doc.fontSize(16)
       .fillColor(this.config.colors.primary)
       .text('INFORMACIÓN DEL VEHÍCULO');
    
    doc.moveDown(0.5);
    
    const vehicleInfo = [
      { label: 'Placa:', value: orderData.placa_vehiculo },
      { label: 'Marca:', value: orderData.marca_vehiculo },
      { label: 'Modelo:', value: orderData.modelo_vehiculo },
      { label: 'Año:', value: orderData.anio_vehiculo || 'No especificado' },
      { label: 'Color:', value: orderData.color_vehiculo || 'No especificado' },
      { label: 'Nivel de Combustible:', value: orderData.nivel_combustible_orden },
      { label: 'Odómetro:', value: orderData.odometro_auto_cliente_orden ? `${orderData.odometro_auto_cliente_orden} km` : 'No especificado' }
    ];

    this.generateInfoTable(doc, vehicleInfo);
    doc.moveDown(1);
  }

  /**
   * Genera la sección de información del servicio
   */
  generateServiceInfo(doc, orderData) {
    doc.fontSize(16)
       .fillColor(this.config.colors.primary)
       .text('INFORMACIÓN DEL SERVICIO');
    
    doc.moveDown(0.5);
    
    const serviceInfo = [
      { label: 'Servicio:', value: orderData.servicio },
      { label: 'Estado:', value: orderData.estado_orden },
      { label: 'Fecha de Ingreso:', value: this.formatDate(orderData.fecha_ingreso_orden) }
    ];

    this.generateInfoTable(doc, serviceInfo);
    
    // Comentarios del cliente
    if (orderData.comentario_cliente_orden) {
      doc.moveDown(1);
      doc.fontSize(14)
         .fillColor(this.config.colors.primary)
         .text('COMENTARIOS DEL CLIENTE:');
      
      doc.moveDown(0.5);
      doc.fontSize(10)
         .fillColor(this.config.colors.secondary)
         .text(orderData.comentario_cliente_orden, {
           width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
           align: 'justify'
         });
    }
    
    // Observaciones técnicas
    if (orderData.observaciones_orden) {
      doc.moveDown(1);
      doc.fontSize(14)
         .fillColor(this.config.colors.primary)
         .text('OBSERVACIONES TÉCNICAS:');
      
      doc.moveDown(0.5);
      doc.fontSize(10)
         .fillColor(this.config.colors.secondary)
         .text(orderData.observaciones_orden, {
           width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
           align: 'justify'
         });
    }
    
    doc.moveDown(2);
  }

  /**
   * Genera el pie de página del PDF
   */
  generateFooter(doc, orderData) {
    this.drawSeparator(doc);
    
    const { empresa, telefono, email, direccion } = config.empresa;
    
    doc.fontSize(10)
       .fillColor(this.config.colors.secondary)
       .text(empresa, { align: 'center' });
    
    doc.fontSize(8)
       .text(`Teléfono: ${telefono} | Email: ${email}`, { align: 'center' });
    
    doc.text(`Dirección: ${direccion}`, { align: 'center' });
    
    doc.moveDown(1);
    
    // Información adicional
    doc.fontSize(8)
       .fillColor(this.config.colors.secondary)
       .text('Este documento es generado automáticamente por el sistema de gestión del taller.', { align: 'center' });
    
    doc.text(`Documento generado el: ${this.formatDate(new Date())}`, { align: 'center' });
  }

  /**
   * Genera una tabla de información con etiquetas y valores
   */
  generateInfoTable(doc, infoArray) {
    const startX = doc.x;
    const labelWidth = 80;
    const valueWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - labelWidth - 20;
    
    infoArray.forEach((item, index) => {
      // Verificar si hay espacio suficiente en la página
      if (doc.y > doc.page.height - doc.page.margins.bottom - 50) {
        doc.addPage();
        doc.y = doc.page.margins.top;
      }
      
      // Etiqueta
      doc.fontSize(10)
         .fillColor(this.config.colors.primary)
         .text(item.label, startX, doc.y, { width: labelWidth });
      
      // Valor
      doc.fontSize(10)
         .fillColor(this.config.colors.secondary)
         .text(item.value || 'No especificado', startX + labelWidth + 10, doc.y, { 
           width: valueWidth,
           align: 'left'
         });
      
      doc.moveDown(0.5);
    });
  }

  /**
   * Dibuja una línea separadora
   */
  drawSeparator(doc) {
    const y = doc.y;
    doc.strokeColor(this.config.colors.accent)
       .lineWidth(1)
       .moveTo(doc.page.margins.left, y)
       .lineTo(doc.page.width - doc.page.margins.right, y)
       .stroke();
    
    doc.moveDown(1);
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

module.exports = new PDFGenerator();
