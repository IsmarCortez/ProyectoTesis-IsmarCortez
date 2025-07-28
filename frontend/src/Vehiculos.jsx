import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Vehiculos() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    dpi_cliente: '',
    fk_id_cliente: '',
    placa_vehiculo: '',
    marca_vehiculo: '',
    modelo_vehiculo: '',
    anio_vehiculo: '',
    color_vehiculo: '',
  });
  const [vehiculos, setVehiculos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [buscarDPI, setBuscarDPI] = useState('');
  const [archivos, setArchivos] = useState({
    imagen_1: null,
    imagen_2: null,
    imagen_3: null,
    imagen_4: null,
    video: null
  });
  const [showModal, setShowModal] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);

  // Cargar vehículos al iniciar
  useEffect(() => {
    fetchVehiculos();
  }, []);

  const fetchVehiculos = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/vehiculos');
      setVehiculos(res.data);
    } catch (err) {
      setError('Error al cargar los vehículos.');
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = e => {
    const { name, files } = e.target;
    setArchivos(prev => ({
      ...prev,
      [name]: files[0] || null
    }));
  };

  const buscarClientePorDPI = async () => {
    if (!buscarDPI.trim()) {
      setError('Por favor ingrese un DPI válido.');
      return;
    }

    try {
      const res = await axios.get(`http://localhost:4000/api/vehiculos/buscar-cliente/${buscarDPI}`);
      setClienteEncontrado(res.data);
      setForm(prev => ({
        ...prev,
        fk_id_cliente: res.data.PK_id_cliente,
        dpi_cliente: res.data.dpi_cliente
      }));
      setError('');
      setMensaje(`Cliente encontrado: ${res.data.nombre_cliente} ${res.data.apellido_cliente}`);
    } catch (err) {
      setClienteEncontrado(null);
      setForm(prev => ({
        ...prev,
        fk_id_cliente: '',
        dpi_cliente: ''
      }));
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al buscar el cliente.');
      }
      setMensaje('');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMensaje('');
    setError('');
    setLoading(true);

    if (!form.fk_id_cliente) {
      setError('Debe buscar y seleccionar un cliente válido.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      
      // Agregar datos del formulario
      Object.keys(form).forEach(key => {
        if (form[key] !== '') {
          formData.append(key, form[key]);
        }
      });

      // Agregar archivos
      Object.keys(archivos).forEach(key => {
        if (archivos[key]) {
          formData.append(key, archivos[key]);
        }
      });

      if (editId) {
        // Actualizar vehículo
        await axios.put(`http://localhost:4000/api/vehiculos/${editId}`, formData);
        setMensaje('Vehículo actualizado exitosamente.');
      } else {
        // Crear vehículo
        await axios.post('http://localhost:4000/api/vehiculos', formData);
        setMensaje('Vehículo registrado exitosamente.');
      }

      // Limpiar formulario
      setForm({
        dpi_cliente: '',
        fk_id_cliente: '',
        placa_vehiculo: '',
        marca_vehiculo: '',
        modelo_vehiculo: '',
        anio_vehiculo: '',
        color_vehiculo: '',
      });
      setArchivos({
        imagen_1: null,
        imagen_2: null,
        imagen_3: null,
        imagen_4: null,
        video: null
      });
      setClienteEncontrado(null);
      setBuscarDPI('');
      setEditId(null);
      fetchVehiculos();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al guardar el vehículo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = vehiculo => {
    setForm({
      dpi_cliente: vehiculo.dpi_cliente,
      fk_id_cliente: vehiculo.fk_id_cliente,
      placa_vehiculo: vehiculo.placa_vehiculo,
      marca_vehiculo: vehiculo.marca_vehiculo,
      modelo_vehiculo: vehiculo.modelo_vehiculo,
      anio_vehiculo: vehiculo.anio_vehiculo,
      color_vehiculo: vehiculo.color_vehiculo,
    });
    setClienteEncontrado({
      PK_id_cliente: vehiculo.fk_id_cliente,
      nombre_cliente: vehiculo.nombre_cliente,
      apellido_cliente: vehiculo.apellido_cliente,
      dpi_cliente: vehiculo.dpi_cliente
    });
    setBuscarDPI(vehiculo.dpi_cliente);
    setEditId(vehiculo.pk_id_vehiculo);
    setMensaje('');
    setError('');
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Seguro que deseas eliminar este vehículo?')) return;
    try {
      await axios.delete(`http://localhost:4000/api/vehiculos/${id}`);
      setMensaje('Vehículo eliminado correctamente.');
      fetchVehiculos();
    } catch (err) {
      setError('Error al eliminar el vehículo.');
    }
  };

  const handleCancelEdit = () => {
    setForm({
      dpi_cliente: '',
      fk_id_cliente: '',
      placa_vehiculo: '',
      marca_vehiculo: '',
      modelo_vehiculo: '',
      anio_vehiculo: '',
      color_vehiculo: '',
    });
    setArchivos({
      imagen_1: null,
      imagen_2: null,
      imagen_3: null,
      imagen_4: null,
      video: null
    });
    setClienteEncontrado(null);
    setBuscarDPI('');
    setEditId(null);
    setMensaje('');
    setError('');
  };

  const handleViewMedia = (vehiculo) => {
    setVehiculoSeleccionado(vehiculo);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setVehiculoSeleccionado(null);
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  return (
    <div className="container mt-4">
      {/* Botón para regresar al menú principal */}
      <div className="mb-3">
        <button
          onClick={handleGoHome}
          className="btn btn-outline-secondary"
        >
          ← Volver al Menú Principal
        </button>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4>{editId ? 'Editar Vehículo' : 'Registrar Vehículo'}</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Búsqueda de cliente por DPI */}
                <div className="mb-3">
                  <label className="form-label">DPI del Cliente *</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={buscarDPI}
                      onChange={(e) => setBuscarDPI(e.target.value)}
                      placeholder="Ingrese DPI del cliente"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={buscarClientePorDPI}
                    >
                      Buscar
                    </button>
                  </div>
                  {clienteEncontrado && (
                    <div className="alert alert-success mt-2">
                      Cliente: {clienteEncontrado.nombre_cliente} {clienteEncontrado.apellido_cliente}
                    </div>
                  )}
                </div>

                {/* Campos del vehículo */}
                <div className="mb-3">
                  <label className="form-label">Placa *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="placa_vehiculo"
                    value={form.placa_vehiculo}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Marca *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="marca_vehiculo"
                        value={form.marca_vehiculo}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Modelo *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="modelo_vehiculo"
                        value={form.modelo_vehiculo}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Año</label>
                      <input
                        type="number"
                        className="form-control"
                        name="anio_vehiculo"
                        value={form.anio_vehiculo}
                        onChange={handleChange}
                        min="1900"
                        max="2030"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Color</label>
                      <input
                        type="text"
                        className="form-control"
                        name="color_vehiculo"
                        value={form.color_vehiculo}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Campos de archivos */}
                <div className="mb-3">
                  <label className="form-label">Imagen 1</label>
                  <input
                    type="file"
                    className="form-control"
                    name="imagen_1"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Imagen 2</label>
                  <input
                    type="file"
                    className="form-control"
                    name="imagen_2"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Imagen 3</label>
                  <input
                    type="file"
                    className="form-control"
                    name="imagen_3"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Imagen 4</label>
                  <input
                    type="file"
                    className="form-control"
                    name="imagen_4"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Video</label>
                  <input
                    type="file"
                    className="form-control"
                    name="video"
                    accept="video/*"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className={`btn ${editId ? 'btn-warning' : 'btn-primary'}`}
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : (editId ? 'Actualizar' : 'Registrar')}
                  </button>
                  {editId && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              {mensaje && <div className="alert alert-success mt-3">{mensaje}</div>}
              {error && <div className="alert alert-danger mt-3">{error}</div>}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4>Vehículos Registrados</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Placa</th>
                      <th>Marca/Modelo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehiculos.map(vehiculo => (
                      <tr key={vehiculo.pk_id_vehiculo}>
                        <td>
                          {vehiculo.nombre_cliente} {vehiculo.apellido_cliente}
                          <br />
                          <small className="text-muted">DPI: {vehiculo.dpi_cliente}</small>
                        </td>
                        <td>{vehiculo.placa_vehiculo}</td>
                        <td>
                          {vehiculo.marca_vehiculo} {vehiculo.modelo_vehiculo}
                          {vehiculo.anio_vehiculo && (
                            <>
                              <br />
                              <small className="text-muted">{vehiculo.anio_vehiculo}</small>
                            </>
                          )}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-info"
                              onClick={() => handleViewMedia(vehiculo)}
                              title="Ver fotos y video"
                            >
                              📷
                            </button>
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleEdit(vehiculo)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(vehiculo.pk_id_vehiculo)}
                            >
                              Eliminar
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
        </div>
      </div>

      {/* Modal para ver fotos y video */}
      {showModal && vehiculoSeleccionado && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Multimedia - {vehiculoSeleccionado.marca_vehiculo} {vehiculoSeleccionado.modelo_vehiculo}
                  <br />
                  <small className="text-muted">Placa: {vehiculoSeleccionado.placa_vehiculo}</small>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Imágenes */}
                  <div className="col-md-8">
                    <h6>Imágenes del Vehículo</h6>
                    <div className="row">
                      {['imagen_1', 'imagen_2', 'imagen_3', 'imagen_4'].map((imagenKey, index) => {
                        const imagen = vehiculoSeleccionado[imagenKey];
                        if (imagen && imagen !== 'sin_imagen.jpg') {
                          return (
                            <div key={imagenKey} className="col-md-6 mb-3">
                              <div className="card">
                                <img
                                  src={`http://localhost:4000/uploads/${imagen}`}
                                  className="card-img-top"
                                  alt={`Imagen ${index + 1}`}
                                  style={{ height: '200px', objectFit: 'cover' }}
                                />
                                <div className="card-body">
                                  <p className="card-text text-center">Imagen {index + 1}</p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                    {/* Mensaje si no hay imágenes */}
                    {!['imagen_1', 'imagen_2', 'imagen_3', 'imagen_4'].some(
                      key => vehiculoSeleccionado[key] && vehiculoSeleccionado[key] !== 'sin_imagen.jpg'
                    ) && (
                      <div className="alert alert-info">
                        No hay imágenes registradas para este vehículo.
                      </div>
                    )}
                  </div>

                  {/* Video */}
                  <div className="col-md-4">
                    <h6>Video del Vehículo</h6>
                    {vehiculoSeleccionado.video && vehiculoSeleccionado.video !== 'sin_video.mp4' ? (
                      <div className="card">
                        <video
                          className="card-img-top"
                          controls
                          style={{ height: '200px', objectFit: 'cover' }}
                        >
                          <source src={`http://localhost:4000/uploads/${vehiculoSeleccionado.video}`} type="video/mp4" />
                          Tu navegador no soporta el elemento de video.
                        </video>
                        <div className="card-body">
                          <p className="card-text text-center">Video del vehículo</p>
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-info">
                        No hay video registrado para este vehículo.
                      </div>
                    )}
                  </div>
                </div>

                {/* Información del vehículo */}
                <div className="mt-3">
                  <h6>Información del Vehículo</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Cliente:</strong> {vehiculoSeleccionado.nombre_cliente} {vehiculoSeleccionado.apellido_cliente}</p>
                      <p><strong>DPI:</strong> {vehiculoSeleccionado.dpi_cliente}</p>
                      <p><strong>Placa:</strong> {vehiculoSeleccionado.placa_vehiculo}</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Marca:</strong> {vehiculoSeleccionado.marca_vehiculo}</p>
                      <p><strong>Modelo:</strong> {vehiculoSeleccionado.modelo_vehiculo}</p>
                      {vehiculoSeleccionado.anio_vehiculo && (
                        <p><strong>Año:</strong> {vehiculoSeleccionado.anio_vehiculo}</p>
                      )}
                      {vehiculoSeleccionado.color_vehiculo && (
                        <p><strong>Color:</strong> {vehiculoSeleccionado.color_vehiculo}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay del modal */}
      {showModal && (
        <div
          className="modal-backdrop fade show"
          onClick={handleCloseModal}
        ></div>
      )}
    </div>
  );
}

export default Vehiculos; 