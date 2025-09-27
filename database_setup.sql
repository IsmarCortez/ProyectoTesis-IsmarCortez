-- Script para crear las tablas faltantes en Railway MySQL
-- Base de datos: taller_mecanico (no taller_LDD)

-- Tabla de estados de orden (nombre correcto)
CREATE TABLE IF NOT EXISTS tbl_orden_estado (
    pk_id_estado INT AUTO_INCREMENT PRIMARY KEY,
    estado_orden VARCHAR(50),
    descripcion_estado VARCHAR(100)
);

-- Insertar estados básicos
INSERT IGNORE INTO tbl_orden_estado (estado_orden, descripcion_estado) VALUES
('Recibido', 'Orden recibida y en espera de revisión'),
('En Proceso', 'Orden en proceso de reparación'),
('Esperando Repuestos', 'Esperando llegada de repuestos'),
('Finalizado', 'Orden completada y lista para entrega'),
('Entregado', 'Orden entregada al cliente');

-- Tabla de historial de estados (nombre correcto)
CREATE TABLE IF NOT EXISTS tbl_historial_estados (
    pk_id_historial INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_orden INT NOT NULL,
    fk_id_estado_anterior INT,
    fk_id_estado_nuevo INT NOT NULL,
    fk_id_usuario_cambio INT,
    fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
    comentario_cambio TEXT,
    ip_usuario VARCHAR(45),
    user_agent VARCHAR(255),
    FOREIGN KEY (fk_id_orden) REFERENCES tbl_ordenes(pk_id_orden) ON DELETE CASCADE,
    FOREIGN KEY (fk_id_estado_anterior) REFERENCES tbl_orden_estado(pk_id_estado) ON DELETE SET NULL,
    FOREIGN KEY (fk_id_estado_nuevo) REFERENCES tbl_orden_estado(pk_id_estado) ON DELETE CASCADE,
    FOREIGN KEY (fk_id_usuario_cambio) REFERENCES tbl_usuarios(pk_id_usuarios) ON DELETE SET NULL,
    INDEX idx_orden_fecha (fk_id_orden, fecha_cambio),
    INDEX idx_fecha_cambio (fecha_cambio),
    INDEX idx_estado_nuevo (fk_id_estado_nuevo)
);

-- Verificar que las tablas principales existen
-- Si no existen, crearlas también

-- Tabla de usuarios (estructura real)
CREATE TABLE IF NOT EXISTS tbl_usuarios (
    pk_id_usuarios INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(100),
    email_usuario VARCHAR(100),
    contrasenia_usuario VARCHAR(255),
    foto_perfil_usuario VARCHAR(255),
    pregunta_seguridad_usuario VARCHAR(255)
);

-- Tabla de clientes (estructura real)
CREATE TABLE IF NOT EXISTS tbl_clientes (
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

-- Tabla de vehículos (estructura real)
CREATE TABLE IF NOT EXISTS tbl_vehiculos (
    pk_id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
    placa_vehiculo VARCHAR(7) UNIQUE,
    marca_vehiculo VARCHAR(50),
    modelo_vehiculo VARCHAR(50),
    anio_vehiculo INT,
    color_vehiculo VARCHAR(30)
);

-- Tabla de servicios (estructura real)
CREATE TABLE IF NOT EXISTS tbl_servicios (
    pk_id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    servicio VARCHAR(50),
    descripcion_servicios VARCHAR(100)
);

-- Tabla de órdenes (estructura real)
CREATE TABLE IF NOT EXISTS tbl_ordenes (
    pk_id_orden INT AUTO_INCREMENT PRIMARY KEY,
    fecha_ingreso_orden DATETIME DEFAULT CURRENT_TIMESTAMP,
    fk_id_vehiculo INT,
    fk_id_cliente INT,
    fk_id_servicio INT,
    comentario_cliente_orden TEXT,
    nivel_combustible_orden ENUM('Empty', 'Low', 'Medium', 'High', 'Full') NOT NULL,
    odometro_auto_cliente_orden FLOAT,
    imagen_1 VARCHAR(255) NOT NULL DEFAULT 'sin_imagen.jpg',
    imagen_2 VARCHAR(255) NOT NULL DEFAULT 'sin_imagen.jpg',
    imagen_3 VARCHAR(255) NOT NULL DEFAULT 'sin_imagen.jpg',
    imagen_4 VARCHAR(255) NOT NULL DEFAULT 'sin_imagen.jpg',
    video VARCHAR(255) NOT NULL DEFAULT 'sin_video.mp4',
    fk_id_estado_orden INT NOT NULL,
    observaciones_orden VARCHAR(100),
    estado_vehiculo VARCHAR(200),
    FOREIGN KEY (fk_id_vehiculo) REFERENCES tbl_vehiculos(pk_id_vehiculo) ON DELETE CASCADE,
    FOREIGN KEY (fk_id_cliente) REFERENCES tbl_clientes(PK_id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (fk_id_estado_orden) REFERENCES tbl_orden_estado(pk_id_estado) ON DELETE CASCADE,
    FOREIGN KEY (fk_id_servicio) REFERENCES tbl_servicios(pk_id_servicio) ON DELETE CASCADE
);

-- Tabla para tokens de recuperación de contraseña
CREATE TABLE IF NOT EXISTS tbl_password_reset_tokens (
    pk_id_token INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_usuario INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    email_usuario VARCHAR(100) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (fk_id_usuario) REFERENCES tbl_usuarios(pk_id_usuarios) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_email (email_usuario),
    INDEX idx_expiracion (fecha_expiracion)
);

-- Insertar algunos servicios básicos si no existen
INSERT IGNORE INTO tbl_servicios (servicio, descripcion_servicios) VALUES
('Mantenimiento Preventivo', 'Cambio de aceite, filtros y revisión general'),
('Reparación de Motor', 'Diagnóstico y reparación de problemas del motor'),
('Sistema de Frenos', 'Revisión y reparación del sistema de frenos'),
('Sistema Eléctrico', 'Diagnóstico y reparación de problemas eléctricos'),
('Sistema de Transmisión', 'Reparación de transmisión automática y manual'),
('Suspensión y Dirección', 'Reparación de sistema de suspensión y dirección'),
('Aire Acondicionado', 'Diagnóstico y reparación del sistema de A/C'),
('Lavado y Detallado', 'Limpieza profunda del vehículo');

-- Crear usuario admin si no existe
INSERT IGNORE INTO tbl_usuarios (nombre_usuario, email_usuario, contrasenia_usuario, foto_perfil_usuario, pregunta_seguridad_usuario) VALUES
('Admin', 'icortezs@miumg.edu.gt', SHA2('admin123', 256), 'Home.jpg', 'Jojo');

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha ON tbl_ordenes(fecha_ingreso_orden);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON tbl_ordenes(fk_id_estado_orden);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente ON tbl_ordenes(fk_id_cliente);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON tbl_usuarios(email_usuario);
CREATE INDEX IF NOT EXISTS idx_clientes_nit ON tbl_clientes(NIT);
CREATE INDEX IF NOT EXISTS idx_vehiculos_placa ON tbl_vehiculos(placa_vehiculo);
