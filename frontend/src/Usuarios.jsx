import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { isAdmin } from './utils/auth';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    email_usuario: '',
    contrasenia_usuario: '',
    pregunta_seguridad_usuario: '',
    rol_usuario: 'mecanico' // Valor por defecto
  });
  
  // Estados para edición
  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para cambio de contraseña - DESHABILITADO
  // const [showPasswordModal, setShowPasswordModal] = useState(false);
  // const [passwordData, setPasswordData] = useState({
  //   contrasenia_usuario: '',
  //   confirmar_contrasenia: ''
  // });
  // const [selectedUserId, setSelectedUserId] = useState(null);
  
  // Estado para archivo de foto
  const [fotoFile, setFotoFile] = useState(null);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/usuarios');
      setUsuarios(response.data);
      setError('');
    } catch (err) {
      setError('Error al cargar los usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre_usuario: '',
      email_usuario: '',
      contrasenia_usuario: '',
      pregunta_seguridad_usuario: '',
      rol_usuario: 'mecanico'
    });
    setFotoFile(null);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFotoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre_usuario || !formData.email_usuario || 
        (!isEditing && !formData.contrasenia_usuario) || !formData.pregunta_seguridad_usuario) {
      setError('Todos los campos requeridos deben ser completados');
      return;
    }

    if (!isEditing && formData.contrasenia_usuario.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombre_usuario', formData.nombre_usuario);
      formDataToSend.append('email_usuario', formData.email_usuario);
      if (!isEditing) {
        formDataToSend.append('contrasenia_usuario', formData.contrasenia_usuario);
      }
      // Enviar pregunta de seguridad tanto al crear como al editar
      formDataToSend.append('pregunta_seguridad_usuario', formData.pregunta_seguridad_usuario || '');
      // Enviar rol solo si el usuario es admin
      if (isAdmin() && formData.rol_usuario) {
        formDataToSend.append('rol_usuario', formData.rol_usuario);
      }
      
      if (fotoFile) {
        formDataToSend.append('foto', fotoFile);
      }

      if (isEditing) {
        await axios.put(`/api/usuarios/${editingId}`, formDataToSend);
        setSuccessMessage('Usuario actualizado correctamente');
      } else {
        await axios.post('/api/usuarios', formDataToSend);
        setSuccessMessage('Usuario registrado correctamente');
      }

      limpiarFormulario();
      cargarUsuarios();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud');
      setSuccessMessage('');
    }
  };

  const editarUsuario = (usuario) => {
    setFormData({
      nombre_usuario: usuario.nombre_usuario,
      email_usuario: usuario.email_usuario,
      contrasenia_usuario: '',
      pregunta_seguridad_usuario: usuario.pregunta_seguridad_usuario || '',
      rol_usuario: usuario.rol_usuario || 'mecanico'
    });
    setEditingId(usuario.pk_id_usuarios);
    setIsEditing(true);
    setError('');
    setSuccessMessage('');
  };

  const eliminarUsuario = async (id, nombre) => {
    if (!window.confirm(`¿Está seguro de eliminar al usuario "${nombre}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/usuarios/${id}`);
      setSuccessMessage('Usuario eliminado correctamente');
      cargarUsuarios();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el usuario');
      setSuccessMessage('');
    }
  };

  // Funciones de cambio de contraseña - DESHABILITADAS
  // const abrirModalContrasena = (usuario) => {
  //   setSelectedUserId(usuario.pk_id_usuarios);
  //   setPasswordData({ contrasenia_usuario: '', confirmar_contrasenia: '' });
  //   setShowPasswordModal(true);
  // };

  // const cambiarContrasena = async () => {
  //   if (passwordData.contrasenia_usuario !== passwordData.confirmar_contrasenia) {
  //     setError('Las contraseñas no coinciden');
  //     return;
  //   }

  //   if (passwordData.contrasenia_usuario.length < 6) {
  //     setError('La contraseña debe tener al menos 6 caracteres');
  //     return;
  //   }

  //   try {
  //     await axios.put(`http://localhost:4000/api/usuarios/${selectedUserId}/cambiar-contrasena`, {
  //       contrasenia_usuario: passwordData.contrasenia_usuario
  //     });
  //     setSuccessMessage('Contraseña actualizada correctamente');
  //     setShowPasswordModal(false);
  //     setError('');
  //   } catch (err) {
  //     setError(err.response?.data?.message || 'Error al cambiar la contraseña');
  //   }
  // };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, var(--tecno-gray-very-light) 0%, var(--tecno-white) 100%)',
        paddingTop: '90px'
      }}>
        <div className="container">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="card-tecno" style={{ padding: '40px', textAlign: 'center' }}>
              <div className="spinner-border text-tecno-orange" role="status" style={{ color: 'var(--tecno-orange)' }}>
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p style={{ marginTop: '20px', color: 'var(--tecno-gray-dark)', fontWeight: '500' }}>
                Cargando usuarios...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              👥 Gestión de Usuarios
            </h1>
            <p style={{ 
              color: 'var(--tecno-gray-dark)', 
              fontSize: '1.1rem',
              marginBottom: '0'
            }}>
              Administra los usuarios del sistema del taller
            </p>
          </div>
          <button 
            className="btn-tecno-outline" 
            onClick={() => window.history.back()}
          >
            ← Volver al Menú Principal
          </button>
        </div>

        {error && (
          <div className="alert-tecno alert-tecno-danger" role="alert">
            {error}
            <button type="button" onClick={() => setError('')} style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--tecno-white)', 
              fontSize: '18px', 
              cursor: 'pointer', 
              marginLeft: '10px' 
            }}>×</button>
          </div>
        )}

        {successMessage && (
          <div className="alert-tecno alert-tecno-success" role="alert">
            {successMessage}
            <button type="button" onClick={() => setSuccessMessage('')} style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--tecno-white)', 
              fontSize: '18px', 
              cursor: 'pointer', 
              marginLeft: '10px' 
            }}>×</button>
          </div>
        )}

        {/* Formulario */}
        <div className="card-tecno mb-4">
          <div className="card-tecno-header">
            {isEditing ? '✏️ Editando Usuario' : '➕ Nuevo Usuario'}
          </div>
          <div className="card-tecno-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nombre Completo *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nombre_usuario"
                      value={formData.nombre_usuario}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email_usuario"
                      value={formData.email_usuario}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      {isEditing ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *'}
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      name="contrasenia_usuario"
                      value={formData.contrasenia_usuario}
                      onChange={handleInputChange}
                      required={!isEditing}
                      minLength={6}
                    />
                    <small className="form-text text-muted">
                      Mínimo 6 caracteres
                    </small>
                    {isEditing && (
                      <div className="alert alert-info mt-2" style={{
                        fontSize: '0.85rem',
                        padding: '8px 12px',
                        marginBottom: '0',
                        background: 'rgba(13, 202, 240, 0.1)',
                        border: '1px solid rgba(13, 202, 240, 0.2)',
                        color: '#0c5460',
                        borderRadius: '6px'
                      }}>
                        <strong>ℹ️ Nota:</strong> Para cambiar contraseñas existentes, usa el sistema de recuperación de contraseñas desde el login.
                      </div>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Pregunta de Seguridad *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="pregunta_seguridad_usuario"
                      value={formData.pregunta_seguridad_usuario}
                      onChange={handleInputChange}
                      placeholder="Ej: Nombre de tu mascota"
                      required
                    />
                  </div>
                  {isAdmin() && (
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Rol *</label>
                      <select
                        className="form-control"
                        name="rol_usuario"
                        value={formData.rol_usuario}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="mecanico">Mecánico (Solo lectura)</option>
                        <option value="editor">Editor (Crear/Editar)</option>
                        <option value="admin">Administrador (Completo)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Foto de Perfil</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn-tecno">
                    {isEditing ? 'Actualizar Usuario' : 'Registrar Usuario'}
                  </button>
                  {isEditing && (
                    <button 
                      type="button" 
                      className="btn-tecno-secondary"
                      onClick={limpiarFormulario}
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>
              </form>
              {isEditing && (
                <div className="alert-tecno alert-tecno-warning mt-3">
                  <strong>Modo edición activado</strong>
                </div>
              )}
            </div>
          </div>

        {/* Tabla de Usuarios */}
        <div className="card-tecno">
          <div className="card-tecno-header">
            📋 Usuarios Registrados
          </div>
          <div className="card-tecno-body">
              {usuarios.length === 0 ? (
                <p className="text-muted">No hay usuarios registrados</p>
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
                        }}>Foto</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600'
                        }}>Nombre</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600'
                        }}>Email</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600'
                        }}>Rol</th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600'
                        }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((usuario) => (
                        <tr key={usuario.pk_id_usuarios}>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{usuario.pk_id_usuarios}</td>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>
                            {usuario.foto_perfil_usuario ? (
                              <img
                                src={usuario.foto_perfil_usuario.startsWith('http') 
                                  ? usuario.foto_perfil_usuario 
                                  : `/uploads/${usuario.foto_perfil_usuario}`}
                                alt="Foto de perfil"
                                className="rounded-circle"
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center"
                                   style={{ width: '40px', height: '40px' }}>
                                <i className="fas fa-user text-white"></i>
                              </div>
                            )}
                          </td>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{usuario.nombre_usuario}</td>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>{usuario.email_usuario}</td>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>
                            {usuario.rol_usuario ? (
                              <span className={`badge ${
                                usuario.rol_usuario === 'admin' ? 'bg-danger' :
                                usuario.rol_usuario === 'editor' ? 'bg-warning' :
                                'bg-secondary'
                              }`} style={{ 
                                fontSize: '0.85rem',
                                padding: '6px 12px',
                                textTransform: 'capitalize'
                              }}>
                                {usuario.rol_usuario === 'admin' ? '👑 Administrador' :
                                 usuario.rol_usuario === 'editor' ? '✏️ Editor' :
                                 '🔧 Mecánico'}
                              </span>
                            ) : (
                              <span className="badge bg-secondary" style={{ 
                                fontSize: '0.85rem',
                                padding: '6px 12px'
                              }}>
                                Sin rol
                              </span>
                            )}
                          </td>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm"
                                onClick={() => editarUsuario(usuario)}
                                title="Editar"
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
                                ✏️
                              </button>
                              {/* Botón de cambio de contraseña DESHABILITADO */}
                              {/* <button
                                className="btn btn-sm"
                                onClick={() => abrirModalContrasena(usuario)}
                                title="Cambiar Contraseña"
                                style={{
                                  backgroundColor: 'var(--info)',
                                  color: 'var(--tecno-white)',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '12px',
                                  marginRight: '4px'
                                }}
                              >
                                🔒
                              </button> */}
                              <button
                                className="btn btn-sm"
                                onClick={() => eliminarUsuario(usuario.pk_id_usuarios, usuario.nombre_usuario)}
                                title="Eliminar"
                                disabled={usuario.nombre_usuario.toLowerCase() === 'admin'}
                                style={{
                                  backgroundColor: usuario.nombre_usuario.toLowerCase() === 'admin' ? 'var(--tecno-gray-light)' : 'var(--danger)',
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

      {/* Modal para cambiar contraseña - DESHABILITADO */}
      {/* {showPasswordModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="card-tecno">
              <div className="card-tecno-header d-flex justify-content-between align-items-center">
                <h5 style={{ margin: '0' }}>🔒 Cambiar Contraseña</h5>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--tecno-white)',
                    fontSize: '24px',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
              <div className="card-tecno-body">
                <div className="mb-3">
                  <label className="form-label">Nueva Contraseña *</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.contrasenia_usuario}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      contrasenia_usuario: e.target.value
                    }))}
                    required
                    minLength={6}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirmar Contraseña *</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.confirmar_contrasenia}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      confirmar_contrasenia: e.target.value
                    }))}
                    required
                  />
                </div>
              </div>
              <div style={{ 
                padding: '20px', 
                borderTop: '1px solid var(--tecno-gray-light)',
                textAlign: 'center'
              }}>
                <button
                  type="button"
                  className="btn-tecno-secondary"
                  onClick={() => setShowPasswordModal(false)}
                  style={{ marginRight: '10px' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-tecno"
                  onClick={cambiarContrasena}
                >
                  Cambiar Contraseña
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="modal-backdrop fade show"></div>
      )} */}
      </div>
    </div>
  );
}

export default Usuarios;
