-- ========================================
-- MIGRACIÓN: Agregar sistema de roles
-- ========================================
-- Este script agrega la columna rol_usuario a la tabla tbl_usuarios
-- y asigna el rol 'admin' a todos los usuarios existentes
-- ========================================

USE taller_mecanico;

-- Agregar columna de rol
ALTER TABLE tbl_usuarios 
ADD COLUMN rol_usuario ENUM('admin', 'editor', 'mecanico') 
DEFAULT 'mecanico' 
NOT NULL
AFTER pregunta_seguridad_usuario;

-- Asignar rol 'admin' a todos los usuarios existentes
UPDATE tbl_usuarios 
SET rol_usuario = 'admin' 
WHERE rol_usuario = 'mecanico';

-- Verificar que se aplicó correctamente
SELECT pk_id_usuarios, nombre_usuario, email_usuario, rol_usuario 
FROM tbl_usuarios;
