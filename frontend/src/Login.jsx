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
      justifyContent: 'center'
    }}>
      <div className="container d-flex align-items-center justify-content-center min-vh-100">
        <div className="card p-4 shadow" style={{ maxWidth: 400, width: '100%' }}>
          <div className="text-center mb-3">
            <img src="/LogoTecnoAuto.jpg" alt="Tecno Auto" style={{ maxWidth: '200px', width: '100%', height: 'auto' }} />
          </div>
          <h2 className="mb-4 text-center">Iniciar Sesión</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Correo electrónico</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Contraseña</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <button type="submit" className="btn btn-primary w-100">Entrar</button>
          </form>
          <div className="mt-3 text-center">
            <button className="btn btn-link" onClick={() => navigate('/recuperar-contrasena')}>
              Olvidé mi contraseña
            </button>
          </div>
          <div className="text-center mt-4">
            <img src="/LogoElectrofrio.jpg" alt="Repuestos Electrofrio" style={{ maxWidth: '180px', width: '100%', height: 'auto' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login; 