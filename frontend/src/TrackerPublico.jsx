import React, { useState } from 'react';
import axios from 'axios';

const TrackerPublico = () => {
  const [tipoBusqueda, setTipoBusqueda] = useState('telefono');
  const [valorBusqueda, setValorBusqueda] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [historial, setHistorial] = useState(null);

  const buscarOrden = async () => {
    if (!valorBusqueda.trim()) {
      setError('Por favor ingresa un valor para buscar');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResultado(null);
      setOrdenSeleccionada(null);
      setHistorial(null);

      let url = '';
      if (tipoBusqueda === 'telefono') {
        url = `/api/tracker/telefono/${valorBusqueda}`;
      } else {
        url = `/api/tracker/orden/${valorBusqueda}`;
      }

      const response = await axios.get(url);
      setResultado(response.data);

    } catch (error) {
      console.error('Error en búsqueda:', error);
      setError('Error al buscar la orden. Verifica los datos e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const verHistorial = async (numeroOrden) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/tracker/historial/${numeroOrden}`);
      setHistorial(response.data);
      setOrdenSeleccionada(numeroOrden);
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      setError('Error al obtener el historial de la orden.');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="text-center">
            <h1 className="h2 mb-3">🔍 Tracker Público de Órdenes</h1>
            <p className="lead text-muted">Consulta el estado de tu orden de servicio</p>
            <p className="text-muted">Taller Mecánico Tecno Auto - Repuestos Electrofrio</p>
          </div>
        </div>
      </div>

      {/* Formulario de búsqueda */}
      <div className="row justify-content-center mb-4">
        <div className="col-lg-8">
          <div className="card shadow">
            <div className="card-header">
              <h5 className="mb-0">🔍 Buscar Orden</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <label className="form-label">Tipo de búsqueda</label>
                  <select 
                    className="form-select"
                    value={tipoBusqueda}
                    onChange={(e) => setTipoBusqueda(e.target.value)}
                  >
                    <option value="telefono">📞 Por teléfono</option>
                    <option value="orden">🔢 Por número de orden</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    {tipoBusqueda === 'telefono' ? 'Número de teléfono' : 'Número de orden'}
                  </label>
                  <input
                    type={tipoBusqueda === 'telefono' ? 'tel' : 'number'}
                    className="form-control"
                    placeholder={tipoBusqueda === 'telefono' ? 'Ej: 12345678' : 'Ej: 12'}
                    value={valorBusqueda}
                    onChange={(e) => setValorBusqueda(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && buscarOrden()}
                  />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={buscarOrden}
                    disabled={loading}
                  >
                    {loading ? '⏳ Buscando...' : '🔍 Buscar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="row justify-content-center mb-4">
          <div className="col-lg-8">
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {resultado && (
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {resultado.encontrado ? (
              <div className="card shadow">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">✅ Órdenes Encontradas</h5>
                </div>
                <div className="card-body">
                  {resultado.ordenes ? (
                    // Múltiples órdenes (búsqueda por teléfono)
                    <div>
                      <p className="text-muted mb-3">
                        Se encontraron {resultado.total} orden(es) para el teléfono {valorBusqueda}
                      </p>
                      <div className="row">
                        {resultado.ordenes.map((orden) => (
                          <div key={orden.pk_id_orden} className="col-md-6 mb-3">
                            <div className="card border">
                              <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className="card-title mb-0">Orden #{orden.pk_id_orden}</h6>
                                  <span className={`badge bg-${getEstadoColor(orden.estado_orden)}`}>
                                    {getEstadoIcono(orden.estado_orden)} {orden.estado_orden}
                                  </span>
                                </div>
                                <p className="card-text small">
                                  <strong>Cliente:</strong> {orden.cliente}<br/>
                                  <strong>Vehículo:</strong> {orden.vehiculo} - {orden.placa_vehiculo}<br/>
                                  <strong>Servicio:</strong> {orden.servicio}<br/>
                                  <strong>Fecha:</strong> {new Date(orden.fecha_ingreso_orden).toLocaleDateString('es-GT')}
                                </p>
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => verHistorial(orden.pk_id_orden)}
                                >
                                  📋 Ver Historial
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Una sola orden (búsqueda por número)
                    <div>
                      <div className="row">
                        <div className="col-md-8">
                          <h6>Orden #{resultado.orden.pk_id_orden}</h6>
                          <p className="text-muted mb-3">
                            <strong>Cliente:</strong> {resultado.orden.cliente}<br/>
                            <strong>Teléfono:</strong> {resultado.orden.telefono_cliente}<br/>
                            <strong>Vehículo:</strong> {resultado.orden.vehiculo} - {resultado.orden.placa_vehiculo}<br/>
                            <strong>Servicio:</strong> {resultado.orden.servicio}<br/>
                            <strong>Fecha de ingreso:</strong> {new Date(resultado.orden.fecha_ingreso_orden).toLocaleDateString('es-GT')}
                          </p>
                          {resultado.orden.comentario_cliente_orden && (
                            <div className="mb-3">
                              <strong>Comentario del cliente:</strong>
                              <p className="text-muted">{resultado.orden.comentario_cliente_orden}</p>
                            </div>
                          )}
                          {resultado.orden.observaciones_orden && (
                            <div className="mb-3">
                              <strong>Observaciones del taller:</strong>
                              <p className="text-muted">{resultado.orden.observaciones_orden}</p>
                            </div>
                          )}
                        </div>
                        <div className="col-md-4 text-center">
                          <div className={`badge bg-${getEstadoColor(resultado.orden.estado_orden)} fs-6 p-3 mb-3`}>
                            {getEstadoIcono(resultado.orden.estado_orden)}<br/>
                            {resultado.orden.estado_orden}
                          </div>
                          <p className="text-muted small">{resultado.orden.descripcion_estado}</p>
                          <button 
                            className="btn btn-primary"
                            onClick={() => verHistorial(resultado.orden.pk_id_orden)}
                          >
                            📋 Ver Historial Completo
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card shadow">
                <div className="card-header bg-warning text-dark">
                  <h5 className="mb-0">⚠️ No Encontrado</h5>
                </div>
                <div className="card-body text-center">
                  <p className="mb-0">{resultado.mensaje}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historial de la orden */}
      {historial && historial.encontrado && (
        <div className="row justify-content-center mt-4">
          <div className="col-lg-8">
            <div className="card shadow">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">📋 Historial de la Orden #{ordenSeleccionada}</h5>
              </div>
              <div className="card-body">
                <div className="timeline">
                  {historial.historial.map((item, index) => (
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
                        <small className="text-muted">
                          {new Date(item.fecha).toLocaleDateString('es-GT')} - {new Date(item.fecha).toLocaleTimeString('es-GT')}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-center">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setHistorial(null);
                      setOrdenSeleccionada(null);
                    }}
                  >
                    ← Volver a los Resultados
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="row justify-content-center mt-5">
        <div className="col-lg-8">
          <div className="card border-0 bg-light">
            <div className="card-body text-center">
              <h6>ℹ️ Información Importante</h6>
              <p className="small text-muted mb-0">
                Este tracker público te permite consultar el estado de tu orden sin necesidad de crear una cuenta. 
                Si tienes alguna pregunta adicional, no dudes en contactarnos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
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

export default TrackerPublico;

