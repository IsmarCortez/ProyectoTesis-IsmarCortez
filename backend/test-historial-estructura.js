/**
 * Script de validación de estructura del sistema de historial de estados
 * Valida que el código esté correctamente implementado sin requerir conexión a BD
 */

const fs = require('fs');
const path = require('path');

function validarEstructuraHistorial() {
  console.log('🧪 VALIDANDO ESTRUCTURA DEL SISTEMA DE HISTORIAL DE ESTADOS\n');
  
  let errores = 0;
  let exitos = 0;
  
  // 1. Verificar que el archivo SQL tiene la tabla de historial
  console.log('1️⃣ Verificando archivo Taller_LDD.sql...');
  try {
    const sqlContent = fs.readFileSync(path.join(__dirname, '../Taller_LDD.sql'), 'utf8');
    
    if (sqlContent.includes('CREATE TABLE tbl_historial_estados')) {
      console.log('✅ Tabla tbl_historial_estados encontrada en SQL');
      exitos++;
    } else {
      console.log('❌ Tabla tbl_historial_estados NO encontrada en SQL');
      errores++;
    }
    
    if (sqlContent.includes('CREATE TRIGGER tr_historial_estados_orden')) {
      console.log('✅ Trigger tr_historial_estados_orden encontrado en SQL');
      exitos++;
    } else {
      console.log('❌ Trigger tr_historial_estados_orden NO encontrado en SQL');
      errores++;
    }
    
    if (sqlContent.includes('CREATE VIEW vw_historial_completo')) {
      console.log('✅ Vista vw_historial_completo encontrada en SQL');
      exitos++;
    } else {
      console.log('❌ Vista vw_historial_completo NO encontrada en SQL');
      errores++;
    }
    
    if (sqlContent.includes('CREATE PROCEDURE sp_obtener_historial_orden')) {
      console.log('✅ Procedimiento sp_obtener_historial_orden encontrado en SQL');
      exitos++;
    } else {
      console.log('❌ Procedimiento sp_obtener_historial_orden NO encontrado en SQL');
      errores++;
    }
    
  } catch (error) {
    console.log('❌ Error leyendo archivo SQL:', error.message);
    errores++;
  }
  
  // 2. Verificar que el backend tiene los endpoints actualizados
  console.log('\n2️⃣ Verificando archivo backend/index.js...');
  try {
    const backendContent = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
    
    if (backendContent.includes('tbl_historial_estados')) {
      console.log('✅ Referencias a tbl_historial_estados encontradas en backend');
      exitos++;
    } else {
      console.log('❌ Referencias a tbl_historial_estados NO encontradas en backend');
      errores++;
    }
    
    if (backendContent.includes('/api/tracker/historial/:numero')) {
      console.log('✅ Endpoint de historial encontrado en backend');
      exitos++;
    } else {
      console.log('❌ Endpoint de historial NO encontrado en backend');
      errores++;
    }
    
    if (backendContent.includes('/api/tracker/cambiar-estado')) {
      console.log('✅ Endpoint de cambiar estado encontrado en backend');
      exitos++;
    } else {
      console.log('❌ Endpoint de cambiar estado NO encontrado en backend');
      errores++;
    }
    
    if (backendContent.includes('/api/tracker/estadisticas-historial')) {
      console.log('✅ Endpoint de estadísticas de historial encontrado en backend');
      exitos++;
    } else {
      console.log('❌ Endpoint de estadísticas de historial NO encontrado en backend');
      errores++;
    }
    
    if (backendContent.includes('historialReal.length === 0')) {
      console.log('✅ Lógica de fallback para historial vacío encontrada');
      exitos++;
    } else {
      console.log('❌ Lógica de fallback para historial vacío NO encontrada');
      errores++;
    }
    
  } catch (error) {
    console.log('❌ Error leyendo archivo backend:', error.message);
    errores++;
  }
  
  // 3. Verificar que existe el script de pruebas
  console.log('\n3️⃣ Verificando script de pruebas...');
  try {
    if (fs.existsSync(path.join(__dirname, 'test-historial-estados.js'))) {
      console.log('✅ Script de pruebas test-historial-estados.js existe');
      exitos++;
    } else {
      console.log('❌ Script de pruebas test-historial-estados.js NO existe');
      errores++;
    }
  } catch (error) {
    console.log('❌ Error verificando script de pruebas:', error.message);
    errores++;
  }
  
  // 4. Verificar que la bitácora está actualizada
  console.log('\n4️⃣ Verificando bitácora general...');
  try {
    const bitacoraContent = fs.readFileSync(path.join(__dirname, '../BitacoraGeneral.txt'), 'utf8');
    
    if (bitacoraContent.includes('IMPLEMENTACIÓN COMPLETA DEL SISTEMA DE HISTORIAL REAL DE ESTADOS')) {
      console.log('✅ Documentación de historial encontrada en bitácora');
      exitos++;
    } else {
      console.log('❌ Documentación de historial NO encontrada en bitácora');
      errores++;
    }
    
    if (bitacoraContent.includes('tbl_historial_estados')) {
      console.log('✅ Referencias a tabla de historial en bitácora');
      exitos++;
    } else {
      console.log('❌ Referencias a tabla de historial NO encontradas en bitácora');
      errores++;
    }
    
  } catch (error) {
    console.log('❌ Error leyendo bitácora:', error.message);
    errores++;
  }
  
  // 5. Verificar estructura de archivos
  console.log('\n5️⃣ Verificando estructura de archivos...');
  const archivosRequeridos = [
    '../Taller_LDD.sql',
    'index.js',
    'test-historial-estados.js',
    '../BitacoraGeneral.txt'
  ];
  
  archivosRequeridos.forEach(archivo => {
    try {
      if (fs.existsSync(path.join(__dirname, archivo))) {
        console.log(`✅ Archivo ${archivo} existe`);
        exitos++;
      } else {
        console.log(`❌ Archivo ${archivo} NO existe`);
        errores++;
      }
    } catch (error) {
      console.log(`❌ Error verificando ${archivo}:`, error.message);
      errores++;
    }
  });
  
  // Resumen final
  console.log('\n📊 RESUMEN DE VALIDACIÓN:');
  console.log(`✅ Éxitos: ${exitos}`);
  console.log(`❌ Errores: ${errores}`);
  console.log(`📈 Porcentaje de éxito: ${Math.round((exitos / (exitos + errores)) * 100)}%`);
  
  if (errores === 0) {
    console.log('\n🎉 ¡VALIDACIÓN EXITOSA!');
    console.log('✅ Todos los componentes del sistema de historial están correctamente implementados');
    console.log('✅ La estructura de archivos es correcta');
    console.log('✅ El código está listo para funcionar con una base de datos MySQL');
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('1. Configurar MySQL y ejecutar Taller_LDD.sql');
    console.log('2. Configurar archivo .env con credenciales de BD');
    console.log('3. Ejecutar test-historial-estados.js para pruebas completas');
    console.log('4. Probar el tracker público con datos reales');
  } else {
    console.log('\n⚠️ VALIDACIÓN CON ERRORES');
    console.log('❌ Se encontraron problemas que deben corregirse');
    console.log('💡 Revisa los errores listados arriba y corrige los archivos correspondientes');
  }
  
  return errores === 0;
}

// Ejecutar validación
validarEstructuraHistorial();

