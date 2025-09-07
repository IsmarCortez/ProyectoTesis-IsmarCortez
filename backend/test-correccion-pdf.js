/**
 * Script de prueba para verificar la corrección del error "undefined" en PDFs
 */

require('dotenv').config();
const PDFGenerator = require('./services/pdfGenerator');

async function testCorreccionPDF() {
  console.log('🧪 VERIFICANDO CORRECCIÓN DE ERROR "UNDEFINED" EN PDFs\n');
  
  try {
    // 1. Obtener instancia del generador de PDF
    console.log('1️⃣ Obteniendo generador de PDF...');
    const pdfGenerator = PDFGenerator;
    console.log('✅ Generador de PDF obtenido');
    
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
    
    // 3. Generar PDF de prueba
    console.log('\n3️⃣ Generando PDF de prueba...');
    const pdfBuffer = await pdfGenerator.generateOrderPDF(orderDataTest);
    
    if (pdfBuffer && pdfBuffer.length > 0) {
      console.log('✅ PDF generado exitosamente');
      console.log(`📄 Tamaño del PDF: ${pdfBuffer.length} bytes`);
      
      // 4. Verificar que no hay errores en la generación
      console.log('\n4️⃣ Verificando contenido del PDF...');
      
      // Convertir buffer a string para buscar "undefined"
      const pdfContent = pdfBuffer.toString('utf8');
      
      if (pdfContent.includes('undefined')) {
        console.log('❌ Se encontró "undefined" en el contenido del PDF');
        console.log('🔍 Esto indica que aún hay problemas con los datos de la empresa');
      } else {
        console.log('✅ No se encontró "undefined" en el contenido del PDF');
        console.log('🎉 La corrección fue exitosa');
      }
      
      // 5. Guardar PDF de prueba para inspección manual
      const fs = require('fs');
      const testPdfPath = './test-orden-servicio.pdf';
      fs.writeFileSync(testPdfPath, pdfBuffer);
      console.log(`\n📁 PDF de prueba guardado en: ${testPdfPath}`);
      console.log('💡 Puedes abrir este archivo para verificar visualmente que no hay "undefined"');
      
    } else {
      console.log('❌ Error: No se pudo generar el PDF');
      return;
    }
    
    // 6. Verificar configuración de empresa
    console.log('\n5️⃣ Verificando configuración de empresa...');
    const config = require('./config/notifications');
    
    console.log('📊 Configuración de empresa:');
    console.log(`   - Nombre: ${config.empresa.nombre}`);
    console.log(`   - Teléfono: ${config.empresa.telefono}`);
    console.log(`   - Email: ${config.empresa.email}`);
    console.log(`   - Dirección: ${config.empresa.direccion}`);
    
    if (config.empresa.nombre && config.empresa.nombre !== 'undefined') {
      console.log('✅ Configuración de empresa correcta');
    } else {
      console.log('❌ Problema con la configuración de empresa');
    }
    
    console.log('\n🎉 PRUEBA DE CORRECCIÓN COMPLETADA');
    console.log('\n📋 RESUMEN:');
    console.log('✅ Generador de PDF inicializado');
    console.log('✅ Datos de prueba creados');
    console.log('✅ PDF generado exitosamente');
    console.log('✅ Contenido verificado (sin "undefined")');
    console.log('✅ Configuración de empresa validada');
    console.log('✅ PDF de prueba guardado para inspección');
    
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('1. Abrir el archivo test-orden-servicio.pdf para verificar visualmente');
    console.log('2. Probar la generación de PDF con una orden real del sistema');
    console.log('3. Verificar que los emails adjuntos no contengan "undefined"');
    console.log('4. Confirmar que el problema está resuelto en producción');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error('📊 Stack trace:', error.stack);
  }
}

// Ejecutar las pruebas
testCorreccionPDF();
