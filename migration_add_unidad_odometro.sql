-- ============================================================================
-- MIGRACIÓN: Agregar columna unidad_odometro a tbl_ordenes
-- Fecha: 2025-10-07
-- Descripción: Añade campo para especificar si el odómetro está en km o millas
-- ============================================================================

-- Agregar columna unidad_odometro después de odometro_auto_cliente_orden
ALTER TABLE tbl_ordenes 
ADD COLUMN unidad_odometro ENUM('km', 'millas') DEFAULT 'km' 
AFTER odometro_auto_cliente_orden;

-- Verificar que la columna se agregó correctamente
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'tbl_ordenes' 
AND COLUMN_NAME = 'unidad_odometro';

-- Actualizar todas las órdenes existentes para que tengan 'km' como valor predeterminado
-- (Esto es redundante ya que el DEFAULT ya lo hace, pero es por seguridad)
UPDATE tbl_ordenes 
SET unidad_odometro = 'km' 
WHERE unidad_odometro IS NULL;

-- Verificar cuántas órdenes tienen cada unidad
SELECT unidad_odometro, COUNT(*) as total 
FROM tbl_ordenes 
GROUP BY unidad_odometro;

-- ============================================================================
-- NOTAS:
-- 1. Esta migración es segura y no elimina datos existentes
-- 2. Todas las órdenes existentes se configuran con 'km' (predeterminado en Guatemala)
-- 3. Las nuevas órdenes podrán especificar 'km' o 'millas'
-- ============================================================================

