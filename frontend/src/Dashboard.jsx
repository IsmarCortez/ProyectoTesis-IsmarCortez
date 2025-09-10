import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes');

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar si hay token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      console.log('Intentando cargar estadísticas...');
      const response = await axios.get('http://localhost:4000/api/dashboard/estadisticas', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // 10 segundos de timeout
      });
      
      console.log('Estadísticas cargadas:', response.data);
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      
      // Crear datos de ejemplo si hay error
      const datosEjemplo = {
        vehiculos_mas_ingresados: [
          { modelo_completo: 'Toyota Corolla', cantidad_ordenes: 15 },
          { modelo_completo: 'Honda Civic', cantidad_ordenes: 12 },
          { modelo_completo: 'Nissan Sentra', cantidad_ordenes: 8 },
          { modelo_completo: 'Ford Focus', cantidad_ordenes: 6 },
          { modelo_completo: 'Chevrolet Aveo', cantidad_ordenes: 5 }
        ],
        clientes_por_mes: [
          { mes: '2024-01', cantidad_clientes: 25, cantidad_ordenes: 30 },
          { mes: '2024-02', cantidad_clientes: 28, cantidad_ordenes: 35 },
          { mes: '2024-03', cantidad_clientes: 32, cantidad_ordenes: 40 },
          { mes: '2024-04', cantidad_clientes: 30, cantidad_ordenes: 38 },
          { mes: '2024-05', cantidad_clientes: 35, cantidad_ordenes: 42 },
          { mes: '2024-06', cantidad_clientes: 38, cantidad_ordenes: 45 }
        ],
        servicios_mas_solicitados: [
          { servicio: 'Cambio de Aceite', cantidad_ordenes: 45, porcentaje: 35.5 },
          { servicio: 'Frenos', cantidad_ordenes: 30, porcentaje: 23.6 },
          { servicio: 'Suspensión', cantidad_ordenes: 25, porcentaje: 19.7 },
          { servicio: 'Motor', cantidad_ordenes: 20, porcentaje: 15.7 },
          { servicio: 'Transmisión', cantidad_ordenes: 7, porcentaje: 5.5 }
        ],
        estados_ordenes: [
          { estado_orden: 'Completado', cantidad_ordenes: 80, porcentaje: 60.0 },
          { estado_orden: 'En Proceso', cantidad_ordenes: 35, porcentaje: 26.3 },
          { estado_orden: 'Pendiente', cantidad_ordenes: 18, porcentaje: 13.5 }
        ],
        ordenes_por_mes: [
          { mes: '2024-01', cantidad_ordenes: 30 },
          { mes: '2024-02', cantidad_ordenes: 35 },
          { mes: '2024-03', cantidad_ordenes: 40 },
          { mes: '2024-04', cantidad_ordenes: 38 },
          { mes: '2024-05', cantidad_ordenes: 42 },
          { mes: '2024-06', cantidad_ordenes: 45 }
        ],
        estadisticas_generales: {
          total_clientes: 150,
          total_vehiculos: 120,
          total_ordenes: 133,
          ordenes_mes_actual: 45,
          ordenes_completadas: 80,
          ordenes_pendientes: 18
        },
        marcas_populares: [
          { marca_vehiculo: 'Toyota', cantidad_vehiculos: 25, cantidad_ordenes: 35 },
          { marca_vehiculo: 'Honda', cantidad_vehiculos: 20, cantidad_ordenes: 28 },
          { marca_vehiculo: 'Nissan', cantidad_vehiculos: 18, cantidad_ordenes: 22 },
          { marca_vehiculo: 'Ford', cantidad_vehiculos: 15, cantidad_ordenes: 18 },
          { marca_vehiculo: 'Chevrolet', cantidad_vehiculos: 12, cantidad_ordenes: 15 }
        ],
        ingresos_por_mes: [
          { mes: '2024-01', cantidad_ordenes: 25, ingresos_estimados: 12500 },
          { mes: '2024-02', cantidad_ordenes: 30, ingresos_estimados: 15000 },
          { mes: '2024-03', cantidad_ordenes: 35, ingresos_estimados: 17500 },
          { mes: '2024-04', cantidad_ordenes: 32, ingresos_estimados: 16000 },
          { mes: '2024-05', cantidad_ordenes: 38, ingresos_estimados: 19000 },
          { mes: '2024-06', cantidad_ordenes: 40, ingresos_estimados: 20000 }
        ]
      };
      
      setEstadisticas(datosEjemplo);
      setError(`Error de conexión: ${error.message}. Mostrando datos de ejemplo.`);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticasPeriodo = async (periodo) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/api/dashboard/estadisticas/${periodo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPeriodoSeleccionado(periodo);
      setError(null);
    } catch (error) {
      console.error('Error cargando estadísticas del período:', error);
      setError('Error al cargar las estadísticas del período');
    } finally {
      setLoading(false);
    }
  };

  // Configuración de colores para los gráficos con paleta Tecno Auto
  const colores = {
    primario: '#F26522', // Naranja Tecno Auto
    secundario: '#28a745',
    advertencia: '#ffc107',
    peligro: '#dc3545',
    info: '#17a2b8',
    oscuro: '#6E6E6E', // Gris oscuro Tecno Auto
    colores: ['#F26522', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6E6E6E', '#FF7A3D', '#20c997']
  };

  // Gráfico de vehículos más ingresados
  const datosVehiculos = estadisticas ? {
    labels: estadisticas.vehiculos_mas_ingresados.map(v => v.modelo_completo),
    datasets: [{
      label: 'Cantidad de Órdenes',
      data: estadisticas.vehiculos_mas_ingresados.map(v => v.cantidad_ordenes),
      backgroundColor: colores.colores.slice(0, estadisticas.vehiculos_mas_ingresados.length),
      borderColor: colores.colores.slice(0, estadisticas.vehiculos_mas_ingresados.length),
      borderWidth: 1
    }]
  } : null;

  // Gráfico de servicios más solicitados
  const datosServicios = estadisticas ? {
    labels: estadisticas.servicios_mas_solicitados.map(s => s.servicio),
    datasets: [{
      data: estadisticas.servicios_mas_solicitados.map(s => s.cantidad_ordenes),
      backgroundColor: colores.colores,
      borderColor: colores.colores,
      borderWidth: 2
    }]
  } : null;

  // Gráfico de estados de órdenes
  const datosEstados = estadisticas ? {
    labels: estadisticas.estados_ordenes.map(e => e.estado_orden),
    datasets: [{
      data: estadisticas.estados_ordenes.map(e => e.cantidad_ordenes),
      backgroundColor: [colores.primario, colores.advertencia, colores.secundario, colores.peligro],
      borderColor: [colores.primario, colores.advertencia, colores.secundario, colores.peligro],
      borderWidth: 2
    }]
  } : null;

  // Gráfico de órdenes por mes
  const datosOrdenesMes = estadisticas ? {
    labels: estadisticas.ordenes_por_mes.map(o => {
      const fecha = new Date(o.mes + '-01');
      return fecha.toLocaleDateString('es-GT', { month: 'short', year: 'numeric' });
    }),
    datasets: [{
      label: 'Órdenes',
      data: estadisticas.ordenes_por_mes.map(o => o.cantidad_ordenes),
      borderColor: colores.primario,
      backgroundColor: colores.primario + '20',
      tension: 0.4,
      fill: true
    }]
  } : null;

  // Gráfico de clientes por mes
  const datosClientesMes = estadisticas ? {
    labels: estadisticas.clientes_por_mes.map(c => {
      const fecha = new Date(c.mes + '-01');
      return fecha.toLocaleDateString('es-GT', { month: 'short', year: 'numeric' });
    }),
    datasets: [{
      label: 'Clientes Únicos',
      data: estadisticas.clientes_por_mes.map(c => c.cantidad_clientes),
      borderColor: colores.secundario,
      backgroundColor: colores.secundario + '20',
      tension: 0.4,
      fill: true
    }]
  } : null;

  // Gráfico de marcas populares
  const datosMarcas = estadisticas ? {
    labels: estadisticas.marcas_populares.map(m => m.marca_vehiculo),
    datasets: [{
      label: 'Cantidad de Órdenes',
      data: estadisticas.marcas_populares.map(m => m.cantidad_ordenes),
      backgroundColor: colores.colores.slice(0, estadisticas.marcas_populares.length),
      borderColor: colores.colores.slice(0, estadisticas.marcas_populares.length),
      borderWidth: 1
    }]
  } : null;

  // Gráfico de ingresos por mes
  const datosIngresos = estadisticas ? {
    labels: estadisticas.ingresos_por_mes.map(i => {
      const fecha = new Date(i.mes + '-01');
      return fecha.toLocaleDateString('es-GT', { month: 'short', year: 'numeric' });
    }),
    datasets: [{
      label: 'Ingresos Estimados (Q)',
      data: estadisticas.ingresos_por_mes.map(i => i.ingresos_estimados),
      borderColor: colores.advertencia,
      backgroundColor: colores.advertencia + '20',
      tension: 0.4,
      fill: true
    }]
  } : null;

  const opcionesGenerales = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const opcionesDona = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

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
                Cargando estadísticas del dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, var(--tecno-gray-very-light) 0%, var(--tecno-white) 100%)',
        paddingTop: '90px'
      }}>
        <div className="container">
          <div className="alert-tecno alert-tecno-warning" role="alert">
            No se pudieron cargar las estadísticas.
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
      <div className="container-fluid">
        {/* Header del Dashboard */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
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
                  📊 Dashboard de Estadísticas
                </h1>
                <p style={{ 
                  color: 'var(--tecno-gray-dark)', 
                  fontSize: '1.1rem',
                  marginBottom: '0'
                }}>
                  Resumen general del taller mecánico Tecno Auto
                </p>
                {error && (
                  <div className="alert-tecno alert-tecno-warning" style={{ marginTop: '16px' }}>
                    <small>{error}</small>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button className="btn-tecno" onClick={cargarEstadisticas}>
                  🔄 Actualizar
                </button>
                <button className="btn-tecno-secondary" onClick={() => window.open('/reportes', '_blank')}>
                  📊 Generar Reportes
                </button>
                <button className="btn-tecno-outline" onClick={() => window.open('/tracker', '_blank')}>
                  🔍 Tracker Público
                </button>
                <button className="btn-tecno-outline" onClick={() => window.history.back()}>
                  ← Volver al Menú
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas de estadísticas generales */}
        <div className="row mb-4">
          <div className="col-xl-3 col-md-6 mb-4">
            <div className="card-tecno h-100">
              <div className="card-tecno-header">
                👥 Total Clientes
              </div>
              <div className="card-tecno-body text-center">
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: '700', 
                  color: 'var(--tecno-orange)',
                  marginBottom: '8px'
                }}>
                  {estadisticas.estadisticas_generales.total_clientes}
                </div>
                <p style={{ 
                  color: 'var(--tecno-gray-dark)', 
                  margin: '0',
                  fontSize: '14px'
                }}>
                  Clientes registrados
                </p>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 mb-4">
            <div className="card-tecno h-100">
              <div className="card-tecno-header">
                🚗 Total Vehículos
              </div>
              <div className="card-tecno-body text-center">
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: '700', 
                  color: 'var(--success)',
                  marginBottom: '8px'
                }}>
                  {estadisticas.estadisticas_generales.total_vehiculos}
                </div>
                <p style={{ 
                  color: 'var(--tecno-gray-dark)', 
                  margin: '0',
                  fontSize: '14px'
                }}>
                  Vehículos registrados
                </p>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 mb-4">
            <div className="card-tecno h-100">
              <div className="card-tecno-header">
                📋 Total Órdenes
              </div>
              <div className="card-tecno-body text-center">
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: '700', 
                  color: 'var(--info)',
                  marginBottom: '8px'
                }}>
                  {estadisticas.estadisticas_generales.total_ordenes}
                </div>
                <p style={{ 
                  color: 'var(--tecno-gray-dark)', 
                  margin: '0',
                  fontSize: '14px'
                }}>
                  Órdenes totales
                </p>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 mb-4">
            <div className="card-tecno h-100">
              <div className="card-tecno-header">
                📅 Órdenes Este Mes
              </div>
              <div className="card-tecno-body text-center">
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: '700', 
                  color: 'var(--warning)',
                  marginBottom: '8px'
                }}>
                  {estadisticas.estadisticas_generales.ordenes_mes_actual}
                </div>
                <p style={{ 
                  color: 'var(--tecno-gray-dark)', 
                  margin: '0',
                  fontSize: '14px'
                }}>
                  Órdenes del mes actual
                </p>
              </div>
            </div>
          </div>
      </div>

        {/* Tarjetas de estado de órdenes */}
        <div className="row mb-4">
          <div className="col-xl-4 col-md-6 mb-4">
            <div className="card-tecno h-100">
              <div className="card-tecno-header">
                ✅ Órdenes Completadas
              </div>
              <div className="card-tecno-body text-center">
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: '700', 
                  color: 'var(--success)',
                  marginBottom: '8px'
                }}>
                  {estadisticas.estadisticas_generales.ordenes_completadas}
                </div>
                <p style={{ 
                  color: 'var(--tecno-gray-dark)', 
                  margin: '0',
                  fontSize: '14px'
                }}>
                  Órdenes finalizadas
                </p>
              </div>
            </div>
          </div>

          <div className="col-xl-4 col-md-6 mb-4">
            <div className="card-tecno h-100">
              <div className="card-tecno-header">
                ⏳ Órdenes Pendientes
              </div>
              <div className="card-tecno-body text-center">
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: '700', 
                  color: 'var(--warning)',
                  marginBottom: '8px'
                }}>
                  {estadisticas.estadisticas_generales.ordenes_pendientes}
                </div>
                <p style={{ 
                  color: 'var(--tecno-gray-dark)', 
                  margin: '0',
                  fontSize: '14px'
                }}>
                  Órdenes en espera
                </p>
              </div>
            </div>
          </div>

          <div className="col-xl-4 col-md-6 mb-4">
            <div className="card-tecno h-100">
              <div className="card-tecno-header">
                📊 Tasa de Completado
              </div>
              <div className="card-tecno-body text-center">
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: '700', 
                  color: 'var(--info)',
                  marginBottom: '8px'
                }}>
                  {estadisticas.estadisticas_generales.total_ordenes > 0 
                    ? Math.round((estadisticas.estadisticas_generales.ordenes_completadas / estadisticas.estadisticas_generales.total_ordenes) * 100)
                    : 0}%
                </div>
                <p style={{ 
                  color: 'var(--tecno-gray-dark)', 
                  margin: '0',
                  fontSize: '14px'
                }}>
                  Eficiencia del taller
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos principales */}
        <div className="row mb-4">
          {/* Gráfico de vehículos más ingresados */}
          <div className="col-xl-6 col-lg-12 mb-4">
            <div className="card-tecno">
              <div className="card-tecno-header">
                🚗 Vehículos Más Ingresados
              </div>
              <div className="card-tecno-body">
                <div style={{ height: '300px' }}>
                  {datosVehiculos && (
                    <Bar data={datosVehiculos} options={opcionesGenerales} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de servicios más solicitados */}
          <div className="col-xl-6 col-lg-12 mb-4">
            <div className="card-tecno">
              <div className="card-tecno-header">
                🔧 Servicios Más Solicitados
              </div>
              <div className="card-tecno-body">
                <div style={{ height: '300px' }}>
                  {datosServicios && (
                    <Doughnut data={datosServicios} options={opcionesDona} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          {/* Gráfico de estados de órdenes */}
          <div className="col-xl-6 col-lg-12 mb-4">
            <div className="card-tecno">
              <div className="card-tecno-header">
                📊 Estados de Órdenes
              </div>
              <div className="card-tecno-body">
                <div style={{ height: '300px' }}>
                  {datosEstados && (
                    <Doughnut data={datosEstados} options={opcionesDona} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de marcas populares */}
          <div className="col-xl-6 col-lg-12 mb-4">
            <div className="card-tecno">
              <div className="card-tecno-header">
                🏆 Marcas Más Populares
              </div>
              <div className="card-tecno-body">
                <div style={{ height: '300px' }}>
                  {datosMarcas && (
                    <Bar data={datosMarcas} options={opcionesGenerales} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos de tendencias temporales */}
        <div className="row mb-4">
          {/* Gráfico de órdenes por mes */}
          <div className="col-xl-6 col-lg-12 mb-4">
            <div className="card-tecno">
              <div className="card-tecno-header">
                📈 Órdenes por Mes
              </div>
              <div className="card-tecno-body">
                <div style={{ height: '300px' }}>
                  {datosOrdenesMes && (
                    <Line data={datosOrdenesMes} options={opcionesGenerales} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de clientes por mes */}
          <div className="col-xl-6 col-lg-12 mb-4">
            <div className="card-tecno">
              <div className="card-tecno-header">
                👥 Clientes por Mes
              </div>
              <div className="card-tecno-body">
                <div style={{ height: '300px' }}>
                  {datosClientesMes && (
                    <Line data={datosClientesMes} options={opcionesGenerales} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de ingresos */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card-tecno">
              <div className="card-tecno-header">
                💰 Ingresos Estimados por Mes
              </div>
              <div className="card-tecno-body">
                <p style={{ 
                  color: 'var(--tecno-gray-dark)', 
                  fontSize: '14px',
                  marginBottom: '16px',
                  fontStyle: 'italic'
                }}>
                  *Basado en órdenes completadas (estimación: Q500 por orden)
                </p>
                <div style={{ height: '300px' }}>
                  {datosIngresos && (
                    <Line data={datosIngresos} options={opcionesGenerales} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de resumen de servicios */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card-tecno">
              <div className="card-tecno-header">
                📋 Resumen Detallado de Servicios
              </div>
              <div className="card-tecno-body">
                <div className="table-responsive">
                  <table className="table table-bordered" style={{ marginBottom: '0' }}>
                    <thead style={{ backgroundColor: 'var(--tecno-gray-very-light)' }}>
                      <tr>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600'
                        }}>
                          Servicio
                        </th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600'
                        }}>
                          Cantidad de Órdenes
                        </th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600'
                        }}>
                          Porcentaje
                        </th>
                        <th style={{ 
                          borderColor: 'var(--tecno-gray-light)',
                          color: 'var(--tecno-black)',
                          fontWeight: '600'
                        }}>
                          Barra de Progreso
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {estadisticas.servicios_mas_solicitados.map((servicio, index) => (
                        <tr key={index}>
                          <td style={{ 
                            borderColor: 'var(--tecno-gray-light)',
                            color: 'var(--tecno-black)'
                          }}>
                            {servicio.servicio}
                          </td>
                          <td style={{ 
                            borderColor: 'var(--tecno-gray-light)',
                            color: 'var(--tecno-black)',
                            fontWeight: '600'
                          }}>
                            {servicio.cantidad_ordenes}
                          </td>
                          <td style={{ 
                            borderColor: 'var(--tecno-gray-light)',
                            color: 'var(--tecno-orange)',
                            fontWeight: '600'
                          }}>
                            {servicio.porcentaje}%
                          </td>
                          <td style={{ borderColor: 'var(--tecno-gray-light)' }}>
                            <div className="progress" style={{ height: '20px' }}>
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{ 
                                  width: `${servicio.porcentaje}%`,
                                  backgroundColor: colores.colores[index % colores.colores.length],
                                  borderRadius: '4px'
                                }}
                                aria-valuenow={servicio.porcentaje}
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              >
                                {servicio.porcentaje}%
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;