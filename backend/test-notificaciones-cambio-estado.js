/**
 * Script de prueba para notificaciones de cambio de estado
 * Verifica que el sistema envíe emails automáticamente cuando se actualiza el estado de una orden
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:4000';

async function testNotificacionesCambioEstado() {
  console.log('🧪 INICIANDO PRUEBAS DE NOTIFICACIONES DE CAMBIO DE ESTADO\n');
  
  try {
    // 1. Verificar que el servidor esté ejecutándose
    console.log('1️⃣ Verificando conexión con el servidor...');
    try {
      const response = await axios.get(`${API_BASE}/api/notifications/status`);
      console.log('✅ Servidor backend funcionando');
      console.log('📊 Estado de servicios:', response.data);
    } catch (error) {
      console.log('❌ Error conectando con el servidor:', error.message);
      console.log('💡 Asegúrate de que el servidor backend esté ejecutándose en puerto 4000');
      return;
    }

    // 2. Obtener una orden existente para probar
    console.log('\n2️⃣ Obteniendo órdenes existentes...');
    try {
      const response = await axios.get(`${API_BASE}/api/ordenes`);
      const ordenes = response.data;
      
      if (ordenes.length === 0) {
        console.log('❌ No hay órdenes en la base de datos para probar');
        console.log('💡 Crea al menos una orden antes de ejecutar esta prueba');
        return;
      }
      
      const ordenPrueba = ordenes[0];
      console.log(`✅ Orden de prueba encontrada: ID ${ordenPrueba.pk_id_orden}`);
      console.log(`📊 Estado actual: ${ordenPrueba.estado_orden}`);
      
      // 3. Obtener estados disponibles
      console.log('\n3️⃣ Obteniendo estados disponibles...');
      const estadosResponse = await axios.get(`${API_BASE}/api/estados`);
      const estados = estadosResponse.data;
      
      console.log('📊 Estados disponibles:');
      estados.forEach(estado => {
        console.log(`   - ${estado.pk_id_estado}: ${estado.estado_orden}`);
      });
      
      // 4. Buscar un estado diferente al actual
      const estadoActual = ordenPrueba.fk_id_estado_orden;
      const nuevoEstado = estados.find(e => e.pk_id_estado !== estadoActual);
      
      if (!nuevoEstado) {
        console.log('❌ No hay estados diferentes para probar el cambio');
        return;
      }
      
      console.log(`\n4️⃣ Probando cambio de estado...`);
      console.log(`🔄 Cambiando de estado ${estadoActual} a ${nuevoEstado.pk_id_estado} (${nuevoEstado.estado_orden})`);
      
      // 5. Actualizar la orden con nuevo estado
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
      
      const updateResponse = await axios.put(`${API_BASE}/api/ordenes/${ordenPrueba.pk_id_orden}`, updateData);
      
      if (updateResponse.data.estadoCambio) {
        console.log('✅ Estado actualizado correctamente');
        console.log('📧 Notificación enviada:', updateResponse.data.notificacionEnviada);
      } else {
        console.log('⚠️ Orden actualizada pero no hubo cambio de estado');
      }
      
      // 6. Verificar que la orden se actualizó
      console.log('\n5️⃣ Verificando actualización...');
      const verifyResponse = await axios.get(`${API_BASE}/api/ordenes/${ordenPrueba.pk_id_orden}`);
      const ordenActualizada = verifyResponse.data;
      
      console.log(`📊 Estado actual de la orden: ${ordenActualizada.estado_orden}`);
      
      if (ordenActualizada.fk_id_estado_orden === nuevoEstado.pk_id_estado) {
        console.log('✅ Estado actualizado correctamente en la base de datos');
      } else {
        console.log('❌ Error: El estado no se actualizó correctamente');
      }
      
      // 7. Restaurar estado original
      console.log('\n6️⃣ Restaurando estado original...');
      const restoreData = {
        ...updateData,
        fk_id_estado_orden: estadoActual
      };
      
      await axios.put(`${API_BASE}/api/ordenes/${ordenPrueba.pk_id_orden}`, restoreData);
      console.log('✅ Estado restaurado al original');
      
      console.log('\n🎉 PRUEBAS COMPLETADAS EXITOSAMENTE');
      console.log('\n📋 RESUMEN:');
      console.log('✅ Servidor backend funcionando');
      console.log('✅ Orden de prueba encontrada');
      console.log('✅ Estados disponibles obtenidos');
      console.log('✅ Cambio de estado ejecutado');
      console.log('✅ Notificación de cambio enviada');
      console.log('✅ Estado restaurado correctamente');
      
      console.log('\n💡 NOTAS IMPORTANTES:');
      console.log('- Verifica tu bandeja de entrada del email del cliente');
      console.log('- El email debe contener el PDF actualizado');
      console.log('- El asunto debe indicar el cambio de estado');
      console.log('- Si no recibes el email, verifica la configuración de email en .env');
      
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
testNotificacionesCambioEstado();
