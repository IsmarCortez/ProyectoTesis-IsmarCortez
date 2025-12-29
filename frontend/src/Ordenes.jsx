import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImprimirOrden from './ImprimirOrden';
import { getFileUrl } from './config/cloudinary';

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
  const [procesandoOrden, setProcesandoOrden] = useState(false);

  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesSugeridos, setClientesSugeridos] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const [form, setForm] = useState({
    nit_cliente: '',
    placa_vehiculo: '',
    fk_id_servicio: '',
    comentario_cliente_orden: '',
    nivel_combustible_orden: 'Medio',
    odometro_auto_cliente_orden: '',
    unidad_odometro: 'km',
    fk_id_estado_orden: '',
    observaciones_orden: '',
    estado_vehiculo: 'Bueno',
    imagen_1: null,
    imagen_2: null,
    imagen_3: null,
    imagen_4: null,
    imagen_5: null,
    imagen_6: null,
    imagen_7: null,
    imagen_8: null,
    imagen_9: null,
    imagen_10: null,
    video: null
  });

  useEffect(() => {
    cargarOrdenes();
    cargarServicios();
    cargarEstados();
  }, []);

  // Función para cerrar modales con tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (mostrarModal) {
          setMostrarModal(false);
        }
        if (mostrarImpresion) {
          setMostrarImpresion(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mostrarModal, mostrarImpresion]);

  const cargarOrdenes = async () => {
    try {
      const response = await fetch('/api/ordenes');
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
      const response = await fetch('/api/servicios');
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
      const response = await fetch('/api/estados');
      if (response.ok) {
        const data = await response.json();
        setEstados(data);
      }
    } catch (error) {
      console.error('Error al cargar estados:', error);
    }
  };

  // Búsqueda de clientes en tiempo real (autocompletado)
  const buscarClientesEnVivo = async (termino) => {
    setBusquedaCliente(termino);
    
    if (termino.length < 2) {
      setClientesSugeridos([]);
      setMostrarSugerencias(false);
      setClienteEncontrado(null);
      setForm(prev => ({ ...prev, fk_id_cliente: '' }));
      return;
    }
    
    try {
      const response = await fetch(`/api/clientes/buscar/${termino}`);
      if (response.ok) {
        const clientes = await response.json();
        setClientesSugeridos(clientes);
        setMostrarSugerencias(clientes.length > 0);
      } else {
        setClientesSugeridos([]);
        setMostrarSugerencias(false);
      }
    } catch (error) {
      console.error('Error buscando clientes:', error);
      setClientesSugeridos([]);
      setMostrarSugerencias(false);
    }
  };

  // Seleccionar cliente del autocompletado
  const seleccionarCliente = (cliente) => {
    if (cliente.tipo === 'CF' || cliente.NIT === 'CF') {
      // Consumidor Final
      setClienteEncontrado({
        nombre_cliente: 'Consumidor Final',
        apellido_cliente: '',
        NIT: 'CF',
        PK_id_cliente: null
      });
      setForm(prev => ({ ...prev, fk_id_cliente: null, nit_cliente: 'CF' }));
      setBusquedaCliente('CF - Consumidor Final');
    } else {
      // Cliente registrado
      setClienteEncontrado(cliente);
      setForm(prev => ({ ...prev, fk_id_cliente: cliente.PK_id_cliente, nit_cliente: cliente.NIT }));
      setBusquedaCliente(
        `${cliente.nombre_cliente} ${cliente.apellido_cliente} - NIT: ${cliente.NIT}`
      );
    }
    setMostrarSugerencias(false);
    setClientesSugeridos([]);
  };

  // Mantener la función original para compatibilidad con código existente
  const buscarCliente = async (nit) => {
    // Si es "CF" (Consumidor Final), no buscar cliente
    if (nit.toUpperCase() === 'CF') {
      setClienteEncontrado({
        nombre_cliente: 'Consumidor Final',
        apellido_cliente: '',
        NIT: 'CF',
        PK_id_cliente: null
      });
      setForm(prev => ({ ...prev, fk_id_cliente: null }));
      return;
    }
    
    if (nit.length < 3) {
      setClienteEncontrado(null);
      setForm(prev => ({ ...prev, fk_id_cliente: '' }));
      return;
    }
    
    try {
      const response = await fetch(`/api/ordenes/buscar-cliente-nit/${nit}`);
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
      setForm(prev => ({ ...prev, fk_id_cliente: '' }));
    }
  };

  const buscarVehiculo = async (placa) => {
    if (placa.length < 3) {
      setVehiculoEncontrado(null);
      return;
    }
    
    try {
      const response = await fetch(`/api/ordenes/buscar-vehiculo/${placa}`);
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
      if (name === 'nit_cliente') {
        buscarCliente(value);
      } else if (name === 'placa_vehiculo') {
        buscarVehiculo(value);
      }
    }
  };

  const limpiarFormulario = () => {
    setForm({
      nit_cliente: '',
      placa_vehiculo: '',
      fk_id_servicio: '',
      comentario_cliente_orden: '',
      nivel_combustible_orden: 'Medio',
      odometro_auto_cliente_orden: '',
      unidad_odometro: 'km',
      fk_id_estado_orden: '',
      observaciones_orden: '',
      estado_vehiculo: 'Bueno',
      imagen_1: null,
      imagen_2: null,
      imagen_3: null,
      imagen_4: null,
      imagen_5: null,
      imagen_6: null,
      imagen_7: null,
      imagen_8: null,
      imagen_9: null,
      imagen_10: null,
      video: null
    });
    setClienteEncontrado(null);
    setVehiculoEncontrado(null);
    setBusquedaCliente('');
    setClientesSugeridos([]);
    setMostrarSugerencias(false);
    setEditando(false);
    setOrdenId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevenir múltiples envíos
    if (procesandoOrden) {
      return;
    }
    
    // Validar campos requeridos (fk_id_cliente puede ser null para CF)
    if ((form.fk_id_cliente === '' || form.fk_id_cliente === undefined) && form.nit_cliente?.toUpperCase() !== 'CF') {
      alert('Por favor ingrese un NIT válido o "CF" para Consumidor Final');
      return;
    }
    
    if (!form.fk_id_vehiculo || !form.fk_id_servicio || !form.fk_id_estado_orden) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    // Activar estado de procesamiento
    setProcesandoOrden(true);

    const formData = new FormData();
    formData.append('fk_id_cliente', form.fk_id_cliente || '');
    formData.append('fk_id_vehiculo', form.fk_id_vehiculo);
    formData.append('fk_id_servicio', form.fk_id_servicio);
    formData.append('comentario_cliente_orden', form.comentario_cliente_orden);
    formData.append('nivel_combustible_orden', form.nivel_combustible_orden);
    formData.append('odometro_auto_cliente_orden', form.odometro_auto_cliente_orden);
    formData.append('unidad_odometro', form.unidad_odometro);
    formData.append('fk_id_estado_orden', form.fk_id_estado_orden);
    formData.append('observaciones_orden', form.observaciones_orden);
    formData.append('estado_vehiculo', form.estado_vehiculo);
    
    // Debug: verificar qué se está enviando
    console.log('🔍 Estado del vehículo que se envía:', form.estado_vehiculo);
    
    if (form.imagen_1) formData.append('imagen_1', form.imagen_1);
    if (form.imagen_2) formData.append('imagen_2', form.imagen_2);
    if (form.imagen_3) formData.append('imagen_3', form.imagen_3);
    if (form.imagen_4) formData.append('imagen_4', form.imagen_4);
    if (form.imagen_5) formData.append('imagen_5', form.imagen_5);
    if (form.imagen_6) formData.append('imagen_6', form.imagen_6);
    if (form.imagen_7) formData.append('imagen_7', form.imagen_7);
    if (form.imagen_8) formData.append('imagen_8', form.imagen_8);
    if (form.imagen_9) formData.append('imagen_9', form.imagen_9);
    if (form.imagen_10) formData.append('imagen_10', form.imagen_10);
    if (form.video) formData.append('video', form.video);

    try {
      const url = editando 
        ? `/api/ordenes/${ordenId}`
        : '/api/ordenes';
      
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
    } finally {
      // Desactivar estado de procesamiento
      setProcesandoOrden(false);
    }
  };

  const editarOrden = (orden) => {
    // Debug: verificar el valor de estado_vehiculo
    console.log('🔍 Estado del vehículo en la orden:', orden.estado_vehiculo);
    
    // Buscar los IDs correctos basándose en los nombres
    const servicioEncontrado = servicios.find(s => s.servicio === orden.servicio);
    const estadoEncontrado = estados.find(e => e.estado_orden === orden.estado_orden);
    
    setForm({
      nit_cliente: orden.NIT || '',
      placa_vehiculo: orden.placa_vehiculo || '',
      fk_id_servicio: servicioEncontrado ? servicioEncontrado.pk_id_servicio : '',
      comentario_cliente_orden: orden.comentario_cliente_orden || '',
      nivel_combustible_orden: orden.nivel_combustible_orden || 'Medio',
      odometro_auto_cliente_orden: orden.odometro_auto_cliente_orden || '',
      unidad_odometro: orden.unidad_odometro || 'km',
      fk_id_estado_orden: estadoEncontrado ? estadoEncontrado.pk_id_estado : '',
      observaciones_orden: orden.observaciones_orden || '',
      estado_vehiculo: orden.estado_vehiculo ? orden.estado_vehiculo : 'Bueno',
      imagen_1: null,
      imagen_2: null,
      imagen_3: null,
      imagen_4: null,
      imagen_5: null,
      imagen_6: null,
      imagen_7: null,
      imagen_8: null,
      imagen_9: null,
      imagen_10: null,
      video: null
    });
    
    // Configurar autocompletado con información del cliente
    if (orden.NIT === 'CF') {
      setBusquedaCliente('CF - Consumidor Final');
      setClienteEncontrado({
        nombre_cliente: 'Consumidor Final',
        apellido_cliente: '',
        NIT: 'CF',
        PK_id_cliente: null
      });
    } else if (orden.NIT) {
      setBusquedaCliente(
        `${orden.nombre_cliente} ${orden.apellido_cliente} - NIT: ${orden.NIT}`
      );
      buscarCliente(orden.NIT);
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
      const response = await fetch(`/api/ordenes/${id}`, {
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
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, var(--tecno-gray-very-light) 0%, var(--tecno-white) 100%)',
      paddingTop: '90px'
    }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
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
              📝 Gestión de Órdenes
            </h1>
            <p style={{ 
              color: 'var(--tecno-gray-dark)', 
              fontSize: '1.1rem',
              marginBottom: '0'
            }}>
              Administra las órdenes de servicio del taller
            </p>
          </div>
          <button 
            className="btn-tecno-outline" 
            onClick={() => navigate('/home')}
          >
            ← Volver al Menú Principal
          </button>
        </div>

        {/* Formulario */}
        <div className="card-tecno mb-4">
          <div className="card-tecno-header">
            {editando ? '✏️ Editando Orden' : '➕ Nueva Orden'}
          </div>
          <div className="card-tecno-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Cliente */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Cliente *</label>
                <div className="position-relative">
                  <input
                    type="text"
                    className={`form-control ${clienteEncontrado ? 'is-valid' : busquedaCliente && !clienteEncontrado ? 'is-invalid' : ''}`}
                    value={busquedaCliente}
                    onChange={(e) => buscarClientesEnVivo(e.target.value)}
                    onFocus={() => {
                      if (clientesSugeridos.length > 0) {
                        setMostrarSugerencias(true);
                      }
                    }}
                    placeholder="Buscar por nombre, NIT o escriba 'CF'"
                    autoComplete="off"
                    required
                  />
                  
                  {/* Dropdown de sugerencias */}
                  {mostrarSugerencias && clientesSugeridos.length > 0 && (
                    <ul 
                      className="list-group position-absolute w-100 shadow-lg" 
                      style={{
                        zIndex: 1000, 
                        maxHeight: '300px', 
                        overflowY: 'auto',
                        marginTop: '2px'
                      }}
                    >
                      {clientesSugeridos.map((cliente, index) => (
                        <li 
                          key={index}
                          className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                          onClick={() => seleccionarCliente(cliente)}
                          style={{cursor: 'pointer'}}
                        >
                          <div>
                            <strong>{cliente.nombre_cliente} {cliente.apellido_cliente}</strong>
                            <br/>
                            <small className="text-muted">
                              {cliente.NIT === 'CF' ? 'Consumidor Final' : `NIT: ${cliente.NIT}`}
                              {cliente.telefono_cliente && ` • Tel: ${cliente.telefono_cliente}`}
                            </small>
                          </div>
                          <span className="badge bg-primary">Seleccionar</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {/* Feedback de cliente seleccionado */}
                  {clienteEncontrado && (
                    <div className="valid-feedback d-block">
                      ✅ Cliente: {clienteEncontrado.nombre_cliente} {clienteEncontrado.apellido_cliente}
                      {clienteEncontrado.NIT !== 'CF' && ` - NIT: ${clienteEncontrado.NIT}`}
                    </div>
                  )}
                  {busquedaCliente && !clienteEncontrado && busquedaCliente.length >= 2 && (
                    <div className="invalid-feedback d-block">
                      ❌ Cliente no encontrado
                    </div>
                  )}
                </div>
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
                  <option value="Reserva">⛽ Reserva</option>
                  <option value="1/4">📊 1/4</option>
                  <option value="Medio">📊 Medio</option>
                  <option value="3/4">📊 3/4</option>
                  <option value="Full">✅ Full</option>
                </select>
              </div>

              {/* Odómetro */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Odómetro del Auto del Cliente</label>
                <input
                  type="number"
                  className="form-control mb-2"
                  name="odometro_auto_cliente_orden"
                  value={form.odometro_auto_cliente_orden}
                  onChange={handleInputChange}
                  placeholder="Ej: 45000"
                />
                <div className="mt-2">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="unidad_odometro"
                      id="unidadKm"
                      value="km"
                      checked={form.unidad_odometro === 'km'}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="unidadKm">
                      Kilómetros (km)
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="unidad_odometro"
                      id="unidadMillas"
                      value="millas"
                      checked={form.unidad_odometro === 'millas'}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="unidadMillas">
                      Millas (mi)
                    </label>
                  </div>
                </div>
              </div>

              {/* Estado del Vehículo */}
              <div className="col-md-4 mb-3">
                <label className="form-label">Estado del Vehículo *</label>
                <textarea
                  className="form-control"
                  name="estado_vehiculo"
                  value={form.estado_vehiculo}
                  onChange={handleInputChange}
                  rows="3"
                  maxLength="200"
                  required
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
                <label className="form-label">Imagen 5</label>
                <input
                  type="file"
                  className="form-control"
                  name="imagen_5"
                  onChange={handleInputChange}
                  accept="image/*"
                />
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Imagen 6</label>
                <input
                  type="file"
                  className="form-control"
                  name="imagen_6"
                  onChange={handleInputChange}
                  accept="image/*"
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-2 mb-3">
                <label className="form-label">Imagen 7</label>
                <input
                  type="file"
                  className="form-control"
                  name="imagen_7"
                  onChange={handleInputChange}
                  accept="image/*"
                />
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Imagen 8</label>
                <input
                  type="file"
                  className="form-control"
                  name="imagen_8"
                  onChange={handleInputChange}
                  accept="image/*"
                />
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Imagen 9</label>
                <input
                  type="file"
                  className="form-control"
                  name="imagen_9"
                  onChange={handleInputChange}
                  accept="image/*"
                />
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Imagen 10</label>
                <input
                  type="file"
                  className="form-control"
                  name="imagen_10"
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
              <button 
                type="submit" 
                className="btn-tecno"
                disabled={procesandoOrden}
                style={{
                  opacity: procesandoOrden ? 0.6 : 1,
                  cursor: procesandoOrden ? 'not-allowed' : 'pointer'
                }}
              >
                {procesandoOrden ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {editando ? '⏳ Actualizando...' : '⏳ Procesando...'}
                  </>
                ) : (
                  editando ? '✏️ Actualizar Orden' : '➕ Registrar Orden'
                )}
              </button>
              {editando && (
                <button 
                  type="button" 
                  className="btn-tecno-secondary"
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
        <div className="card-tecno">
          <div className="card-tecno-header">
            📋 Órdenes Registradas
          </div>
          <div className="card-tecno-body">
            <div className="table-responsive">
              <table className="table table-bordered" style={{ marginBottom: '0' }}>
                <thead style={{ backgroundColor: 'var(--tecno-gray-very-light)' }}>
                  <tr>
                    <th style={{ 
                      borderColor: 'var(--tecno-gray-light)',
                      color: 'var(--tecno-black)',
                      fontWeight: '600'
                    }}>ID</th>
                    <th style={{ 
                      borderColor: 'var(--tecno-gray-light)',
                      color: 'var(--tecno-black)',
                      fontWeight: '600'
                    }}>Fecha</th>
                    <th style={{ 
                      borderColor: 'var(--tecno-gray-light)',
                      color: 'var(--tecno-black)',
                      fontWeight: '600'
                    }}>Cliente</th>
                    <th style={{ 
                      borderColor: 'var(--tecno-gray-light)',
                      color: 'var(--tecno-black)',
                      fontWeight: '600'
                    }}>Vehículo</th>
                    <th style={{ 
                      borderColor: 'var(--tecno-gray-light)',
                      color: 'var(--tecno-black)',
                      fontWeight: '600'
                    }}>Servicio</th>
                    <th style={{ 
                      borderColor: 'var(--tecno-gray-light)',
                      color: 'var(--tecno-black)',
                      fontWeight: '600'
                    }}>Estado</th>
                    <th style={{ 
                      borderColor: 'var(--tecno-gray-light)',
                      color: 'var(--tecno-black)',
                      fontWeight: '600'
                    }}>Combustible</th>
                    <th style={{ 
                      borderColor: 'var(--tecno-gray-light)',
                      color: 'var(--tecno-black)',
                      fontWeight: '600'
                    }}>Odómetro</th>
                    <th style={{ 
                      borderColor: 'var(--tecno-gray-light)',
                      color: 'var(--tecno-black)',
                      fontWeight: '600'
                    }}>Multimedia</th>
                    <th style={{ 
                      borderColor: 'var(--tecno-gray-light)',
                      color: 'var(--tecno-black)',
                      fontWeight: '600'
                    }}>Acciones</th>
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
                      <small className="text-muted">NIT: {orden.NIT}</small>
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
                    <td>
                      {orden.odometro_auto_cliente_orden 
                        ? `${orden.odometro_auto_cliente_orden} ${orden.unidad_odometro || 'km'}` 
                        : '-'}
                    </td>
                    <td style={{ borderColor: 'var(--tecno-gray-light)' }}>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm"
                          onClick={() => verMultimedia(orden)}
                          title="Ver multimedia"
                          style={{
                            backgroundColor: 'var(--info)',
                            color: 'var(--tecno-white)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px'
                          }}
                        >
                          📷
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => imprimirOrden(orden)}
                          title="Imprimir orden"
                          style={{
                            backgroundColor: 'var(--success)',
                            color: 'var(--tecno-white)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px'
                          }}
                        >
                          🖨️
                        </button>
                      </div>
                    </td>
                    <td style={{ borderColor: 'var(--tecno-gray-light)' }}>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm"
                          onClick={() => editarOrden(orden)}
                          title="Editar"
                          style={{
                            backgroundColor: 'var(--warning)',
                            color: 'var(--tecno-white)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px'
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => eliminarOrden(orden.pk_id_orden)}
                          title="Eliminar"
                          style={{
                            backgroundColor: 'var(--danger)',
                            color: 'var(--tecno-white)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px'
                          }}
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
                    📷 Multimedia - Orden #{ordenSeleccionada.pk_id_orden}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setMostrarModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Cliente:</strong> {ordenSeleccionada.nombre_cliente} {ordenSeleccionada.apellido_cliente}
                    <br />
                    <strong>NIT:</strong> {ordenSeleccionada.NIT}
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
                    <strong>Odómetro:</strong> {ordenSeleccionada.odometro_auto_cliente_orden 
                      ? `${ordenSeleccionada.odometro_auto_cliente_orden} ${ordenSeleccionada.unidad_odometro || 'km'}` 
                      : 'No especificado'}
                  </div>
                </div>

                {ordenSeleccionada.estado_vehiculo && (
                  <div className="mb-3">
                    <strong>Estado del Vehículo:</strong>
                    <p className="mt-1">{ordenSeleccionada.estado_vehiculo}</p>
                  </div>
                )}

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
                  {[
                    ordenSeleccionada.imagen_1, 
                    ordenSeleccionada.imagen_2, 
                    ordenSeleccionada.imagen_3, 
                    ordenSeleccionada.imagen_4,
                    ordenSeleccionada.imagen_5,
                    ordenSeleccionada.imagen_6,
                    ordenSeleccionada.imagen_7,
                    ordenSeleccionada.imagen_8,
                    ordenSeleccionada.imagen_9,
                    ordenSeleccionada.imagen_10
                  ].map((imagen, index) => {
                    const imageUrl = getFileUrl(imagen);
                    return imageUrl ? (
                      <div key={index} className="col-md-6 mb-2">
                        <img
                          src={imageUrl}
                          alt={`Imagen ${index + 1}`}
                          className="img-fluid rounded"
                          style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : null;
                  })}
                  {[
                    ordenSeleccionada.imagen_1, 
                    ordenSeleccionada.imagen_2, 
                    ordenSeleccionada.imagen_3, 
                    ordenSeleccionada.imagen_4,
                    ordenSeleccionada.imagen_5,
                    ordenSeleccionada.imagen_6,
                    ordenSeleccionada.imagen_7,
                    ordenSeleccionada.imagen_8,
                    ordenSeleccionada.imagen_9,
                    ordenSeleccionada.imagen_10
                  ].every(img => !img || img === 'sin_imagen.jpg') && (
                    <div className="col-12">
                      <p className="text-muted">No hay imágenes registradas</p>
                    </div>
                  )}
                </div>

                {/* Video */}
                {(() => {
                  const videoUrl = getFileUrl(ordenSeleccionada.video);
                  return videoUrl ? (
                    <div className="mb-3">
                      <h6>Video:</h6>
                      <video
                        controls
                        className="w-100"
                        style={{ maxHeight: '400px' }}
                      >
                        <source src={videoUrl} type="video/mp4" />
                        Tu navegador no soporta el elemento de video.
                      </video>
                    </div>
                  ) : null;
                })()}
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
                  ></button>
                </div>
                <div className="modal-body" style={{ padding: '0' }}>
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
    </div>
  );
};

export default Ordenes;
