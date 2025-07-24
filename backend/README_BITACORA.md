# Bitácora de Desarrollo - Proyecto Taller Mecánico

## 1. Estructura inicial del proyecto (Login)
- Se crearon las carpetas `backend` y `frontend` para separar el backend y frontend.
- Se inicializó el proyecto Node.js en la carpeta `backend`.
- Se instalaron las dependencias: express, mysql2, bcrypt, jsonwebtoken, cors y dotenv.
- Se creó el archivo principal `index.js` con la ruta POST `/api/login` para autenticación de usuarios.
- Se configuró la conexión a la base de datos MySQL y el uso de variables de entorno.

**Pendiente:**
- Crear el archivo `.env` con las variables de entorno necesarias.
- Desarrollar el frontend (formulario de login y manejo de sesión).
- Documentar la API en Postman.
- Subir el proyecto a GitHub.

---

## 2. Cambios realizados el [fecha de hoy]
- Se agregaron los logos de "Tecno Auto" y "Repuestos Electrofrio" al formulario de login en el frontend.
- Se añadió una imagen de fondo personalizada al login.
- Se implementó en el frontend el campo de pregunta de seguridad "Primera mascota" en el formulario de recuperación de contraseña.
- Se actualizó la tabla `tbl_usuarios` en la base de datos para incluir el campo `pregunta_seguridad_usuario`.
- Se modificó el backend para que la ruta `/api/recuperar-contrasena` valide la respuesta de la pregunta de seguridad antes de permitir el cambio de contraseña.
- Se mejoró la gestión de variables de entorno en el archivo `.env` y se reforzó la seguridad del `JWT_SECRET`.
- Se realizaron pruebas de flujo completo de recuperación de contraseña y validación de seguridad. 