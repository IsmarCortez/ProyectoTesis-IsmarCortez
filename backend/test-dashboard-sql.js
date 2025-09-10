require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

async function testDashboardQueries() {
  try {
    console.log('🔍 Probando consultas SQL del dashboard...');
    
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a la base de datos establecida');

    // Probar consulta de vehículos
    console.log('\n📊 Probando consulta de vehículos más ingresados...');
    const [vehiculosStats] = await connection.execute(`
      SELECT 
        CONCAT(v.marca_vehiculo, ' ', v.modelo_vehiculo) as modelo_completo,
        v.marca_vehiculo,
        v.modelo_vehiculo,
        COUNT(o.pk_id_orden) as cantidad_ordenes
      FROM tbl_vehiculos v
      LEFT JOIN tbl_ordenes o ON v.pk_id_vehiculo = o.fk_id_vehiculo
      GROUP BY v.marca_vehiculo, v.modelo_vehiculo
      ORDER BY cantidad_ordenes DESC
      LIMIT 10
    `);
    console.log('✅ Consulta de vehículos exitosa:', vehiculosStats.length, 'resultados');

    // Probar consulta de estadísticas generales
    console.log('\n📊 Probando consulta de estadísticas generales...');
    const [estadisticasGenerales] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM tbl_clientes) as total_clientes,
        (SELECT COUNT(*) FROM tbl_vehiculos) as total_vehiculos,
        (SELECT COUNT(*) FROM tbl_ordenes) as total_ordenes,
        (SELECT COUNT(*) FROM tbl_ordenes WHERE fecha_ingreso_orden >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as ordenes_mes_actual,
        (SELECT COUNT(*) FROM tbl_ordenes WHERE fk_id_estado_orden = (SELECT pk_id_estado FROM tbl_orden_estado WHERE estado_orden = 'Completado')) as ordenes_completadas,
        (SELECT COUNT(*) FROM tbl_ordenes WHERE fk_id_estado_orden = (SELECT pk_id_estado FROM tbl_orden_estado WHERE estado_orden = 'Pendiente')) as ordenes_pendientes
    `);
    console.log('✅ Consulta de estadísticas generales exitosa:', estadisticasGenerales[0]);

    // Probar consulta de servicios
    console.log('\n📊 Probando consulta de servicios...');
    const [serviciosStats] = await connection.execute(`
      SELECT 
        s.servicio,
        COUNT(o.pk_id_orden) as cantidad_ordenes,
        ROUND((COUNT(o.pk_id_orden) * 100.0 / (SELECT COUNT(*) FROM tbl_ordenes)), 2) as porcentaje
      FROM tbl_servicios s
      LEFT JOIN tbl_ordenes o ON s.pk_id_servicio = o.fk_id_servicio
      GROUP BY s.pk_id_servicio, s.servicio
      ORDER BY cantidad_ordenes DESC
    `);
    console.log('✅ Consulta de servicios exitosa:', serviciosStats.length, 'resultados');

    // Probar consulta de estados
    console.log('\n📊 Probando consulta de estados...');
    const [estadosStats] = await connection.execute(`
      SELECT 
        e.estado_orden,
        COUNT(o.pk_id_orden) as cantidad_ordenes,
        ROUND((COUNT(o.pk_id_orden) * 100.0 / (SELECT COUNT(*) FROM tbl_ordenes)), 2) as porcentaje
      FROM tbl_orden_estado e
      LEFT JOIN tbl_ordenes o ON e.pk_id_estado = o.fk_id_estado_orden
      GROUP BY e.pk_id_estado, e.estado_orden
      ORDER BY cantidad_ordenes DESC
    `);
    console.log('✅ Consulta de estados exitosa:', estadosStats.length, 'resultados');

    await connection.end();
    console.log('\n🎉 ¡Todas las consultas SQL funcionan correctamente!');
    
  } catch (error) {
    console.error('❌ Error en las consultas SQL:', error.message);
    console.error('Detalles del error:', error);
  }
}

// Ejecutar las pruebas
testDashboardQueries();
