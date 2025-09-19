import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';

// Mock de axios
jest.mock('axios');
const axios = require('axios');

// Mock de fetch
global.fetch = jest.fn();

// Wrapper para componentes que usan React Router
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de datos de estadísticas
    const mockEstadisticas = {
      totalOrdenes: 25,
      ordenesCompletadas: 20,
      ordenesEnProceso: 3,
      ordenesPendientes: 2,
      totalClientes: 15,
      totalVehiculos: 18,
      totalServicios: 5,
      ordenesPorMes: [
        { mes: 'Enero', cantidad: 5 },
        { mes: 'Febrero', cantidad: 8 },
        { mes: 'Marzo', cantidad: 12 }
      ],
      ordenesPorEstado: [
        { estado: 'Completado', cantidad: 20 },
        { estado: 'En Proceso', cantidad: 3 },
        { estado: 'Pendiente', cantidad: 2 }
      ],
      ordenesPorServicio: [
        { servicio: 'Mantenimiento', cantidad: 15 },
        { servicio: 'Reparación', cantidad: 8 },
        { servicio: 'Diagnóstico', cantidad: 2 }
      ]
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEstadisticas
    });
  });

  test('Debería renderizar el dashboard', async () => {
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('📊 Dashboard de Estadísticas')).toBeInTheDocument();
    });

    expect(screen.getByText('← Volver al Menú Principal')).toBeInTheDocument();
  });

  test('Debería mostrar tarjetas de estadísticas', async () => {
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Total de Órdenes')).toBeInTheDocument();
      expect(screen.getByText('Órdenes Completadas')).toBeInTheDocument();
      expect(screen.getByText('Órdenes en Proceso')).toBeInTheDocument();
      expect(screen.getByText('Órdenes Pendientes')).toBeInTheDocument();
      expect(screen.getByText('Total de Clientes')).toBeInTheDocument();
      expect(screen.getByText('Total de Vehículos')).toBeInTheDocument();
    });
  });

  test('Debería mostrar valores de estadísticas', async () => {
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // Total órdenes
      expect(screen.getByText('20')).toBeInTheDocument(); // Órdenes completadas
      expect(screen.getByText('3')).toBeInTheDocument();  // Órdenes en proceso
      expect(screen.getByText('2')).toBeInTheDocument();  // Órdenes pendientes
      expect(screen.getByText('15')).toBeInTheDocument(); // Total clientes
      expect(screen.getByText('18')).toBeInTheDocument(); // Total vehículos
    });
  });

  test('Debería mostrar gráficos', async () => {
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      // Verificar que los componentes de gráficos se renderizan
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  test('Debería mostrar títulos de gráficos', async () => {
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Órdenes por Mes')).toBeInTheDocument();
      expect(screen.getByText('Órdenes por Estado')).toBeInTheDocument();
      expect(screen.getByText('Órdenes por Servicio')).toBeInTheDocument();
    });
  });

  test('Debería manejar errores de carga de datos', async () => {
    // Mock de error
    global.fetch.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      // Debería mostrar valores por defecto o mensaje de error
      expect(screen.getByText('📊 Dashboard de Estadísticas')).toBeInTheDocument();
    });
  });

  test('Debería mostrar botón de volver al menú', async () => {
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      const volverButton = screen.getByText('← Volver al Menú Principal');
      expect(volverButton).toBeInTheDocument();
      expect(volverButton.closest('button')).toHaveClass('btn-tecno-outline');
    });
  });

  test('Debería tener estructura responsive', async () => {
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      // Verificar que los contenedores tienen clases de Bootstrap
      const container = screen.getByText('📊 Dashboard de Estadísticas').closest('div');
      expect(container).toHaveClass('container-fluid');
    });
  });

  test('Debería mostrar porcentajes de completado', async () => {
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      // Verificar que se muestran porcentajes (80% de 25 órdenes completadas)
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });
});


