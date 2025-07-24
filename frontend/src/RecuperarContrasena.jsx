import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function RecuperarContrasena() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mascota, setMascota] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!mascota) {
      setError('Debe responder la pregunta de seguridad.');
      return;
    }
    try {
      const res = await axios.post('http://localhost:4000/api/recuperar-contrasena', {
        email,
        password,
        confirmPassword,
        mascota
      });
      setMensaje(res.data.message);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setMascota('');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al intentar restablecer la contraseña.');
      }
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="card p-4 shadow" style={{ maxWidth: 400, width: '100%' }}>
        <h2 className="mb-4 text-center">Recuperar Contraseña</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Correo electrónico</label>
            <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Primera mascota</label>
            <input type="text" className="form-control" value={mascota} onChange={e => setMascota(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Nueva contraseña</label>
            <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Confirmar nueva contraseña</label>
            <input type="password" className="form-control" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          {mensaje && <div className="alert alert-success">{mensaje}</div>}
          <button type="submit" className="btn btn-primary w-100">Restablecer contraseña</button>
        </form>
        <div className="mt-3 text-center">
          <button className="btn btn-link" onClick={() => navigate('/')}>Volver al login</button>
        </div>
      </div>
    </div>
  );
}

export default RecuperarContrasena; 