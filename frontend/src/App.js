import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Home from './Home';
import 'bootstrap/dist/css/bootstrap.min.css';
import RecuperarContrasena from './RecuperarContrasena';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Clientes from './Clientes';
import Vehiculos from './Vehiculos';
import Servicios from './Servicios';
import Estados from './Estados';
import Ordenes from './Ordenes';
import Usuarios from './Usuarios';
import Dashboard from './Dashboard';
import Reportes from './Reportes';
import OrdenPublica from './OrdenPublica';

function App() {
  const [usuario, setUsuario] = useState(() => {
    const user = localStorage.getItem('usuario');
    return user ? JSON.parse(user) : null;
  });

  const handleSetUsuario = (user) => {
    setUsuario(user);
    localStorage.setItem('usuario', JSON.stringify(user));
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setUsuario={handleSetUsuario} />} />
        <Route path="/home" element={usuario ? <Home usuario={usuario} onLogout={handleLogout} /> : <Navigate to="/" />} />
        <Route path="/clientes" element={usuario ? <Clientes /> : <Navigate to="/" />} />
        <Route path="/vehiculos" element={usuario ? <Vehiculos /> : <Navigate to="/" />} />
        <Route path="/servicios" element={usuario ? <Servicios /> : <Navigate to="/" />} />
        <Route path="/estados" element={usuario ? <Estados /> : <Navigate to="/" />} />
        <Route path="/ordenes" element={usuario ? <Ordenes /> : <Navigate to="/" />} />
        <Route path="/usuarios" element={usuario ? <Usuarios /> : <Navigate to="/" />} />
        <Route path="/dashboard" element={usuario ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/reportes" element={usuario ? <Reportes /> : <Navigate to="/" />} />
        <Route path="/orden/:token" element={<OrdenPublica />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
