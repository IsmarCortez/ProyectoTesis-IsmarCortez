-- ============================================================================
-- MIGRACIÓN: Cambiar valores ENUM de nivel_combustible_orden
-- Fecha: 2025-10-08
-- Descripción: Cambiar valores de inglés a español con fracciones
-- Base de datos: Railway
-- ============================================================================

-- VALORES ACTUALES: Low, Medium, High, Full
-- VALORES NUEVOS: Reserva, 1/4, Medio, 3/4, Full

-- ============================================================================
-- VERIFICACIÓN PRE-MIGRACIÓN
-- ============================================================================
SELECT 'VALORES ANTES DE MIGRACIÓN:' as mensaje;
SELECT nivel_combustible_orden, COUNT(*) as total
FROM tbl_ordenes 
GROUP BY nivel_combustible_orden;

-- ============================================================================
-- PASO 1: Agregar columna temporal
-- ============================================================================
ALTER TABLE tbl_ordenes 
ADD COLUMN nivel_combustible_nuevo ENUM('Reserva', '1/4', 'Medio', '3/4', 'Full') NULL;

-- ============================================================================
-- PASO 2: Copiar y convertir datos (mapeo explícito)
-- ============================================================================
UPDATE tbl_ordenes 
SET nivel_combustible_nuevo = CASE nivel_combustible_orden
    WHEN 'Low' THEN '1/4'
    WHEN 'Medium' THEN 'Medio'
    WHEN 'High' THEN '3/4'
    WHEN 'Full' THEN 'Full'
    WHEN 'Empty' THEN 'Reserva'  -- Por si existe en el futuro
    ELSE 'Medio'  -- Valor por defecto para casos inesperados
END;

-- ============================================================================
-- VERIFICACIÓN INTERMEDIA
-- ============================================================================
SELECT 'VERIFICACIÓN DE CONVERSIÓN:' as mensaje;
SELECT 
    nivel_combustible_orden as valor_antiguo,
    nivel_combustible_nuevo as valor_nuevo,
    COUNT(*) as total
FROM tbl_ordenes 
GROUP BY nivel_combustible_orden, nivel_combustible_nuevo
ORDER BY nivel_combustible_orden;

-- ============================================================================
-- PASO 3: Hacer la nueva columna NOT NULL
-- ============================================================================
ALTER TABLE tbl_ordenes 
MODIFY COLUMN nivel_combustible_nuevo ENUM('Reserva', '1/4', 'Medio', '3/4', 'Full') NOT NULL;

-- ============================================================================
-- PASO 4: Eliminar columna antigua
-- ============================================================================
ALTER TABLE tbl_ordenes 
DROP COLUMN nivel_combustible_orden;

-- ============================================================================
-- PASO 5: Renombrar nueva columna al nombre original
-- ============================================================================
ALTER TABLE tbl_ordenes 
CHANGE COLUMN nivel_combustible_nuevo nivel_combustible_orden ENUM('Reserva', '1/4', 'Medio', '3/4', 'Full') NOT NULL;

-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================================
SELECT 'VALORES DESPUÉS DE MIGRACIÓN:' as mensaje;
SELECT nivel_combustible_orden, COUNT(*) as total
FROM tbl_ordenes 
GROUP BY nivel_combustible_orden
ORDER BY 
  CASE nivel_combustible_orden
    WHEN 'Reserva' THEN 1
    WHEN '1/4' THEN 2
    WHEN 'Medio' THEN 3
    WHEN '3/4' THEN 4
    WHEN 'Full' THEN 5
  END;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- nivel_combustible_orden | total
-- ------------------------+-------
-- 1/4                     | 5     (antes Low)
-- Medio                   | 10    (antes Medium)
-- 3/4                     | 3     (antes High)
-- Full                    | 1     (antes Full)
-- ============================================================================

