import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Reportes = () => {
  const [tiposReportes, setTiposReportes] = useState([]);
  const [filtros, setFiltros] = useState({});
  const [opcionesFiltros, setOpcionesFiltros] = useState({ estados: [], servicios: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reporteSeleccionado, setReporteSeleccionado] = useState('');

  useEffect(() => {
    cargarTiposReportes();
    cargarOpcionesFiltros();
  }, []);

  const cargarTiposReportes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/api/reportes/tipos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTiposReportes(response.data);
    } catch (error) {
      console.error('Error cargando tipos de reportes:', error);
      setError('Error al cargar tipos de reportes');
    }
  };

  const cargarOpcionesFiltros = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/api/reportes/filtros', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpcionesFiltros(response.data);
    } catch (error) {
      console.error('Error cargando opciones de filtros:', error);
    }
  };

  const generarReporte = async (formato) => {
    if (!reporteSeleccionado) {
      setError('Por favor selecciona un tipo de reporte');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      // Agregar filtros a los parámetros
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const url = `http://localhost:4000/api/reportes/${formato}/${reporteSeleccionado}?${params.toString()}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Crear enlace de descarga
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const extension = formato === 'pdf' ? 'pdf' : 'xlsx';
      link.download = `reporte_${reporteSeleccionado}_${new Date().toISOString().split('T')[0]}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('Error generando reporte:', error);
      setError('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({});
  };

  const reporteSeleccionadoData = tiposReportes.find(r => r.id === reporteSeleccionado);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, var(--tecno-gray-very-light) 0%, var(--tecno-white) 100%)',
      paddingTop: '90px'
    }}>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 style={{ 
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  marginBottom: '8px',
                  background: 'linear-gradient(135deg, var(--tecno-orange), var(--tecno-orange-light))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  📊 Generador de Reportes
                </h1>
                <p style={{ 
                  color: 'var(--tecno-gray-dark)', 
                  fontSize: '1.1rem',
                  marginBottom: '0'
                }}>
                  Genera reportes en PDF y Excel del taller mecánico
                </p>
              </div>
              <button className="btn-tecno-outline" onClick={() => window.history.back()}>
                ← Volver al Dashboard
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="alert-tecno alert-tecno-danger" role="alert">
                {error}
              </div>
            </div>
          </div>
        )}

        <div className="row">
          {/* Panel de selección */}
          <div className="col-lg-4 mb-4">
            <div className="card-tecno">
              <div className="card-tecno-header">
                📋 Seleccionar Reporte
              </div>
              <div className="card-tecno-body">
              <div className="mb-3">
                <label className="form-label">Tipo de Reporte</label>
                <select 
                  className="form-select"
                  value={reporteSeleccionado}
                  onChange={(e) => setReporteSeleccionado(e.target.value)}
                >
                  <option value="">Selecciona un reporte...</option>
                  {tiposReportes.map(reporte => (
                    <option key={reporte.id} value={reporte.id}>
                      {reporte.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {reporteSeleccionadoData && (
                <div className="alert-tecno alert-tecno-info">
                  <strong>{reporteSeleccionadoData.nombre}</strong><br/>
                  <small>{reporteSeleccionadoData.descripcion}</small>
                </div>
              )}

              {/* Filtros */}
              {reporteSeleccionadoData && reporteSeleccionadoData.filtros.length > 0 && (
                <div className="mt-3">
                  <h6>🔍 Filtros</h6>
                  
                  {reporteSeleccionadoData.filtros.includes('fechaInicio') && (
                    <div className="mb-2">
                      <label className="form-label">Fecha Inicio</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={filtros.fechaInicio || ''}
                        onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                      />
                    </div>
                  )}

                  {reporteSeleccionadoData.filtros.includes('fechaFin') && (
                    <div className="mb-2">
                      <label className="form-label">Fecha Fin</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={filtros.fechaFin || ''}
                        onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                      />
                    </div>
                  )}

                  {reporteSeleccionadoData.filtros.includes('estado') && (
                    <div className="mb-2">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-select form-select-sm"
                        value={filtros.estado || ''}
                        onChange={(e) => handleFiltroChange('estado', e.target.value)}
                      >
                        <option value="">Todos los estados</option>
                        {opcionesFiltros.estados.map(estado => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {reporteSeleccionadoData.filtros.includes('servicio') && (
                    <div className="mb-2">
                      <label className="form-label">Servicio</label>
                      <select
                        className="form-select form-select-sm"
                        value={filtros.servicio || ''}
                        onChange={(e) => handleFiltroChange('servicio', e.target.value)}
                      >
                        <option value="">Todos los servicios</option>
                        {opcionesFiltros.servicios.map(servicio => (
                          <option key={servicio} value={servicio}>{servicio}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button 
                    className="btn-tecno-outline btn-sm"
                    onClick={limpiarFiltros}
                  >
                    🗑️ Limpiar Filtros
                  </button>
                </div>
              )}

              {/* Botones de generación */}
              {reporteSeleccionado && (
                <div className="mt-4">
                  <h6>📄 Generar Reporte</h6>
                  <div className="d-grid gap-2">
                    <button
                      className="btn-tecno"
                      onClick={() => generarReporte('pdf')}
                      disabled={loading}
                      style={{ backgroundColor: 'var(--danger)' }}
                    >
                      {loading ? '⏳ Generando...' : '📄 Generar PDF'}
                    </button>
                    <button
                      className="btn-tecno"
                      onClick={() => generarReporte('excel')}
                      disabled={loading}
                      style={{ backgroundColor: 'var(--success)' }}
                    >
                      {loading ? '⏳ Generando...' : '📊 Generar Excel'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

          {/* Panel de información */}
          <div className="col-lg-8 mb-4">
            <div className="card-tecno">
              <div className="card-tecno-header">
                ℹ️ Información de Reportes
              </div>
              <div className="card-tecno-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>📄 Reportes PDF</h6>
                  <ul className="list-unstyled">
                    <li>✅ Formato profesional</li>
                    <li>✅ Fácil de imprimir</li>
                    <li>✅ Ideal para presentaciones</li>
                    <li>✅ Tamaño de archivo pequeño</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>📊 Reportes Excel</h6>
                  <ul className="list-unstyled">
                    <li>✅ Datos tabulares</li>
                    <li>✅ Fácil de analizar</li>
                    <li>✅ Filtros y ordenamiento</li>
                    <li>✅ Ideal para análisis</li>
                  </ul>
                </div>
              </div>

              <hr/>

              <h6>📋 Tipos de Reportes Disponibles</h6>
              <div className="row">
                {tiposReportes.map(reporte => (
                  <div key={reporte.id} className="col-md-6 mb-3">
                    <div className="card-tecno">
                      <div className="card-tecno-body p-3">
                        <h6 style={{ color: 'var(--tecno-black)' }}>{reporte.nombre}</h6>
                        <p style={{ color: 'var(--tecno-gray-dark)', fontSize: '14px' }}>{reporte.descripcion}</p>
                        {reporte.filtros.length > 0 && (
                          <small style={{ color: 'var(--info)' }}>
                            🔍 Filtros: {reporte.filtros.join(', ')}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Instrucciones */}
        <div className="row">
          <div className="col-12">
            <div className="card-tecno">
              <div className="card-tecno-header">
                📖 Instrucciones de Uso
              </div>
              <div className="card-tecno-body">
              <div className="row">
                <div className="col-md-4">
                  <h6 style={{ color: 'var(--tecno-black)' }}>1️⃣ Seleccionar</h6>
                  <p style={{ color: 'var(--tecno-gray-dark)' }}>Elige el tipo de reporte que necesitas generar</p>
                </div>
                <div className="col-md-4">
                  <h6 style={{ color: 'var(--tecno-black)' }}>2️⃣ Filtrar</h6>
                  <p style={{ color: 'var(--tecno-gray-dark)' }}>Aplica filtros para personalizar el reporte según tus necesidades</p>
                </div>
                <div className="col-md-4">
                  <h6 style={{ color: 'var(--tecno-black)' }}>3️⃣ Generar</h6>
                  <p style={{ color: 'var(--tecno-gray-dark)' }}>Haz clic en PDF o Excel para descargar el reporte</p>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportes;
