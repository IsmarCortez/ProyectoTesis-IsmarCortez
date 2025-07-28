# Módulo de Vehículos - Documentación Técnica

## Descripción General
El módulo de vehículos permite gestionar los vehículos de los clientes del taller mecánico, con validación automática de clientes por DPI y manejo de múltiples archivos multimedia.

## Estructura de la Base de Datos

### Tabla: tbl_vehiculos
```sql
CREATE TABLE tbl_vehiculos (
    pk_id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
    fk_id_cliente INT,
    placa_vehiculo VARCHAR(20) UNIQUE,
    marca_vehiculo VARCHAR(50),
    modelo_vehiculo VARCHAR(50),
    anio_vehiculo INT,
    color_vehiculo VARCHAR(30),
    imagen_1 VARCHAR(255) NOT NULL DEFAULT 'sin_imagen.jpg',
    imagen_2 VARCHAR(255) NOT NULL DEFAULT 'sin_imagen.jpg',
    imagen_3 VARCHAR(255) NOT NULL DEFAULT 'sin_imagen.jpg',
    imagen_4 VARCHAR(255) NOT NULL DEFAULT 'sin_imagen.jpg',
    video VARCHAR(255) NOT NULL DEFAULT 'sin_video.mp4',
    FOREIGN KEY (fk_id_cliente) REFERENCES tbl_clientes(pk_id_cliente)
        ON DELETE CASCADE
);
```

## Endpoints del Backend

### 1. GET /api/vehiculos
**Descripción:** Obtiene todos los vehículos con información del cliente asociado.

**Respuesta:**
```json
[
  {
    "pk_id_vehiculo": 1,
    "fk_id_cliente": 1,
    "placa_vehiculo": "ABC123",
    "marca_vehiculo": "Toyota",
    "modelo_vehiculo": "Corolla",
    "anio_vehiculo": 2020,
    "color_vehiculo": "Blanco",
    "imagen_1": "1234567890-123456789.jpg",
    "imagen_2": "sin_imagen.jpg",
    "imagen_3": "sin_imagen.jpg",
    "imagen_4": "sin_imagen.jpg",
    "video": "sin_video.mp4",
    "nombre_cliente": "Juan",
    "apellido_cliente": "Pérez",
    "dpi_cliente": "1234567890101"
  }
]
```

### 2. GET /api/vehiculos/buscar-cliente/:dpi
**Descripción:** Busca un cliente por DPI para asociarlo a un vehículo.

**Parámetros:**
- `dpi`: DPI del cliente a buscar

**Respuesta:**
```json
{
  "PK_id_cliente": 1,
  "nombre_cliente": "Juan",
  "apellido_cliente": "Pérez",
  "dpi_cliente": "1234567890101"
}
```

### 3. POST /api/vehiculos
**Descripción:** Registra un nuevo vehículo con archivos multimedia.

**Parámetros (multipart/form-data):**
- `fk_id_cliente`: ID del cliente (requerido)
- `placa_vehiculo`: Placa del vehículo (requerido)
- `marca_vehiculo`: Marca del vehículo (requerido)
- `modelo_vehiculo`: Modelo del vehículo (requerido)
- `anio_vehiculo`: Año del vehículo (opcional)
- `color_vehiculo`: Color del vehículo (opcional)
- `imagen_1`: Primera imagen (opcional)
- `imagen_2`: Segunda imagen (opcional)
- `imagen_3`: Tercera imagen (opcional)
- `imagen_4`: Cuarta imagen (opcional)
- `video`: Video del vehículo (opcional)

**Respuesta:**
```json
{
  "message": "Vehículo registrado exitosamente."
}
```

### 4. GET /api/vehiculos/:id
**Descripción:** Obtiene un vehículo específico por ID.

**Respuesta:** Igual que el endpoint de listar, pero con un solo objeto.

### 5. PUT /api/vehiculos/:id
**Descripción:** Actualiza un vehículo existente.

**Parámetros:** Igual que POST, pero preserva archivos existentes si no se suben nuevos.

### 6. DELETE /api/vehiculos/:id
**Descripción:** Elimina un vehículo.

**Respuesta:**
```json
{
  "message": "Vehículo eliminado correctamente."
}
```

## Funcionalidades del Frontend

### Componente: Vehiculos.jsx

#### Características Principales:
1. **Validación por DPI**: El formulario requiere buscar un cliente válido por DPI antes de permitir el registro.
2. **Autocompletado**: Al encontrar un cliente, se autocompletan los campos del formulario.
3. **Manejo de Archivos**: Permite subir hasta 4 imágenes y 1 video por vehículo.
4. **CRUD Completo**: Crear, leer, actualizar y eliminar vehículos.
5. **Interfaz Responsiva**: Diseño moderno con Bootstrap 5.

#### Flujo de Trabajo:
1. **Búsqueda de Cliente**: El usuario ingresa el DPI y hace clic en "Buscar".
2. **Validación**: El sistema verifica que el cliente existe en la base de datos.
3. **Autocompletado**: Si el cliente existe, se muestra su información y se habilita el formulario.
4. **Registro**: El usuario completa los datos del vehículo y sube archivos opcionales.
5. **Guardado**: El sistema asocia el vehículo al cliente encontrado.

#### Validaciones:
- DPI de cliente debe existir en la base de datos
- Placa del vehículo es única
- Marca y modelo son campos requeridos
- Año debe estar entre 1900 y 2030
- Archivos deben ser imágenes (jpg, png, etc.) o video (mp4, avi, etc.)

## Manejo de Archivos

### Configuración de Multer:
- **Destino**: Carpeta `uploads/` en el backend
- **Nomenclatura**: `timestamp-randomnumber.extensión`
- **Tipos Permitidos**: Imágenes y videos
- **Tamaño Máximo**: Configurado en multer

### Estructura de Archivos:
```
backend/uploads/
├── 1234567890-123456789.jpg
├── 1234567891-987654321.jpg
├── 1234567892-456789123.mp4
└── ...
```

## Seguridad y Validaciones

### Backend:
- Validación de existencia de cliente antes de asociar vehículo
- Validación de unicidad de placa
- Sanitización de archivos subidos
- Manejo de errores con mensajes descriptivos

### Frontend:
- Validación de campos requeridos
- Verificación de cliente antes de permitir registro
- Confirmación antes de eliminar
- Manejo de estados de carga y errores

## Integración con el Sistema

### Rutas:
- **Frontend**: `/vehiculos` (protegida por autenticación)
- **Backend**: `/api/vehiculos/*` (endpoints REST)

### Dependencias:
- **Backend**: multer, mysql2, express
- **Frontend**: axios, react-router-dom, bootstrap

### Navegación:
- Accesible desde el menú principal en Home.jsx
- Integrado con el sistema de autenticación existente

## Casos de Uso

### 1. Registrar Vehículo Nuevo:
1. Usuario navega a /vehiculos
2. Ingresa DPI del cliente y hace clic en "Buscar"
3. Sistema valida y muestra información del cliente
4. Usuario completa datos del vehículo
5. Opcionalmente sube imágenes/video
6. Hace clic en "Registrar"

### 2. Editar Vehículo Existente:
1. Usuario hace clic en "Editar" en la tabla
2. Sistema carga datos del vehículo y cliente
3. Usuario modifica campos necesarios
4. Opcionalmente cambia archivos
5. Hace clic en "Actualizar"

### 3. Eliminar Vehículo:
1. Usuario hace clic en "Eliminar"
2. Sistema solicita confirmación
3. Si confirma, elimina vehículo y archivos asociados

## Notas Técnicas

### Optimizaciones:
- Consultas JOIN para obtener información completa
- Preservación de archivos existentes en actualizaciones
- Manejo eficiente de estados en React

### Consideraciones:
- Los archivos se almacenan en el servidor
- La eliminación en cascada está configurada en la BD
- El sistema maneja múltiples formatos de archivo

### Limitaciones:
- Tamaño máximo de archivos configurado en multer
- Número limitado de archivos por vehículo (4 imágenes + 1 video)
- Validación de DPI requiere conexión a BD 