/**
 * Script de prueba para verificar la corrección del error "undefined" en emails
 */

require('dotenv').config();
const EmailService = require('./services/emailService');

async function testCorreccionEmail() {
  console.log('🧪 VERIFICANDO CORRECCIÓN DE ERROR "UNDEFINED" EN EMAILS\n');
  
  try {
    // 1. Obtener instancia del servicio de email
    console.log('1️⃣ Obteniendo servicio de email...');
    const emailService = EmailService;
    console.log('✅ Servicio de email obtenido');
    
    // 2. Crear datos de prueba simulando una orden real
    console.log('\n2️⃣ Creando datos de prueba...');
    const orderDataTest = {
      pk_id_orden: 16,
      fecha_ingreso_orden: '2024-01-15',
      comentario_cliente_orden: 'Revisión general del vehículo',
      nivel_combustible_orden: '3/4',
      odometro_auto_cliente_orden: 45000,
      observaciones_orden: 'Vehículo en buen estado general',
      dpi_cliente: '1234567890123',
      nombre_cliente: 'Juan',
      apellido_cliente: 'Pérez',
      telefono_cliente: '5555-1234',
      correo_cliente: 'juan.perez@email.com',
      placa_vehiculo: 'ABC-123',
      marca_vehiculo: 'Toyota',
      modelo_vehiculo: 'Corolla',
      anio_vehiculo: 2020,
      color_vehiculo: 'Blanco',
      servicio: 'Revisión General',
      estado_orden: 'En Proceso'
    };
    
    console.log('✅ Datos de prueba creados');
    console.log(`📊 Orden ID: ${orderDataTest.pk_id_orden}`);
    console.log(`👤 Cliente: ${orderDataTest.nombre_cliente} ${orderDataTest.apellido_cliente}`);
    console.log(`🚗 Vehículo: ${orderDataTest.marca_vehiculo} ${orderDataTest.modelo_vehiculo}`);
    console.log(`🔧 Servicio: ${orderDataTest.servicio}`);
    
    // 3. Preparar datos del template
    console.log('\n3️⃣ Preparando datos del template...');
    const templateData = emailService.prepareTemplateData(orderDataTest);
    
    console.log('✅ Datos del template preparados');
    console.log('📊 Datos del template:');
    console.log(`   - orderId: ${templateData.orderId}`);
    console.log(`   - empresa: ${templateData.empresa}`);
    console.log(`   - clienteNombre: ${templateData.clienteNombre}`);
    console.log(`   - clienteApellido: ${templateData.clienteApellido}`);
    console.log(`   - vehiculoPlaca: ${templateData.vehiculoPlaca}`);
    console.log(`   - vehiculoMarca: ${templateData.vehiculoMarca}`);
    console.log(`   - vehiculoModelo: ${templateData.vehiculoModelo}`);
    console.log(`   - servicioNombre: ${templateData.servicioNombre}`);
    console.log(`   - servicioDescripcion: ${templateData.servicioDescripcion}`);
    
    // 4. Verificar que no hay valores undefined
    console.log('\n4️⃣ Verificando ausencia de valores undefined...');
    
    const undefinedFields = [];
    Object.keys(templateData).forEach(key => {
      if (templateData[key] === undefined) {
        undefinedFields.push(key);
      }
    });
    
    if (undefinedFields.length > 0) {
      console.log('❌ Se encontraron campos undefined:');
      undefinedFields.forEach(field => {
        console.log(`   - ${field}: ${templateData[field]}`);
      });
    } else {
      console.log('✅ No se encontraron campos undefined en templateData');
    }
    
    // 5. Generar contenido del email de cambio de estado
    console.log('\n5️⃣ Generando contenido del email de cambio de estado...');
    const emailContent = emailService.generateStateChangeEmailContent(
      templateData, 
      'En Proceso', 
      'Completado'
    );
    
    console.log('✅ Contenido del email generado');
    console.log(`📧 Asunto: ${emailContent.subject}`);
    
    // 6. Verificar que no hay "undefined" en el contenido HTML
    console.log('\n6️⃣ Verificando contenido HTML...');
    
    if (emailContent.html.includes('undefined')) {
      console.log('❌ Se encontró "undefined" en el contenido HTML del email');
      
      // Buscar líneas específicas que contengan undefined
      const lines = emailContent.html.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('undefined')) {
          console.log(`   - Línea ${index + 1}: ${line.trim()}`);
        }
      });
    } else {
      console.log('✅ No se encontró "undefined" en el contenido HTML del email');
    }
    
    // 7. Verificar campos específicos mencionados por el usuario
    console.log('\n7️⃣ Verificando campos específicos...');
    
    // Verificar orderId en el asunto
    if (emailContent.subject.includes('undefined')) {
      console.log('❌ El asunto contiene "undefined"');
    } else {
      console.log('✅ El asunto no contiene "undefined"');
    }
    
    // Verificar servicioNombre y servicioDescripcion en el HTML
    if (emailContent.html.includes('${templateData.servicioNombre}')) {
      console.log('❌ El HTML contiene template no procesado para servicioNombre');
    } else {
      console.log('✅ El HTML procesó correctamente servicioNombre');
    }
    
    if (emailContent.html.includes('${templateData.servicioDescripcion}')) {
      console.log('❌ El HTML contiene template no procesado para servicioDescripcion');
    } else {
      console.log('✅ El HTML procesó correctamente servicioDescripcion');
    }
    
    // 8. Guardar contenido HTML para inspección manual
    const fs = require('fs');
    const testEmailPath = './test-email-contenido.html';
    fs.writeFileSync(testEmailPath, emailContent.html);
    console.log(`\n📁 Contenido HTML guardado en: ${testEmailPath}`);
    console.log('💡 Puedes abrir este archivo para verificar visualmente que no hay "undefined"');
    
    console.log('\n🎉 PRUEBA DE CORRECCIÓN COMPLETADA');
    console.log('\n📋 RESUMEN:');
    console.log('✅ Servicio de email inicializado');
    console.log('✅ Datos de prueba creados');
    console.log('✅ Datos del template preparados');
    console.log('✅ Campos undefined verificados');
    console.log('✅ Contenido del email generado');
    console.log('✅ Contenido HTML verificado');
    console.log('✅ Campos específicos validados');
    console.log('✅ Contenido HTML guardado para inspección');
    
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('1. Abrir el archivo test-email-contenido.html para verificar visualmente');
    console.log('2. Probar el envío de email con una orden real del sistema');
    console.log('3. Verificar que los emails recibidos no contengan "undefined"');
    console.log('4. Confirmar que el problema está resuelto en producción');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error('📊 Stack trace:', error.stack);
  }
}

// Ejecutar las pruebas
testCorreccionEmail();
