import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Servicios() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    servicio: '',
    descripcion_servicios: '',
  });
  const [servicios, setServicios] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  // Cargar servicios al iniciar
  useEffect(() => {
    fetchServicios();
  }, []);

  const fetchServicios = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/servicios');
      setServicios(res.data);
    } catch (err) {
      setError('Error al cargar los servicios.');
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
        // Actualizar servicio
        await axios.put(`http://localhost:4000/api/servicios/${editId}`, form);
        setMensaje('Servicio actualizado exitosamente.');
      } else {
        // Crear servicio
        await axios.post('http://localhost:4000/api/servicios', form);
        setMensaje('Servicio registrado exitosamente.');
      }

      // Limpiar formulario
      setForm({
        servicio: '',
        descripcion_servicios: '',
      });
      setEditId(null);
      fetchServicios();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al guardar el servicio.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = servicio => {
    setForm({
      servicio: servicio.servicio,
      descripcion_servicios: servicio.descripcion_servicios,
    });
    setEditId(servicio.pk_id_servicio);
    setMensaje('');
    setError('');
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Seguro que deseas eliminar este servicio?')) return;
    try {
      await axios.delete(`http://localhost:4000/api/servicios/${id}`);
      setMensaje('Servicio eliminado correctamente.');
      fetchServicios();
    } catch (err) {
      setError('Error al eliminar el servicio.');
    }
  };

  const handleCancelEdit = () => {
    setForm({
      servicio: '',
      descripcion_servicios: '',
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
              <h4>{editId ? 'Editar Servicio' : 'Registrar Servicio'}</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nombre del Servicio *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="servicio"
                    value={form.servicio}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    name="descripcion_servicios"
                    value={form.descripcion_servicios}
                    onChange={handleChange}
                    rows="3"
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
              <h4>Servicios Registrados</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Servicio</th>
                      <th>Descripción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicios.map(servicio => (
                      <tr key={servicio.pk_id_servicio}>
                        <td>{servicio.pk_id_servicio}</td>
                        <td>{servicio.servicio}</td>
                        <td>{servicio.descripcion_servicios || '-'}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleEdit(servicio)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(servicio.pk_id_servicio)}
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

export default Servicios; 