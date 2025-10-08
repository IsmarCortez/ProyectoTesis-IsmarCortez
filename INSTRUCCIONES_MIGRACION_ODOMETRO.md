# 📋 INSTRUCCIONES DE MIGRACIÓN - UNIDAD DE ODÓMETRO

## ✅ IMPLEMENTACIÓN COMPLETADA

Se ha implementado exitosamente la funcionalidad de **radio buttons para seleccionar la unidad del odómetro** (kilómetros o millas).

---

## 🔐 BACKUP DE SEGURIDAD

Se creó un backup completo antes de realizar los cambios:
- **Ubicación**: `backups/odometro_backup_20251007_181454/`
- **Archivos respaldados**:
  - `index.js.backup`
  - `Ordenes.jsx.backup`
  - `pdfGenerator.js.backup`
  - `reportService.js.backup`
  - `TrackerPublico.jsx.backup`
  - `Taller_LDD.sql.backup`

**Si algo sale mal**, puedes restaurar los archivos desde este directorio.

---

## 🗄️ MIGRACIÓN DE BASE DE DATOS

### **⚠️ IMPORTANTE: EJECUTAR ANTES DE DESPLEGAR**

Debes ejecutar el siguiente script SQL en tu base de datos de **Railway**:

### **Opción 1: Usar el archivo de migración**
```bash
# El archivo ya está creado: migration_add_unidad_odometro.sql
# Ejecútalo en tu base de datos de Railway
```

### **Opción 2: Ejecutar SQL manualmente**
```sql
-- Agregar columna unidad_odometro a tbl_ordenes
ALTER TABLE tbl_ordenes 
ADD COLUMN unidad_odometro ENUM('km', 'millas') DEFAULT 'km' 
AFTER odometro_auto_cliente_orden;

-- Verificar que se agregó correctamente
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'tbl_ordenes' 
AND COLUMN_NAME = 'unidad_odometro';
```

---

## 📝 CAMBIOS REALIZADOS

### **1. BASE DE DATOS**
- ✅ Agregada columna `unidad_odometro ENUM('km', 'millas') DEFAULT 'km'`
- ✅ Actualizado `Taller_LDD.sql` para futuras instalaciones
- ✅ Creado script de migración `migration_add_unidad_odometro.sql`

### **2. BACKEND**
#### **`backend/index.js`**
- ✅ POST `/api/ordenes`: Incluye `unidad_odometro` en INSERT
- ✅ PUT `/api/ordenes/:id`: Incluye `unidad_odometro` en UPDATE
- ✅ GET `/api/ordenes`: Selecciona `unidad_odometro` en consulta

#### **`backend/services/pdfGenerator.js`**
- ✅ Actualizado formato: `45,000 km` o `28,000 mi`

#### **`backend/services/reportService.js`**
- ✅ Reportes PDF: Incluyen unidad
- ✅ Reportes Excel: Incluyen unidad

### **3. FRONTEND**
#### **`frontend/src/Ordenes.jsx`**
- ✅ Agregado estado `unidad_odometro` con valor predeterminado `'km'`
- ✅ Radio buttons para seleccionar km/millas
- ✅ Actualizado `limpiarFormulario()` y `editarOrden()`
- ✅ FormData incluye `unidad_odometro`
- ✅ Tabla muestra: `45,000 km` o `28,000 mi`
- ✅ Modal muestra unidad correcta

---

## 🎨 INTERFAZ DE USUARIO

### **Formulario de Registro:**
```
┌────────────────────────────────────────┐
│ Odómetro del Auto del Cliente:        │
│ ┌──────────────────────────────────┐  │
│ │ 45000                            │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ◉ Kilómetros (km)  ○ Millas (mi)     │
└────────────────────────────────────────┘
```

### **Tabla de Órdenes:**
```
| Combustible | Odómetro      | Acciones |
|-------------|---------------|----------|
| Medium      | 45,000 km     | [Editar] |
| High        | 28,000 mi     | [Editar] |
```

---

## 🧪 PRUEBAS RECOMENDADAS

### **1. Crear Nueva Orden**
- [ ] Crear orden con km (predeterminado)
- [ ] Crear orden con millas
- [ ] Verificar que se guarda correctamente

### **2. Editar Orden Existente**
- [ ] Editar orden antigua (debe mostrar 'km' por defecto)
- [ ] Cambiar de km a millas
- [ ] Verificar que se actualiza correctamente

### **3. PDF y Reportes**
- [ ] Generar PDF de orden con km
- [ ] Generar PDF de orden con millas
- [ ] Generar reporte Excel
- [ ] Verificar que la unidad aparece correctamente

### **4. Visualización**
- [ ] Ver orden en tabla (unidad correcta)
- [ ] Ver orden en modal (unidad correcta)
- [ ] Imprimir orden (unidad correcta)

---

## 🚀 PASOS PARA DESPLEGAR

### **1. Base de Datos (Railway)**
```bash
# Conectarse a Railway y ejecutar:
mysql -h MYSQLHOST -u MYSQLUSER -p MYSQLDATABASE < migration_add_unidad_odometro.sql
```

### **2. Backend**
```bash
cd backend
# Los cambios ya están en index.js, pdfGenerator.js, reportService.js
# Solo hacer commit y push
git add .
git commit -m "feat: agregar selector de unidad de odómetro (km/millas)"
git push
```

### **3. Frontend**
```bash
cd frontend
# Los cambios ya están en Ordenes.jsx
# Solo hacer commit y push
git add .
git commit -m "feat: agregar radio buttons para unidad de odómetro"
git push
```

---

## ⚠️ COMPATIBILIDAD CON DATOS EXISTENTES

### **Órdenes Antiguas:**
- ✅ **Automáticamente se asignan 'km'** (valor predeterminado)
- ✅ **No hay pérdida de datos**
- ✅ **Retrocompatible** con el sistema existente

### **Ejemplo:**
```
Orden #1 (antigua): 45000 → Se mostrará como "45,000 km"
Orden #2 (nueva km): 50000 km → Se mostrará como "50,000 km"
Orden #3 (nueva mi): 30000 mi → Se mostrará como "30,000 mi"
```

---

## 🛠️ ROLLBACK (En caso de problemas)

### **Si necesitas revertir los cambios:**

#### **1. Restaurar archivos desde backup:**
```bash
cd backups/odometro_backup_20251007_181454/

# Restaurar backend
copy index.js.backup ../../backend/index.js
copy pdfGenerator.js.backup ../../backend/services/pdfGenerator.js
copy reportService.js.backup ../../backend/services/reportService.js

# Restaurar frontend
copy Ordenes.jsx.backup ../../frontend/src/Ordenes.jsx
copy TrackerPublico.jsx.backup ../../frontend/src/TrackerPublico.jsx

# Restaurar SQL
copy Taller_LDD.sql.backup ../../Taller_LDD.sql
```

#### **2. Eliminar columna de base de datos:**
```sql
ALTER TABLE tbl_ordenes DROP COLUMN unidad_odometro;
```

---

## 📊 VERIFICACIÓN POST-DESPLIEGUE

### **Checklist:**
- [ ] Migración SQL ejecutada correctamente
- [ ] Backend desplegado sin errores
- [ ] Frontend desplegado sin errores
- [ ] Registro de nueva orden funciona
- [ ] Edición de orden funciona
- [ ] PDFs se generan con unidad correcta
- [ ] Reportes incluyen unidad correcta
- [ ] Órdenes antiguas muestran 'km' por defecto

---

## 📞 SOPORTE

Si encuentras algún problema:
1. Revisa los logs del servidor
2. Verifica que la migración SQL se ejecutó
3. Comprueba que las variables de entorno están correctas
4. Restaura desde el backup si es necesario

---

## ✅ RESUMEN

**Estado**: ✅ IMPLEMENTACIÓN COMPLETA  
**Archivos modificados**: 6  
**Backup creado**: ✅ Sí  
**Migración SQL**: ⚠️ Pendiente de ejecutar  
**Linter**: ✅ Sin errores  
**Retrocompatibilidad**: ✅ Garantizada  

**¡La funcionalidad está lista para ser desplegada!** 🚀

