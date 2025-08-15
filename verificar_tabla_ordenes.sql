-- Script para verificar y crear la tabla de órdenes
USE taller_mecanico;

-- Verificar si la tabla tbl_ordenes existe
CREATE TABLE IF NOT EXISTS tbl_ordenes (
    -- Encabezado -------------------------
    pk_id_orden INT AUTO_INCREMENT PRIMARY KEY,
    fecha_ingreso_orden DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- ------------------------------------
    -- Datos vehiculo y cliente -----------
    fk_id_vehiculo INT,
    fk_id_cliente INT,
    -- ------------------------------------
    --  Servicios -------------------------
    fk_id_servicio int,
    -- ------------------------------------
    -- Datos orden -----------------------
    comentario_cliente_orden TEXT,
    nivel_combustible_orden ENUM('Empty', 'Low', 'Medium', 'High', 'Full') NOT NULL,
    odometro_auto_cliente_orden float,
    
    imagen_1 VARCHAR(255) NOT NULL DEFAULT 'sin_imagen.jpg',
    imagen_2 VARCHAR(255) NOT NULL DEFAULT 'sin_imagen.jpg',
    imagen_3 VARCHAR(255) NOT NULL DEFAULT 'sin_imagen.jpg',
    imagen_4 VARCHAR(255) NOT NULL DEFAULT 'sin_imagen.jpg',
    video    VARCHAR(255) NOT NULL DEFAULT 'sin_video.mp4',    
    -- ------------------------------------
    -- -------Añadidos estado orden o mejor dicho, nuevos campos-------------
    fk_id_estado_orden int not null,
    observaciones_orden varchar(100),
    -- ----------------------------------------    
    FOREIGN KEY (fk_id_vehiculo) REFERENCES tbl_vehiculos(pk_id_vehiculo)
        ON DELETE CASCADE,
    FOREIGN KEY (fk_id_cliente) REFERENCES tbl_clientes(PK_id_cliente)
        ON DELETE CASCADE, 
    FOREIGN KEY (fk_id_estado_orden) REFERENCES tbl_orden_estado(PK_id_estado)
        ON DELETE CASCADE,
    FOREIGN KEY (fk_id_servicio) REFERENCES tbl_servicios(pk_id_servicio)
        ON DELETE CASCADE
);

-- Verificar que existan las tablas relacionadas
-- Si no existen, crearlas primero

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
SELECT 'Estados:', COUNT(*) FROM tbl_orden_estado
UNION ALL
SELECT 'Órdenes:', COUNT(*) FROM tbl_ordenes;

-- Mostrar estructura de la tabla de órdenes
DESCRIBE tbl_ordenes;

-- Mostrar datos de prueba
SELECT * FROM tbl_servicios;
SELECT * FROM tbl_orden_estado;
