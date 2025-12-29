-- Script para agregar columna token_publico a tbl_ordenes
-- Este token será único y se usará para generar enlaces públicos por orden

ALTER TABLE tbl_ordenes 
ADD COLUMN token_publico VARCHAR(255) UNIQUE NULL AFTER video;

-- Crear índice para mejorar búsquedas por token
CREATE INDEX idx_token_publico ON tbl_ordenes(token_publico);

-- Nota: Los tokens se generarán automáticamente al crear nuevas órdenes
-- Para órdenes existentes, se puede generar un token con:
-- UPDATE tbl_ordenes SET token_publico = UUID() WHERE token_publico IS NULL;

