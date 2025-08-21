// Configuración centralizada del sistema de notificaciones
module.exports = {
  // Configuración de la empresa
  empresa: {
    nombre: process.env.EMPRESA_NOMBRE || 'Tecno Auto - Repuestos Electrofrio',
    telefono: process.env.EMPRESA_TELEFONO || '+502 5555-1234',
    email: process.env.EMPRESA_EMAIL || 'info@tecnoauto.com',
    direccion: process.env.EMPRESA_DIRECCION || 'Zona 1, Ciudad de Guatemala',
    logo: process.env.EMPRESA_LOGO || '/LogoElectrofrio.jpg'
  },

  // Configuración de Email
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER
  },

  // Configuración de WhatsApp (deshabilitado temporalmente)
  whatsapp: {
    enabled: false, // Deshabilitado por complejidad de configuración
    sessionPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp-session',
    clientId: process.env.WHATSAPP_CLIENT_ID || 'taller-mecanico',
    puppeteerArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--disable-extensions',
      '--disable-plugins'
    ]
  },

  // Configuración de PDF
  pdf: {
    enabled: process.env.PDF_ENABLED === 'true',
    fontSize: 12,
    lineHeight: 1.5,
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    },
    colors: {
      primary: '#2c3e50',
      secondary: '#34495e',
      accent: '#3498db',
      success: '#27ae60',
      warning: '#f39c12',
      danger: '#e74c3c'
    }
  },

  // Configuración de logging
  logging: {
    enabled: process.env.LOGGING_ENABLED === 'true',
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/notifications.log'
  },

  // Configuración de templates
  templates: {
    email: {
      subject: (data) => `Orden de Servicio #${data.orderId} - ${data.empresa}`,
      html: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Orden de Servicio #${data.orderId}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #2c3e50; }
            .value { color: #555; }
            .highlight { background: #3498db; color: white; padding: 10px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Orden de Servicio #${data.orderId}</h1>
              <p>${data.empresa}</p>
            </div>
            <div class="content">
              <div class="highlight">
                <strong>¡Su orden ha sido registrada exitosamente!</strong>
              </div>
              
              <h3>Información del Cliente:</h3>
              <div class="info-row">
                <span class="label">Nombre:</span>
                <span class="value">${data.clienteNombre} ${data.clienteApellido}</span>
              </div>
              <div class="info-row">
                <span class="label">DPI:</span>
                <span class="value">${data.clienteDpi}</span>
              </div>
              <div class="info-row">
                <span class="label">Teléfono:</span>
                <span class="value">${data.clienteTelefono}</span>
              </div>
              
              <h3>Información del Vehículo:</h3>
              <div class="info-row">
                <span class="label">Placa:</span>
                <span class="value">${data.vehiculoPlaca}</span>
              </div>
              <div class="info-row">
                <span class="label">Marca/Modelo:</span>
                <span class="value">${data.vehiculoMarca} ${data.vehiculoModelo}</span>
              </div>
              <div class="info-row">
                <span class="label">Año:</span>
                <span class="value">${data.vehiculoAnio}</span>
              </div>
              <div class="info-row">
                <span class="label">Color:</span>
                <span class="value">${data.vehiculoColor}</span>
              </div>
              
              <h3>Servicio Solicitado:</h3>
              <div class="info-row">
                <span class="label">Servicio:</span>
                <span class="value">${data.servicio}</span>
              </div>
              <div class="info-row">
                <span class="label">Estado:</span>
                <span class="value">${data.estado}</span>
              </div>
              <div class="info-row">
                <span class="label">Fecha de Ingreso:</span>
                <span class="value">${data.fechaIngreso}</span>
              </div>
              
              ${data.comentario ? `
                <h3>Comentarios:</h3>
                <div class="info-row">
                  <span class="value">${data.comentario}</span>
                </div>
              ` : ''}
              
              <div style="margin-top: 30px; padding: 15px; background: #ecf0f1; border-radius: 5px;">
                <p><strong>Nota:</strong> Este email incluye un PDF adjunto con todos los detalles de su orden de servicio.</p>
              </div>
            </div>
            <div class="footer">
              <p>${data.empresa}</p>
              <p>Teléfono: ${data.empresaTelefono} | Email: ${data.empresaEmail}</p>
              <p>Dirección: ${data.empresaDireccion}</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    
    whatsapp: {
      message: (data) => `🚗 *ORDEN DE SERVICIO #${data.orderId}*

✅ *¡Su orden ha sido registrada exitosamente!*

👤 *CLIENTE:*
• Nombre: ${data.clienteNombre} ${data.clienteApellido}
• DPI: ${data.clienteDpi}
• Teléfono: ${data.clienteTelefono}

🚙 *VEHÍCULO:*
• Placa: ${data.vehiculoPlaca}
• Marca/Modelo: ${data.vehiculoMarca} ${data.vehiculoModelo}
• Año: ${data.vehiculoAnio}
• Color: ${data.vehiculoColor}

🔧 *SERVICIO:*
• Tipo: ${data.servicio}
• Estado: ${data.estado}
• Fecha de Ingreso: ${data.fechaIngreso}

${data.comentario ? `💬 *COMENTARIOS:*
${data.comentario}

` : ''}📞 *CONTACTO:*
${data.empresa}
Teléfono: ${data.empresaTelefono}
Email: ${data.empresaEmail}

📍 *DIRECCIÓN:*
${data.empresaDireccion}

_Le mantendremos informado sobre el progreso de su orden._`
    }
  }
};
