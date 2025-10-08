# 📋 INSTRUCCIONES: MIGRACIÓN NIVEL DE COMBUSTIBLE

## 🎯 OBJETIVO

Cambiar los valores del campo `nivel_combustible_orden` de inglés a español con fracciones:

| **Antes** | **Después** |
|----------|------------|
| `Empty` | `Reserva` |
| `Low` | `1/4` |
| `Medium` | `Medio` |
| `High` | `3/4` |
| `Full` | `Full` |

---

## 📊 DATOS ACTUALES EN TU BD

Según la verificación realizada:

| **Valor** | **Cantidad** |
|----------|-------------|
| `Low` | 5 |
| `Medium` | 10 |
| `High` | 3 |
| `Full` | 1 |
| **TOTAL** | **19 órdenes** |

---

## 🚀 PASOS PARA EJECUTAR LA MIGRACIÓN

### **1️⃣ ABRIR MYSQL WORKBENCH O GESTOR DE BD**

Conéctate a tu base de datos de Railway.

---

### **2️⃣ EJECUTAR EL SCRIPT DE MIGRACIÓN**

**Opción A: Ejecutar todo de una vez (recomendado)**

1. Abre el archivo `migration_nivel_combustible.sql`
2. Copia todo el contenido
3. Pega en MySQL Workbench
4. Ejecuta todo el script (Ctrl+Shift+Enter)

**Opción B: Ejecutar paso a paso**

1. Ejecuta cada bloque del script uno por uno
2. Verifica los resultados intermedios
3. Continúa solo si todo está correcto

---

### **3️⃣ VERIFICAR RESULTADO**

Después de ejecutar el script, deberías ver:

```
nivel_combustible_orden | total
------------------------+-------
1/4                     | 5
Medio                   | 10
3/4                     | 3
Full                    | 1
```

---

## ✅ CAMBIOS EN EL CÓDIGO (YA REALIZADOS)

### **Frontend:**

#### **1. `frontend/src/Ordenes.jsx`**
- ✅ Actualizado valor por defecto: `'Medium'` → `'Medio'`
- ✅ Actualizado combobox con nuevos valores:
  ```jsx
  <option value="Reserva">⛽ Reserva</option>
  <option value="1/4">📊 1/4</option>
  <option value="Medio">📊 Medio</option>
  <option value="3/4">📊 3/4</option>
  <option value="Full">✅ Full</option>
  ```

#### **2. `frontend/src/ImprimirOrden.jsx`**
- ✅ Actualizada función `formatearCombustible()`:
  ```javascript
  const niveles = {
    'Reserva': 'Reserva',
    '1/4': '1/4',
    'Medio': 'Medio',
    '3/4': '3/4',
    'Full': 'Full'
  };
  ```

### **Backend:**

#### **3. `backend/services/pdfGenerator.js`**
- ✅ No requiere cambios - muestra valor directo
- ✅ Los nuevos valores ya están en español

#### **4. `backend/services/reportService.js`**
- ✅ No requiere cambios - muestra valor directo
- ✅ Los reportes PDF y Excel mostrarán los nuevos valores automáticamente

---

## 📝 MAPEO DE CONVERSIÓN

```sql
UPDATE tbl_ordenes 
SET nivel_combustible_nuevo = CASE nivel_combustible_orden
    WHEN 'Low' THEN '1/4'          -- 5 registros
    WHEN 'Medium' THEN 'Medio'     -- 10 registros
    WHEN 'High' THEN '3/4'         -- 3 registros
    WHEN 'Full' THEN 'Full'        -- 1 registro
    WHEN 'Empty' THEN 'Reserva'    -- 0 registros (por si acaso)
    ELSE 'Medio'
END;
```

---

## ⚠️ IMPORTANTE

### **Antes de ejecutar:**
- 🔒 **Backup recomendado** (Railway hace backups automáticos, pero siempre es mejor)
- ⏸️ **No ejecutes en horario pico** (si hay usuarios activos)

### **Después de ejecutar:**
- 🔄 **Reinicia el backend** en Railway (puede ser necesario)
- 🧪 **Prueba crear una nueva orden** y verifica que el combobox funcione
- 📊 **Verifica que las órdenes existentes** muestren los nuevos valores
- 🖨️ **Genera un PDF de prueba** para confirmar

---

## 🔄 ROLLBACK (Por si algo sale mal)

Si necesitas revertir los cambios (aunque no debería ser necesario):

```sql
-- ROLLBACK: Volver a valores en inglés
ALTER TABLE tbl_ordenes 
ADD COLUMN nivel_combustible_temp ENUM('Empty', 'Low', 'Medium', 'High', 'Full') NULL;

UPDATE tbl_ordenes 
SET nivel_combustible_temp = CASE nivel_combustible_orden
    WHEN 'Reserva' THEN 'Empty'
    WHEN '1/4' THEN 'Low'
    WHEN 'Medio' THEN 'Medium'
    WHEN '3/4' THEN 'High'
    WHEN 'Full' THEN 'Full'
END;

ALTER TABLE tbl_ordenes 
MODIFY COLUMN nivel_combustible_temp ENUM('Empty', 'Low', 'Medium', 'High', 'Full') NOT NULL;

ALTER TABLE tbl_ordenes 
DROP COLUMN nivel_combustible_orden;

ALTER TABLE tbl_ordenes 
CHANGE COLUMN nivel_combustible_temp nivel_combustible_orden ENUM('Empty', 'Low', 'Medium', 'High', 'Full') NOT NULL;
```

---

## ✅ CHECKLIST

- [ ] **Backup creado** (opcional pero recomendado)
- [ ] **Script ejecutado** en la base de datos
- [ ] **Verificación post-migración** realizada
- [ ] **Frontend actualizado** (ya está listo)
- [ ] **Backend reiniciado** en Railway
- [ ] **Prueba de creación de orden** exitosa
- [ ] **Prueba de PDF** exitosa
- [ ] **Prueba de reportes** exitosa

---

## 🎉 RESULTADO FINAL

### **Combobox mostrará:**
```
⛽ Reserva
📊 1/4
📊 Medio
📊 3/4
✅ Full
```

### **Base de datos almacenará:**
```
Reserva, 1/4, Medio, 3/4, Full
```

### **PDFs y reportes mostrarán:**
```
Nivel de Combustible: 1/4
Nivel de Combustible: Medio
Nivel de Combustible: 3/4
Nivel de Combustible: Full
```

---

## 🆘 SOPORTE

Si encuentras algún problema durante la migración:

1. **No ejecutes el siguiente paso** del script
2. **Toma screenshot** del error
3. **Verifica** qué paso falló
4. **Contacta** antes de continuar

---

**Fecha de creación**: 08 de octubre de 2025  
**Versión**: 1.0  
**Estado**: ✅ Listo para ejecutar

