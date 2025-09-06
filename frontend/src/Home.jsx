import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Home({ usuario, onLogout }) {
  const [open, setOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState(usuario.nombre);
  const [nuevaFoto, setNuevaFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // Para el menú vertical
  const navigate = useNavigate();

  if (!usuario) return <div className="container mt-5">No autenticado.</div>;

  // Construye la URL para la imagen usando la ruta estática del backend
  const urlFoto = usuario.foto ? `http://localhost:4000/uploads/${usuario.foto}` : null;

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    setNuevaFoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewFoto(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewFoto(null);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', usuario.email);
      formData.append('nombre', nuevoNombre);
      if (nuevaFoto) {
        formData.append('foto', nuevaFoto);
      }
      const res = await axios.post('http://localhost:4000/api/actualizar-usuario', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMensaje(res.data.message);
      // Actualizar usuario en localStorage y en el estado
      const nuevoUsuario = {
        ...usuario,
        nombre: nuevoNombre,
        foto: res.data.foto ? res.data.foto : usuario.foto,
      };
      localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
      window.location.reload(); // Refrescar para que se actualice la foto y nombre en toda la app
    } catch (err) {
      setError('Error al actualizar la información.');
    } finally {
      setLoading(false);
    }
  };

  // Handlers de navegación para el menú
  const goTo = (ruta) => {
    setMenuOpen(false);
    navigate(ruta);
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Header horizontal con menú fijo */}
      <header style={{
        width: '100%',
        height: 60,
        background: '#343a40',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1200,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <span style={{ fontWeight: 'bold', fontSize: 22, letterSpacing: 1 }}>Menú Principal</span>
        <nav style={{ display: 'flex', gap: 24 }}>
          <button onClick={() => navigate('/home')} style={menuBtnStyleHeader}>Inicio</button>
          <button onClick={() => navigate('/dashboard')} style={menuBtnStyleHeader}>📊 Dashboard</button>
          <button onClick={() => navigate('/clientes')} style={menuBtnStyleHeader}>Clientes</button>
          <button onClick={() => navigate('/vehiculos')} style={menuBtnStyleHeader}>Vehículos</button>
          <button onClick={() => navigate('/servicios')} style={menuBtnStyleHeader}>Servicios</button>
          <button onClick={() => navigate('/estados')} style={menuBtnStyleHeader}>Estados</button>
          <button onClick={() => navigate('/ordenes')} style={menuBtnStyleHeader}>Órdenes</button>
          <button onClick={() => navigate('/usuarios')} style={menuBtnStyleHeader}>Usuarios</button>
        </nav>
      </header>

      {/* Espacio para el header */}
      <div style={{ height: 60 }} />

      {/* Botón para abrir el menú lateral */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute',
          top: 84,
          left: 24,
          zIndex: 1001,
          background: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          padding: '10px 16px',
          cursor: 'pointer',
        }}
      >
        ☰ Menú usuario
      </button>

      {/* Drawer lateral (usuario) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: open ? 0 : -280,
          width: 260,
          height: '100%',
          background: '#f8f9fa',
          boxShadow: open ? '2px 0 8px rgba(0,0,0,0.15)' : 'none',
          padding: '2rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'left 0.3s',
          zIndex: 2000,
        }}
      >
        <button
          onClick={() => setOpen(false)}
          style={{
            alignSelf: 'flex-end',
            background: 'transparent',
            border: 'none',
            fontSize: 22,
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          ×
        </button>
        {previewFoto ? (
          <img
            src={previewFoto}
            alt="Nueva foto de perfil"
            className="rounded-circle"
            style={{ width: 100, height: 100, objectFit: 'cover', marginBottom: 16 }}
          />
        ) : urlFoto && (
          <img
            src={urlFoto}
            alt="Foto de perfil"
            className="rounded-circle"
            style={{ width: 100, height: 100, objectFit: 'cover', marginBottom: 16 }}
          />
        )}
        <h4 style={{ marginBottom: 8 }}>{usuario.nombre}</h4>
        <p style={{ color: '#555', fontSize: 14, marginBottom: 24 }}>{usuario.email}</p>
        <button
          onClick={() => setShowEdit(!showEdit)}
          style={{
            background: '#ffc107',
            color: '#333',
            border: 'none',
            borderRadius: 4,
            padding: '8px 16px',
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          {showEdit ? 'Cancelar' : 'Modificar información'}
        </button>
        {showEdit && (
          <form onSubmit={handleEditSubmit} style={{ width: '100%' }}>
            <div className="mb-2">
              <label style={{ fontSize: 13 }}>Nombre de usuario</label>
              <input
                type="text"
                className="form-control"
                value={nuevoNombre}
                onChange={e => setNuevoNombre(e.target.value)}
                style={{ fontSize: 14, marginBottom: 8 }}
                required
              />
            </div>
            <div className="mb-2">
              <label style={{ fontSize: 13 }}>Foto de perfil</label>
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={handleFotoChange}
                style={{ fontSize: 14, marginBottom: 8 }}
              />
            </div>
            {error && <div className="alert alert-danger p-1" style={{ fontSize: 13 }}>{error}</div>}
            {mensaje && <div className="alert alert-success p-1" style={{ fontSize: 13 }}>{mensaje}</div>}
            <button
              type="submit"
              className="btn btn-success btn-sm w-100 mb-2"
              style={{ fontSize: 14 }}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              className="btn btn-link btn-sm w-100"
              style={{ fontSize: 14 }}
              onClick={() => navigate('/recuperar-contrasena')}
            >
              Cambiar contraseña
            </button>
          </form>
        )}
        <button
          onClick={handleLogout}
          style={{
            background: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '10px 20px',
            cursor: 'pointer',
            marginTop: 'auto',
          }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Fondo oscuro cuando el Drawer está abierto */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.2)',
            zIndex: 999,
          }}
        />
      )}

      {/* Contenido principal */}
      <main style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', minHeight: '100vh', paddingTop: 40 }}>
        <div className="container text-center">
          <h1 style={{ marginTop: 0, marginBottom: 32 }}>🏠 Bienvenido al Sistema de Gestión</h1>
          <p className="lead mb-4">Taller Mecánico Tecno Auto - Repuestos Electrofrio</p>
          
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card shadow">
                <div className="card-body">
                  <h3 className="card-title">📊 Dashboard de Estadísticas</h3>
                  <p className="card-text">
                    Accede a un resumen completo de las estadísticas del taller, incluyendo:
                  </p>
                  <ul className="list-unstyled">
                    <li>🚗 Vehículos más ingresados</li>
                    <li>👥 Clientes por mes</li>
                    <li>🔧 Servicios más solicitados</li>
                    <li>📈 Tendencias de órdenes</li>
                    <li>💰 Ingresos estimados</li>
                  </ul>
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={() => navigate('/dashboard')}
                  >
                    📊 Ver Dashboard de Estadísticas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Estilo para los botones del menú vertical
const menuBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#343a40',
  padding: '12px 20px',
  textAlign: 'left',
  fontSize: 16,
  cursor: 'pointer',
  borderBottom: '1px solid #eee',
  outline: 'none',
};

const menuBtnStyleHeader = {
  background: 'none',
  border: 'none',
  color: '#fff',
  padding: '10px 18px',
  textAlign: 'center',
  fontSize: 16,
  cursor: 'pointer',
  borderRadius: 4,
  outline: 'none',
  transition: 'background 0.2s',
};

export default Home;
