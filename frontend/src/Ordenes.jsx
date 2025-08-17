import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImprimirOrden from './ImprimirOrden';

const Ordenes = () => {
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [estados, setEstados] = useState([]);
  const [editando, setEditando] = useState(false);
  const [ordenId, setOrdenId] = useState(null);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [vehiculoEncontrado, setVehiculoEncontrado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [mostrarImpresion, setMostrarImpresion] = useState(false);
  const [ordenParaImprimir, setOrdenParaImprimir] = useState(null);

  const [form, setForm] = useState({
    dpi_cliente: '',
    placa_vehiculo: '',
    fk_id_servicio: '',
    comentario_cliente_orden: '',
    nivel_combustible_orden: 'Medium',
    odometro_auto_cliente_orden: '',
    fk_id_estado_orden: '',
    observaciones_orden: '',
    imagen_1: null,
    imagen_2: null,
    imagen_3: null,
    imagen_4: null,
    video: null
  });

  useEffect(() => {
    cargarOrdenes();
    cargarServicios();
    cargarEstados();
  }, []);

  const cargarOrdenes = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/ordenes');
      if (response.ok) {
        const data = await response.json();
        setOrdenes(data);
      }
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
    }
  };

  const cargarServicios = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/servicios');
      if (response.ok) {
        const data = await response.json();
        setServicios(data);
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    }
  };

  const cargarEstados = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/estados');
      if (response.ok) {
        const data = await response.json();
        setEstados(data);
      }
    } catch (error) {
      console.error('Error al cargar estados:', error);
    }
  };

  const buscarCliente = async (dpi) => {
    if (dpi.length < 3) {
      setClienteEncontrado(null);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:4000/api/ordenes/buscar-cliente/${dpi}`);
      if (response.ok) {
        const cliente = await response.json();
        setClienteEncontrado(cliente);
        setForm(prev => ({ ...prev, fk_id_cliente: cliente.PK_id_cliente }));
      } else {
        setClienteEncontrado(null);
        setForm(prev => ({ ...prev, fk_id_cliente: '' }));
      }
    } catch (error) {
      console.error('Error al buscar cliente:', error);
      setClienteEncontrado(null);
    }
  };

  const buscarVehiculo = async (placa) => {
    if (placa.length < 3) {
      setVehiculoEncontrado(null);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:4000/api/ordenes/buscar-vehiculo/${placa}`);
      if (response.ok) {
        const vehiculo = await response.json();
        setVehiculoEncontrado(vehiculo);
        setForm(prev => ({ ...prev, fk_id_vehiculo: vehiculo.pk_id_vehiculo }));
      } else {
        setVehiculoEncontrado(null);
        setForm(prev => ({ ...prev, fk_id_vehiculo: '' }));
      }
    } catch (error) {
      console.error('Error al buscar vehículo:', error);
      setVehiculoEncontrado(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files) {
      setForm(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
      
      // Búsqueda automática
      if (name === 'dpi_cliente') {
        buscarCliente(value);
      } else if (name === 'placa_vehiculo') {
        buscarVehiculo(value);
      }
    }
  };

  const limpiarFormulario = () => {
    setForm({
      dpi_cliente: '',
      placa_vehiculo: '',
      fk_id_servicio: '',
      comentario_cliente_orden: '',
      nivel_combustible_orden: 'Medium',
      odometro_auto_cliente_orden: '',
      fk_id_estado_orden: '',
      observaciones_orden: '',
      imagen_1: null,
      imagen_2: null,
      imagen_3: null,
      imagen_4: null,
      video: null
    });
    setClienteEncontrado(null);
    setVehiculoEncontrado(null);
    setEditando(false);
    setOrdenId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.fk_id_cliente || !form.fk_id_vehiculo || !form.fk_id_servicio || !form.fk_id_estado_orden) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    const formData = new FormData();
    formData.append('fk_id_cliente', form.fk_id_cliente);
    formData.append('fk_id_vehiculo', form.fk_id_vehiculo);
    formData.append('fk_id_servicio', form.fk_id_servicio);
    formData.append('comentario_cliente_orden', form.comentario_cliente_orden);
    formData.append('nivel_combustible_orden', form.nivel_combustible_orden);
    formData.append('odometro_auto_cliente_orden', form.odometro_auto_cliente_orden);
    formData.append('fk_id_estado_orden', form.fk_id_estado_orden);
    formData.append('observaciones_orden', form.observaciones_orden);
    
    if (form.imagen_1) formData.append('imagen_1', form.imagen_1);
    if (form.imagen_2) formData.append('imagen_2', form.imagen_2);
    if (form.imagen_3) formData.append('imagen_3', form.imagen_3);
    if (form.imagen_4) formData.append('imagen_4', form.imagen_4);
    if (form.video) formData.append('video', form.video);

    try {
      const url = editando 
        ? `http://localhost:4000/api/ordenes/${ordenId}`
        : 'http://localhost:4000/api/ordenes';
      
      const method = editando ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formData
      });

      if (response.ok) {
        const message = editando ? 'Orden actualizada correctamente' : 'Orden registrada exitosamente';
        alert(message);
        limpiarFormulario();
        cargarOrdenes();
      } else {
        const error = await response.json();
        alert(error.message || 'Error al procesar la orden');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la orden');
    }
  };

  const editarOrden = (orden) => {
    // Buscar los IDs correctos basándose en los nombres
    const servicioEncontrado = servicios.find(s => s.servicio === orden.servicio);
    const estadoEncontrado = estados.find(e => e.estado_orden === orden.estado_orden);
    
    setForm({
      dpi_cliente: orden.dpi_cliente || '',
      placa_vehiculo: orden.placa_vehiculo || '',
      fk_id_servicio: servicioEncontrado ? servicioEncontrado.pk_id_servicio : '',
      comentario_cliente_orden: orden.comentario_cliente_orden || '',
      nivel_combustible_orden: orden.nivel_combustible_orden || 'Medium',
      odometro_auto_cliente_orden: orden.odometro_auto_cliente_orden || '',
      fk_id_estado_orden: estadoEncontrado ? estadoEncontrado.pk_id_estado : '',
      observaciones_orden: orden.observaciones_orden || '',
      imagen_1: null,
      imagen_2: null,
      imagen_3: null,
      imagen_4: null,
      video: null
    });
    
    // Buscar cliente y vehículo para mostrar información
    if (orden.dpi_cliente) {
      buscarCliente(orden.dpi_cliente);
    }
    if (orden.placa_vehiculo) {
      buscarVehiculo(orden.placa_vehiculo);
    }
    
    setEditando(true);
    setOrdenId(orden.pk_id_orden);
  };

  const eliminarOrden = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta orden?')) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/ordenes/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('Orden eliminada correctamente');
        cargarOrdenes();
      } else {
        const error = await response.json();
        alert(error.message || 'Error al eliminar la orden');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la orden');
    }
  };

  const verMultimedia = (orden) => {
    setOrdenSeleccionada(orden);
    setMostrarModal(true);
  };

  const imprimirOrden = (orden) => {
    setOrdenParaImprimir(orden);
    setMostrarImpresion(true);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-GT');
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Órdenes</h2>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/home')}
        >
          ← Volver al Menú Principal
        </button>
      </div>

      {/* Formulario */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            {editando ? '✏️ Editando Orden' : '➕ Nueva Orden'}
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Cliente */}
              <div className="col-md-6 mb-3">
                <label className="form-label">DPI del Cliente *</label>
                <input
                  type="text"
                  className={`form-control ${clienteEncontrado ? 'is-valid' : form.dpi_cliente && !clienteEncontrado ? 'is-invalid' : ''}`}
                  name="dpi_cliente"
                  value={form.dpi_cliente}
                  onChange={handleInputChange}
                  placeholder="Ingrese DPI del cliente"
                  required
                />
                {clienteEncontrado && (
                  <div className="valid-feedback">
                    ✅ Cliente: {clienteEncontrado.nombre_cliente} {clienteEncontrado.apellido_cliente}
                  </div>
                )}
                {form.dpi_cliente && !clienteEncontrado && (
                  <div className="invalid-feedback">
                    ❌ Cliente no encontrado
                  </div>
                )}
              </div>

              {/* Vehículo */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Placa del Vehículo *</label>
                <input
                  type="text"
                  className={`form-control ${vehiculoEncontrado ? 'is-valid' : form.placa_vehiculo && !vehiculoEncontrado ? 'is-invalid' : ''}`}
                  name="placa_vehiculo"
                  value={form.placa_vehiculo}
                  onChange={handleInputChange}
                  placeholder="Ingrese placa del vehículo"
                  required
                />
                {vehiculoEncontrado && (
                  <div className="valid-feedback">
                    ✅ Vehículo: {vehiculoEncontrado.marca_vehiculo} {vehiculoEncontrado.modelo_vehiculo} ({vehiculoEncontrado.anio_vehiculo})
                  </div>
                )}
                {form.placa_vehiculo && !vehiculoEncontrado && (
                  <div className="invalid-feedback">
                    ❌ Vehículo no encontrado
                  </div>
                )}
              </div>
            </div>

            <div className="row">
              {/* Servicio */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Tipo de Servicio *</label>
                <select
                  className="form-select"
                  name="fk_id_servicio"
                  value={form.fk_id_servicio}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione un servicio</option>
                  {servicios.map(servicio => (
                    <option key={servicio.pk_id_servicio} value={servicio.pk_id_servicio}>
                      {servicio.servicio}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Estado de la Orden *</label>
                <select
                  className="form-select"
                  name="fk_id_estado_orden"
                  value={form.fk_id_estado_orden}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione un estado</option>
                  {estados.map(estado => (
                    <option key={estado.pk_id_estado} value={estado.pk_id_estado}>
                      {estado.estado_orden}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row">
              {/* Nivel de Combustible */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Nivel de Combustible *</label>
                <select
                  className="form-select"
                  name="nivel_combustible_orden"
                  value={form.nivel_combustible_orden}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Empty">Vacío</option>
                  <option value="Low">Bajo</option>
                  <option value="Medium">Medio</option>
                  <option value="High">Alto</option>
                  <option value="Full">Lleno</option>
                </select>
              </div>

              {/* Odómetro */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Odómetro (km)</label>
                <input
                  type="number"
                  className="form-control"
                  name="odometro_auto_cliente_orden"
                  value={form.odometro_auto_cliente_orden}
                  onChange={handleInputChange}
                  placeholder="Kilometraje actual"
                />
              </div>
            </div>

            {/* Comentarios */}
            <div className="mb-3">
              <label className="form-label">Comentario del Cliente</label>
              <textarea
                className="form-control"
                name="comentario_cliente_orden"
                value={form.comentario_cliente_orden}
                onChange={handleInputChange}
                rows="3"
                placeholder="Descripción del problema o solicitud"
              />
            </div>

            {/* Observaciones */}
            <div className="mb-3">
              <label className="form-label">Observaciones del Taller</label>
              <textarea
                className="form-control"
                name="observaciones_orden"
                value={form.observaciones_orden}
                onChange={handleInputChange}
                rows="3"
                placeholder="Observaciones técnicas del taller"
              />
            </div>

            {/* Archivos Multimedia */}
            <div className="row">
              <div className="col-md-2 mb-3">
                <label className="form-label">Imagen 1</label>
                <input
                  type="file"
                  className="form-control"
                  name="imagen_1"
                  onChange={handleInputChange}
                  accept="image/*"
                />
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Imagen 2</label>
                <input
                  type="file"
                  className="form-control"
                  name="imagen_2"
                  onChange={handleInputChange}
                  accept="image/*"
                />
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Imagen 3</label>
                <input
                  type="file"
                  className="form-control"
                  name="imagen_3"
                  onChange={handleInputChange}
                  accept="image/*"
                />
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Imagen 4</label>
                <input
                  type="file"
                  className="form-control"
                  name="imagen_4"
                  onChange={handleInputChange}
                  accept="image/*"
                />
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Video</label>
                <input
                  type="file"
                  className="form-control"
                  name="video"
                  onChange={handleInputChange}
                  accept="video/*"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary">
                {editando ? '✏️ Actualizar Orden' : '➕ Registrar Orden'}
              </button>
              {editando && (
                <button 
                  type="button" 
                  className="btn btn-warning"
                  onClick={limpiarFormulario}
                >
                  ❌ Cancelar Edición
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Órdenes Registradas</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Servicio</th>
                  <th>Estado</th>
                  <th>Combustible</th>
                  <th>Odómetro</th>
                  <th>Multimedia</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map(orden => (
                  <tr key={orden.pk_id_orden}>
                    <td>{orden.pk_id_orden}</td>
                    <td>{formatearFecha(orden.fecha_ingreso_orden)}</td>
                    <td>
                      {orden.nombre_cliente} {orden.apellido_cliente}
                      <br />
                      <small className="text-muted">DPI: {orden.dpi_cliente}</small>
                    </td>
                    <td>
                      {orden.placa_vehiculo}
                      <br />
                      <small className="text-muted">{orden.marca_vehiculo} {orden.modelo_vehiculo}</small>
                    </td>
                    <td>{orden.servicio}</td>
                    <td>
                      <span className={`badge ${
                        orden.estado_orden === 'Pendiente' ? 'bg-warning' :
                        orden.estado_orden === 'En Proceso' ? 'bg-info' :
                        orden.estado_orden === 'Completado' ? 'bg-success' :
                        orden.estado_orden === 'Cancelado' ? 'bg-danger' : 'bg-secondary'
                      }`}>
                        {orden.estado_orden}
                      </span>
                    </td>
                    <td>{orden.nivel_combustible_orden}</td>
                    <td>{orden.odometro_auto_cliente_orden ? `${orden.odometro_auto_cliente_orden} km` : '-'}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => verMultimedia(orden)}
                          title="Ver multimedia"
                        >
                          📷
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => imprimirOrden(orden)}
                          title="Imprimir orden"
                        >
                          🖨️
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => editarOrden(orden)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => eliminarOrden(orden.pk_id_orden)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Multimedia */}
      {mostrarModal && ordenSeleccionada && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Multimedia - Orden #{ordenSeleccionada.pk_id_orden}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setMostrarModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Cliente:</strong> {ordenSeleccionada.nombre_cliente} {ordenSeleccionada.apellido_cliente}
                    <br />
                    <strong>DPI:</strong> {ordenSeleccionada.dpi_cliente}
                  </div>
                  <div className="col-md-6">
                    <strong>Vehículo:</strong> {ordenSeleccionada.placa_vehiculo}
                    <br />
                    <strong>Modelo:</strong> {ordenSeleccionada.marca_vehiculo} {ordenSeleccionada.modelo_vehiculo}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Servicio:</strong> {ordenSeleccionada.servicio}
                    <br />
                    <strong>Estado:</strong> {ordenSeleccionada.estado_orden}
                  </div>
                  <div className="col-md-6">
                    <strong>Combustible:</strong> {ordenSeleccionada.nivel_combustible_orden}
                    <br />
                    <strong>Odómetro:</strong> {ordenSeleccionada.odometro_auto_cliente_orden ? `${ordenSeleccionada.odometro_auto_cliente_orden} km` : 'No especificado'}
                  </div>
                </div>

                {ordenSeleccionada.comentario_cliente_orden && (
                  <div className="mb-3">
                    <strong>Comentario del Cliente:</strong>
                    <p className="mt-1">{ordenSeleccionada.comentario_cliente_orden}</p>
                  </div>
                )}

                {ordenSeleccionada.observaciones_orden && (
                  <div className="mb-3">
                    <strong>Observaciones del Taller:</strong>
                    <p className="mt-1">{ordenSeleccionada.observaciones_orden}</p>
                  </div>
                )}

                {/* Imágenes */}
                <div className="row mb-3">
                  <div className="col-12">
                    <h6>Imágenes:</h6>
                  </div>
                  {[ordenSeleccionada.imagen_1, ordenSeleccionada.imagen_2, ordenSeleccionada.imagen_3, ordenSeleccionada.imagen_4].map((imagen, index) => (
                    imagen && imagen !== 'sin_imagen.jpg' ? (
                      <div key={index} className="col-md-6 mb-2">
                        <img
                          src={`http://localhost:4000/uploads/${imagen}`}
                          alt={`Imagen ${index + 1}`}
                          className="img-fluid rounded"
                          style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : null
                  ))}
                  {[ordenSeleccionada.imagen_1, ordenSeleccionada.imagen_2, ordenSeleccionada.imagen_3, ordenSeleccionada.imagen_4].every(img => !img || img === 'sin_imagen.jpg') && (
                    <div className="col-12">
                      <p className="text-muted">No hay imágenes registradas</p>
                    </div>
                  )}
                </div>

                {/* Video */}
                {ordenSeleccionada.video && ordenSeleccionada.video !== 'sin_video.mp4' && (
                  <div className="mb-3">
                    <h6>Video:</h6>
                    <video
                      controls
                      className="w-100"
                      style={{ maxHeight: '400px' }}
                    >
                      <source src={`http://localhost:4000/uploads/${ordenSeleccionada.video}`} type="video/mp4" />
                      Tu navegador no soporta el elemento de video.
                    </video>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setMostrarModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay del modal */}
      {mostrarModal && (
        <div className="modal-backdrop fade show" />
      )}

      {/* Componente de Impresión */}
      {mostrarImpresion && ordenParaImprimir && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  🖨️ Imprimir Orden #{ordenParaImprimir.pk_id_orden}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setMostrarImpresion(false)}
                />
              </div>
              <div className="modal-body p-0">
                <ImprimirOrden 
                  orden={ordenParaImprimir} 
                  onClose={() => setMostrarImpresion(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay del modal de impresión */}
      {mostrarImpresion && (
        <div className="modal-backdrop fade show" />
      )}
    </div>
  );
};

export default Ordenes;
