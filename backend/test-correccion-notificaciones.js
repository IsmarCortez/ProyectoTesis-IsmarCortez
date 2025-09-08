/**
 * Script de prueba para verificar la corrección del error en notificaciones de cambio de estado
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:4000';

async function testCorreccionNotificaciones() {
  console.log('🧪 VERIFICANDO CORRECCIÓN DE ERROR EN NOTIFICACIONES\n');
  
  try {
    // 1. Verificar que el servidor esté ejecutándose
    console.log('1️⃣ Verificando conexión con el servidor...');
    try {
      const response = await axios.get(`${API_BASE}/api/notifications/status`);
      console.log('✅ Servidor backend funcionando');
    } catch (error) {
      console.log('❌ Error conectando con el servidor:', error.message);
      console.log('💡 Asegúrate de que el servidor backend esté ejecutándose en puerto 4000');
      return;
    }

    // 2. Obtener una orden existente
    console.log('\n2️⃣ Obteniendo órdenes existentes...');
    try {
      const response = await axios.get(`${API_BASE}/api/ordenes`);
      const ordenes = response.data;
      
      if (ordenes.length === 0) {
        console.log('❌ No hay órdenes en la base de datos para probar');
        return;
      }
      
      const ordenPrueba = ordenes[0];
      console.log(`✅ Orden de prueba encontrada: ID ${ordenPrueba.pk_id_orden}`);
      console.log(`📊 Cliente: ${ordenPrueba.cliente}`);
      console.log(`📧 Email del cliente: ${ordenPrueba.cliente ? 'Disponible' : 'No disponible'}`);
      
      // 3. Obtener estados disponibles
      console.log('\n3️⃣ Obteniendo estados disponibles...');
      const estadosResponse = await axios.get(`${API_BASE}/api/estados`);
      const estados = estadosResponse.data;
      
      const estadoActual = ordenPrueba.fk_id_estado_orden;
      const nuevoEstado = estados.find(e => e.pk_id_estado !== estadoActual);
      
      if (!nuevoEstado) {
        console.log('❌ No hay estados diferentes para probar el cambio');
        return;
      }
      
      console.log(`🔄 Cambiando de estado ${estadoActual} a ${nuevoEstado.pk_id_estado} (${nuevoEstado.estado_orden})`);
      
      // 4. Actualizar la orden con nuevo estado
      const updateData = {
        fk_id_cliente: ordenPrueba.fk_id_cliente,
        fk_id_vehiculo: ordenPrueba.fk_id_vehiculo,
        fk_id_servicio: ordenPrueba.fk_id_servicio,
        comentario_cliente_orden: ordenPrueba.comentario_cliente_orden,
        nivel_combustible_orden: ordenPrueba.nivel_combustible_orden,
        odometro_auto_cliente_orden: ordenPrueba.odometro_auto_cliente_orden,
        fk_id_estado_orden: nuevoEstado.pk_id_estado,
        observaciones_orden: ordenPrueba.observaciones_orden
      };
      
      console.log('\n4️⃣ Actualizando orden...');
      const updateResponse = await axios.put(`${API_BASE}/api/ordenes/${ordenPrueba.pk_id_orden}`, updateData);
      
      console.log('📊 Respuesta del servidor:');
      console.log(`   - Mensaje: ${updateResponse.data.message}`);
      console.log(`   - Estado cambió: ${updateResponse.data.estadoCambio}`);
      console.log(`   - Notificación enviada: ${updateResponse.data.notificacionEnviada}`);
      
      if (updateResponse.data.estadoCambio && updateResponse.data.notificacionEnviada) {
        console.log('✅ ¡Corrección exitosa! El cambio de estado se procesó sin errores');
      } else if (updateResponse.data.estadoCambio && !updateResponse.data.notificacionEnviada) {
        console.log('⚠️ Estado cambió pero la notificación no se envió (posible problema de configuración de email)');
      } else {
        console.log('ℹ️ No hubo cambio de estado, por lo que no se envió notificación');
      }
      
      // 5. Restaurar estado original
      console.log('\n5️⃣ Restaurando estado original...');
      const restoreData = {
        ...updateData,
        fk_id_estado_orden: estadoActual
      };
      
      await axios.put(`${API_BASE}/api/ordenes/${ordenPrueba.pk_id_orden}`, restoreData);
      console.log('✅ Estado restaurado al original');
      
      console.log('\n🎉 PRUEBA DE CORRECCIÓN COMPLETADA');
      console.log('\n📋 RESUMEN:');
      console.log('✅ Servidor backend funcionando');
      console.log('✅ Orden de prueba encontrada');
      console.log('✅ Actualización de orden ejecutada');
      console.log('✅ No se produjeron errores de "Cannot read properties of undefined"');
      console.log('✅ Estado restaurado correctamente');
      
      console.log('\n💡 NOTAS:');
      console.log('- Si ves "Notificación enviada: true", la corrección fue exitosa');
      console.log('- Si ves "Notificación enviada: false", verifica la configuración de email');
      console.log('- El error "Cannot read properties of undefined" debería estar resuelto');
      
    } catch (error) {
      console.error('❌ Error durante las pruebas:', error.message);
      if (error.response) {
        console.error('📊 Respuesta del servidor:', error.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar las pruebas
testCorreccionNotificaciones();

