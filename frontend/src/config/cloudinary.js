// Configuración de Cloudinary para el frontend
// Esta configuración permite al frontend detectar si se está usando Cloudinary

// Función helper para obtener la URL correcta de archivos (Cloudinary o local)
export const getFileUrl = (filename) => {
  if (!filename || filename === 'sin_imagen.jpg' || filename === 'sin_video.mp4') {
    return null;
  }
  
  // Si es una URL de Cloudinary (contiene 'cloudinary.com'), usar directamente
  if (filename.includes('cloudinary.com')) {
    return filename;
  }
  
  // Si es un filename local, usar la ruta local
  return `http://localhost:4000/uploads/${filename}`;
};

// Función para obtener URL optimizada de Cloudinary con transformaciones
export const getOptimizedImageUrl = (filename, options = {}) => {
  if (!filename || filename === 'sin_imagen.jpg') {
    return null;
  }
  
  // Si es una URL de Cloudinary, aplicar transformaciones
  if (filename.includes('cloudinary.com')) {
    const baseUrl = filename.split('/upload/')[0] + '/upload/';
    const publicId = filename.split('/upload/')[1];
    
    // Transformaciones por defecto
    const defaultTransformations = {
      quality: 'auto',
      format: 'auto',
      fetch_format: 'auto',
      ...options
    };
    
    // Construir string de transformaciones
    const transformations = Object.entries(defaultTransformations)
      .map(([key, value]) => `${key}_${value}`)
      .join(',');
    
    return `${baseUrl}${transformations}/${publicId}`;
  }
  
  // Si es un filename local, usar la ruta local
  return `http://localhost:4000/uploads/${filename}`;
};

// Función para obtener thumbnail de video
export const getVideoThumbnail = (filename) => {
  if (!filename || filename === 'sin_video.mp4') {
    return null;
  }
  
  // Si es una URL de Cloudinary, generar thumbnail
  if (filename.includes('cloudinary.com')) {
    const baseUrl = filename.split('/upload/')[0] + '/upload/';
    const publicId = filename.split('/upload/')[1];
    
    // Generar thumbnail de video
    return `${baseUrl}w_300,h_200,c_fill,q_auto,f_jpg/${publicId}`;
  }
  
  // Si es un filename local, no hay thumbnail
  return null;
};

// Función para detectar si un archivo es de Cloudinary
export const isCloudinaryFile = (filename) => {
  return filename && filename.includes('cloudinary.com');
};

// Función para obtener el tipo de archivo
export const getFileType = (filename) => {
  if (!filename) return null;
  
  const extension = filename.split('.').pop().toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(extension)) {
    return 'image';
  } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
    return 'video';
  }
  
  return 'unknown';
};
