// Configuración de API para desarrollo y producción
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // En producción, usar rutas relativas
  : 'http://localhost:4000'; // En desarrollo, usar el backend local

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/login`,
  CLIENTES: `${API_BASE_URL}/api/clientes`,
  VEHICULOS: `${API_BASE_URL}/api/vehiculos`,
  SERVICIOS: `${API_BASE_URL}/api/servicios`,
  ESTADOS: `${API_BASE_URL}/api/estados`,
  ORDENES: `${API_BASE_URL}/api/ordenes`,
  USUARIOS: `${API_BASE_URL}/api/usuarios`,
  DASHBOARD: `${API_BASE_URL}/api/dashboard`,
  REPORTES: `${API_BASE_URL}/api/reportes`,
  TRACKER: `${API_BASE_URL}/api/tracker`,
  NOTIFICATIONS: `${API_BASE_URL}/api/notifications`
};

export default API_BASE_URL;
