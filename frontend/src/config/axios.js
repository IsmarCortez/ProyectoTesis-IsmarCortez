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
    
    // Para FormData, axios maneja automáticamente el Content-Type
    // No establecer Content-Type manualmente para FormData
    if (config.data instanceof FormData) {
      // Axios establecerá automáticamente el Content-Type correcto con el boundary
      delete config.headers['Content-Type'];
      
      // Configurar timeout extendido para uploads de archivos (especialmente videos)
      // 10 minutos (600000ms) para permitir uploads grandes desde móviles
      if (!config.timeout) {
        config.timeout = 600000; // 10 minutos
      }
      
      // Detectar si hay un video en el FormData
      const hasVideo = config.data.has('video');
      if (hasVideo && !config.timeout) {
        config.timeout = 600000; // 10 minutos para videos
      }
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
    // Manejar errores de timeout específicamente
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('⏱️ Timeout en la petición:', error.message);
      // No redirigir en caso de timeout, solo rechazar el error
      return Promise.reject({
        ...error,
        message: 'La carga está tardando más de lo esperado. Por favor, verifica tu conexión a internet e intenta nuevamente. Si el problema persiste, el archivo puede ser demasiado grande.',
        isTimeout: true
      });
    }
    
    // Manejar errores 413 específicamente
    if (error.response && error.response.status === 413) {
      console.error('❌ Error 413 (Payload Too Large) recibido del servidor');
      console.error('📊 Response data:', error.response.data);
      console.error('📋 Headers:', error.response.headers);
      
      // El error ya tiene un mensaje del servidor, solo agregar contexto
      const serverMessage = error.response.data?.message || 'El archivo es demasiado grande';
      return Promise.reject({
        ...error,
        message: serverMessage + '\n\nNota: Este error puede venir del servidor (Railway) o de Cloudinary. Si el archivo es menor a 150MB, puede ser un límite del servidor.',
        is413: true
      });
    }
    
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

