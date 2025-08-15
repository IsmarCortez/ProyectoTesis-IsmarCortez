import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Estados() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    estado_orden: '',
    descripcion_estado: '',
  });
  const [estados, setEstados] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  // Cargar estados al iniciar
  useEffect(() => {
    fetchEstados();
  }, []);

  const fetchEstados = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/estados');
      setEstados(res.data);
    } catch (err) {
      setError('Error al cargar los estados.');
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
        // Actualizar estado
        await axios.put(`http://localhost:4000/api/estados/${editId}`, form);
        setMensaje('Estado actualizado exitosamente.');
      } else {
        // Crear estado
        await axios.post('http://localhost:4000/api/estados', form);
        setMensaje('Estado registrado exitosamente.');
      }

      // Limpiar formulario
      setForm({
        estado_orden: '',
        descripcion_estado: '',
      });
      setEditId(null);
      fetchEstados();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al guardar el estado.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = estado => {
    setForm({
      estado_orden: estado.estado_orden,
      descripcion_estado: estado.descripcion_estado,
    });
    setEditId(estado.pk_id_estado);
    setMensaje('');
    setError('');
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Seguro que deseas eliminar este estado?')) return;
    try {
      await axios.delete(`http://localhost:4000/api/estados/${id}`);
      setMensaje('Estado eliminado correctamente.');
      fetchEstados();
    } catch (err) {
      setError('Error al eliminar el estado.');
    }
  };

  const handleCancelEdit = () => {
    setForm({
      estado_orden: '',
      descripcion_estado: '',
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
              <h4>{editId ? 'Editar Estado' : 'Registrar Estado'}</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nombre del Estado *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="estado_orden"
                    value={form.estado_orden}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    name="descripcion_estado"
                    value={form.descripcion_estado}
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
              <h4>Estados Registrados</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Estado</th>
                      <th>Descripción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estados.map(estado => (
                      <tr key={estado.pk_id_estado}>
                        <td>{estado.pk_id_estado}</td>
                        <td>{estado.estado_orden}</td>
                        <td>{estado.descripcion_estado || '-'}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleEdit(estado)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(estado.pk_id_estado)}
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

export default Estados; 