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






