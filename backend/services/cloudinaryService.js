const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar almacenamiento de Cloudinary para Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: process.env.CLOUDINARY_FOLDER || 'taller-mecanico',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'mp4', 'avi', 'mov', 'wmv'],
    resource_type: 'auto' // Detecta automáticamente si es imagen o video
  }
});

// Configurar Multer con Cloudinary
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB máximo (límite de Cloudinary para videos)
    files: 11 // Máximo 11 archivos por request (10 imágenes + 1 video)
  },
  fileFilter: (req, file, cb) => {
    // Validar tipos de archivo
    const allowedTypes = /jpeg|jpg|png|gif|webp|avif|mp4|avi|mov|wmv/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (jpg, png, gif, webp, avif) y videos (mp4, avi, mov, wmv)'));
    }
  },
  onError: (err, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const error = new Error('Archivo demasiado grande. Límites: Imágenes 10MB, Videos 100MB');
      error.status = 413;
      return next(error);
    }
    next(err);
  }
});

// Función para subir un archivo a Cloudinary
const uploadFile = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || process.env.CLOUDINARY_FOLDER || 'taller-mecanico',
      resource_type: options.resource_type || 'auto',
      ...options
    });
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Error subiendo archivo a Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para eliminar un archivo de Cloudinary
const deleteFile = async (publicId, resourceType = 'auto') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('Error eliminando archivo de Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para obtener URL optimizada de Cloudinary
const getOptimizedUrl = (publicId, options = {}) => {
  try {
    const defaultOptions = {
      quality: 'auto',
      fetch_format: 'auto',
      ...options
    };

    return cloudinary.url(publicId, defaultOptions);
  } catch (error) {
    console.error('Error generando URL optimizada:', error);
    return null;
  }
};

// Función para generar thumbnail de video
const generateVideoThumbnail = async (publicId) => {
  try {
    const result = await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      resource_type: 'video',
      eager: [
        { width: 300, height: 200, crop: 'fill', quality: 'auto', format: 'jpg' }
      ]
    });
    
    return {
      success: true,
      thumbnail_url: result.eager[0].secure_url
    };
  } catch (error) {
    console.error('Error generando thumbnail de video:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para verificar si Cloudinary está configurado
const isConfigured = () => {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && 
           process.env.CLOUDINARY_API_KEY && 
           process.env.CLOUDINARY_API_SECRET);
};

// Función para obtener información de un archivo
const getFileInfo = async (publicId, resourceType = 'auto') => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType
    });
    
    return {
      success: true,
      info: {
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        url: result.secure_url,
        created_at: result.created_at
      }
    };
  } catch (error) {
    console.error('Error obteniendo información del archivo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadFile,
  deleteFile,
  getOptimizedUrl,
  generateVideoThumbnail,
  isConfigured,
  getFileInfo
};
