import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
    pregunta_seguridad_usuario: ''
  });
  
  // Estados para edición
  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para cambio de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    contrasenia_usuario: '',
    confirmar_contrasenia: ''
  });
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  // Estado para archivo de foto
  const [fotoFile, setFotoFile] = useState(null);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:4000/api/usuarios');
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
      pregunta_seguridad_usuario: ''
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
      setError('Todos los campos son requeridos');
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
      formDataToSend.append('pregunta_seguridad_usuario', formData.pregunta_seguridad_usuario);
      
      if (fotoFile) {
        formDataToSend.append('foto', fotoFile);
      }

      if (isEditing) {
        await axios.put(`http://localhost:4000/api/usuarios/${editingId}`, formDataToSend);
        setSuccessMessage('Usuario actualizado correctamente');
      } else {
        await axios.post('http://localhost:4000/api/usuarios', formDataToSend);
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
      pregunta_seguridad_usuario: usuario.pregunta_seguridad_usuario
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
      await axios.delete(`http://localhost:4000/api/usuarios/${id}`);
      setSuccessMessage('Usuario eliminado correctamente');
      cargarUsuarios();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el usuario');
      setSuccessMessage('');
    }
  };

  const abrirModalContrasena = (usuario) => {
    setSelectedUserId(usuario.pk_id_usuarios);
    setPasswordData({ contrasenia_usuario: '', confirmar_contrasenia: '' });
    setShowPasswordModal(true);
  };

  const cambiarContrasena = async () => {
    if (passwordData.contrasenia_usuario !== passwordData.confirmar_contrasenia) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.contrasenia_usuario.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await axios.put(`http://localhost:4000/api/usuarios/${selectedUserId}/cambiar-contrasena`, {
        contrasenia_usuario: passwordData.contrasenia_usuario
      });
      setSuccessMessage('Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar la contraseña');
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Gestión de Usuarios</h2>
            <button 
              className="btn btn-secondary" 
              onClick={() => window.history.back()}
            >
              ← Volver al Menú Principal
            </button>
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {successMessage}
              <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
            </div>
          )}

          {/* Formulario */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                {isEditing ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
              </h5>
            </div>
            <div className="card-body">
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
                  <button type="submit" className="btn btn-primary">
                    {isEditing ? 'Actualizar Usuario' : 'Registrar Usuario'}
                  </button>
                  {isEditing && (
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={limpiarFormulario}
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Usuarios Registrados</h5>
            </div>
            <div className="card-body">
              {usuarios.length === 0 ? (
                <p className="text-muted">No hay usuarios registrados</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Foto</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Pregunta de Seguridad</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((usuario) => (
                        <tr key={usuario.pk_id_usuarios}>
                          <td>{usuario.pk_id_usuarios}</td>
                          <td>
                            {usuario.foto_perfil_usuario ? (
                              <img
                                src={`http://localhost:4000/uploads/${usuario.foto_perfil_usuario}`}
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
                          <td>{usuario.nombre_usuario}</td>
                          <td>{usuario.email_usuario}</td>
                          <td>{usuario.pregunta_seguridad_usuario}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => editarUsuario(usuario)}
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn btn-sm btn-info"
                                onClick={() => abrirModalContrasena(usuario)}
                                title="Cambiar Contraseña"
                              >
                                🔒
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => eliminarUsuario(usuario.pk_id_usuarios, usuario.nombre_usuario)}
                                title="Eliminar"
                                disabled={usuario.nombre_usuario.toLowerCase() === 'admin'}
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
      </div>

      {/* Modal para cambiar contraseña */}
      {showPasswordModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cambiar Contraseña</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPasswordModal(false)}
                ></button>
              </div>
              <div className="modal-body">
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
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={cambiarContrasena}
                >
                  Cambiar Contraseña
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay del modal */}
      {showPasswordModal && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div>
  );
}

export default Usuarios;
