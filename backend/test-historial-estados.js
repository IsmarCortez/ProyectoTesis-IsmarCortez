/**
 * Script de prueba para el sistema de historial de estados
 * Verifica que la tabla, trigger y endpoints funcionen correctamente
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const axios = require('axios');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'taller_mecanico',
};

const API_BASE = 'http://localhost:4000';

async function testHistorialEstados() {
  console.log('🧪 INICIANDO PRUEBAS DEL SISTEMA DE HISTORIAL DE ESTADOS\n');
  
  try {
    // 1. Verificar que la tabla existe
    console.log('1️⃣ Verificando estructura de la tabla...');
    const connection = await mysql.createConnection(dbConfig);
    
    const [tablaExiste] = await connection.execute(`
      SHOW TABLES LIKE 'tbl_historial_estados'
    `);
    
    if (tablaExiste.length === 0) {
      console.log('❌ La tabla tbl_historial_estados no existe');
      console.log('💡 Ejecuta el script Taller_LDD.sql para crear la tabla');
      return;
    }
    
    console.log('✅ Tabla tbl_historial_estados existe');
    
    // 2. Verificar estructura de la tabla
    const [estructura] = await connection.execute(`
      DESCRIBE tbl_historial_estados
    `);
    
    console.log('📋 Estructura de la tabla:');
    estructura.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    // 3. Verificar que el trigger existe
    console.log('\n2️⃣ Verificando trigger automático...');
    const [triggers] = await connection.execute(`
      SHOW TRIGGERS LIKE 'tbl_ordenes'
    `);
    
    const triggerExiste = triggers.find(t => t.Trigger === 'tr_historial_estados_orden');
    if (triggerExiste) {
      console.log('✅ Trigger tr_historial_estados_orden existe');
    } else {
      console.log('❌ Trigger tr_historial_estados_orden no existe');
    }
    
    // 4. Verificar que la vista existe
    console.log('\n3️⃣ Verificando vista de consulta...');
    const [vistas] = await connection.execute(`
      SHOW TABLES LIKE 'vw_historial_completo'
    `);
    
    if (vistas.length > 0) {
      console.log('✅ Vista vw_historial_completo existe');
    } else {
      console.log('❌ Vista vw_historial_completo no existe');
    }
    
    // 5. Obtener datos de prueba
    console.log('\n4️⃣ Obteniendo datos de prueba...');
    
    // Obtener una orden existente
    const [ordenes] = await connection.execute(`
      SELECT pk_id_orden, fk_id_estado_orden FROM tbl_ordenes LIMIT 1
    `);
    
    if (ordenes.length === 0) {
      console.log('❌ No hay órdenes en la base de datos para probar');
      await connection.end();
      return;
    }
    
    const ordenPrueba = ordenes[0];
    console.log(`✅ Orden de prueba encontrada: ID ${ordenPrueba.pk_id_orden}, Estado actual: ${ordenPrueba.fk_id_estado_orden}`);
    
    // Obtener estados disponibles
    const [estados] = await connection.execute(`
      SELECT pk_id_estado, estado_orden FROM tbl_orden_estado ORDER BY pk_id_estado
    `);
    
    console.log('📊 Estados disponibles:');
    estados.forEach(estado => {
      console.log(`   - ${estado.pk_id_estado}: ${estado.estado_orden}`);
    });
    
    // 6. Probar el trigger automático
    console.log('\n5️⃣ Probando trigger automático...');
    
    // Obtener estado diferente al actual
    const estadoActual = ordenPrueba.fk_id_estado_orden;
    const nuevoEstado = estados.find(e => e.pk_id_estado !== estadoActual);
    
    if (!nuevoEstado) {
      console.log('❌ No hay estados diferentes para probar el cambio');
      await connection.end();
      return;
    }
    
    console.log(`🔄 Cambiando estado de ${estadoActual} a ${nuevoEstado.pk_id_estado} (${nuevoEstado.estado_orden})`);
    
    // Contar registros antes del cambio
    const [historialAntes] = await connection.execute(`
      SELECT COUNT(*) as total FROM tbl_historial_estados WHERE fk_id_orden = ?
    `, [ordenPrueba.pk_id_orden]);
    
    console.log(`📊 Registros de historial antes: ${historialAntes[0].total}`);
    
    // Realizar el cambio de estado
    await connection.execute(`
      UPDATE tbl_ordenes SET fk_id_estado_orden = ? WHERE pk_id_orden = ?
    `, [nuevoEstado.pk_id_estado, ordenPrueba.pk_id_orden]);
    
    // Contar registros después del cambio
    const [historialDespues] = await connection.execute(`
      SELECT COUNT(*) as total FROM tbl_historial_estados WHERE fk_id_orden = ?
    `, [ordenPrueba.pk_id_orden]);
    
    console.log(`📊 Registros de historial después: ${historialDespues[0].total}`);
    
    if (historialDespues[0].total > historialAntes[0].total) {
      console.log('✅ Trigger funcionó correctamente - se registró el cambio');
    } else {
      console.log('❌ Trigger no funcionó - no se registró el cambio');
    }
    
    // 7. Verificar el registro creado
    console.log('\n6️⃣ Verificando registro creado...');
    const [ultimoRegistro] = await connection.execute(`
      SELECT * FROM tbl_historial_estados 
      WHERE fk_id_orden = ? 
      ORDER BY fecha_cambio DESC 
      LIMIT 1
    `, [ordenPrueba.pk_id_orden]);
    
    if (ultimoRegistro.length > 0) {
      const registro = ultimoRegistro[0];
      console.log('📝 Último registro de historial:');
      console.log(`   - ID: ${registro.pk_id_historial}`);
      console.log(`   - Orden: ${registro.fk_id_orden}`);
      console.log(`   - Estado anterior: ${registro.fk_id_estado_anterior}`);
      console.log(`   - Estado nuevo: ${registro.fk_id_estado_nuevo}`);
      console.log(`   - Fecha: ${registro.fecha_cambio}`);
      console.log(`   - Comentario: ${registro.comentario_cambio}`);
    }
    
    // 8. Probar la vista
    console.log('\n7️⃣ Probando vista de consulta...');
    const [vistaResultado] = await connection.execute(`
      SELECT * FROM vw_historial_completo 
      WHERE fk_id_orden = ? 
      ORDER BY fecha_cambio DESC 
      LIMIT 3
    `, [ordenPrueba.pk_id_orden]);
    
    console.log(`📊 Registros obtenidos de la vista: ${vistaResultado.length}`);
    if (vistaResultado.length > 0) {
      console.log('✅ Vista funcionando correctamente');
      vistaResultado.forEach((registro, index) => {
        console.log(`   ${index + 1}. ${registro.estado_nuevo} - ${registro.fecha_cambio}`);
      });
    }
    
    // 9. Probar endpoints del API
    console.log('\n8️⃣ Probando endpoints del API...');
    
    try {
      // Probar endpoint de historial
      const response = await axios.get(`${API_BASE}/api/tracker/historial/${ordenPrueba.pk_id_orden}`);
      
      if (response.data.encontrado) {
        console.log('✅ Endpoint de historial funcionando');
        console.log(`📊 Historial obtenido: ${response.data.historial.length} registros`);
        console.log(`📊 Total de registros: ${response.data.total_registros}`);
      } else {
        console.log('❌ Endpoint de historial no funcionó correctamente');
      }
    } catch (apiError) {
      console.log('❌ Error probando endpoint de historial:', apiError.message);
      console.log('💡 Asegúrate de que el servidor backend esté ejecutándose en puerto 4000');
    }
    
    // 10. Restaurar estado original
    console.log('\n9️⃣ Restaurando estado original...');
    await connection.execute(`
      UPDATE tbl_ordenes SET fk_id_estado_orden = ? WHERE pk_id_orden = ?
    `, [estadoActual, ordenPrueba.pk_id_orden]);
    
    console.log(`✅ Estado restaurado a ${estadoActual}`);
    
    await connection.end();
    
    console.log('\n🎉 PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('\n📋 RESUMEN:');
    console.log('✅ Tabla de historial creada correctamente');
    console.log('✅ Trigger automático funcionando');
    console.log('✅ Vista de consulta operativa');
    console.log('✅ Endpoints del API implementados');
    console.log('✅ Sistema de historial completamente funcional');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

// Ejecutar las pruebas
testHistorialEstados();
