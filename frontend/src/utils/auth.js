// Helper para obtener información del usuario desde el token JWT o localStorage

/**
 * Decodifica un token JWT (sin verificar la firma)
 * @param {string} token - Token JWT
 * @returns {object|null} - Payload del token o null si es inválido
 */
export const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decodificando token:', error);
    return null;
  }
};

/**
 * Obtiene el rol del usuario actual
 * @returns {string|null} - Rol del usuario ('admin', 'editor', 'mecanico') o null
 */
export const getUserRole = () => {
  // Primero intentar obtener del objeto usuario en localStorage
  const usuario = localStorage.getItem('usuario');
  if (usuario) {
    try {
      const userObj = JSON.parse(usuario);
      if (userObj.rol) {
        return userObj.rol;
      }
    } catch (error) {
      console.error('Error parseando usuario:', error);
    }
  }
  
  // Si no está en usuario, intentar decodificar el token
  const token = localStorage.getItem('token');
  if (token) {
    const decoded = decodeToken(token);
    if (decoded && decoded.rol) {
      return decoded.rol;
    }
  }
  
  return null;
};

/**
 * Verifica si el usuario tiene un rol específico
 * @param {string} role - Rol a verificar ('admin', 'editor', 'mecanico')
 * @returns {boolean} - true si el usuario tiene el rol
 */
export const hasRole = (role) => {
  const userRole = getUserRole();
  return userRole === role;
};

/**
 * Verifica si el usuario es administrador
 * @returns {boolean} - true si el usuario es admin
 */
export const isAdmin = () => {
  return hasRole('admin');
};

/**
 * Verifica si el usuario es editor o administrador
 * @returns {boolean} - true si el usuario es admin o editor
 */
export const isAdminOrEditor = () => {
  const role = getUserRole();
  return role === 'admin' || role === 'editor';
};

/**
 * Verifica si el usuario es solo mecánico (solo lectura)
 * @returns {boolean} - true si el usuario es mecánico
 */
export const isMecanico = () => {
  return hasRole('mecanico');
};
