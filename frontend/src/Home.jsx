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
  // const [menuOpen, setMenuOpen] = useState(false); // Para el menú vertical - removido, no se usa
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Para el menú móvil
  const navigate = useNavigate();

  if (!usuario) return <div className="container mt-5">No autenticado.</div>;

  // Construye la URL para la imagen usando la ruta estática del backend
  const urlFoto = usuario.foto ? `/uploads/${usuario.foto}` : null;

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
      const res = await axios.post('/api/actualizar-usuario', formData, {
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
    // setMenuOpen(false); // Removido - variable no existe
    setMobileMenuOpen(false);
    navigate(ruta);
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Header horizontal con menú fijo */}
      <header className="header-tecno" style={{
        minHeight: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 2rem',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        boxShadow: 'var(--shadow-medium)'
      }}>
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src="/LogoTecnoAuto.jpg" 
            alt="Tecno Auto" 
            style={{ 
              height: '40px', 
              width: 'auto',
              borderRadius: '6px'
            }} 
          />
          <span style={{ 
            fontWeight: '700', 
            fontSize: '20px', 
            letterSpacing: '0.5px',
            background: 'linear-gradient(135deg, var(--tecno-orange), var(--tecno-orange-light))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Sistema de Gestión
          </span>
        </div>
        
        {/* Navegación desktop */}
        <nav className="nav-tecno">
          <button onClick={() => navigate('/home')} className="nav-link">🏠 Inicio</button>
          <button onClick={() => navigate('/dashboard')} className="nav-link">📊 Dashboard</button>
          <button onClick={() => navigate('/reportes')} className="nav-link">📄 Reportes</button>
          <button onClick={() => navigate('/tracker')} className="nav-link">🔍 Tracker</button>
          <button onClick={() => navigate('/clientes')} className="nav-link">👥 Clientes</button>
          <button onClick={() => navigate('/vehiculos')} className="nav-link">🚗 Vehículos</button>
          <button onClick={() => navigate('/servicios')} className="nav-link">🔧 Servicios</button>
          <button onClick={() => navigate('/estados')} className="nav-link">📋 Estados</button>
          <button onClick={() => navigate('/ordenes')} className="nav-link">📝 Órdenes</button>
          <button onClick={() => navigate('/usuarios')} className="nav-link">👤 Usuarios</button>
        </nav>
        
        {/* Botón hamburguesa para móvil */}
        <button 
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(true)}
        >
          ☰
        </button>
      </header>

      {/* Espacio para el header */}
      <div style={{ height: 102 }} />

      {/* Botón para abrir el menú lateral - Solo visible en desktop */}
      <button
        onClick={() => setOpen(true)}
        className="btn-tecno user-menu-btn"
        style={{
          position: 'absolute',
          top: 120,
          left: 24,
          zIndex: 1001,
          padding: '12px 20px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        ☰ Menú Usuario
      </button>

      {/* Drawer lateral (usuario) - SOLO PERFIL DE USUARIO */}
      <div
        className="user-drawer"
        style={{
          position: 'fixed',
          top: 0,
          left: open ? 0 : -300,
          width: 280,
          height: '100%',
          background: 'var(--tecno-white)',
          boxShadow: open ? 'var(--shadow-heavy)' : 'none',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'left var(--transition-medium)',
          zIndex: 2000,
          borderRight: '1px solid var(--tecno-gray-light)'
        }}
      >
        <button
          onClick={() => setOpen(false)}
          style={{
            alignSelf: 'flex-end',
            background: 'var(--tecno-gray-light)',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            marginBottom: '20px',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--tecno-gray-dark)',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--tecno-orange)';
            e.target.style.color = 'var(--tecno-white)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'var(--tecno-gray-light)';
            e.target.style.color = 'var(--tecno-gray-dark)';
          }}
        >
          ×
        </button>
        
        {/* Header del drawer de usuario */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h3 style={{ 
            color: 'var(--tecno-orange)', 
            marginBottom: '16px',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            👤 Perfil de Usuario
          </h3>
        </div>
        
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
        <h4 style={{ 
          marginBottom: '8px', 
          color: 'var(--tecno-black)',
          fontWeight: '600'
        }}>
          {usuario.nombre}
        </h4>
        <p style={{ 
          color: 'var(--tecno-gray-dark)', 
          fontSize: '14px', 
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          {usuario.email}
        </p>
        <button
          onClick={() => setShowEdit(!showEdit)}
          className={showEdit ? "btn-tecno-secondary" : "btn-tecno-outline"}
          style={{
            marginBottom: '16px',
            fontSize: '14px',
            padding: '10px 16px'
          }}
        >
          {showEdit ? '❌ Cancelar' : '✏️ Modificar información'}
        </button>
        {showEdit && (
          <form onSubmit={handleEditSubmit} style={{ width: '100%' }}>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600' }}>
                Nombre de usuario
              </label>
              <input
                type="text"
                className="form-control"
                value={nuevoNombre}
                onChange={e => setNuevoNombre(e.target.value)}
                style={{ 
                  fontSize: '14px', 
                  marginBottom: '8px',
                  border: '2px solid var(--tecno-gray-light)',
                  borderRadius: '6px',
                  padding: '8px 12px'
                }}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600' }}>
                Foto de perfil
              </label>
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={handleFotoChange}
                style={{ 
                  fontSize: '14px', 
                  marginBottom: '8px',
                  border: '2px solid var(--tecno-gray-light)',
                  borderRadius: '6px',
                  padding: '8px 12px'
                }}
              />
            </div>
            {error && (
              <div className="alert-tecno alert-tecno-danger" style={{ fontSize: '12px', marginBottom: '12px' }}>
                {error}
              </div>
            )}
            {mensaje && (
              <div className="alert-tecno alert-tecno-success" style={{ fontSize: '12px', marginBottom: '12px' }}>
                {mensaje}
              </div>
            )}
            <button
              type="submit"
              className="btn-tecno w-100 mb-2"
              style={{ fontSize: '14px', padding: '10px' }}
              disabled={loading}
            >
              {loading ? '⏳ Guardando...' : '💾 Guardar cambios'}
            </button>
            <button
              type="button"
              className="btn-tecno-outline w-100"
              style={{ fontSize: '14px', padding: '8px' }}
              onClick={() => navigate('/recuperar-contrasena')}
            >
              🔐 Cambiar contraseña
            </button>
          </form>
        )}
        <button
          onClick={handleLogout}
          style={{
            background: 'var(--danger)',
            color: 'var(--tecno-white)',
            border: 'none',
            borderRadius: '6px',
            padding: '12px 20px',
            cursor: 'pointer',
            marginTop: 'auto',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all var(--transition-fast)',
            boxShadow: 'var(--shadow-light)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#c82333';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = 'var(--shadow-medium)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'var(--danger)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'var(--shadow-light)';
          }}
        >
          🚪 Cerrar sesión
        </button>
      </div>

      {/* Menú móvil - Solo visible en móviles */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`} style={{ display: 'none' }}>
        <div className="mobile-menu-header">
          <div>
            <img 
              src="/LogoTecnoAuto.jpg" 
              alt="Tecno Auto" 
              style={{ 
                height: '32px', 
                width: 'auto',
                borderRadius: '4px',
                marginRight: '12px'
              }} 
            />
            <span style={{ fontWeight: '600', fontSize: '18px' }}>
              Menú de Navegación
            </span>
          </div>
          <button 
            className="mobile-menu-close"
            onClick={() => setMobileMenuOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="mobile-menu-body">
          <button onClick={() => goTo('/home')} className="nav-link">🏠 Inicio</button>
          <button onClick={() => goTo('/dashboard')} className="nav-link">📊 Dashboard</button>
          <button onClick={() => goTo('/reportes')} className="nav-link">📄 Reportes</button>
          <button onClick={() => goTo('/tracker')} className="nav-link">🔍 Tracker</button>
          <button onClick={() => goTo('/clientes')} className="nav-link">👥 Clientes</button>
          <button onClick={() => goTo('/vehiculos')} className="nav-link">🚗 Vehículos</button>
          <button onClick={() => goTo('/servicios')} className="nav-link">🔧 Servicios</button>
          <button onClick={() => goTo('/estados')} className="nav-link">📋 Estados</button>
          <button onClick={() => goTo('/ordenes')} className="nav-link">📝 Órdenes</button>
          <button onClick={() => goTo('/usuarios')} className="nav-link">👤 Usuarios</button>
          
          {/* Separador */}
          <div style={{ 
            height: '1px', 
            background: 'var(--tecno-gray-light)', 
            margin: '20px 0',
            width: '100%'
          }} />
          
          {/* Botón de menú usuario en móvil */}
          <button 
            onClick={() => {
              setMobileMenuOpen(false);
              setOpen(true);
            }} 
            className="nav-link"
            style={{
              background: 'var(--tecno-orange)',
              color: 'var(--tecno-white)',
              fontWeight: '600',
              border: '2px solid var(--tecno-orange)'
            }}
          >
            👤 Mi Perfil
          </button>
        </div>
      </div>

      {/* Overlay para menú móvil - Solo visible en móviles */}
      <div 
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        style={{ display: 'none' }}
      />

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
      <main className="main-content" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'flex-start', 
        alignItems: 'center', 
        minHeight: '100vh', 
        paddingTop: '40px',
        background: 'linear-gradient(135deg, var(--tecno-gray-very-light) 0%, var(--tecno-white) 100%)'
      }}>
        <div className="container text-center">
          <div style={{ marginBottom: '48px' }}>
            <h1 style={{ 
              marginTop: 0, 
              marginBottom: '16px',
              fontSize: '2.5rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, var(--tecno-orange), var(--tecno-orange-light))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🏠 Bienvenido al Sistema de Gestión
            </h1>
            <p style={{ 
              fontSize: '1.2rem', 
              color: 'var(--tecno-gray-dark)',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              Taller Mecánico Tecno Auto - Repuestos Electrofrio
            </p>
            <p style={{ 
              fontSize: '1rem', 
              color: 'var(--tecno-gray-medium)',
              marginBottom: '0'
            }}>
              Gestiona tu taller de manera eficiente y profesional
            </p>
          </div>
          
          <div className="row justify-content-center" style={{ gap: '24px' }}>
            <div className="col-md-4">
              <div className="card-tecno">
                <div className="card-tecno-header">
                  📊 Dashboard de Estadísticas
                </div>
                <div className="card-tecno-body">
                  <p style={{ color: 'var(--tecno-gray-dark)', marginBottom: '20px' }}>
                    Accede a un resumen completo de las estadísticas del taller:
                  </p>
                  <ul style={{ 
                    listStyle: 'none', 
                    padding: 0, 
                    textAlign: 'left',
                    marginBottom: '24px'
                  }}>
                    <li style={{ marginBottom: '8px', color: 'var(--tecno-gray-dark)' }}>🚗 Vehículos más ingresados</li>
                    <li style={{ marginBottom: '8px', color: 'var(--tecno-gray-dark)' }}>👥 Clientes por mes</li>
                    <li style={{ marginBottom: '8px', color: 'var(--tecno-gray-dark)' }}>🔧 Servicios más solicitados</li>
                    <li style={{ marginBottom: '8px', color: 'var(--tecno-gray-dark)' }}>📈 Tendencias de órdenes</li>
                    <li style={{ marginBottom: '8px', color: 'var(--tecno-gray-dark)' }}>💰 Ingresos estimados</li>
                  </ul>
                  <button
                    className="btn-tecno w-100"
                    onClick={() => navigate('/dashboard')}
                    style={{ fontSize: '16px', padding: '14px' }}
                  >
                    📊 Ver Dashboard
                  </button>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card-tecno">
                <div className="card-tecno-header">
                  📄 Generador de Reportes
                </div>
                <div className="card-tecno-body">
                  <p style={{ color: 'var(--tecno-gray-dark)', marginBottom: '20px' }}>
                    Genera reportes profesionales en PDF y Excel:
                  </p>
                  <ul style={{ 
                    listStyle: 'none', 
                    padding: 0, 
                    textAlign: 'left',
                    marginBottom: '24px'
                  }}>
                    <li style={{ marginBottom: '8px', color: 'var(--tecno-gray-dark)' }}>📋 Reportes de órdenes</li>
                    <li style={{ marginBottom: '8px', color: 'var(--tecno-gray-dark)' }}>👥 Listado de clientes</li>
                    <li style={{ marginBottom: '8px', color: 'var(--tecno-gray-dark)' }}>🚗 Inventario de vehículos</li>
                    <li style={{ marginBottom: '8px', color: 'var(--tecno-gray-dark)' }}>🔧 Catálogo de servicios</li>
                    <li style={{ marginBottom: '8px', color: 'var(--tecno-gray-dark)' }}>📊 Estadísticas generales</li>
                  </ul>
                  <button
                    className="btn-tecno-secondary w-100"
                    onClick={() => navigate('/reportes')}
                    style={{ fontSize: '16px', padding: '14px' }}
                  >
                    📄 Generar Reportes
                  </button>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card-tecno">
                <div className="card-tecno-header">
                  🔍 Tracker Público
                </div>
                <div className="card-tecno-body">
                  <p style={{ color: 'var(--tecno-gray-dark)', marginBottom: '20px' }}>
                    Consulta el estado de órdenes sin login:
                  </p>
                  <ul style={{ 
                    listStyle: 'none', 
                    padding: 0, 
                    textAlign: 'left',
                    marginBottom: '24px'
                  }}>
                    <li style={{ marginBottom: '8px', color: 'var(--tecno-gray-dark)' }}>📞 Búsqueda por teléfono</li>
                    <li style={{ marginBottom: '8px', color: 'var(--tecno-gray-dark)' }}>🔢 Búsqueda por número de orden</li>
                    <li style={{ marginBottom: '8px', color: 'var(--tecno-gray-dark)' }}>📋 Historial de estados</li>
                    <li style={{ marginBottom: '8px', color: 'var(--tecno-gray-dark)' }}>⏰ Timeline de progreso</li>
                    <li style={{ marginBottom: '8px', color: 'var(--tecno-gray-dark)' }}>🌐 Acceso público</li>
                  </ul>
                  <button
                    className="btn-tecno-outline w-100"
                    onClick={() => navigate('/tracker')}
                    style={{ fontSize: '16px', padding: '14px' }}
                  >
                    🔍 Consultar Orden
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


export default Home;
