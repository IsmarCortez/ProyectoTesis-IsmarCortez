import axios from 'axios';

// Configurar interceptor de request para agregar token automáticamente
axios.interceptors.request.use(
  (config) => {
    // Obtener token del localStorage
    const token = localStorage.getItem('token');
    
    // Lista de rutas públicas que no requieren token
    const publicRoutes = [
      '/api/login',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/verify-reset-token',
      '/api/recuperar-contrasena',
      '/api/orden/publica/',
      '/api/health'
    ];
    
    // Obtener la ruta sin el dominio (solo el path)
    const urlPath = config.url.startsWith('http') 
      ? new URL(config.url).pathname 
      : config.url;
    
    // Verificar si la ruta es pública
    const isPublicRoute = publicRoutes.some(route => {
      if (route.endsWith('/')) {
        return urlPath.startsWith(route);
      }
      return urlPath === route || urlPath.startsWith(route + '/');
    });
    
    // Si no es ruta pública y hay token, agregarlo al header
    // Solo agregar si no existe ya un header Authorization (para evitar duplicados)
    if (!isPublicRoute && token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Configurar interceptor de response para manejar errores de autenticación
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si el error es 401 (No autorizado) o 403 (Prohibido), redirigir al login
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Limpiar datos de sesión
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      
      // Redirigir al login solo si no estamos ya en la página de login
      if (window.location.pathname !== '/' && !window.location.pathname.includes('/forgot-password') && !window.location.pathname.includes('/reset-password') && !window.location.pathname.includes('/recuperar-contrasena') && !window.location.pathname.startsWith('/orden/')) {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axios;

