import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login({ setUsuario }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:4000/api/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUsuario(res.data.usuario);
      navigate('/home');
    } catch (err) {
      setError('Credenciales incorrectas o error de servidor.');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100vw', 
      backgroundImage: 'url(/Fondo.jpg)', 
      backgroundSize: 'cover', 
      backgroundPosition: 'center', 
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* Overlay sutil para mejorar legibilidad */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.3)',
        zIndex: 1
      }} />
      
      <div className="container d-flex align-items-center justify-content-center min-vh-100" style={{ position: 'relative', zIndex: 2 }}>
        <div className="card-tecno" style={{ maxWidth: 450, width: '100%' }}>
          {/* Header con gradiente */}
          <div className="card-tecno-header text-center">
            <img 
              src="/LogoTecnoAuto.jpg" 
              alt="Tecno Auto" 
              style={{ 
                maxWidth: '180px', 
                width: '100%', 
                height: 'auto',
                marginBottom: '16px',
                borderRadius: '8px'
              }} 
            />
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Iniciar Sesión</h2>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
              Sistema de Gestión del Taller
            </p>
          </div>
          
          <div className="card-tecno-body">
            <form onSubmit={handleSubmit} className="form-tecno" style={{ padding: 0, boxShadow: 'none', border: 'none' }}>
              <div className="mb-4">
                <label className="form-label">Correo electrónico</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  placeholder="tu@email.com"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div className="mb-4">
                <label className="form-label">Contraseña</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  placeholder="••••••••"
                  style={{ fontSize: '16px' }}
                />
              </div>
              {error && (
                <div className="alert-tecno alert-tecno-danger" style={{ marginBottom: '20px' }}>
                  {error}
                </div>
              )}
              <button type="submit" className="btn-tecno w-100" style={{ fontSize: '16px', padding: '14px' }}>
                🚀 Entrar al Sistema
              </button>
            </form>
            
            <div className="text-center mt-4">
              <button 
                className="btn-tecno-outline" 
                onClick={() => navigate('/forgot-password')}
                style={{ fontSize: '14px', padding: '8px 16px' }}
              >
                🔐 ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>
          
          {/* Footer con logo Electrofrio */}
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            backgroundColor: 'var(--tecno-gray-very-light)',
            borderTop: '1px solid var(--tecno-gray-light)'
          }}>
            <img 
              src="/LogoElectrofrio.jpg" 
              alt="Repuestos Electrofrio" 
              style={{ 
                maxWidth: '160px', 
                width: '100%', 
                height: 'auto',
                borderRadius: '6px'
              }} 
            />
            <p style={{ 
              margin: '12px 0 0 0', 
              fontSize: '12px', 
              color: 'var(--tecno-gray-dark)',
              fontWeight: '500'
            }}>
              Repuestos Electrofrio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login; 