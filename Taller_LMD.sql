use taller_mecanico;

INSERT INTO tbl_clientes 
(nombre_cliente, apellido_cliente, dpi_cliente, NIT, telefono_cliente, correo_cliente, direccion_cliente)
VALUES
('Carlos', 'López', '1234567890101', '1234567-1', '55511122', 'carlos.lopez@example.com', 'Zona 1, Ciudad de Guatemala'),
('María', 'Gómez', '2234567890102', '2234567-2', '55522233', 'maria.gomez@example.com', 'Zona 10, Ciudad de Guatemala'),
('José', 'Martínez', '3234567890103', '3234567-3', '55533344', 'jose.martinez@example.com', 'Mixco, Guatemala'),
('Ana', 'Rodríguez', '4234567890104', '4234567-4', '55544455', 'ana.rodriguez@example.com', 'Villa Nueva, Guatemala'),
('Luis', 'Pérez', '5234567890105', '5234567-5', '55555566', 'luis.perez@example.com', 'Zona 5, Ciudad de Guatemala'),
('Laura', 'Méndez', '6234567890106', '6234567-6', '55566677', 'laura.mendez@example.com', 'San Miguel Petapa'),
('Pedro', 'Jiménez', '7234567890107', '7234567-7', '55577788', 'pedro.jimenez@example.com', 'Zona 18, Ciudad de Guatemala'),
('Andrea', 'Castillo', '8234567890108', '8234567-8', '55588899', 'andrea.castillo@example.com', 'Amatitlán, Guatemala'),
('Fernando', 'Ruiz', '9234567890109', '9234567-9', '55599900', 'fernando.ruiz@example.com', 'Santa Catarina Pinula'),
('Sofía', 'Herrera', '1034567890110', '1034567-0', '55600011', 'sofia.herrera@example.com', 'Zona 14, Ciudad de Guatemala');

INSERT INTO tbl_vehiculos 
(placa_vehiculo, marca_vehiculo, modelo_vehiculo, anio_vehiculo, color_vehiculo)
VALUES
('P123ABC', 'Toyota', 'Corolla', 2018, 'Blanco'),
('P456DEF', 'Honda', 'Civic', 2020, 'Negro'),
('P789GHI', 'Ford', 'Focus', 2017, 'Rojo'),
('P321JKL', 'Chevrolet', 'Cruze', 2019, 'Azul'),
('P654MNO', 'Nissan', 'Sentra', 2021, 'Gris'),
('P987PQR', 'Volkswagen', 'Golf', 2016, 'Plateado'),
('P147STU', 'Mazda', '3', 2018, 'Blanco'),
('P258VWX', 'Hyundai', 'Elantra', 2019, 'Negro'),
('P369YZA', 'Kia', 'Rio', 2020, 'Rojo'),
('P741BCD', 'Subaru', 'Impreza', 2017, 'Azul');

-- Insertar servicios
INSERT INTO tbl_servicios (servicio, descripcion_servicios) VALUES
('Cambio de aceite', 'Reemplazo de aceite y filtro de motor'),
('Alineación y balanceo', 'Ajuste de la alineación de las ruedas y balanceo'),
('Revisión de frenos', 'Inspección y mantenimiento del sistema de frenos'),
('Cambio de llantas', 'Sustitución de llantas desgastadas o dañadas'),
('Mantenimiento general', 'Chequeo y mantenimiento preventivo general'),
('Reparación de motor', 'Diagnóstico y reparación del motor'),
('Servicio de batería', 'Prueba y cambio de batería'),
('Lavado y detallado', 'Limpieza profunda del vehículo');

-- Insertar estados de orden
INSERT INTO tbl_orden_estado (estado_orden, descripcion_estado) VALUES
('Recibido', 'Orden registrada y vehículo recibido en taller'),
('En proceso', 'Servicio en curso'),
('En espera de piezas', 'Se espera la llegada de repuestos'),
('Finalizado', 'Servicio completado y listo para entrega'),
('Entregado', 'Vehículo entregado al cliente'),
('Cancelado', 'Orden cancelada por cliente o taller');


