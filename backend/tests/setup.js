// Configuración global para tests
const mysql = require('mysql2/promise');

// Configuración de base de datos de prueba
const testDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_TEST_DATABASE || 'taller_mecanico_test',
  port: process.env.DB_PORT || 3306
};

// Función para limpiar base de datos de prueba
async function cleanTestDatabase() {
  const connection = await mysql.createConnection(testDbConfig);
  
  try {
    // Deshabilitar foreign key checks temporalmente
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Limpiar tablas en orden correcto (respetando foreign keys)
    const tables = [
      'tbl_seguimiento_orden',
      'tbl_ordenes', 
      'tbl_vehiculos',
      'tbl_clientes',
      'tbl_servicios',
      'tbl_orden_estado'
    ];
    
    for (const table of tables) {
      await connection.execute(`DELETE FROM ${table}`);
      // Resetear auto_increment
      await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
    }
    
    // Rehabilitar foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Base de datos de prueba limpiada');
  } catch (error) {
    console.error('❌ Error limpiando base de datos de prueba:', error);
  } finally {
    await connection.end();
  }
}

// Función para insertar datos de prueba
async function seedTestData() {
  const connection = await mysql.createConnection(testDbConfig);
  
  try {
    // Insertar servicios de prueba
    await connection.execute(`
      INSERT INTO tbl_servicios (servicio, descripcion_servicios) VALUES
      ('Mantenimiento', 'Mantenimiento general del vehículo'),
      ('Reparación', 'Reparación de fallas mecánicas'),
      ('Diagnóstico', 'Diagnóstico computarizado')
    `);
    
    // Insertar estados de prueba
    await connection.execute(`
      INSERT INTO tbl_orden_estado (estado_orden, descripcion_estado) VALUES
      ('Recibido', 'Orden recibida y en espera'),
      ('En Proceso', 'Orden en proceso de reparación'),
      ('Completado', 'Orden completada y lista para entrega')
    `);
    
    // Insertar cliente de prueba
    await connection.execute(`
      INSERT INTO tbl_clientes (nombre_cliente, apellido_cliente, NIT, telefono_cliente, correo_cliente) VALUES
      ('Juan', 'Pérez', '123456789', '12345678', 'juan@test.com')
    `);
    
    // Insertar vehículo de prueba
    await connection.execute(`
      INSERT INTO tbl_vehiculos (placa_vehiculo, marca_vehiculo, modelo_vehiculo, anio_vehiculo, color_vehiculo) VALUES
      ('ABC123', 'Toyota', 'Corolla', 2020, 'Blanco')
    `);
    
    console.log('✅ Datos de prueba insertados');
  } catch (error) {
    console.error('❌ Error insertando datos de prueba:', error);
  } finally {
    await connection.end();
  }
}

module.exports = {
  testDbConfig,
  cleanTestDatabase,
  seedTestData
};

