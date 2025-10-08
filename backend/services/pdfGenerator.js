const PDFDocument = require('pdfkit');
const moment = require('moment-timezone');
const config = require('../config/notifications');
const path = require('path');
const fs = require('fs');

class PDFGenerator {
  constructor() {
    this.config = config.pdf;
  }

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

        // Configuración inicial
        this.setupDocument(doc);

        // Contenido
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

  setupDocument(doc) {
    doc.colors = this.config.colors;
    doc.fontSize(this.config.fontSize);
    doc.lineGap(this.config.lineHeight);
  }

  generateHeader(doc, orderData) {
    const { nombre: empresa, telefono, email, direccion } = config.empresa;
    
    try {
      const logoTecnoAutoPath = path.join(__dirname, '..', 'Logos', 'LogoTecnoAuto.jpg');
      if (fs.existsSync(logoTecnoAutoPath)) {
        doc.image(logoTecnoAutoPath, 50, 20, { width: 100, height: 50 });
      } else {
        doc.fontSize(16).fillColor('#1a1a1a').text('TECNOAUTO', 50, 30, { width: 100 });
      }

      const logoElectroFrioPath = path.join(__dirname, '..', 'Logos', 'LogoElectrofrio.jpg');
      if (fs.existsSync(logoElectroFrioPath)) {
        doc.image(logoElectroFrioPath, 400, 20, { width: 100, height: 50 });
      } else {
        doc.fontSize(14).fillColor('#e74c3c').text('Repuestos', 400, 30, { width: 100 });
        doc.fontSize(16).fillColor('#0066cc').text('ELECTROFRIO', 400, 45, { width: 100 });
      }
    } catch (error) {
      console.log('❌ Error cargando logos:', error.message);
      doc.fontSize(16).fillColor('#1a1a1a').text('TECNOAUTO', 50, 30, { width: 100 });
      doc.fontSize(14).fillColor('#e74c3c').text('Repuestos', 400, 30, { width: 100 });
      doc.fontSize(16).fillColor('#0066cc').text('ELECTROFRIO', 400, 45, { width: 100 });
    }

    // contacto alineado al margen izquierdo
    doc.fontSize(9)
       .fillColor('#666666')
       .text(`${direccion} | Tel: ${telefono} | ${email}`, doc.page.margins.left, 80, { width: 500 });

    // título
    doc.fontSize(22)
       .fillColor(this.config.colors.primary)
       .text('ORDEN DE SERVICIO', doc.page.margins.left, 100, { align: 'center' });

    doc.fontSize(16)
       .fillColor(this.config.colors.secondary)
       .text(`#${orderData.pk_id_orden}`, doc.page.margins.left, 125, { align: 'center' });

    doc.strokeColor('#e74c3c')
       .lineWidth(1)
       .moveTo(doc.page.margins.left, 150)
       .lineTo(doc.page.width - doc.page.margins.right, 150)
       .stroke();

    doc.y = 160;
  }

  generateClientInfo(doc, orderData) {
    doc.fontSize(12)
       .fillColor(this.config.colors.primary)
       .text('INFORMACIÓN DEL CLIENTE', doc.page.margins.left, doc.y);

    doc.moveDown(0.2);

    const clientInfo = [
      { label: 'Nombre:', value: `${orderData.nombre_cliente} ${orderData.apellido_cliente}` },
      { label: 'NIT:', value: orderData.NIT || 'No especificado' },
      { label: 'Teléfono:', value: orderData.telefono_cliente || 'No especificado' },
      { label: 'Correo:', value: orderData.correo_cliente || 'No especificado' }
    ];

    this.generateInfoTable(doc, clientInfo);
    doc.moveDown(0.3);
  }

  generateVehicleInfo(doc, orderData) {
    doc.fontSize(12)
       .fillColor(this.config.colors.primary)
       .text('INFORMACIÓN DEL VEHÍCULO', doc.page.margins.left, doc.y);

    doc.moveDown(0.2);

    const vehicleInfo = [
      { label: 'Placa:', value: orderData.placa_vehiculo },
      { label: 'Marca:', value: orderData.marca_vehiculo },
      { label: 'Modelo:', value: orderData.modelo_vehiculo },
      { label: 'Año:', value: orderData.anio_vehiculo || 'No especificado' },
      { label: 'Color:', value: orderData.color_vehiculo || 'No especificado' },
      { label: 'Estado del Vehículo:', value: orderData.estado_vehiculo || 'No especificado' },
      { label: 'Nivel de Combustible:', value: orderData.nivel_combustible_orden },
      { label: 'Odómetro:', value: orderData.odometro_auto_cliente_orden ? `${orderData.odometro_auto_cliente_orden} ${orderData.unidad_odometro || 'km'}` : 'No especificado' }
    ];

    this.generateInfoTable(doc, vehicleInfo);
    doc.moveDown(0.3);
  }

  generateServiceInfo(doc, orderData) {
    doc.fontSize(12)
       .fillColor(this.config.colors.primary)
       .text('INFORMACIÓN DEL SERVICIO', doc.page.margins.left, doc.y);

    doc.moveDown(0.2);

    const serviceInfo = [
      { label: 'Servicio:', value: orderData.servicio },
      { label: 'Estado:', value: orderData.estado_orden },
      { label: 'Fecha de Ingreso:', value: this.formatDate(orderData.fecha_ingreso_orden) }
    ];

    this.generateInfoTable(doc, serviceInfo);

    if (orderData.comentario_cliente_orden) {
      doc.moveDown(0.3);
      doc.fontSize(10)
         .fillColor(this.config.colors.primary)
         .text('COMENTARIOS DEL CLIENTE:', doc.page.margins.left, doc.y);

      doc.moveDown(0.2);
      doc.fontSize(8)
         .fillColor(this.config.colors.secondary)
         .text(orderData.comentario_cliente_orden, {
           width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
           align: 'justify'
         });
    }

    if (orderData.observaciones_orden) {
      doc.moveDown(0.3);
      doc.fontSize(10)
         .fillColor(this.config.colors.primary)
         .text('OBSERVACIONES TÉCNICAS:', doc.page.margins.left, doc.y);

      doc.moveDown(0.2);
      doc.fontSize(8)
         .fillColor(this.config.colors.secondary)
         .text(orderData.observaciones_orden, {
           width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
           align: 'justify'
         });
    }

    doc.moveDown(0.5);
  }

  generateFooter(doc, orderData) {
    // Verificar si hay espacio suficiente para el footer completo
    const availableHeight = doc.page.height - doc.y - doc.page.margins.bottom;
    const footerHeight = 200; // Altura estimada del footer
    
    if (availableHeight < footerHeight) {
      // Si no hay espacio, mover a nueva página
      doc.addPage();
      doc.y = doc.page.margins.top;
    }

    this.drawSeparator(doc);

    // Notas importantes
    doc.fontSize(9).fillColor(this.config.colors.accent).text('⚠️ NOTAS IMPORTANTES', { align: 'center' });
    doc.moveDown(0.3);

    const notas = [
      '• Nuestros servicios (no así los repuestos, ya que la garantía la proporciona el fabricante de los mismos) cuentan con una garantía de 30 días o 1,000 Kms. lo que ocurra primero.',
      '• Autorizo al taller a realizar una prueba de carretera, no mayor a 5km, si se requiere una prueba en una distancia mayor sera previa autorización del cliente, tomando responsabilidad compartida por cualquier siniestro que pueda llegar a suceder.',
      '• Todo trabajo adicional sera notificado y debe ser autorizado por el cliente.'
    ];

    doc.fontSize(7).fillColor(this.config.colors.secondary);
    notas.forEach(nota => {
      doc.text(nota, doc.page.margins.left, doc.y, { 
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: 'justify'
      });
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);

    // Información de contacto del taller
    const { nombre: empresa, telefono, email, direccion } = config.empresa;

    doc.fontSize(10).fillColor(this.config.colors.primary).text('TECNOAUTO', { align: 'center' });
    doc.fontSize(9).fillColor(this.config.colors.secondary).text('Centro de Servicio Automotriz', { align: 'center' });
    doc.fontSize(7).text(`Teléfono: ${telefono} | Email: ${email}`, { align: 'center' });
    doc.fontSize(7).text(`Dirección: ${direccion}`, { align: 'center' });

    doc.moveDown(0.3);

    doc.fontSize(6)
       .fillColor(this.config.colors.secondary)
       .text('Este documento es generado automáticamente por el sistema de gestión.', { align: 'center' });
    doc.text(`Documento generado el: ${this.formatDate(new Date())}`, { align: 'center' });
  }

  // ✅ Corregido: etiqueta y valor en una sola línea
  generateInfoTable(doc, infoArray) {
    const startX = doc.page.margins.left; 
    const lineWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    infoArray.forEach((item) => {
      if (doc.y > doc.page.height - doc.page.margins.bottom - 50) {
        doc.addPage();
        doc.y = doc.page.margins.top;
      }

      const line = `${item.label} ${item.value || 'No especificado'}`;

      doc.fontSize(8)
         .fillColor(this.config.colors.primary)
         .text(line, startX, doc.y, { width: lineWidth, align: 'left' });

      doc.moveDown(0.3);
    });
  }

  drawSeparator(doc) {
    const y = doc.y;
    doc.strokeColor(this.config.colors.accent)
       .lineWidth(1)
       .moveTo(doc.page.margins.left, y)
       .lineTo(doc.page.width - doc.page.margins.right, y)
       .stroke();
    doc.moveDown(1);
  }

  formatDate(date) {
    if (!date) return 'No especificada';
    // Usar moment-timezone para convertir a zona horaria de Guatemala
    return moment(date).tz('America/Guatemala').format('DD [de] MMMM [de] YYYY, HH:mm');
  }

  formatPhone(phone) {
    if (!phone) return 'No especificado';
    const clean = phone.replace(/\D/g, '');
    if (clean.startsWith('502')) {
      return `+502 ${clean.substring(3, 7)}-${clean.substring(7)}`;
    }
    if (clean.length === 8) {
      return `${clean.substring(0, 4)}-${clean.substring(4)}`;
    }
    return phone;
  }
}

module.exports = new PDFGenerator();
