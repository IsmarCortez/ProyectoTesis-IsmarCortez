import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
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
          <div className="card-tecno-header" style={{
            background: 'linear-gradient(135deg, var(--tecno-orange), var(--tecno-orange-light))',
            color: 'var(--tecno-white)',
            textAlign: 'center',
            padding: '2rem',
            borderRadius: '12px 12px 0 0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              animation: 'float 6s ease-in-out infinite'
            }} />
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.8rem', 
              fontWeight: '700',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              position: 'relative',
              zIndex: 2
            }}>
              🔐 Recuperar Contraseña
            </h2>
            <p style={{ 
              margin: '0.5rem 0 0 0', 
              fontSize: '0.95rem', 
              opacity: 0.9,
              position: 'relative',
              zIndex: 2
            }}>
              Ingresa tu email para recibir un enlace de recuperación
            </p>
          </div>

          {/* Body del formulario */}
          <div className="card-tecno-body" style={{ padding: '2rem' }}>
            {message && (
              <div className="alert alert-success" style={{
                background: 'linear-gradient(135deg, #d4edda, #c3e6cb)',
                border: '1px solid #c3e6cb',
                color: '#155724',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.9rem'
              }}>
                <strong>✅ {message}</strong>
              </div>
            )}

            {error && (
              <div className="alert alert-danger" style={{
                background: 'linear-gradient(135deg, #f8d7da, #f5c6cb)',
                border: '1px solid #f5c6cb',
                color: '#721c24',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.9rem'
              }}>
                <strong>❌ {error}</strong>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label" style={{
                  color: 'var(--tecno-black)',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  fontSize: '0.95rem'
                }}>
                  📧 Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    border: '2px solid var(--tecno-gray-light)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '16px',
                    transition: 'all var(--transition-fast)',
                    background: 'var(--tecno-white)',
                    color: 'var(--tecno-black)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--tecno-orange)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(230, 57, 70, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--tecno-gray-light)';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Ingresa tu email"
                />
              </div>

              <div className="d-grid gap-2">
                <button
                  type="submit"
                  className="btn-tecno"
                  disabled={loading}
                  style={{
                    background: loading ? 'var(--tecno-gray)' : 'linear-gradient(135deg, var(--tecno-orange), var(--tecno-orange-light))',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--tecno-white)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all var(--transition-fast)',
                    boxShadow: '0 4px 15px rgba(230, 57, 70, 0.3)',
                    opacity: loading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(230, 57, 70, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(230, 57, 70, 0.3)';
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Enviando...
                    </>
                  ) : (
                    '📧 Enviar Enlace de Recuperación'
                  )}
                </button>
              </div>
            </form>

            {/* Enlaces de navegación */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--tecno-gray-light)'
            }}>
              <p style={{ 
                margin: '0 0 1rem 0', 
                color: 'var(--tecno-gray-dark)',
                fontSize: '0.9rem'
              }}>
                ¿Recordaste tu contraseña?
              </p>
              <button
                onClick={() => navigate('/')}
                className="btn btn-link"
                style={{
                  color: 'var(--tecno-orange)',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  transition: 'all var(--transition-fast)',
                  background: 'transparent',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(230, 57, 70, 0.1)';
                  e.target.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.textDecoration = 'none';
                }}
              >
                ← Volver al Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animación CSS */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
}

export default ForgotPassword;
