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
              🔧 Gestión de Servicios
            </h1>
            <p style={{ 
              color: 'var(--tecno-gray-dark)', 
              fontSize: '1.1rem',
              marginBottom: '0'
            }}>
              Administra los servicios disponibles en el taller
            </p>
          </div>
          <button
            onClick={handleGoHome}
            className="btn-tecno-outline"
          >
            ← Volver al Menú Principal
          </button>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="card-tecno">
              <div className="card-tecno-header">
                {editId ? '✏️ Editando Servicio' : '➕ Nuevo Servicio'}
              </div>
              <div className="card-tecno-body">
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
                      className="btn-tecno"
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : (editId ? 'Actualizar' : 'Registrar')}
                    </button>
                    {editId && (
                      <button
                        type="button"
                        className="btn-tecno-secondary"
                        onClick={handleCancelEdit}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>

                {mensaje && <div className="alert-tecno alert-tecno-success mt-3">{mensaje}</div>}
                {error && <div className="alert-tecno alert-tecno-danger mt-3">{error}</div>}
                {editId && (
                  <div className="alert-tecno alert-tecno-warning mt-3">
                    <strong>Modo edición activado</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card-tecno">
              <div className="card-tecno-header">
                📋 Servicios Registrados
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
                        }}>Servicio</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600'
                        }}>Descripción</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600'
                        }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {servicios.map(servicio => (
                        <tr key={servicio.pk_id_servicio}>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{servicio.pk_id_servicio}</td>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{servicio.servicio}</td>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{servicio.descripcion_servicios || '-'}</td>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-sm"
                                onClick={() => handleEdit(servicio)}
                                style={{
                                  backgroundColor: 'var(--warning)',
                                  color: 'var(--tecno-white)',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '12px',
                                  marginRight: '4px'
                                }}
                              >
                                Editar
                              </button>
                              <button
                                className="btn btn-sm"
                                onClick={() => handleDelete(servicio.pk_id_servicio)}
                                style={{
                                  backgroundColor: 'var(--danger)',
                                  color: 'var(--tecno-white)',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '12px'
                                }}
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
    </div>
  );
}

export default Servicios; 