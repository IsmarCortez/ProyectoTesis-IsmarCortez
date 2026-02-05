import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { isAdmin, isAdminOrEditor } from './utils/auth';

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
      const res = await axios.get('/api/vehiculos');
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
        await axios.put(`/api/vehiculos/${editId}`, form);
        setMensaje('Vehículo actualizado exitosamente.');
      } else {
        // Crear vehículo
        await axios.post('/api/vehiculos', form);
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
      await axios.delete(`/api/vehiculos/${id}`);
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
              🚗 Gestión de Vehículos
            </h1>
            <p style={{ 
              color: 'var(--tecno-gray-dark)', 
              fontSize: '1.1rem',
              marginBottom: '0'
            }}>
              Administra el registro de vehículos del taller
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
                {editId ? '✏️ Editando Vehículo' : '➕ Nuevo Vehículo'}
              </div>
              <div className="card-tecno-body">
                {!isAdminOrEditor() && (
                  <div className="alert-tecno alert-tecno-warning">
                    ⚠️ No tienes permisos para crear o editar vehículos. Tu rol es de solo lectura.
                  </div>
                )}
                <form onSubmit={handleSubmit} style={{ display: isAdminOrEditor() ? 'block' : 'none' }}>
                  {/* Campos del vehículo */}
                  <div className="mb-3">
                    <label className="form-label">Placa *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="placa_vehiculo"
                      value={form.placa_vehiculo}
                      onChange={handleChange}
                      maxLength="7"
                      placeholder="Máximo 7 caracteres"
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
                          maxLength="50"
                          placeholder="Máximo 50 caracteres"
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
                          maxLength="50"
                          placeholder="Máximo 50 caracteres"
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
                          maxLength="30"
                          placeholder="Máximo 30 caracteres"
                        />
                      </div>
                    </div>
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
                📋 Vehículos Registrados
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
                        }}>Placa</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600'
                        }}>Marca/Modelo</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600'
                        }}>Año</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600'
                        }}>Color</th>
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
                      {vehiculos.map(vehiculo => (
                        <tr key={vehiculo.pk_id_vehiculo}>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{vehiculo.placa_vehiculo}</td>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>
                            {vehiculo.marca_vehiculo} {vehiculo.modelo_vehiculo}
                          </td>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{vehiculo.anio_vehiculo || '-'}</td>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{vehiculo.color_vehiculo || '-'}</td>
                          {(isAdmin() || isAdminOrEditor()) && (
                            <td style={{ borderColor: 'var(--tecno-gray-light)' }}>
                              <div className="btn-group btn-group-sm">
                                {isAdminOrEditor() && (
                                  <button
                                    className="btn btn-sm"
                                    onClick={() => handleEdit(vehiculo)}
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
                                    onClick={() => handleDelete(vehiculo.pk_id_vehiculo)}
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

export default Vehiculos; 