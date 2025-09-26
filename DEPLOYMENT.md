# 🚀 Guía de Despliegue - Sistema Taller Mecánico

## 📋 Requisitos Previos

- Cuenta en [Railway.app](https://railway.app)
- Repositorio en GitHub
- Variables de entorno configuradas

## 🔧 Pasos de Despliegue

### 1. Preparar el Proyecto
```bash
# Instalar dependencias
npm run install:all

# Probar localmente
npm run dev
```

### 2. Desplegar en Railway
1. Ve a [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Selecciona tu repositorio
4. Configura las variables de entorno
5. Añade base de datos MySQL

### 3. Configurar Variables de Entorno
```bash
# Base de datos (Railway las proporciona automáticamente)
DB_HOST=containers-us-west-xxx.railway.app
DB_USER=root
DB_PASSWORD=tu_password_railway
DB_NAME=railway

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro

# Empresa
EMPRESA_NOMBRE=Tecno Auto - Repuestos Electrofrio
EMPRESA_TELEFONO=+502 7844 4001
EMPRESA_EMAIL=telectrofrio@gmail.com
EMPRESA_DIRECCION=Km. 115.6 Carretera Interamericana, Cerro Gordo, Jutiapa, Jutiapa 22001-Jutiapa, Guatemala

# Email
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion

# WhatsApp
WHATSAPP_ENABLED=true
WHATSAPP_SESSION_PATH=./whatsapp-session
WHATSAPP_CLIENT_ID=taller-mecanico

# PDF
PDF_ENABLED=true

# Cloudinary
CLOUDINARY_ENABLED=true
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
CLOUDINARY_FOLDER=taller-mecanico

# Servidor
PORT=4000
NODE_ENV=production
```

### 4. Ejecutar Migraciones
```bash
# Conectar a la base de datos
railway connect mysql

# Ejecutar script SQL
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < Taller_LDD.sql
```

### 5. Probar Despliegue
```bash
# Probar health check
curl https://tu-proyecto.railway.app/api/health

# Probar frontend
curl https://tu-proyecto.railway.app/
```

## 🎯 URLs Finales

- **Frontend**: `https://tu-proyecto.railway.app/`
- **API**: `https://tu-proyecto.railway.app/api/`
- **Health**: `https://tu-proyecto.railway.app/api/health`

## 🚨 Solución de Problemas

### CORS Error
```javascript
// En backend/index.js
app.use(cors({
  origin: ['https://tu-proyecto.railway.app', 'http://localhost:3000'],
  credentials: true
}));
```

### Variables de Entorno
```bash
# Verificar variables en Railway
railway variables
```

### Base de Datos
```bash
# Conectar a la base de datos
railway connect mysql
```

## ✅ Checklist de Despliegue

- [ ] Backend desplegado en Railway
- [ ] Frontend construido y servido
- [ ] Base de datos configurada
- [ ] Variables de entorno configuradas
- [ ] Migraciones ejecutadas
- [ ] Health check funcionando
- [ ] Frontend accesible
- [ ] APIs funcionando
- [ ] Notificaciones configuradas (opcional)

## 🎉 ¡Listo!

Tu sistema de taller mecánico estará funcionando en producción.

