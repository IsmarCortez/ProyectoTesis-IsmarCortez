import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Ordenes from '../Ordenes';

// Mock de axios
jest.mock('axios');
const axios = require('axios');

// Mock de fetch
global.fetch = jest.fn();

// Wrapper para componentes que usan React Router
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Ordenes Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de datos de prueba
    const mockServicios = [
      { pk_id_servicio: 1, servicio: 'Mantenimiento', descripcion_servicios: 'Mantenimiento general' },
      { pk_id_servicio: 2, servicio: 'Reparación', descripcion_servicios: 'Reparación de fallas' }
    ];

    const mockEstados = [
      { pk_id_estado: 1, estado_orden: 'Recibido', descripcion_estado: 'Orden recibida' },
      { pk_id_estado: 2, estado_orden: 'En Proceso', descripcion_estado: 'En proceso' }
    ];

    const mockOrdenes = [
      {
        pk_id_orden: 1,
        NIT: '123456789',
        nombre_cliente: 'Juan',
        apellido_cliente: 'Pérez',
        placa_vehiculo: 'ABC123',
        servicio: 'Mantenimiento',
        estado_orden: 'Recibido',
        estado_vehiculo: 'Bueno',
        fecha_ingreso_orden: '2024-01-15'
      }
    ];

    // Mock de fetch para cargar datos
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrdenes
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockServicios
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEstados
      });
  });

  test('Debería renderizar el formulario de órdenes', async () => {
    render(
      <RouterWrapper>
        <Ordenes />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Administra las órdenes de servicio del taller')).toBeInTheDocument();
    });

    expect(screen.getByText('➕ Nueva Orden')).toBeInTheDocument();
    expect(screen.getByLabelText(/nit del cliente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/placa del vehículo/i)).toBeInTheDocument();
  });

  test('Debería mostrar campos requeridos', async () => {
    render(
      <RouterWrapper>
        <Ordenes />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/nit del cliente/i)).toBeRequired();
      expect(screen.getByLabelText(/placa del vehículo/i)).toBeRequired();
      expect(screen.getByLabelText(/servicio/i)).toBeRequired();
      expect(screen.getByLabelText(/estado de la orden/i)).toBeRequired();
    });
  });

  test('Debería permitir escribir en el campo NIT', async () => {
    render(
      <RouterWrapper>
        <Ordenes />
      </RouterWrapper>
    );

    await waitFor(() => {
      const nitInput = screen.getByLabelText(/nit del cliente/i);
      fireEvent.change(nitInput, { target: { value: '123456789' } });
      expect(nitInput.value).toBe('123456789');
    });
  });

  test('Debería mostrar placeholder para Consumidor Final', async () => {
    render(
      <RouterWrapper>
        <Ordenes />
      </RouterWrapper>
    );

    await waitFor(() => {
      const nitInput = screen.getByLabelText(/nit del cliente/i);
      expect(nitInput).toHaveAttribute('placeholder', "Ingrese NIT del cliente o 'CF' para Consumidor Final");
    });
  });

  test('Debería buscar cliente por NIT', async () => {
    const mockCliente = {
      PK_id_cliente: 1,
      nombre_cliente: 'Juan',
      apellido_cliente: 'Pérez',
      NIT: '123456789'
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCliente
    });

    render(
      <RouterWrapper>
        <Ordenes />
      </RouterWrapper>
    );

    await waitFor(() => {
      const nitInput = screen.getByLabelText(/nit del cliente/i);
      fireEvent.change(nitInput, { target: { value: '123456789' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/cliente: juan pérez/i)).toBeInTheDocument();
    });
  });

  test('Debería manejar Consumidor Final (CF)', async () => {
    render(
      <RouterWrapper>
        <Ordenes />
      </RouterWrapper>
    );

    await waitFor(() => {
      const nitInput = screen.getByLabelText(/nit del cliente/i);
      fireEvent.change(nitInput, { target: { value: 'CF' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/cliente: consumidor final/i)).toBeInTheDocument();
    });
  });

  test('Debería mostrar tabla de órdenes', async () => {
    render(
      <RouterWrapper>
        <Ordenes />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('NIT')).toBeInTheDocument();
      expect(screen.getByText('Cliente')).toBeInTheDocument();
      expect(screen.getByText('Vehículo')).toBeInTheDocument();
      expect(screen.getByText('Servicio')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();
    });
  });

  test('Debería mostrar datos de órdenes en la tabla', async () => {
    render(
      <RouterWrapper>
        <Ordenes />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('123456789')).toBeInTheDocument();
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('ABC123')).toBeInTheDocument();
      expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
      expect(screen.getByText('Recibido')).toBeInTheDocument();
    });
  });

  test('Debería mostrar botones de acción en la tabla', async () => {
    render(
      <RouterWrapper>
        <Ordenes />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('✏️')).toBeInTheDocument();
      expect(screen.getByText('🗑️')).toBeInTheDocument();
      expect(screen.getByText('👁️')).toBeInTheDocument();
      expect(screen.getByText('🖨️')).toBeInTheDocument();
    });
  });

  test('Debería validar campos requeridos al enviar', async () => {
    render(
      <RouterWrapper>
        <Ordenes />
      </RouterWrapper>
    );

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /guardar orden/i });
      fireEvent.click(submitButton);
    });

    // Debería mostrar alerta de campos requeridos
    await waitFor(() => {
      expect(screen.getByText(/complete todos los campos requeridos/i)).toBeInTheDocument();
    });
  });

  test('Debería mostrar campo de estado del vehículo', async () => {
    render(
      <RouterWrapper>
        <Ordenes />
      </RouterWrapper>
    );

    await waitFor(() => {
      const estadoVehiculoField = screen.getByLabelText(/estado del vehículo/i);
      expect(estadoVehiculoField).toBeInTheDocument();
      expect(estadoVehiculoField.tagName).toBe('TEXTAREA');
      expect(estadoVehiculoField).toHaveAttribute('maxLength', '200');
    });
  });

  test('Debería permitir escribir en el campo estado del vehículo', async () => {
    render(
      <RouterWrapper>
        <Ordenes />
      </RouterWrapper>
    );

    await waitFor(() => {
      const estadoVehiculoField = screen.getByLabelText(/estado del vehículo/i);
      fireEvent.change(estadoVehiculoField, { target: { value: 'Vehículo en buen estado' } });
      expect(estadoVehiculoField.value).toBe('Vehículo en buen estado');
    });
  });
});


