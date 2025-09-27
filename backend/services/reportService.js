const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment = require('moment-timezone');
const mysql = require('mysql2/promise');
require('dotenv').config();

class ReportService {
  constructor() {
    this.dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };
  }

  // Obtener datos para reportes
  async getReportData(tipoReporte, filtros = {}) {
    const connection = await mysql.createConnection(this.dbConfig);
    
    try {
      let query = '';
      let params = [];

      switch (tipoReporte) {
        case 'ordenes':
          query = `
            SELECT 
              o.pk_id_orden,
              o.fecha_ingreso_orden,
              CONCAT(c.nombre_cliente, ' ', c.apellido_cliente) as cliente,
              c.dpi_cliente,
              c.telefono_cliente,
              CONCAT(v.marca_vehiculo, ' ', v.modelo_vehiculo) as vehiculo,
              v.placa_vehiculo,
              s.servicio,
              e.estado_orden,
              o.comentario_cliente_orden,
              o.nivel_combustible_orden,
              o.odometro_auto_cliente_orden,
              o.observaciones_orden
            FROM tbl_ordenes o
            LEFT JOIN tbl_clientes c ON o.fk_id_cliente = c.PK_id_cliente
            LEFT JOIN tbl_vehiculos v ON o.fk_id_vehiculo = v.pk_id_vehiculo
            LEFT JOIN tbl_servicios s ON o.fk_id_servicio = s.pk_id_servicio
            LEFT JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
            WHERE 1=1
          `;
          
          if (filtros.fechaInicio) {
            query += ' AND o.fecha_ingreso_orden >= ?';
            params.push(filtros.fechaInicio);
          }
          if (filtros.fechaFin) {
            query += ' AND o.fecha_ingreso_orden <= ?';
            params.push(filtros.fechaFin);
          }
          if (filtros.estado) {
            query += ' AND e.estado_orden = ?';
            params.push(filtros.estado);
          }
          if (filtros.servicio) {
            query += ' AND s.servicio = ?';
            params.push(filtros.servicio);
          }
          
          query += ' ORDER BY o.fecha_ingreso_orden DESC';
          break;

        case 'clientes':
          query = `
            SELECT 
              c.PK_id_cliente,
              c.nombre_cliente,
              c.apellido_cliente,
              c.dpi_cliente,
              c.NIT,
              c.telefono_cliente,
              c.correo_cliente,
              c.direccion_cliente,
              c.fecha_registro_cliente,
              COUNT(o.pk_id_orden) as total_ordenes
            FROM tbl_clientes c
            LEFT JOIN tbl_ordenes o ON c.PK_id_cliente = o.fk_id_cliente
            GROUP BY c.PK_id_cliente
            ORDER BY c.fecha_registro_cliente DESC
          `;
          break;

        case 'vehiculos':
          query = `
            SELECT 
              v.pk_id_vehiculo,
              v.placa_vehiculo,
              v.marca_vehiculo,
              v.modelo_vehiculo,
              v.anio_vehiculo,
              v.color_vehiculo,
              COUNT(o.pk_id_orden) as total_ordenes,
              MAX(o.fecha_ingreso_orden) as ultima_orden
            FROM tbl_vehiculos v
            LEFT JOIN tbl_ordenes o ON v.pk_id_vehiculo = o.fk_id_vehiculo
            GROUP BY v.pk_id_vehiculo
            ORDER BY v.marca_vehiculo, v.modelo_vehiculo
          `;
          break;

        case 'servicios':
          query = `
            SELECT 
              s.pk_id_servicio,
              s.servicio,
              s.descripcion_servicios,
              COUNT(o.pk_id_orden) as cantidad_ordenes,
              ROUND((COUNT(o.pk_id_orden) * 100.0 / (SELECT COUNT(*) FROM tbl_ordenes)), 2) as porcentaje
            FROM tbl_servicios s
            LEFT JOIN tbl_ordenes o ON s.pk_id_servicio = o.fk_id_servicio
            GROUP BY s.pk_id_servicio
            ORDER BY cantidad_ordenes DESC
          `;
          break;

        case 'estadisticas':
          query = `
            SELECT 
              'Total Clientes' as metrica,
              COUNT(*) as valor
            FROM tbl_clientes
            UNION ALL
            SELECT 
              'Total Vehículos' as metrica,
              COUNT(*) as valor
            FROM tbl_vehiculos
            UNION ALL
            SELECT 
              'Total Órdenes' as metrica,
              COUNT(*) as valor
            FROM tbl_ordenes
            UNION ALL
            SELECT 
              'Órdenes Completadas' as metrica,
              COUNT(*) as valor
            FROM tbl_ordenes o
            INNER JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
            WHERE e.estado_orden = 'Finalizado'
            UNION ALL
            SELECT 
              'Órdenes Pendientes' as metrica,
              COUNT(*) as valor
            FROM tbl_ordenes o
            INNER JOIN tbl_orden_estado e ON o.fk_id_estado_orden = e.pk_id_estado
            WHERE e.estado_orden = 'Recibido'
          `;
          break;

        default:
          throw new Error('Tipo de reporte no válido');
      }

      const [rows] = await connection.execute(query, params);
      return rows;

    } finally {
      await connection.end();
    }
  }

  // Generar reporte en PDF
  async generatePDFReport(tipoReporte, filtros = {}) {
    const data = await this.getReportData(tipoReporte, filtros);
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Encabezado
        doc.fontSize(20)
           .text('TECNO AUTO - TALLER MECÁNICO', { align: 'center' });
        
        doc.fontSize(14)
           .text('REPORTE DE ' + tipoReporte.toUpperCase(), { align: 'center' })
           .moveDown();

        // Fecha de generación
        doc.fontSize(10)
           .text(`Generado el: ${this.formatDate(new Date())}`, { align: 'right' })
           .moveDown();

        // Filtros aplicados
        if (Object.keys(filtros).length > 0) {
          doc.fontSize(12)
             .text('Filtros aplicados:', { underline: true })
             .moveDown(0.5);
          
          Object.entries(filtros).forEach(([key, value]) => {
            if (value) {
              doc.fontSize(10)
                 .text(`${key}: ${value}`);
            }
          });
          doc.moveDown();
        }

        // Contenido del reporte
        this.addPDFContent(doc, tipoReporte, data);

        // Pie de página
        doc.fontSize(8)
           .text('Taller Mecánico Tecno Auto - Repuestos Electrofrio', 
                 { align: 'center' });

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  // Agregar contenido específico al PDF
  addPDFContent(doc, tipoReporte, data) {
    switch (tipoReporte) {
      case 'ordenes':
        this.addOrdenesPDFContent(doc, data);
        break;
      case 'clientes':
        this.addClientesPDFContent(doc, data);
        break;
      case 'vehiculos':
        this.addVehiculosPDFContent(doc, data);
        break;
      case 'servicios':
        this.addServiciosPDFContent(doc, data);
        break;
      case 'estadisticas':
        this.addEstadisticasPDFContent(doc, data);
        break;
    }
  }

  addOrdenesPDFContent(doc, data) {
    doc.fontSize(12).text('ÓRDENES DE SERVICIO', { underline: true }).moveDown();
    
    data.forEach((orden, index) => {
      doc.fontSize(10)
         .text(`Orden #${orden.pk_id_orden}`, { underline: true })
         .text(`Fecha: ${this.formatDate(new Date(orden.fecha_ingreso_orden))}`)
         .text(`Cliente: ${orden.cliente} (DPI: ${orden.dpi_cliente})`)
         .text(`Teléfono: ${orden.telefono_cliente || 'No registrado'}`)
         .text(`Vehículo: ${orden.vehiculo} - Placa: ${orden.placa_vehiculo}`)
         .text(`Servicio: ${orden.servicio}`)
         .text(`Estado: ${orden.estado_orden}`)
         .text(`Combustible: ${orden.nivel_combustible_orden}`)
         .text(`Odómetro: ${orden.odometro_auto_cliente_orden} km`);
      
      if (orden.comentario_cliente_orden) {
        doc.text(`Comentario: ${orden.comentario_cliente_orden}`);
      }
      if (orden.observaciones_orden) {
        doc.text(`Observaciones: ${orden.observaciones_orden}`);
      }
      
      doc.moveDown();
      
      if (index < data.length - 1) {
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
      }
    });
  }

  addClientesPDFContent(doc, data) {
    doc.fontSize(12).text('CLIENTES REGISTRADOS', { underline: true }).moveDown();
    
    data.forEach((cliente, index) => {
      doc.fontSize(10)
         .text(`${cliente.nombre_cliente} ${cliente.apellido_cliente}`, { underline: true })
         .text(`DPI: ${cliente.dpi_cliente}`)
         .text(`NIT: ${cliente.NIT || 'No registrado'}`)
         .text(`Teléfono: ${cliente.telefono_cliente || 'No registrado'}`)
         .text(`Email: ${cliente.correo_cliente || 'No registrado'}`)
         .text(`Dirección: ${cliente.direccion_cliente || 'No registrada'}`)
         .text(`Fecha de registro: ${this.formatDate(new Date(cliente.fecha_registro_cliente))}`)
         .text(`Total de órdenes: ${cliente.total_ordenes}`);
      
      doc.moveDown();
      
      if (index < data.length - 1) {
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
      }
    });
  }

  addVehiculosPDFContent(doc, data) {
    doc.fontSize(12).text('VEHÍCULOS REGISTRADOS', { underline: true }).moveDown();
    
    data.forEach((vehiculo, index) => {
      doc.fontSize(10)
         .text(`${vehiculo.marca_vehiculo} ${vehiculo.modelo_vehiculo}`, { underline: true })
         .text(`Placa: ${vehiculo.placa_vehiculo}`)
         .text(`Año: ${vehiculo.anio_vehiculo || 'No especificado'}`)
         .text(`Color: ${vehiculo.color_vehiculo || 'No especificado'}`)
         .text(`Total de órdenes: ${vehiculo.total_ordenes}`);
      
      if (vehiculo.ultima_orden) {
        doc.text(`Última orden: ${this.formatDate(new Date(vehiculo.ultima_orden))}`);
      }
      
      doc.moveDown();
      
      if (index < data.length - 1) {
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
      }
    });
  }

  addServiciosPDFContent(doc, data) {
    doc.fontSize(12).text('SERVICIOS DISPONIBLES', { underline: true }).moveDown();
    
    data.forEach((servicio, index) => {
      doc.fontSize(10)
         .text(servicio.servicio, { underline: true })
         .text(`Descripción: ${servicio.descripcion_servicios || 'Sin descripción'}`)
         .text(`Cantidad de órdenes: ${servicio.cantidad_ordenes}`)
         .text(`Porcentaje: ${servicio.porcentaje}%`);
      
      doc.moveDown();
      
      if (index < data.length - 1) {
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
      }
    });
  }

  addEstadisticasPDFContent(doc, data) {
    doc.fontSize(12).text('ESTADÍSTICAS GENERALES', { underline: true }).moveDown();
    
    data.forEach((stat, index) => {
      doc.fontSize(10)
         .text(`${stat.metrica}: ${stat.valor}`);
    });
  }

  // Generar reporte en Excel
  async generateExcelReport(tipoReporte, filtros = {}) {
    const data = await this.getReportData(tipoReporte, filtros);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Reporte ${tipoReporte}`);

    // Configurar encabezado
    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = 'TECNO AUTO - TALLER MECÁNICO';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:H2');
    worksheet.getCell('A2').value = `REPORTE DE ${tipoReporte.toUpperCase()}`;
    worksheet.getCell('A2').font = { size: 14, bold: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.getCell('A3').value = `Generado el: ${this.formatDate(new Date())}`;
    worksheet.getCell('A3').font = { size: 10 };
    worksheet.getCell('A3').alignment = { horizontal: 'right' };

    // Agregar contenido específico
    this.addExcelContent(worksheet, tipoReporte, data);

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  formatDate(date) {
    if (!date) return 'No especificada';
    // Usar moment-timezone para convertir a zona horaria de Guatemala
    return moment(date).tz('America/Guatemala').format('DD [de] MMMM [de] YYYY, HH:mm');
  }

  // Agregar contenido específico al Excel
  addExcelContent(worksheet, tipoReporte, data) {
    let startRow = 5;

    switch (tipoReporte) {
      case 'ordenes':
        this.addOrdenesExcelContent(worksheet, data, startRow);
        break;
      case 'clientes':
        this.addClientesExcelContent(worksheet, data, startRow);
        break;
      case 'vehiculos':
        this.addVehiculosExcelContent(worksheet, data, startRow);
        break;
      case 'servicios':
        this.addServiciosExcelContent(worksheet, data, startRow);
        break;
      case 'estadisticas':
        this.addEstadisticasExcelContent(worksheet, data, startRow);
        break;
    }
  }

  addOrdenesExcelContent(worksheet, data, startRow) {
    // Encabezados
    const headers = [
      'ID Orden', 'Fecha', 'Cliente', 'DPI', 'Teléfono', 
      'Vehículo', 'Placa', 'Servicio', 'Estado', 'Combustible', 'Odómetro'
    ];
    
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(startRow, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    });

    // Datos
    data.forEach((orden, rowIndex) => {
      const row = startRow + 1 + rowIndex;
      worksheet.getCell(row, 1).value = orden.pk_id_orden;
      worksheet.getCell(row, 2).value = this.formatDate(new Date(orden.fecha_ingreso_orden));
      worksheet.getCell(row, 3).value = orden.cliente;
      worksheet.getCell(row, 4).value = orden.dpi_cliente;
      worksheet.getCell(row, 5).value = orden.telefono_cliente || '';
      worksheet.getCell(row, 6).value = orden.vehiculo;
      worksheet.getCell(row, 7).value = orden.placa_vehiculo;
      worksheet.getCell(row, 8).value = orden.servicio;
      worksheet.getCell(row, 9).value = orden.estado_orden;
      worksheet.getCell(row, 10).value = orden.nivel_combustible_orden;
      worksheet.getCell(row, 11).value = orden.odometro_auto_cliente_orden;
    });

    // Ajustar ancho de columnas
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
  }

  addClientesExcelContent(worksheet, data, startRow) {
    const headers = [
      'ID', 'Nombre', 'Apellido', 'DPI', 'NIT', 'Teléfono', 'Email', 'Dirección', 'Fecha Registro', 'Total Órdenes'
    ];
    
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(startRow, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    });

    data.forEach((cliente, rowIndex) => {
      const row = startRow + 1 + rowIndex;
      worksheet.getCell(row, 1).value = cliente.PK_id_cliente;
      worksheet.getCell(row, 2).value = cliente.nombre_cliente;
      worksheet.getCell(row, 3).value = cliente.apellido_cliente;
      worksheet.getCell(row, 4).value = cliente.dpi_cliente;
      worksheet.getCell(row, 5).value = cliente.NIT || '';
      worksheet.getCell(row, 6).value = cliente.telefono_cliente || '';
      worksheet.getCell(row, 7).value = cliente.correo_cliente || '';
      worksheet.getCell(row, 8).value = cliente.direccion_cliente || '';
      worksheet.getCell(row, 9).value = this.formatDate(new Date(cliente.fecha_registro_cliente));
      worksheet.getCell(row, 10).value = cliente.total_ordenes;
    });

    worksheet.columns.forEach(column => {
      column.width = 15;
    });
  }

  addVehiculosExcelContent(worksheet, data, startRow) {
    const headers = [
      'ID', 'Placa', 'Marca', 'Modelo', 'Año', 'Color', 'Total Órdenes', 'Última Orden'
    ];
    
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(startRow, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    });

    data.forEach((vehiculo, rowIndex) => {
      const row = startRow + 1 + rowIndex;
      worksheet.getCell(row, 1).value = vehiculo.pk_id_vehiculo;
      worksheet.getCell(row, 2).value = vehiculo.placa_vehiculo;
      worksheet.getCell(row, 3).value = vehiculo.marca_vehiculo;
      worksheet.getCell(row, 4).value = vehiculo.modelo_vehiculo;
      worksheet.getCell(row, 5).value = vehiculo.anio_vehiculo || '';
      worksheet.getCell(row, 6).value = vehiculo.color_vehiculo || '';
      worksheet.getCell(row, 7).value = vehiculo.total_ordenes;
      worksheet.getCell(row, 8).value = vehiculo.ultima_orden ? 
        this.formatDate(new Date(vehiculo.ultima_orden)) : '';
    });

    worksheet.columns.forEach(column => {
      column.width = 15;
    });
  }

  addServiciosExcelContent(worksheet, data, startRow) {
    const headers = [
      'ID', 'Servicio', 'Descripción', 'Cantidad Órdenes', 'Porcentaje'
    ];
    
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(startRow, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    });

    data.forEach((servicio, rowIndex) => {
      const row = startRow + 1 + rowIndex;
      worksheet.getCell(row, 1).value = servicio.pk_id_servicio;
      worksheet.getCell(row, 2).value = servicio.servicio;
      worksheet.getCell(row, 3).value = servicio.descripcion_servicios || '';
      worksheet.getCell(row, 4).value = servicio.cantidad_ordenes;
      worksheet.getCell(row, 5).value = servicio.porcentaje;
    });

    worksheet.columns.forEach(column => {
      column.width = 20;
    });
  }

  addEstadisticasExcelContent(worksheet, data, startRow) {
    const headers = ['Métrica', 'Valor'];
    
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(startRow, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    });

    data.forEach((stat, rowIndex) => {
      const row = startRow + 1 + rowIndex;
      worksheet.getCell(row, 1).value = stat.metrica;
      worksheet.getCell(row, 2).value = stat.valor;
    });

    worksheet.columns.forEach(column => {
      column.width = 25;
    });
  }
}

module.exports = new ReportService();
