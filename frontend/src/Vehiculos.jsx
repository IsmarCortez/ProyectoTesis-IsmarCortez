import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Vehiculos() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
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

  const handleSubmit = async e => {
    e.preventDefault();
    setMensaje('');
    setError('');
    setLoading(true);

    try {
      if (editId) {
        // Actualizar vehículo
        await axios.put(`http://localhost:4000/api/vehiculos/${editId}`, form);
        setMensaje('Vehículo actualizado exitosamente.');
      } else {
        // Crear vehículo
        await axios.post('http://localhost:4000/api/vehiculos', form);
        setMensaje('Vehículo registrado exitosamente.');
      }

      // Limpiar formulario
      setForm({
        placa_vehiculo: '',
        marca_vehiculo: '',
        modelo_vehiculo: '',
        anio_vehiculo: '',
        color_vehiculo: '',
      });
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
      placa_vehiculo: vehiculo.placa_vehiculo,
      marca_vehiculo: vehiculo.marca_vehiculo,
      modelo_vehiculo: vehiculo.modelo_vehiculo,
      anio_vehiculo: vehiculo.anio_vehiculo,
      color_vehiculo: vehiculo.color_vehiculo,
    });
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
      placa_vehiculo: '',
      marca_vehiculo: '',
      modelo_vehiculo: '',
      anio_vehiculo: '',
      color_vehiculo: '',
    });
    setEditId(null);
    setMensaje('');
    setError('');
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
                      <th>Placa</th>
                      <th>Marca/Modelo</th>
                      <th>Año</th>
                      <th>Color</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehiculos.map(vehiculo => (
                      <tr key={vehiculo.pk_id_vehiculo}>
                        <td>{vehiculo.placa_vehiculo}</td>
                        <td>
                          {vehiculo.marca_vehiculo} {vehiculo.modelo_vehiculo}
                        </td>
                        <td>{vehiculo.anio_vehiculo || '-'}</td>
                        <td>{vehiculo.color_vehiculo || '-'}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
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
    </div>
  );
}

export default Vehiculos; 