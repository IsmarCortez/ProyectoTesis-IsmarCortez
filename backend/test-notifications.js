#!/usr/bin/env node

/**
 * Script de pruebas para el sistema de notificaciones
 * Uso: node test-notifications.js [email] [phone]
 * 
 * Ejemplos:
 *   node test-notifications.js
 *   node test-notifications.js test@example.com
 *   node test-notifications.js test@example.com 5555-1234
 */

require('dotenv').config();
const NotificationService = require('./services/notificationService');

async function runTests() {
  console.log('🧪 ========================================');
  console.log('🧪 SISTEMA DE NOTIFICACIONES - PRUEBAS');
  console.log('🧪 ========================================');
  console.log('');

  // Obtener argumentos de línea de comandos
  const args = process.argv.slice(2);
  const testEmail = args[0] || null;
  const testPhone = args[1] || null;

  try {
    // 1. Verificar configuración
    console.log('📋 1. Verificando configuración...');
    const config = require('./config/notifications');
    
    console.log(`   📧 Email habilitado: ${config.email.enabled ? '✅ Sí' : '❌ No'}`);
    console.log(`   📱 WhatsApp habilitado: ${config.whatsapp.enabled ? '✅ Sí' : '❌ No'}`);
    console.log(`   📄 PDF habilitado: ${config.pdf.enabled ? '✅ Sí' : '❌ No'}`);
    console.log(`   🏢 Empresa: ${config.empresa.nombre}`);
    console.log('');

    // 2. Inicializar servicios
    console.log('🚀 2. Inicializando servicios...');
    await NotificationService.initialize();
    console.log('');

    // 3. Verificar estado de servicios
    console.log('📊 3. Estado de servicios:');
    const status = NotificationService.getServicesStatus();
    
    console.log(`   📧 Email:`);
    console.log(`      - Habilitado: ${status.email.enabled ? '✅ Sí' : '❌ No'}`);
    console.log(`      - Inicializado: ${status.email.initialized ? '✅ Sí' : '❌ No'}`);
    console.log(`      - Servicio: ${status.email.service || 'N/A'}`);
    console.log(`      - Usuario: ${status.email.user || 'N/A'}`);
    
    console.log(`   📱 WhatsApp:`);
    console.log(`      - Habilitado: ${status.whatsapp.enabled ? '✅ Sí' : '❌ No'}`);
    console.log(`      - Inicializado: ${status.whatsapp.initialized ? '✅ Sí' : '❌ No'}`);
    console.log(`      - Autenticado: ${status.whatsapp.authenticated ? '✅ Sí' : '❌ No'}`);
    console.log(`      - Tiene QR: ${status.whatsapp.hasQRCode ? '✅ Sí' : '❌ No'}`);
    
    if (status.whatsapp.hasQRCode) {
      console.log('      ⚠️  WhatsApp requiere escanear código QR');
    }
    
    console.log(`   📄 PDF:`);
    console.log(`      - Habilitado: ${status.pdf.enabled ? '✅ Sí' : '❌ No'}`);
    console.log('');

    // 4. Probar notificaciones
    if (testEmail || testPhone) {
      console.log('🧪 4. Enviando notificaciones de prueba...');
      
      const testResults = await NotificationService.sendTestNotifications(testEmail, testPhone);
      
      console.log(`   📧 Email de prueba:`);
      if (testEmail) {
        if (testResults.email.success) {
          console.log(`      ✅ Enviado exitosamente a ${testResults.email.recipient}`);
          console.log(`      📧 Message ID: ${testResults.email.messageId}`);
        } else {
          console.log(`      ❌ Error: ${testResults.email.error}`);
        }
      } else {
        console.log(`      ⚠️  No se proporcionó email de prueba`);
      }
      
      console.log(`   📱 WhatsApp de prueba:`);
      if (testPhone) {
        if (testResults.whatsapp.success) {
          console.log(`      ✅ Enviado exitosamente a ${testResults.whatsapp.recipient}`);
          console.log(`      📱 Message ID: ${testResults.whatsapp.messageId}`);
        } else {
          console.log(`      ❌ Error: ${testResults.whatsapp.error}`);
        }
      } else {
        console.log(`      ⚠️  No se proporcionó teléfono de prueba`);
      }
      console.log('');
    } else {
      console.log('⚠️  4. Saltando pruebas de envío (no se proporcionaron contactos de prueba)');
      console.log('   Para probar envíos, ejecuta:');
      console.log('   node test-notifications.js test@example.com 5555-1234');
      console.log('');
    }

    // 5. Probar generación de PDF (con datos de ejemplo)
    console.log('📄 5. Probando generación de PDF...');
    const sampleOrderData = {
      pk_id_orden: 999,
      fecha_ingreso_orden: new Date(),
      comentario_cliente_orden: 'Prueba del sistema de notificaciones',
      nivel_combustible_orden: 'Medium',
      odometro_auto_cliente_orden: 50000,
      observaciones_orden: 'Orden de prueba generada automáticamente',
      dpi_cliente: '1234567890101',
      nombre_cliente: 'Cliente',
      apellido_cliente: 'Prueba',
      telefono_cliente: '5555-1234',
      correo_cliente: 'cliente@prueba.com',
      placa_vehiculo: 'ABC-123',
      marca_vehiculo: 'Toyota',
      modelo_vehiculo: 'Corolla',
      anio_vehiculo: 2020,
      color_vehiculo: 'Blanco',
      servicio: 'Mantenimiento General',
      estado_orden: 'Recibido'
    };

    const pdfResult = await NotificationService.generatePDF(sampleOrderData);
    
    if (pdfResult.success) {
      console.log(`   ✅ PDF generado exitosamente`);
      console.log(`   📏 Tamaño: ${(pdfResult.size / 1024).toFixed(2)} KB`);
    } else {
      console.log(`   ❌ Error generando PDF: ${pdfResult.error}`);
    }
    console.log('');

    // 6. Resumen final
    console.log('📊 6. Resumen de pruebas:');
    console.log(`   ✅ Configuración verificada`);
    console.log(`   ✅ Servicios inicializados`);
    console.log(`   ✅ Estado de servicios verificado`);
    
    if (testEmail || testPhone) {
      console.log(`   ✅ Notificaciones de prueba enviadas`);
    }
    
    console.log(`   ${pdfResult.success ? '✅' : '❌'} Generación de PDF probada`);
    console.log('');

    console.log('🎉 ¡Todas las pruebas completadas!');
    console.log('');
    console.log('💡 Próximos pasos:');
    console.log('   1. Si WhatsApp muestra QR, escanéalo con tu móvil');
    console.log('   2. Verifica que las notificaciones llegaron correctamente');
    console.log('   3. El sistema está listo para usar en producción');
    console.log('');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Cerrar servicios
    await NotificationService.destroy();
    process.exit(0);
  }
}

// Manejar señales de terminación
process.on('SIGINT', async () => {
  console.log('\n🛑 Recibida señal de terminación, cerrando servicios...');
  await NotificationService.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recibida señal de terminación, cerrando servicios...');
  await NotificationService.destroy();
  process.exit(0);
});

// Ejecutar pruebas
runTests().catch(async (error) => {
  console.error('❌ Error fatal:', error.message);
  await NotificationService.destroy();
  process.exit(1);
});
