import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Clientes() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre_cliente: '',
    apellido_cliente: '',
    dpi_cliente: '',
    NIT: '',
    telefono_cliente: '',
    correo_cliente: '',
    direccion_cliente: '',
  });
  const [clientes, setClientes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [verificarNIT, setVerificarNIT] = useState('');
  const [verificacion, setVerificacion] = useState(null);

  // Cargar clientes al iniciar
  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const res = await axios.get('/api/clientes');
      setClientes(res.data);
    } catch (err) {
      setError('Error al cargar los clientes.');
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
        // Actualizar cliente
        await axios.put(`/api/clientes/${editId}`, form);
        setMensaje('Cliente actualizado exitosamente.');
      } else {
        // Crear cliente
        await axios.post('/api/clientes', form);
        setMensaje('Cliente registrado exitosamente.');
      }
      setForm({
        nombre_cliente: '',
        apellido_cliente: '',
        dpi_cliente: '',
        NIT: '',
        telefono_cliente: '',
        correo_cliente: '',
        direccion_cliente: '',
      });
      setEditId(null);
      fetchClientes();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al guardar el cliente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = cliente => {
    setForm({
      nombre_cliente: cliente.nombre_cliente,
      apellido_cliente: cliente.apellido_cliente,
      dpi_cliente: cliente.dpi_cliente,
      NIT: cliente.NIT,
      telefono_cliente: cliente.telefono_cliente,
      correo_cliente: cliente.correo_cliente,
      direccion_cliente: cliente.direccion_cliente,
    });
    setEditId(cliente.PK_id_cliente);
    setMensaje('');
    setError('');
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Seguro que deseas eliminar este cliente?')) return;
    try {
      await axios.delete(`/api/clientes/${id}`);
      setMensaje('Cliente eliminado correctamente.');
      fetchClientes();
    } catch (err) {
      setError('Error al eliminar el cliente.');
    }
  };

  const handleVerificarNIT = async () => {
    setVerificacion(null);
    setError('');
    if (!verificarNIT) {
      setError('Ingresa un NIT para verificar.');
      return;
    }
    console.log('🔍 Frontend: Verificando NIT:', verificarNIT);
    try {
      const res = await axios.get(`/api/clientes/nit/${verificarNIT}`);
      console.log('✅ Frontend: Cliente encontrado:', res.data);
      console.log('📊 Frontend: Tipo de respuesta:', typeof res.data);
      console.log('📊 Frontend: Contenido de respuesta:', JSON.stringify(res.data));
      
      if (res.data && res.data.nombre_cliente) {
        setVerificacion(res.data);
      } else {
        console.log('⚠️ Frontend: Datos del cliente incompletos');
        setVerificacion('Cliente encontrado pero con datos incompletos.');
      }
    } catch (err) {
      console.log('❌ Frontend: Error en verificación:', err.response?.data);
      if (err.response && err.response.status === 404) {
        setVerificacion('No existe un cliente con ese NIT.');
      } else {
        setError('Error al verificar el NIT.');
      }
    }
  };

  const handleCancelEdit = () => {
    setForm({
      nombre_cliente: '',
      apellido_cliente: '',
      dpi_cliente: '',
      NIT: '',
      telefono_cliente: '',
      correo_cliente: '',
      direccion_cliente: '',
    });
    setEditId(null);
    setMensaje('');
    setError('');
  };

  console.log('editId:', editId);
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, var(--tecno-gray-very-light) 0%, var(--tecno-white) 100%)',
      paddingTop: '90px'
    }}>
      <div className="container" style={{ maxWidth: 1200 }}>
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
              👥 Gestión de Clientes
            </h1>
            <p style={{ 
              color: 'var(--tecno-gray-dark)', 
              fontSize: '1.1rem',
              marginBottom: '0'
            }}>
              Administra la información de los clientes del taller
            </p>
          </div>
          <button 
            className="btn-tecno-outline" 
            onClick={() => navigate('/home')}
          >
            ← Regresar al Menú Principal
          </button>
        </div>
        <div className="row">
          <div className="col-md-5">
            <div className="card-tecno mb-4">
              <div className="card-tecno-header">
                🔍 Verificar Cliente por NIT
              </div>
              <div className="card-tecno-body">
                <div className="input-group mb-3">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="NIT a verificar (máx. 9 caracteres)" 
                    value={verificarNIT} 
                    onChange={e => setVerificarNIT(e.target.value)} 
                    maxLength="9"
                  />
                  <button 
                    className="btn-tecno" 
                    type="button" 
                    onClick={handleVerificarNIT}
                  >
                    Verificar
                  </button>
                </div>
                {verificacion && (
                  typeof verificacion === 'string' ?
                    <div className="alert-tecno alert-tecno-warning">{verificacion}</div> :
                    <div className="alert-tecno alert-tecno-success">
                      <strong>✅ Cliente encontrado:</strong><br/>
                      <strong>Nombre:</strong> {verificacion.nombre_cliente} {verificacion.apellido_cliente}<br/>
                      <strong>NIT:</strong> {verificacion.NIT}<br/>
                      {verificacion.telefono_cliente && <><strong>Teléfono:</strong> {verificacion.telefono_cliente}<br/></>}
                      {verificacion.correo_cliente && <><strong>Correo:</strong> {verificacion.correo_cliente}<br/></>}
                    </div>
                )}
              </div>
            </div>
            <div className="card-tecno">
              <div className="card-tecno-header">
                {editId ? '✏️ Editando Cliente' : '➕ Nuevo Cliente'}
              </div>
              <div className="card-tecno-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Nombre *</label>
                    <input type="text" className="form-control" name="nombre_cliente" value={form.nombre_cliente} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Apellido *</label>
                    <input type="text" className="form-control" name="apellido_cliente" value={form.apellido_cliente} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">DPI</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="dpi_cliente" 
                      value={form.dpi_cliente} 
                      onChange={handleChange} 
                      maxLength="13"
                      placeholder="Máximo 13 caracteres (opcional)"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">NIT *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="NIT" 
                      value={form.NIT} 
                      onChange={handleChange} 
                      maxLength="9"
                      placeholder="Máximo 9 caracteres"
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Teléfono</label>
                    <input type="text" className="form-control" name="telefono_cliente" value={form.telefono_cliente} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Correo</label>
                    <input type="email" className="form-control" name="correo_cliente" value={form.correo_cliente} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Dirección</label>
                    <textarea className="form-control" name="direccion_cliente" value={form.direccion_cliente} onChange={handleChange} />
                  </div>
                  {error && <div className="alert-tecno alert-tecno-danger">{error}</div>}
                  {mensaje && <div className="alert-tecno alert-tecno-success">{mensaje}</div>}
                  <button type="submit" className="btn-tecno w-100" disabled={loading}>
                    {loading ? (editId ? 'Actualizando...' : 'Guardando...') : (editId ? 'Actualizar Cliente' : 'Registrar Cliente')}
                  </button>
                  {editId && (
                    <button type="button" className="btn-tecno-secondary w-100 mt-2" onClick={handleCancelEdit}>
                      Cancelar edición
                    </button>
                  )}
                </form>
                {editId && (
                  <div className="alert-tecno alert-tecno-warning mt-3">
                    <strong>Modo edición activado</strong>
                  </div>
                )}
              </div>
            </div>
        </div>
          <div className="col-md-7">
            <div className="card-tecno">
              <div className="card-tecno-header">
                📋 Lista de Clientes
              </div>
              <div className="card-tecno-body">
                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                  <table className="table table-bordered" style={{ marginBottom: '0' }}>
                    <thead style={{ backgroundColor: 'var(--tecno-gray-very-light)' }}>
                      <tr>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600',
                          minWidth: '50px'
                        }}>ID</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600',
                          minWidth: '120px'
                        }}>Nombre</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600',
                          minWidth: '120px'
                        }}>Apellido</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600',
                          minWidth: '100px'
                        }}>DPI</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600',
                          minWidth: '100px'
                        }}>NIT</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600',
                          minWidth: '100px'
                        }}>Teléfono</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600',
                          minWidth: '150px'
                        }}>Correo</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600',
                          minWidth: '100px'
                        }}>Fecha Registro</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600',
                          minWidth: '120px'
                        }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center" style={{ 
                            borderColor: 'var(--tecno-gray-light)',
                            color: 'var(--tecno-gray-dark)',
                            padding: '20px'
                          }}>
                            No hay clientes registrados.
                          </td>
                        </tr>
                      ) : (
                        clientes.map((cliente, idx) => (
                          <tr key={cliente.PK_id_cliente || idx}>
                            <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{cliente.PK_id_cliente}</td>
                            <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{cliente.nombre_cliente}</td>
                            <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{cliente.apellido_cliente}</td>
                            <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{cliente.dpi_cliente}</td>
                            <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{cliente.NIT || '-'}</td>
                            <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{cliente.telefono_cliente || '-'}</td>
                            <td style={{ borderColor: 'var(--tecno-gray-light)' }}>
                              {cliente.correo_cliente ? (
                                <a href={`mailto:${cliente.correo_cliente}`} style={{ color: 'var(--tecno-orange)', textDecoration: 'none' }}>
                                  {cliente.correo_cliente}
                                </a>
                              ) : '-'}
                            </td>
                            <td style={{ borderColor: 'var(--tecno-gray-light)' }}>
                              {cliente.fecha_registro_cliente ? 
                                new Date(cliente.fecha_registro_cliente).toLocaleDateString('es-GT') : '-'
                              }
                            </td>
                            <td style={{ borderColor: 'var(--tecno-gray-light)' }}>
                              <div className="btn-group" role="group">
                                <button 
                                  className="btn btn-sm" 
                                  onClick={() => {console.log('Editar cliente:', cliente); handleEdit(cliente);}}
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
                                  onClick={() => handleDelete(cliente.PK_id_cliente)}
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
                        ))
                      )}
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

export default Clientes; 