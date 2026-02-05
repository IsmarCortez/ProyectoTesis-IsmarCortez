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
      const res = await axios.get('/api/estados');
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
        await axios.put(`/api/estados/${editId}`, form);
        setMensaje('Estado actualizado exitosamente.');
      } else {
        // Crear estado
        await axios.post('/api/estados', form);
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
      await axios.delete(`/api/estados/${id}`);
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
              📊 Gestión de Estados
            </h1>
            <p style={{ 
              color: 'var(--tecno-gray-dark)', 
              fontSize: '1.1rem',
              marginBottom: '0'
            }}>
              Administra los estados de las órdenes del taller
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
                {editId ? '✏️ Editando Estado' : '➕ Nuevo Estado'}
              </div>
              <div className="card-tecno-body">
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
                📋 Estados Registrados
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
                        }}>Estado</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600'
                        }}>Descripción</th>
                        {(isAdmin() || isAdminOrEditor()) && (
                          <th style={{ 
                            borderColor: 'var(--tecno-gray-light)',
                            color: 'var(--tecno-black)',
                            fontWeight: '600'
                          }}>Acciones</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {estados.map(estado => (
                        <tr key={estado.pk_id_estado}>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{estado.pk_id_estado}</td>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{estado.estado_orden}</td>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{estado.descripcion_estado || '-'}</td>
                          {(isAdmin() || isAdminOrEditor()) && (
                            <td style={{ borderColor: 'var(--tecno-gray-light)' }}>
                              <div className="btn-group btn-group-sm">
                                {isAdminOrEditor() && (
                                  <button
                                    className="btn btn-sm"
                                    onClick={() => handleEdit(estado)}
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
                                )}
                                {isAdmin() && (
                                  <button
                                    className="btn btn-sm"
                                    onClick={() => handleDelete(estado.pk_id_estado)}
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
                                )}
                              </div>
                            </td>
                          )}
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

export default Estados; 