/**
 * Script de validación de la corrección del error en notificaciones
 * Verifica que el código esté corregido sin requerir servidor ejecutándose
 */

const fs = require('fs');
const path = require('path');

function validarCorreccionNotificaciones() {
  console.log('🧪 VALIDANDO CORRECCIÓN DE ERROR EN NOTIFICACIONES\n');
  
  let errores = 0;
  let exitos = 0;
  
  try {
    // 1. Verificar que el archivo notificationService.js existe
    console.log('1️⃣ Verificando archivo notificationService.js...');
    const notificationServicePath = path.join(__dirname, 'services/notificationService.js');
    
    if (fs.existsSync(notificationServicePath)) {
      console.log('✅ Archivo notificationService.js existe');
      exitos++;
    } else {
      console.log('❌ Archivo notificationService.js NO existe');
      errores++;
      return;
    }
    
    // 2. Leer el contenido del archivo
    const notificationServiceContent = fs.readFileSync(notificationServicePath, 'utf8');
    
    // 3. Verificar que no hay referencias incorrectas a orderData.cliente.correo_cliente
    console.log('\n2️⃣ Verificando corrección de referencias...');
    
    if (notificationServiceContent.includes('orderData.cliente.correo_cliente')) {
      console.log('❌ Aún hay referencias incorrectas a orderData.cliente.correo_cliente');
      errores++;
    } else {
      console.log('✅ No hay referencias incorrectas a orderData.cliente.correo_cliente');
      exitos++;
    }
    
    // 4. Verificar que hay referencias correctas a orderData.correo_cliente
    if (notificationServiceContent.includes('orderData.correo_cliente')) {
      console.log('✅ Referencias correctas a orderData.correo_cliente encontradas');
      exitos++;
    } else {
      console.log('❌ No se encontraron referencias correctas a orderData.correo_cliente');
      errores++;
    }
    
    // 5. Verificar que el método sendStateChangeNotification existe
    console.log('\n3️⃣ Verificando método sendStateChangeNotification...');
    
    if (notificationServiceContent.includes('sendStateChangeNotification')) {
      console.log('✅ Método sendStateChangeNotification existe');
      exitos++;
    } else {
      console.log('❌ Método sendStateChangeNotification NO existe');
      errores++;
    }
    
    // 6. Verificar que el método sendStateChangeEmail existe en EmailService
    console.log('\n4️⃣ Verificando método sendStateChangeEmail en EmailService...');
    const emailServicePath = path.join(__dirname, 'services/emailService.js');
    
    if (fs.existsSync(emailServicePath)) {
      const emailServiceContent = fs.readFileSync(emailServicePath, 'utf8');
      
      if (emailServiceContent.includes('sendStateChangeEmail')) {
        console.log('✅ Método sendStateChangeEmail existe en EmailService');
        exitos++;
      } else {
        console.log('❌ Método sendStateChangeEmail NO existe en EmailService');
        errores++;
      }
      
      if (emailServiceContent.includes('generateStateChangeEmailContent')) {
        console.log('✅ Método generateStateChangeEmailContent existe');
        exitos++;
      } else {
        console.log('❌ Método generateStateChangeEmailContent NO existe');
        errores++;
      }
    } else {
      console.log('❌ Archivo emailService.js NO existe');
      errores++;
    }
    
    // 7. Verificar que el endpoint de actualización está modificado
    console.log('\n5️⃣ Verificando endpoint de actualización...');
    const indexPath = path.join(__dirname, 'index.js');
    
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      if (indexContent.includes('estadoCambio')) {
        console.log('✅ Endpoint de actualización detecta cambios de estado');
        exitos++;
      } else {
        console.log('❌ Endpoint de actualización NO detecta cambios de estado');
        errores++;
      }
      
      if (indexContent.includes('sendStateChangeNotification')) {
        console.log('✅ Endpoint llama a sendStateChangeNotification');
        exitos++;
      } else {
        console.log('❌ Endpoint NO llama a sendStateChangeNotification');
        errores++;
      }
    } else {
      console.log('❌ Archivo index.js NO existe');
      errores++;
    }
    
    // 8. Verificar que hay manejo de errores
    console.log('\n6️⃣ Verificando manejo de errores...');
    
    if (notificationServiceContent.includes('try {') && notificationServiceContent.includes('} catch (error) {')) {
      console.log('✅ Manejo de errores implementado');
      exitos++;
    } else {
      console.log('❌ Manejo de errores NO implementado');
      errores++;
    }
    
    // Resumen final
    console.log('\n📊 RESUMEN DE VALIDACIÓN:');
    console.log(`✅ Éxitos: ${exitos}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📈 Porcentaje de éxito: ${Math.round((exitos / (exitos + errores)) * 100)}%`);
    
    if (errores === 0) {
      console.log('\n🎉 ¡VALIDACIÓN EXITOSA!');
      console.log('✅ La corrección del error está implementada correctamente');
      console.log('✅ Todas las referencias están corregidas');
      console.log('✅ Los métodos necesarios están implementados');
      console.log('✅ El manejo de errores está en su lugar');
      console.log('\n💡 PRÓXIMOS PASOS:');
      console.log('1. Ejecutar el servidor backend');
      console.log('2. Probar el cambio de estado de una orden');
      console.log('3. Verificar que no se produzcan errores de "Cannot read properties of undefined"');
      console.log('4. Confirmar que se envíen las notificaciones por email');
    } else {
      console.log('\n⚠️ VALIDACIÓN CON ERRORES');
      console.log('❌ Se encontraron problemas que deben corregirse');
      console.log('💡 Revisa los errores listados arriba y corrige los archivos correspondientes');
    }
    
    return errores === 0;
    
  } catch (error) {
    console.error('❌ Error durante la validación:', error.message);
    return false;
  }
}

// Ejecutar validación
validarCorreccionNotificaciones();

