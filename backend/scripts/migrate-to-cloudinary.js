#!/usr/bin/env node

/**
 * Script de migración de archivos locales a Cloudinary
 * 
 * Este script migra todos los archivos de la carpeta uploads/ a Cloudinary
 * y actualiza la base de datos con las nuevas URLs.
 * 
 * Uso:
 * node scripts/migrate-to-cloudinary.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { uploadFile, isConfigured } = require('../services/cloudinaryService');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Configuración de rutas
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const BACKUP_DIR = path.join(__dirname, '../uploads-backup');

// Colores para console.log
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  progress: (msg) => console.log(`${colors.cyan}🔄 ${msg}${colors.reset}`)
};

// Función para crear backup de la carpeta uploads
const createBackup = async () => {
  log.info('Creando backup de la carpeta uploads...');
  
  if (!fs.existsSync(UPLOADS_DIR)) {
    log.warning('La carpeta uploads no existe, no se necesita backup');
    return;
  }
  
  if (fs.existsSync(BACKUP_DIR)) {
    log.warning('El backup ya existe, eliminando...');
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
  }
  
  fs.cpSync(UPLOADS_DIR, BACKUP_DIR, { recursive: true });
  log.success(`Backup creado en: ${BACKUP_DIR}`);
};

// Función para obtener todos los archivos de órdenes
const getOrderFiles = async (connection) => {
  log.info('Obteniendo archivos de órdenes de la base de datos...');
  
  const [rows] = await connection.execute(`
    SELECT pk_id_orden, imagen_1, imagen_2, imagen_3, imagen_4, video
    FROM tbl_ordenes
    WHERE imagen_1 != 'sin_imagen.jpg' 
       OR imagen_2 != 'sin_imagen.jpg'
       OR imagen_3 != 'sin_imagen.jpg'
       OR imagen_4 != 'sin_imagen.jpg'
       OR video != 'sin_video.mp4'
  `);
  
  const files = [];
  rows.forEach(order => {
    ['imagen_1', 'imagen_2', 'imagen_3', 'imagen_4', 'video'].forEach(field => {
      const filename = order[field];
      if (filename && filename !== 'sin_imagen.jpg' && filename !== 'sin_video.mp4') {
        files.push({
          orderId: order.pk_id_orden,
          field: field,
          filename: filename,
          filePath: path.join(UPLOADS_DIR, filename)
        });
      }
    });
  });
  
  log.success(`Encontrados ${files.length} archivos para migrar`);
  return files;
};

// Función para migrar un archivo a Cloudinary
const migrateFile = async (file) => {
  const { orderId, field, filename, filePath } = file;
  
  // Verificar si el archivo existe
  if (!fs.existsSync(filePath)) {
    log.warning(`Archivo no encontrado: ${filename}`);
    return null;
  }
  
  try {
    log.progress(`Migrando ${filename}...`);
    
    // Subir archivo a Cloudinary
    const result = await uploadFile(filePath, {
      folder: `taller-mecanico/ordenes/orden-${orderId}`,
      public_id: `orden-${orderId}-${field}-${Date.now()}`
    });
    
    if (result.success) {
      log.success(`✅ ${filename} → ${result.url}`);
      return {
        orderId,
        field,
        oldFilename: filename,
        newUrl: result.url,
        publicId: result.public_id
      };
    } else {
      log.error(`❌ Error subiendo ${filename}: ${result.error}`);
      return null;
    }
  } catch (error) {
    log.error(`❌ Error procesando ${filename}: ${error.message}`);
    return null;
  }
};

// Función para actualizar la base de datos
const updateDatabase = async (connection, migrations) => {
  log.info('Actualizando base de datos con nuevas URLs...');
  
  let updated = 0;
  let errors = 0;
  
  for (const migration of migrations) {
    if (!migration) continue;
    
    try {
      await connection.execute(
        `UPDATE tbl_ordenes SET ${migration.field} = ? WHERE pk_id_orden = ?`,
        [migration.newUrl, migration.orderId]
      );
      updated++;
    } catch (error) {
      log.error(`Error actualizando orden ${migration.orderId}: ${error.message}`);
      errors++;
    }
  }
  
  log.success(`Base de datos actualizada: ${updated} registros actualizados, ${errors} errores`);
};

// Función para generar reporte de migración
const generateReport = (migrations, startTime) => {
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  const successful = migrations.filter(m => m !== null).length;
  const failed = migrations.length - successful;
  
  const report = {
    timestamp: new Date().toISOString(),
    duration: `${duration}s`,
    totalFiles: migrations.length,
    successful,
    failed,
    migrations: migrations.filter(m => m !== null)
  };
  
  const reportPath = path.join(__dirname, `../migration-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log.info(`Reporte de migración guardado en: ${reportPath}`);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE MIGRACIÓN');
  console.log('='.repeat(50));
  console.log(`⏱️  Duración: ${duration}s`);
  console.log(`📁 Archivos totales: ${migrations.length}`);
  console.log(`✅ Exitosos: ${successful}`);
  console.log(`❌ Fallidos: ${failed}`);
  console.log(`📄 Reporte: ${reportPath}`);
  console.log('='.repeat(50));
};

// Función principal
const main = async () => {
  console.log(`${colors.bright}${colors.magenta}`);
  console.log('🚀 MIGRACIÓN A CLOUDINARY');
  console.log('========================');
  console.log(`${colors.reset}`);
  
  const startTime = Date.now();
  
  try {
    // Verificar configuración de Cloudinary
    if (!isConfigured()) {
      log.error('Cloudinary no está configurado. Verifica las variables de entorno.');
      process.exit(1);
    }
    
    log.info('Cloudinary configurado correctamente');
    
    // Crear backup
    await createBackup();
    
    // Conectar a la base de datos
    log.info('Conectando a la base de datos...');
    const connection = await mysql.createConnection(dbConfig);
    log.success('Conectado a la base de datos');
    
    // Obtener archivos a migrar
    const files = await getOrderFiles(connection);
    
    if (files.length === 0) {
      log.info('No hay archivos para migrar');
      await connection.end();
      return;
    }
    
    // Migrar archivos
    log.info(`Iniciando migración de ${files.length} archivos...`);
    const migrations = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      log.progress(`[${i + 1}/${files.length}] Procesando ${file.filename}...`);
      
      const migration = await migrateFile(file);
      migrations.push(migration);
      
      // Pequeña pausa para no sobrecargar Cloudinary
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Actualizar base de datos
    await updateDatabase(connection, migrations);
    
    // Cerrar conexión
    await connection.end();
    
    // Generar reporte
    generateReport(migrations, startTime);
    
    log.success('🎉 Migración completada exitosamente!');
    
  } catch (error) {
    log.error(`Error durante la migración: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };

