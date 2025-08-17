-- Script para agregar teléfono del usuario y vincularlo con órdenes
-- Ejecutar en la base de datos taller_mecanico

USE taller_mecanico;

-- 1. Agregar campo de teléfono a la tabla de usuarios
ALTER TABLE tbl_usuarios 
ADD COLUMN telefono_usuario VARCHAR(8) AFTER email_usuario;

-- 2. Agregar campo para vincular usuario con orden
ALTER TABLE tbl_ordenes 
ADD COLUMN fk_id_usuario INT AFTER fk_id_cliente;

-- 3. Agregar la foreign key para vincular usuario con orden
ALTER TABLE tbl_ordenes 
ADD CONSTRAINT fk_orden_usuario 
FOREIGN KEY (fk_id_usuario) REFERENCES tbl_usuarios(pk_id_usuarios);

-- 4. Actualizar usuarios existentes con un teléfono por defecto
UPDATE tbl_usuarios 
SET telefono_usuario = '12345678' 
WHERE telefono_usuario IS NULL;

-- 5. Asignar el usuario admin a todas las órdenes existentes (si las hay)
UPDATE tbl_ordenes 
SET fk_id_usuario = (SELECT pk_id_usuarios FROM tbl_usuarios WHERE email_usuario = 'admin@taller.com' LIMIT 1)
WHERE fk_id_usuario IS NULL;

-- 6. Verificar la estructura actualizada
DESCRIBE tbl_usuarios;
DESCRIBE tbl_ordenes;

-- 7. Mostrar la relación entre órdenes y usuarios
SELECT 
  o.pk_id_orden,
  o.fecha_ingreso_orden,
  u.nombre_usuario,
  u.telefono_usuario,
  c.nombre_cliente,
  v.placa_vehiculo
FROM tbl_ordenes o
LEFT JOIN tbl_usuarios u ON o.fk_id_usuario = u.pk_id_usuarios
LEFT JOIN tbl_clientes c ON o.fk_id_cliente = c.PK_id_cliente
LEFT JOIN tbl_vehiculos v ON o.fk_id_vehiculo = v.pk_id_vehiculo
ORDER BY o.pk_id_orden DESC;
