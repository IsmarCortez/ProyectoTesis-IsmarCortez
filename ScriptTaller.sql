-- Crear base de datos
CREATE DATABASE IF NOT EXISTS taller_mecanico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE taller_mecanico;


-- --------------------------------------------------------
-- Tabla de clientes
CREATE TABLE tbl_clientes (
    PK_id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cliente VARCHAR(100) NOT NULL,
    dpi_cliente VARCHAR(20) UNIQUE,
    telefono_cliente VARCHAR(20),
    correo_cliente VARCHAR(100),
    direccion_cliente TEXT,
    fecha_registro_cliente DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de vehículos
CREATE TABLE tbl_vehiculos (
    pk_id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_cliente INT,
    placa_vehiculo VARCHAR(20) UNIQUE,
    marca_vehiculo VARCHAR(50),
    modelo_vehiculo VARCHAR(50),
    anio_vehiculo INT,
    color_vehiculo VARCHAR(30),
    FOREIGN KEY (fk_id_cliente) REFERENCES tbl_clientes(pk_id_cliente)
        ON DELETE CASCADE
);

-- Tabla de órdenes de mantenimiento y reparación
CREATE TABLE tbl_ordenes (
    pk_id_orden INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_vehiculo INT,
    fecha_ingreso_orden DATETIME DEFAULT CURRENT_TIMESTAMP,
    descripcion_problema_orden TEXT,
    estado_actual_orden VARCHAR(50) DEFAULT 'Recibido',
    enlace_seguimiento_orden VARCHAR(100) UNIQUE,
    fecha_salida_orden DATETIME NULL,
    FOREIGN KEY (fk_id_vehiculo) REFERENCES tbl_vehiculos(pk_id_vehiculo)
        ON DELETE CASCADE
);

-- Tabla de seguimiento de órdenes (historial de estados)
CREATE TABLE tbl_seguimiento_orden (
    pk_id_seguimiento INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_orden INT,
    estado_orden VARCHAR(50),
    comentario_orden TEXT,
    fecha_orden DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fk_id_orden) REFERENCES tbl_ordenes(pk_id_orden)
        ON DELETE CASCADE
);

-- Tabla de imágenes del vehículo
CREATE TABLE tbl_imagenes_vehiculo (
    pk_id_imagen INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_orden INT,
    ruta_imagen TEXT,
    descripcion_imagen VARCHAR(100),
    fecha_subida_imagen DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fk_id_orden) REFERENCES tbl_ordenes(pk_id_orden)
        ON DELETE CASCADE
);



-- Tabla de usuarios del sistema (personal del taller)
-- CREATE TABLE usuarios (
 --    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
 --    nombre VARCHAR(100) NOT NULL,
 --    usuario VARCHAR(50) UNIQUE NOT NULL,
 --    contrasena VARCHAR(255) NOT NULL,
 --    rol ENUM('admin', 'empleado') DEFAULT 'empleado'
-- );

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

ALTER TABLE tbl_clientes
ADD COLUMN apellido_cliente VARCHAR(100) NOT NULL AFTER nombre_cliente;

INSERT INTO tbl_clientes (nombre_cliente, apellido_cliente, dpi_cliente, telefono_cliente, correo_cliente, direccion_cliente)
VALUES
('Carlos', 'López', '1234567890101', '5551-1122', 'carlos.lopez@example.com', 'Zona 1, Ciudad de Guatemala'),
('María', 'Gómez', '2234567890102', '5552-2233', 'maria.gomez@example.com', 'Zona 10, Ciudad de Guatemala'),
('José', 'Martínez', '3234567890103', '5553-3344', 'jose.martinez@example.com', 'Mixco, Guatemala'),
('Ana', 'Rodríguez', '4234567890104', '5554-4455', 'ana.rodriguez@example.com', 'Villa Nueva, Guatemala'),
('Luis', 'Pérez', '5234567890105', '5555-5566', 'luis.perez@example.com', 'Zona 5, Ciudad de Guatemala'),
('Laura', 'Méndez', '6234567890106', '5556-6677', 'laura.mendez@example.com', 'San Miguel Petapa'),
('Pedro', 'Jiménez', '7234567890107', '5557-7788', 'pedro.jimenez@example.com', 'Zona 18, Ciudad de Guatemala'),
('Andrea', 'Castillo', '8234567890108', '5558-8899', 'andrea.castillo@example.com', 'Amatitlán, Guatemala'),
('Fernando', 'Ruiz', '9234567890109', '5559-9900', 'fernando.ruiz@example.com', 'Santa Catarina Pinula'),
('Sofía', 'Herrera', '1034567890110', '5560-0011', 'sofia.herrera@example.com', 'Zona 14, Ciudad de Guatemala');


