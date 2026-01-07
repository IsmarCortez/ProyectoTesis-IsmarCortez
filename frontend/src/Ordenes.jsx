import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImprimirOrden from './ImprimirOrden';
import { getFileUrl } from './config/cloudinary';
import axios from './config/axios';

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
  const [filtroEstado, setFiltroEstado] = useState(null); // null = todas, o pk_id_estado
  const [progresoUpload, setProgresoUpload] = useState(0);
  const [mensajeProgreso, setMensajeProgreso] = useState('');

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
      const response = await axios.get('/api/ordenes');
      setOrdenes(response.data);
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
    }
  };

  const cargarServicios = async () => {
    try {
      const response = await axios.get('/api/servicios');
      setServicios(response.data);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    }
  };

  const cargarEstados = async () => {
    try {
      const response = await axios.get('/api/estados');
      setEstados(response.data);
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
      const response = await axios.get(`/api/clientes/buscar/${termino}`);
      setClientesSugeridos(response.data);
      setMostrarSugerencias(response.data.length > 0);
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
      const response = await axios.get(`/api/ordenes/buscar-cliente-nit/${nit}`);
      setClienteEncontrado(response.data);
      setForm(prev => ({ ...prev, fk_id_cliente: response.data.PK_id_cliente }));
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
      const response = await axios.get(`/api/ordenes/buscar-vehiculo/${placa}`);
      setVehiculoEncontrado(response.data);
      setForm(prev => ({ ...prev, fk_id_vehiculo: response.data.pk_id_vehiculo }));
    } catch (error) {
      console.error('Error al buscar vehículo:', error);
      setVehiculoEncontrado(null);
      setForm(prev => ({ ...prev, fk_id_vehiculo: '' }));
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
    setProgresoUpload(0);
    setMensajeProgreso('Preparando archivos...');

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
    
    // Contar archivos para mensajes informativos
    let archivosCount = 0;
    if (form.imagen_1) { formData.append('imagen_1', form.imagen_1); archivosCount++; }
    if (form.imagen_2) { formData.append('imagen_2', form.imagen_2); archivosCount++; }
    if (form.imagen_3) { formData.append('imagen_3', form.imagen_3); archivosCount++; }
    if (form.imagen_4) { formData.append('imagen_4', form.imagen_4); archivosCount++; }
    if (form.imagen_5) { formData.append('imagen_5', form.imagen_5); archivosCount++; }
    if (form.imagen_6) { formData.append('imagen_6', form.imagen_6); archivosCount++; }
    if (form.imagen_7) { formData.append('imagen_7', form.imagen_7); archivosCount++; }
    if (form.imagen_8) { formData.append('imagen_8', form.imagen_8); archivosCount++; }
    if (form.imagen_9) { formData.append('imagen_9', form.imagen_9); archivosCount++; }
    if (form.imagen_10) { formData.append('imagen_10', form.imagen_10); archivosCount++; }
    
    const tieneVideo = !!form.video;
    if (tieneVideo) {
      formData.append('video', form.video);
      archivosCount++;
      
      // Obtener tamaño del video para mensaje informativo
      const videoSizeMB = (form.video.size / (1024 * 1024)).toFixed(2);
      setMensajeProgreso(`Subiendo video (${videoSizeMB} MB). Esto puede tardar varios minutos en conexiones móviles...`);
    } else {
      setMensajeProgreso(`Subiendo ${archivosCount} archivo${archivosCount !== 1 ? 's' : ''}...`);
    }

    try {
      const url = editando 
        ? `/api/ordenes/${ordenId}`
        : '/api/ordenes';
      
      // Configurar axios con indicador de progreso
      const config = {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const porcentaje = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgresoUpload(porcentaje);
            
            if (tieneVideo) {
              const uploadedMB = (progressEvent.loaded / (1024 * 1024)).toFixed(2);
              const totalMB = (progressEvent.total / (1024 * 1024)).toFixed(2);
              setMensajeProgreso(`Subiendo video: ${uploadedMB} MB / ${totalMB} MB (${porcentaje}%)`);
            } else {
              setMensajeProgreso(`Subiendo archivos: ${porcentaje}%`);
            }
          }
        },
        timeout: tieneVideo ? 600000 : 300000 // 10 min para videos, 5 min para imágenes
      };
      
      setMensajeProgreso(tieneVideo 
        ? 'Iniciando carga de video. Por favor, mantén la aplicación abierta...'
        : 'Iniciando carga de archivos...'
      );
      
      let response;
      if (editando) {
        response = await axios.put(url, formData, config);
      } else {
        response = await axios.post(url, formData, config);
      }

      setProgresoUpload(100);
      setMensajeProgreso('Procesando orden en el servidor...');

      const message = editando ? 'Orden actualizada correctamente' : 'Orden registrada exitosamente';
      alert(message);
      limpiarFormulario();
      cargarOrdenes();
    } catch (error) {
      console.error('Error:', error);
      
      let mensajeError = 'Error al procesar la orden';
      
      if (error.isTimeout || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        mensajeError = 'La carga está tardando más de lo esperado.\n\n' +
          'Posibles causas:\n' +
          '• Conexión a internet lenta o inestable\n' +
          '• Archivo de video muy grande\n' +
          '• Problemas temporales del servidor\n\n' +
          'Recomendaciones:\n' +
          '• Verifica tu conexión a internet\n' +
          '• Intenta con un video más pequeño o comprimido\n' +
          '• Usa una conexión WiFi si es posible\n' +
          '• Intenta nuevamente en unos momentos';
      } else if (error.response?.status === 413) {
        mensajeError = 'El archivo es demasiado grande.\n\n' +
          'Límites permitidos:\n' +
          '• Imágenes: 10MB máximo\n' +
          '• Videos: 100MB máximo\n\n' +
          'Por favor, reduce el tamaño del archivo e intenta nuevamente.';
      } else if (error.response?.data?.message) {
        mensajeError = error.response.data.message;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      alert(mensajeError);
    } finally {
      // Desactivar estado de procesamiento
      setProcesandoOrden(false);
      setProgresoUpload(0);
      setMensajeProgreso('');
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
      await axios.delete(`/api/ordenes/${id}`);
      alert('Orden eliminada correctamente');
      cargarOrdenes();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Error al eliminar la orden');
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

  // Calcular conteos de órdenes por estado
  const calcularConteosPorEstado = () => {
    const conteos = {};
    
    // Inicializar todos los estados con 0
    estados.forEach(estado => {
      conteos[estado.pk_id_estado] = 0;
    });
    
    // Contar órdenes por estado
    ordenes.forEach(orden => {
      const estadoId = estados.find(e => e.estado_orden === orden.estado_orden)?.pk_id_estado;
      if (estadoId) {
        conteos[estadoId] = (conteos[estadoId] || 0) + 1;
      }
    });
    
    return conteos;
  };

  // Obtener emoji/icono según el estado
  const getEmojiEstado = (estadoNombre) => {
    const estadoLower = estadoNombre?.toLowerCase() || '';
    if (estadoLower.includes('pendiente')) return '⏳';
    if (estadoLower.includes('proceso')) return '🔄';
    if (estadoLower.includes('completado') || estadoLower.includes('completada')) return '✅';
    if (estadoLower.includes('cancelado') || estadoLower.includes('cancelada')) return '❌';
    return '📋';
  };

  // Filtrar órdenes según el estado seleccionado
  const ordenesFiltradas = filtroEstado === null 
    ? ordenes 
    : ordenes.filter(orden => {
        const estadoEncontrado = estados.find(e => e.pk_id_estado === filtroEstado);
        return estadoEncontrado && orden.estado_orden === estadoEncontrado.estado_orden;
      });

  const conteosPorEstado = calcularConteosPorEstado();
  const totalOrdenes = ordenes.length;

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

            {/* Indicador de Progreso */}
            {procesandoOrden && (
              <div className="mb-3 p-3" style={{
                backgroundColor: 'var(--tecno-gray-very-light)',
                borderRadius: '8px',
                border: '1px solid var(--tecno-gray-light)'
              }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '500',
                    color: 'var(--tecno-black)'
                  }}>
                    {mensajeProgreso || 'Procesando...'}
                  </span>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--tecno-gray-dark)',
                    fontWeight: '600'
                  }}>
                    {progresoUpload > 0 ? `${progresoUpload}%` : ''}
                  </span>
                </div>
                {progresoUpload > 0 && (
                  <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                    <div 
                      className="progress-bar progress-bar-striped progress-bar-animated" 
                      role="progressbar" 
                      style={{ 
                        width: `${progresoUpload}%`,
                        backgroundColor: 'var(--tecno-orange)'
                      }}
                      aria-valuenow={progresoUpload} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    ></div>
                  </div>
                )}
                {progresoUpload === 0 && (
                  <div className="text-center mt-2">
                    <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span>
                    <span className="ms-2" style={{ fontSize: '0.85rem', color: 'var(--tecno-gray-dark)' }}>
                      Iniciando carga...
                    </span>
                  </div>
                )}
              </div>
            )}

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
          <div className="card-tecno-header d-flex justify-content-between align-items-center">
            <span>📋 Órdenes Registradas</span>
            <span style={{ 
              fontSize: '0.9rem', 
              color: 'var(--tecno-gray-dark)',
              fontWeight: '500'
            }}>
              {filtroEstado === null 
                ? `Total: ${totalOrdenes} órdenes`
                : `Mostrando: ${ordenesFiltradas.length} de ${totalOrdenes} órdenes`
              }
            </span>
          </div>
          <div className="card-tecno-body">
            {/* Filtros por Estado */}
            <div className="mb-4">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <button
                  className={`btn ${filtroEstado === null ? 'btn-tecno' : 'btn-tecno-outline'}`}
                  onClick={() => setFiltroEstado(null)}
                  style={{
                    fontSize: '0.9rem',
                    padding: '8px 16px',
                    fontWeight: filtroEstado === null ? '600' : '400'
                  }}
                >
                  📊 Todas ({totalOrdenes})
                </button>
                {estados.map(estado => {
                  const conteo = conteosPorEstado[estado.pk_id_estado] || 0;
                  const emoji = getEmojiEstado(estado.estado_orden);
                  const estaActivo = filtroEstado === estado.pk_id_estado;
                  
                  return (
                    <button
                      key={estado.pk_id_estado}
                      className={`btn ${estaActivo ? 'btn-tecno' : 'btn-tecno-outline'}`}
                      onClick={() => setFiltroEstado(estado.pk_id_estado)}
                      style={{
                        fontSize: '0.9rem',
                        padding: '8px 16px',
                        fontWeight: estaActivo ? '600' : '400',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {emoji} {estado.estado_orden} ({conteo})
                    </button>
                  );
                })}
              </div>
            </div>

            {ordenesFiltradas.length === 0 ? (
              <div className="text-center py-5">
                <p style={{ 
                  fontSize: '1.1rem', 
                  color: 'var(--tecno-gray-dark)',
                  margin: 0
                }}>
                  {filtroEstado === null 
                    ? 'No hay órdenes registradas'
                    : `No hay órdenes con el estado seleccionado`
                  }
                </p>
              </div>
            ) : (
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
                      }}>Enlace Público</th>
                      <th style={{ 
                        borderColor: 'var(--tecno-gray-light)',
                        color: 'var(--tecno-black)',
                        fontWeight: '600'
                      }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesFiltradas.map(orden => (
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
                      {orden.token_publico ? (
                        <div>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              const url = `${window.location.origin}/orden/${orden.token_publico}`;
                              navigator.clipboard.writeText(url).then(() => {
                                alert('✅ Enlace copiado al portapapeles!\n\n' + url);
                              }).catch(() => {
                                // Fallback si no se puede copiar
                                prompt('Copia este enlace:', url);
                              });
                            }}
                            title="Copiar enlace público"
                            style={{
                              fontSize: '11px',
                              padding: '2px 6px'
                            }}
                          >
                            🔗 Copiar
                          </button>
                          <br />
                          <small className="text-muted" style={{ fontSize: '10px' }}>
                            {orden.token_publico.substring(0, 8)}...
                          </small>
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '11px' }}>No disponible</span>
                      )}
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
            )}
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
  );
};

export default Ordenes;
