#!/usr/bin/env node

/**
 * Script para actualizar URLs de Cloudinary de cuenta anterior a nueva cuenta
 * 
 * Este script actualiza las URLs en la base de datos para que apunten
 * a la nueva cuenta de Cloudinary.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Configuración de Cloudinary
const OLD_CLOUD_NAME = 'dseu2xtum'; // Cuenta anterior
const NEW_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME; // Nueva cuenta

async function updateCloudinaryUrls() {
  console.log('🔄 ACTUALIZANDO URLs DE CLOUDINARY');
  console.log('==================================');
  console.log(`📤 Cuenta anterior: ${OLD_CLOUD_NAME}`);
  console.log(`📥 Cuenta nueva: ${NEW_CLOUD_NAME}`);
  console.log('');

  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Obtener todas las órdenes con URLs de la cuenta anterior
    const [rows] = await connection.execute(`
      SELECT pk_id_orden, imagen_1, imagen_2, imagen_3, imagen_4, video
      FROM tbl_ordenes 
      WHERE imagen_1 LIKE '%${OLD_CLOUD_NAME}%'
         OR imagen_2 LIKE '%${OLD_CLOUD_NAME}%'
         OR imagen_3 LIKE '%${OLD_CLOUD_NAME}%'
         OR imagen_4 LIKE '%${OLD_CLOUD_NAME}%'
         OR video LIKE '%${OLD_CLOUD_NAME}%'
    `);

    console.log(`📋 Encontradas ${rows.length} órdenes con URLs de la cuenta anterior`);

    if (rows.length === 0) {
      console.log('✅ No hay URLs que actualizar');
      return;
    }

    let totalUpdated = 0;

    for (const orden of rows) {
      console.log(`\n🔄 Procesando orden #${orden.pk_id_orden}`);
      
      const campos = ['imagen_1', 'imagen_2', 'imagen_3', 'imagen_4', 'video'];
      const updates = [];
      
      for (const campo of campos) {
        if (orden[campo] && orden[campo].includes(OLD_CLOUD_NAME)) {
          // Reemplazar el cloud_name en la URL
          const newUrl = orden[campo].replace(OLD_CLOUD_NAME, NEW_CLOUD_NAME);
          updates.push(`${campo} = '${newUrl}'`);
          console.log(`  🔄 ${campo}: ${OLD_CLOUD_NAME} → ${NEW_CLOUD_NAME}`);
        }
      }
      
      if (updates.length > 0) {
        const updateQuery = `UPDATE tbl_ordenes SET ${updates.join(', ')} WHERE pk_id_orden = ?`;
        await connection.execute(updateQuery, [orden.pk_id_orden]);
        totalUpdated += updates.length;
        console.log(`  ✅ Orden #${orden.pk_id_orden} actualizada (${updates.length} campos)`);
      }
    }
    
    console.log(`\n🎉 Actualización completada:`);
    console.log(`   📊 Órdenes procesadas: ${rows.length}`);
    console.log(`   🔄 URLs actualizadas: ${totalUpdated}`);
    
  } catch (error) {
    console.error('❌ Error actualizando URLs:', error);
  } finally {
    await connection.end();
  }
}

// Ejecutar actualización
updateCloudinaryUrls()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error ejecutando script:', error);
    process.exit(1);
  });
