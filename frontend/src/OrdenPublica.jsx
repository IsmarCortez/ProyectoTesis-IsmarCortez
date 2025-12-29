import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getFileUrl } from './config/cloudinary';

const OrdenPublica = () => {
  const { token } = useParams();
  const [orden, setOrden] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      console.log('🔍 Token recibido:', token);
      cargarOrden();
    } else {
      console.error('❌ No se recibió token');
      setError('Token no válido');
      setLoading(false);
    }
  }, [token]);

  const cargarOrden = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Cargando orden con token:', token);
      const response = await axios.get(`/api/orden/publica/${token}`);
      
      console.log('✅ Respuesta recibida:', response.data);
      
      if (response.data.encontrado) {
        setOrden(response.data.orden);
        setHistorial(response.data.historial || []);
      } else {
        setError(response.data.mensaje || 'Orden no encontrada');
      }
    } catch (error) {
      console.error('❌ Error cargando orden:', error);
      console.error('❌ Detalles del error:', error.response?.data || error.message);
      setError(error.response?.data?.mensaje || 'Error al cargar la orden. Verifica que el enlace sea correcto.');
    } finally {
      setLoading(false);
    }
  };

  // Función para renderizar multimedia
  const renderizarMultimedia = (orden) => {
    const imagenes = [
      orden.imagen_1,
      orden.imagen_2, 
      orden.imagen_3,
      orden.imagen_4,
      orden.imagen_5,
      orden.imagen_6,
      orden.imagen_7,
      orden.imagen_8,
      orden.imagen_9,
      orden.imagen_10
    ].filter(img => img && img !== 'sin_imagen.jpg');

    const video = orden.video && orden.video !== 'sin_video.mp4' ? orden.video : null;

    if (imagenes.length === 0 && !video) {
      return null;
    }

    return (
      <div className="mt-3">
        <h6 className="text-primary mb-2">📷 Fotos del Vehículo</h6>
        {imagenes.length > 0 && (
          <div className="row mb-3">
            {imagenes.map((imagen, index) => (
              <div key={index} className="col-md-3 mb-2">
                <img
                  src={getFileUrl(imagen)}
                  alt={`Foto ${index + 1} del vehículo`}
                  className="img-fluid rounded shadow-sm"
                  style={{ 
                    width: '100%', 
                    height: '120px', 
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.open(getFileUrl(imagen), '_blank')}
                />
              </div>
            ))}
          </div>
        )}
        {video && (
          <div className="mb-3">
            <h6 className="text-primary mb-2">🎥 Video del Vehículo</h6>
            <video
              src={getFileUrl(video)}
              controls
              className="img-fluid rounded shadow-sm"
              style={{ maxHeight: '300px' }}
            >
              Tu navegador no soporta la reproducción de video.
            </video>
          </div>
        )}
      </div>
    );
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'Recibido': 'primary',
      'En proceso': 'warning',
      'En espera de piezas': 'info',
      'Finalizado': 'success',
      'Entregado': 'success',
      'Cancelado': 'danger'
    };
    return colores[estado] || 'secondary';
  };

  const getEstadoIcono = (estado) => {
    const iconos = {
      'Recibido': '📋',
      'En proceso': '🔧',
      'En espera de piezas': '⏳',
      'Finalizado': '✅',
      'Entregado': '🚗',
      'Cancelado': '❌'
    };
    return iconos[estado] || '❓';
  };

  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-3">Cargando información de la orden...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid mt-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow">
              <div className="card-header bg-danger text-white">
                <h5 className="mb-0">❌ Error</h5>
              </div>
              <div className="card-body text-center">
                <p className="mb-0">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orden && !loading && !error) {
    return (
      <div className="container-fluid mt-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow">
              <div className="card-body text-center py-5">
                <p className="mb-0">No se pudo cargar la información de la orden.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="text-center">
            <h1 className="h2 mb-3">📋 Información de la Orden</h1>
            <p className="lead text-muted">Orden #{orden.pk_id_orden}</p>
            <p className="text-muted">TECNOAUTO - Centro de Servicio Automotriz</p>
          </div>
        </div>
      </div>

      {/* Información de la Orden */}
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">📋 Detalles de la Orden</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-8">
                  <h6>Orden #{orden.pk_id_orden}</h6>
                  <p className="text-muted mb-3">
                    <strong>Cliente:</strong> {orden.cliente || 'Consumidor Final'}<br/>
                    {orden.NIT && (
                      <>
                        <strong>NIT:</strong> {orden.NIT}<br/>
                      </>
                    )}
                    {orden.telefono_cliente && (
                      <>
                        <strong>Teléfono:</strong> {orden.telefono_cliente}<br/>
                      </>
                    )}
                    <strong>Vehículo:</strong> {orden.vehiculo} - {orden.placa_vehiculo}<br/>
                    {orden.anio_vehiculo && (
                      <>
                        <strong>Año:</strong> {orden.anio_vehiculo}<br/>
                      </>
                    )}
                    <strong>Servicio:</strong> {orden.servicio}<br/>
                    <strong>Fecha de ingreso:</strong> {new Date(orden.fecha_ingreso_orden).toLocaleDateString('es-GT')}
                  </p>
                  
                  {orden.comentario_cliente_orden && (
                    <div className="mb-3">
                      <strong>Comentario del cliente:</strong>
                      <p className="text-muted">{orden.comentario_cliente_orden}</p>
                    </div>
                  )}
                  
                  {orden.observaciones_orden && (
                    <div className="mb-3">
                      <strong>Observaciones del taller:</strong>
                      <p className="text-muted">{orden.observaciones_orden}</p>
                    </div>
                  )}

                  {orden.estado_vehiculo && (
                    <div className="mb-3">
                      <strong>Estado del vehículo:</strong>
                      <p className="text-muted">{orden.estado_vehiculo}</p>
                    </div>
                  )}

                  {/* Galería de multimedia */}
                  {renderizarMultimedia(orden)}
                </div>
                <div className="col-md-4 text-center">
                  <div className={`badge bg-${getEstadoColor(orden.estado_orden)} fs-6 p-3 mb-3`}>
                    {getEstadoIcono(orden.estado_orden)}<br/>
                    {orden.estado_orden}
                  </div>
                  <p className="text-muted small">{orden.descripcion_estado}</p>
                  
                  {orden.nivel_combustible_orden && (
                    <div className="mt-3">
                      <strong>Combustible:</strong> {orden.nivel_combustible_orden}
                    </div>
                  )}
                  
                  {orden.odometro_auto_cliente_orden && (
                    <div className="mt-2">
                      <strong>Odómetro:</strong> {orden.odometro_auto_cliente_orden} {orden.unidad_odometro || 'km'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Historial de Estados */}
          {historial.length > 0 && (
            <div className="card shadow">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">📋 Historial de Estados</h5>
              </div>
              <div className="card-body">
                <div className="timeline">
                  {historial.map((item, index) => (
                    <div key={index} className={`timeline-item ${item.activo ? 'active' : ''}`}>
                      <div className="timeline-marker">
                        <span className={`badge bg-${getEstadoColor(item.estado)}`}>
                          {getEstadoIcono(item.estado)}
                        </span>
                      </div>
                      <div className="timeline-content">
                        <h6 className={`${item.activo ? 'text-primary' : 'text-muted'}`}>
                          {item.estado}
                          {item.activo && <span className="badge bg-primary ms-2">ACTUAL</span>}
                        </h6>
                        <p className="text-muted small mb-1">{item.descripcion}</p>
                        {item.comentario && (
                          <p className="text-muted small mb-1">{item.comentario}</p>
                        )}
                        <small className="text-muted">
                          {new Date(item.fecha).toLocaleDateString('es-GT')} - {new Date(item.fecha).toLocaleTimeString('es-GT')}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="row justify-content-center mt-5">
        <div className="col-lg-8">
          <div className="card border-0 bg-light">
            <div className="card-body text-center">
              <h6>ℹ️ Información Importante</h6>
              <p className="small text-muted mb-0">
                Este enlace te permite consultar el estado de tu orden sin necesidad de crear una cuenta. 
                Si tienes alguna pregunta adicional, no dudes en contactarnos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .timeline {
          position: relative;
          padding-left: 30px;
        }
        
        .timeline-item {
          position: relative;
          margin-bottom: 20px;
        }
        
        .timeline-item:not(:last-child)::before {
          content: '';
          position: absolute;
          left: -25px;
          top: 30px;
          width: 2px;
          height: calc(100% + 10px);
          background-color: #dee2e6;
        }
        
        .timeline-item.active:not(:last-child)::before {
          background-color: #0d6efd;
        }
        
        .timeline-marker {
          position: absolute;
          left: -30px;
          top: 0;
        }
        
        .timeline-content {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }
        
        .timeline-item.active .timeline-content {
          border-color: #0d6efd;
          background-color: #f8f9ff;
        }
      `}</style>
    </div>
  );
};

export default OrdenPublica;

