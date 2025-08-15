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
  const [verificarDPI, setVerificarDPI] = useState('');
  const [verificacion, setVerificacion] = useState(null);

  // Cargar clientes al iniciar
  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/clientes');
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
        await axios.put(`http://localhost:4000/api/clientes/${editId}`, form);
        setMensaje('Cliente actualizado exitosamente.');
      } else {
        // Crear cliente
        await axios.post('http://localhost:4000/api/clientes', form);
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
      await axios.delete(`http://localhost:4000/api/clientes/${id}`);
      setMensaje('Cliente eliminado correctamente.');
      fetchClientes();
    } catch (err) {
      setError('Error al eliminar el cliente.');
    }
  };

  const handleVerificarDPI = async () => {
    setVerificacion(null);
    setError('');
    if (!verificarDPI) {
      setError('Ingresa un DPI para verificar.');
      return;
    }
    try {
      const res = await axios.get(`http://localhost:4000/api/clientes/dpi/${verificarDPI}`);
      setVerificacion(res.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setVerificacion('No existe un cliente con ese DPI.');
      } else {
        setError('Error al verificar el DPI.');
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
    <div className="container mt-5" style={{ maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Clientes</h2>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/home')}
        >
          ← Regresar al Menú Principal
        </button>
      </div>
      <div className="row">
        <div className="col-md-5">
          <div className="mb-4">
            <h5>Verificar cliente por DPI</h5>
            <div className="input-group mb-2">
              <input type="text" className="form-control" placeholder="DPI a verificar" value={verificarDPI} onChange={e => setVerificarDPI(e.target.value)} />
              <button className="btn btn-info" type="button" onClick={handleVerificarDPI}>Verificar</button>
            </div>
            {verificacion && (
              typeof verificacion === 'string' ?
                <div className="alert alert-warning p-2">{verificacion}</div> :
                <div className="alert alert-success p-2">Cliente: {verificacion.nombre_cliente} ({verificacion.dpi_cliente})</div>
            )}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Nombre</label>
              <input type="text" className="form-control" name="nombre_cliente" value={form.nombre_cliente} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Apellido</label>
              <input type="text" className="form-control" name="apellido_cliente" value={form.apellido_cliente} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">DPI</label>
              <input type="text" className="form-control" name="dpi_cliente" value={form.dpi_cliente} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">NIT</label>
              <input type="text" className="form-control" name="NIT" value={form.NIT} onChange={handleChange} />
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
            {error && <div className="alert alert-danger p-2">{error}</div>}
            {mensaje && <div className="alert alert-success p-2">{mensaje}</div>}
            <button type="submit" className={`btn w-100 ${editId ? 'btn-warning' : 'btn-primary'}`} disabled={loading}>
              {loading ? (editId ? 'Actualizando...' : 'Guardando...') : (editId ? 'Actualizar Cliente' : 'Registrar Cliente')}
            </button>
            {editId && (
              <button type="button" className="btn btn-secondary w-100 mt-2" onClick={handleCancelEdit}>
                Cancelar edición
              </button>
            )}
          </form>
          <div className={`p-2 mt-2 ${editId ? 'bg-warning-subtle border border-warning' : ''}`} style={{ borderRadius: 6 }}>
            {editId && (
              <span className="text-warning fw-bold">Modo edición activado</span>
            )}
          </div>
        </div>
        <div className="col-md-7">
          <h5>Lista de clientes</h5>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table className="table table-bordered table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>DPI</th>
                  <th>NIT</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Dirección</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan="9" className="text-center">No hay clientes registrados.</td></tr>
                ) : (
                  clientes.map((cliente, idx) => (
                    <tr key={cliente.PK_id_cliente || idx}>
                      <td>{cliente.PK_id_cliente}</td>
                      <td>{cliente.nombre_cliente}</td>
                      <td>{cliente.apellido_cliente}</td>
                      <td>{cliente.dpi_cliente}</td>
                      <td>{cliente.NIT}</td>
                      <td>{cliente.telefono_cliente}</td>
                      <td>{cliente.correo_cliente}</td>
                      <td>{cliente.direccion_cliente}</td>
                      <td>
                        <button className="btn btn-sm btn-warning me-2" onClick={() => {console.log('Editar cliente:', cliente); handleEdit(cliente);}}>Editar</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cliente.PK_id_cliente)}>Eliminar</button>
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
  );
}

export default Clientes; 