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
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-0">📊 Generador de Reportes</h1>
              <p className="text-muted">Genera reportes en PDF y Excel del taller mecánico</p>
            </div>
            <button className="btn btn-outline-secondary" onClick={() => window.history.back()}>
              ← Volver al Dashboard
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          </div>
        </div>
      )}

      <div className="row">
        {/* Panel de selección */}
        <div className="col-lg-4 mb-4">
          <div className="card shadow">
            <div className="card-header">
              <h5 className="mb-0">📋 Seleccionar Reporte</h5>
            </div>
            <div className="card-body">
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
                <div className="alert alert-info">
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
                    className="btn btn-outline-secondary btn-sm"
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
                      className="btn btn-danger"
                      onClick={() => generarReporte('pdf')}
                      disabled={loading}
                    >
                      {loading ? '⏳ Generando...' : '📄 Generar PDF'}
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={() => generarReporte('excel')}
                      disabled={loading}
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
          <div className="card shadow">
            <div className="card-header">
              <h5 className="mb-0">ℹ️ Información de Reportes</h5>
            </div>
            <div className="card-body">
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
                    <div className="card border">
                      <div className="card-body p-3">
                        <h6 className="card-title">{reporte.nombre}</h6>
                        <p className="card-text small text-muted">{reporte.descripcion}</p>
                        {reporte.filtros.length > 0 && (
                          <small className="text-info">
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
          <div className="card shadow">
            <div className="card-header">
              <h5 className="mb-0">📖 Instrucciones de Uso</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <h6>1️⃣ Seleccionar</h6>
                  <p>Elige el tipo de reporte que necesitas generar</p>
                </div>
                <div className="col-md-4">
                  <h6>2️⃣ Filtrar</h6>
                  <p>Aplica filtros para personalizar el reporte según tus necesidades</p>
                </div>
                <div className="col-md-4">
                  <h6>3️⃣ Generar</h6>
                  <p>Haz clic en PDF o Excel para descargar el reporte</p>
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
