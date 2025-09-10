const fs = require('fs');
const path = require('path');

// Configuración básica para el archivo .env
const envContent = `# ========================================
# CONFIGURACIÓN DE BASE DE DATOS
# ========================================
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=1970
DB_NAME=taller_mecanico

# ========================================
# CONFIGURACIÓN JWT
# ========================================
JWT_SECRET=MiPerroChubasco

# ========================================
# CONFIGURACIÓN DE EMAIL
# ========================================
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=leojpstudy@gmail.com
EMAIL_PASS=yqlq tdfg onzl xeco

# ========================================
# CONFIGURACIÓN DEL SERVIDOR
# ========================================
PORT=4000

# ========================================
# CONFIGURACIÓN DE WHATSAPP
# ========================================
WHATSAPP_ENABLED=true
WHATSAPP_SESSION_PATH=./whatsapp-session
WHATSAPP_CLIENT_ID=taller-mecanico

# ========================================
# CONFIGURACIÓN DE PDF
# ========================================
PDF_ENABLED=true

# ========================================
# CONFIGURACIÓN DE LOGGING
# ========================================
LOGGING_ENABLED=true
LOG_LEVEL=info
`;

// Ruta del archivo .env
const envPath = path.join(__dirname, '.env');

try {
  // Crear el archivo .env
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Archivo .env creado exitosamente en:', envPath);
  console.log('📋 Configuración aplicada:');
  console.log('   - DB_HOST: localhost');
  console.log('   - DB_USER: root');
  console.log('   - DB_PASSWORD: 1970');
  console.log('   - DB_NAME: taller_mecanico');
  console.log('   - JWT_SECRET: MiPerroChubasco');
  console.log('   - PORT: 4000');
  console.log('');
  console.log('🔄 Reinicia el servidor para aplicar los cambios');
} catch (error) {
  console.error('❌ Error creando archivo .env:', error.message);
  console.log('');
  console.log('📝 Crea manualmente el archivo .env en la carpeta backend con el siguiente contenido:');
  console.log('');
  console.log(envContent);
}
