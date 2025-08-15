-- Script para verificar y crear las tablas necesarias
USE taller_mecanico;

-- Verificar si la tabla tbl_servicios existe
CREATE TABLE IF NOT EXISTS tbl_servicios (
    pk_id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    servicio VARCHAR(50),
    descripcion_servicios varchar(100)
);

-- Verificar si la tabla tbl_orden_estado existe
CREATE TABLE IF NOT EXISTS tbl_orden_estado (
    pk_id_estado INT AUTO_INCREMENT PRIMARY KEY,
    estado_orden VARCHAR(50),
    descripcion_estado varchar(100)
);

-- Insertar datos de prueba si las tablas están vacías
INSERT IGNORE INTO tbl_servicios (servicio, descripcion_servicios) VALUES
('Cambio de aceite', 'Servicio de cambio de aceite y filtro'),
('Frenos', 'Revisión y reparación del sistema de frenos'),
('Suspensión', 'Mantenimiento del sistema de suspensión'),
('Motor', 'Diagnóstico y reparación de problemas del motor');

INSERT IGNORE INTO tbl_orden_estado (estado_orden, descripcion_estado) VALUES
('Pendiente', 'Orden recibida, pendiente de revisión'),
('En Proceso', 'Orden en proceso de reparación'),
('Completado', 'Orden completada y lista para entrega'),
('Cancelado', 'Orden cancelada por el cliente');

-- Verificar datos
SELECT 'Servicios:' as tabla, COUNT(*) as cantidad FROM tbl_servicios
UNION ALL
SELECT 'Estados:', COUNT(*) FROM tbl_orden_estado;

-- Mostrar datos
SELECT * FROM tbl_servicios;
SELECT * FROM tbl_orden_estado; 