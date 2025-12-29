-- Crear base de datos
CREATE DATABASE IF NOT EXISTS taller_mecanico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE taller_mecanico;

-- --------------------------------------------------------
-- Tabla de clientes
CREATE TABLE tbl_clientes (
    PK_id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cliente VARCHAR(100) NOT NULL,
    apellido_cliente VARCHAR(100),
    dpi_cliente VARCHAR(13) UNIQUE,
	NIT VARCHAR(13) UNIQUE,
    telefono_cliente VARCHAR(8),
    correo_cliente VARCHAR(100),
    direccion_cliente TEXT,
    fecha_registro_cliente DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ALTER TABLE tbl_clientes
-- ADD COLUMN apellido_cliente VARCHAR(100) NOT NULL AFTER nombre_cliente;

-- Tabla de vehículos
CREATE TABLE tbl_vehiculos (
    pk_id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
--    fk_id_cliente INT,
    placa_vehiculo VARCHAR(7) UNIQUE,
    marca_vehiculo VARCHAR(50),
    modelo_vehiculo VARCHAR(50),
    anio_vehiculo INT,
    color_vehiculo VARCHAR(30)
--    FOREIGN KEY (fk_id_cliente) REFERENCES tbl_clientes(pk_id_cliente)
--        ON DELETE CASCADE
);

CREATE TABLE tbl_servicios (
    pk_id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    servicio VARCHAR(50),
    descripcion_servicios varchar(100)
);

-- Tabla de seguimiento de órdenes (historial de estados)
CREATE TABLE tbl_orden_estado (
    pk_id_estado INT AUTO_INCREMENT PRIMARY KEY,
    estado_orden VARCHAR(50),
    descripcion_estado varchar(100)
);

-- Tabla de órdenes de mantenimiento y reparación
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
    unidad_odometro ENUM('km', 'millas') DEFAULT 'km',
    
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

CREATE TABLE tbl_usuarios (
  pk_id_usuarios INT AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario VARCHAR(100),
  email_usuario VARCHAR(100),
  contrasenia_usuario VARCHAR(255),
  foto_perfil_usuario VARCHAR(255),
  pregunta_seguridad_usuario VARCHAR(255)
);

-- Tabla para tokens de recuperación de contraseña
CREATE TABLE tbl_password_reset_tokens (
  pk_id_token INT AUTO_INCREMENT PRIMARY KEY,
  fk_id_usuario INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  email_usuario VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion DATETIME NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (fk_id_usuario) REFERENCES tbl_usuarios(pk_id_usuarios)
    ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_email (email_usuario),
  INDEX idx_expiracion (fecha_expiracion)
);
select* from tbl_password_reset_tokens;
INSERT INTO tbl_usuarios (nombre_usuario, email_usuario, contrasenia_usuario,foto_perfil_usuario,pregunta_seguridad_usuario )
VALUES (
  'Admin',
  'admin@taller.com',
  'admin123', -- ← generado por bcrypt
  '',
  'Jojo'
);

UPDATE `tbl_usuarios` SET `contrasenia_usuario` = 'admin123' WHERE `Pk_id_usuarios` = 1;

-- Se hashea la contraseña
UPDATE tbl_usuarios
SET contrasenia_usuario = SHA2('admin123', 256) 
WHERE nombre_usuario = 'admin';

UPDATE tbl_usuarios
SET email_usuario = 'icortezs@miumg.edu.gt'
WHERE nombre_usuario = 'admin';

select* from tbl_usuarios;
select* from tbl_clientes;

UPDATE tbl_usuarios
SET foto_perfil_usuario = 'Home.jpg'
WHERE nombre_usuario = 'admin';



select* from tbl_usuarios;
select* from tbl_clientes;

-- --------------------------------------------------------
-- Tabla de historial de estados de órdenes
-- Esta tabla registra todos los cambios de estado de las órdenes
-- con timestamps y usuarios responsables para el tracker público
-- --------------------------------------------------------
CREATE TABLE tbl_historial_estados (
    pk_id_historial INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_orden INT NOT NULL,
    fk_id_estado_anterior INT,
    fk_id_estado_nuevo INT NOT NULL,
    fk_id_usuario_cambio INT,
    fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
    comentario_cambio TEXT,
    ip_usuario VARCHAR(45),
    user_agent VARCHAR(255),
    
    -- Claves foráneas
    FOREIGN KEY (fk_id_orden) REFERENCES tbl_ordenes(pk_id_orden)
        ON DELETE CASCADE,
    FOREIGN KEY (fk_id_estado_anterior) REFERENCES tbl_orden_estado(pk_id_estado)
        ON DELETE SET NULL,
    FOREIGN KEY (fk_id_estado_nuevo) REFERENCES tbl_orden_estado(pk_id_estado)
        ON DELETE CASCADE,
    FOREIGN KEY (fk_id_usuario_cambio) REFERENCES tbl_usuarios(pk_id_usuarios)
        ON DELETE SET NULL,
    
    -- Índices para optimizar consultas
    INDEX idx_orden_fecha (fk_id_orden, fecha_cambio),
    INDEX idx_fecha_cambio (fecha_cambio),
    INDEX idx_estado_nuevo (fk_id_estado_nuevo)
);

-- --------------------------------------------------------
-- Trigger para registrar automáticamente cambios de estado
-- Este trigger se ejecuta cuando se actualiza el estado de una orden
-- --------------------------------------------------------
DELIMITER $$

CREATE TRIGGER tr_historial_estados_orden
AFTER UPDATE ON tbl_ordenes
FOR EACH ROW
BEGIN
    -- Solo registrar si el estado cambió
    IF OLD.fk_id_estado_orden != NEW.fk_id_estado_orden THEN
        INSERT INTO tbl_historial_estados (
            fk_id_orden,
            fk_id_estado_anterior,
            fk_id_estado_nuevo,
            fecha_cambio,
            comentario_cambio
        ) VALUES (
            NEW.pk_id_orden,
            OLD.fk_id_estado_orden,
            NEW.fk_id_estado_orden,
            NOW(),
            CONCAT('Estado cambiado de "', 
                   (SELECT estado_orden FROM tbl_orden_estado WHERE pk_id_estado = OLD.fk_id_estado_orden),
                   '" a "',
                   (SELECT estado_orden FROM tbl_orden_estado WHERE pk_id_estado = NEW.fk_id_estado_orden),
                   '"')
        );
    END IF;
END$$

DELIMITER ;

-- --------------------------------------------------------
-- Datos de ejemplo para el historial (opcional)
-- Estos datos se pueden usar para pruebas del sistema
-- --------------------------------------------------------
-- INSERT INTO tbl_historial_estados (fk_id_orden, fk_id_estado_anterior, fk_id_estado_nuevo, comentario_cambio)
-- VALUES 
-- (1, NULL, 1, 'Orden creada y recibida en el taller'),
-- (1, 1, 2, 'Orden en proceso de revisión'),
-- (1, 2, 3, 'Esperando piezas de repuesto'),
-- (1, 3, 4, 'Servicio completado y listo para entrega');

-- --------------------------------------------------------
-- Vista para consultar el historial completo de una orden
-- Esta vista facilita las consultas del tracker público
-- --------------------------------------------------------
CREATE VIEW vw_historial_completo AS
SELECT 
    h.pk_id_historial,
    h.fk_id_orden,
    h.fecha_cambio,
    h.comentario_cambio,
    h.ip_usuario,
    -- Estado anterior
    ea.estado_orden AS estado_anterior,
    ea.descripcion_estado AS descripcion_estado_anterior,
    -- Estado nuevo
    en.estado_orden AS estado_nuevo,
    en.descripcion_estado AS descripcion_estado_nuevo,
    -- Usuario que hizo el cambio
    u.nombre_usuario AS usuario_cambio,
    u.email_usuario AS email_usuario_cambio
FROM tbl_historial_estados h
LEFT JOIN tbl_orden_estado ea ON h.fk_id_estado_anterior = ea.pk_id_estado
LEFT JOIN tbl_orden_estado en ON h.fk_id_estado_nuevo = en.pk_id_estado
LEFT JOIN tbl_usuarios u ON h.fk_id_usuario_cambio = u.pk_id_usuarios
ORDER BY h.fecha_cambio DESC;

-- --------------------------------------------------------
-- Procedimiento almacenado para obtener historial de una orden
-- Facilita las consultas desde el backend
-- --------------------------------------------------------
DELIMITER $$

CREATE PROCEDURE sp_obtener_historial_orden(IN p_id_orden INT)
BEGIN
    SELECT 
        h.pk_id_historial,
        h.fecha_cambio,
        h.comentario_cambio,
        ea.estado_orden AS estado_anterior,
        en.estado_orden AS estado_nuevo,
        en.descripcion_estado AS descripcion_estado,
        u.nombre_usuario AS usuario_cambio
    FROM tbl_historial_estados h
    LEFT JOIN tbl_orden_estado ea ON h.fk_id_estado_anterior = ea.pk_id_estado
    LEFT JOIN tbl_orden_estado en ON h.fk_id_estado_nuevo = en.pk_id_estado
    LEFT JOIN tbl_usuarios u ON h.fk_id_usuario_cambio = u.pk_id_usuarios
    WHERE h.fk_id_orden = p_id_orden
    ORDER BY h.fecha_cambio ASC;
END$$

DELIMITER ;

-- --------------------------------------------------------
-- Comentarios sobre la implementación
-- --------------------------------------------------------
/*
TABLA DE HISTORIAL DE ESTADOS IMPLEMENTADA:

1. ESTRUCTURA:
   - pk_id_historial: ID único del registro de historial
   - fk_id_orden: Referencia a la orden
   - fk_id_estado_anterior: Estado previo (puede ser NULL para órdenes nuevas)
   - fk_id_estado_nuevo: Nuevo estado
   - fk_id_usuario_cambio: Usuario que hizo el cambio (opcional)
   - fecha_cambio: Timestamp del cambio
   - comentario_cambio: Comentario adicional
   - ip_usuario: IP del usuario (para auditoría)
   - user_agent: Información del navegador (para auditoría)

2. TRIGGER AUTOMÁTICO:
   - Se ejecuta automáticamente cuando se actualiza el estado de una orden
   - Registra el cambio con timestamp y comentario descriptivo
   - No requiere intervención manual

3. VISTA DE CONSULTA:
   - vw_historial_completo: Vista que une todas las tablas relacionadas
   - Facilita las consultas del tracker público
   - Incluye nombres de estados y usuarios

4. PROCEDIMIENTO ALMACENADO:
   - sp_obtener_historial_orden: Obtiene el historial de una orden específica
   - Optimizado para consultas del backend
   - Ordenado cronológicamente

5. ÍNDICES:
   - Optimizados para consultas frecuentes por orden y fecha
   - Mejoran el rendimiento del tracker público

BENEFICIOS:
- Tracker público con datos reales
- Auditoría completa de cambios
- Historial cronológico detallado
- Información de usuarios responsables
- Optimización de consultas
*/

-- ========================================
-- ALTER TABLE para agregar campo estado_vehiculo
-- ========================================
-- Ejecutar este comando si la tabla tbl_ordenes ya existe
ALTER TABLE tbl_ordenes 
ADD COLUMN estado_vehiculo VARCHAR(200)
AFTER observaciones_orden;

select* from tbl_ordenes ;

ALTER TABLE tbl_servicios
MODIFY COLUMN descripcion_servicios VARCHAR(500);

ALTER TABLE tbl_ordenes 
MODIFY COLUMN observaciones_orden VARCHAR(500);

-- Si en tbl_orden_estado tienes un campo texto que describe el estado
-- (por ejemplo "estado_orden"), también lo modificas:
ALTER TABLE tbl_ordenes
MODIFY COLUMN estado_vehiculo VARCHAR(500);


   ALTER TABLE tbl_ordenes 
   MODIFY COLUMN nivel_combustible_orden 
   ENUM('Reserva', '1/4', 'Medio', '3/4', 'Full') NOT NULL;

ALTER TABLE tbl_ordenes
ADD imagen_5 VARCHAR(255) AFTER imagen_4,
ADD imagen_6 VARCHAR(255) AFTER imagen_5,
ADD imagen_7 VARCHAR(255) AFTER imagen_6,
ADD imagen_8 VARCHAR(255) AFTER imagen_7,
ADD imagen_9 VARCHAR(255) AFTER imagen_8,
ADD imagen_10 VARCHAR(255) AFTER imagen_9;

ALTER TABLE tbl_ordenes 
ADD COLUMN token_publico VARCHAR(255) UNIQUE NULL AFTER video;

-- Crear índice para mejorar búsquedas por token
CREATE INDEX idx_token_publico ON tbl_ordenes(token_publico);