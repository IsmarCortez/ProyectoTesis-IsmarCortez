import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Clientes from '../Clientes';

// Mock de axios
jest.mock('axios');
const axios = require('axios');

// Mock de fetch
global.fetch = jest.fn();

// Wrapper para componentes que usan React Router
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Clientes Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de datos de clientes
    const mockClientes = [
      {
        PK_id_cliente: 1,
        nombre_cliente: 'Juan',
        apellido_cliente: 'Pérez',
        NIT: '123456789',
        telefono_cliente: '12345678',
        correo_cliente: 'juan@test.com'
      },
      {
        PK_id_cliente: 2,
        nombre_cliente: 'María',
        apellido_cliente: 'González',
        NIT: '987654321',
        telefono_cliente: '87654321',
        correo_cliente: 'maria@test.com'
      }
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockClientes
    });
  });

  test('Debería renderizar el formulario de clientes', async () => {
    render(
      <RouterWrapper>
        <Clientes />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Administra los clientes del taller')).toBeInTheDocument();
    });

    expect(screen.getByText('➕ Nuevo Cliente')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nit/i)).toBeInTheDocument();
  });

  test('Debería mostrar campos requeridos', async () => {
    render(
      <RouterWrapper>
        <Clientes />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre \*/i)).toBeRequired();
      expect(screen.getByLabelText(/apellido \*/i)).toBeRequired();
      expect(screen.getByLabelText(/nit \*/i)).toBeRequired();
    });
  });

  test('Debería mostrar campo DPI como opcional', async () => {
    render(
      <RouterWrapper>
        <Clientes />
      </RouterWrapper>
    );

    await waitFor(() => {
      const dpiField = screen.getByLabelText(/dpi/i);
      expect(dpiField).not.toBeRequired();
      expect(dpiField).toHaveAttribute('placeholder', 'Máximo 13 caracteres (opcional)');
    });
  });

  test('Debería limitar NIT a 9 caracteres', async () => {
    render(
      <RouterWrapper>
        <Clientes />
      </RouterWrapper>
    );

    await waitFor(() => {
      const nitField = screen.getByLabelText(/nit \*/i);
      expect(nitField).toHaveAttribute('maxLength', '9');
    });
  });

  test('Debería permitir escribir en los campos', async () => {
    render(
      <RouterWrapper>
        <Clientes />
      </RouterWrapper>
    );

    await waitFor(() => {
      const nombreInput = screen.getByLabelText(/nombre \*/i);
      const apellidoInput = screen.getByLabelText(/apellido \*/i);
      const nitInput = screen.getByLabelText(/nit \*/i);

      fireEvent.change(nombreInput, { target: { value: 'Pedro' } });
      fireEvent.change(apellidoInput, { target: { value: 'López' } });
      fireEvent.change(nitInput, { target: { value: '111222333' } });

      expect(nombreInput.value).toBe('Pedro');
      expect(apellidoInput.value).toBe('López');
      expect(nitInput.value).toBe('111222333');
    });
  });

  test('Debería mostrar sección de verificación por NIT', async () => {
    render(
      <RouterWrapper>
        <Clientes />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Verificar Cliente por NIT')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('NIT a verificar (máx. 9 caracteres)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /verificar/i })).toBeInTheDocument();
    });
  });

  test('Debería verificar cliente por NIT exitosamente', async () => {
    const mockCliente = {
      PK_id_cliente: 1,
      nombre_cliente: 'Juan',
      apellido_cliente: 'Pérez',
      NIT: '123456789',
      telefono_cliente: '12345678',
      correo_cliente: 'juan@test.com'
    };

    axios.get.mockResolvedValueOnce({
      data: mockCliente
    });

    render(
      <RouterWrapper>
        <Clientes />
      </RouterWrapper>
    );

    await waitFor(() => {
      const nitInput = screen.getByPlaceholderText('NIT a verificar (máx. 9 caracteres)');
      const verificarButton = screen.getByRole('button', { name: /verificar/i });

      fireEvent.change(nitInput, { target: { value: '123456789' } });
      fireEvent.click(verificarButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/cliente encontrado/i)).toBeInTheDocument();
      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument();
      expect(screen.getByText(/123456789/i)).toBeInTheDocument();
    });
  });

  test('Debería mostrar error para NIT inexistente', async () => {
    axios.get.mockRejectedValueOnce({
      response: {
        status: 404,
        data: { message: 'No existe un cliente con ese NIT.' }
      }
    });

    render(
      <RouterWrapper>
        <Clientes />
      </RouterWrapper>
    );

    await waitFor(() => {
      const nitInput = screen.getByPlaceholderText('NIT a verificar (máx. 9 caracteres)');
      const verificarButton = screen.getByRole('button', { name: /verificar/i });

      fireEvent.change(nitInput, { target: { value: '999999999' } });
      fireEvent.click(verificarButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/no existe un cliente con ese nit/i)).toBeInTheDocument();
    });
  });

  test('Debería mostrar tabla de clientes', async () => {
    render(
      <RouterWrapper>
        <Clientes />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Nombre')).toBeInTheDocument();
      expect(screen.getByText('Apellido')).toBeInTheDocument();
      expect(screen.getByText('NIT')).toBeInTheDocument();
      expect(screen.getByText('Teléfono')).toBeInTheDocument();
      expect(screen.getByText('Correo')).toBeInTheDocument();
    });
  });

  test('Debería mostrar datos de clientes en la tabla', async () => {
    render(
      <RouterWrapper>
        <Clientes />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument();
      expect(screen.getByText('Pérez')).toBeInTheDocument();
      expect(screen.getByText('123456789')).toBeInTheDocument();
      expect(screen.getByText('María')).toBeInTheDocument();
      expect(screen.getByText('González')).toBeInTheDocument();
      expect(screen.getByText('987654321')).toBeInTheDocument();
    });
  });

  test('Debería mostrar botones de acción en la tabla', async () => {
    render(
      <RouterWrapper>
        <Clientes />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText('✏️')).toHaveLength(2); // Botones de editar
      expect(screen.getAllByText('🗑️')).toHaveLength(2); // Botones de eliminar
    });
  });

  test('Debería validar campos requeridos al enviar', async () => {
    render(
      <RouterWrapper>
        <Clientes />
      </RouterWrapper>
    );

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /guardar cliente/i });
      fireEvent.click(submitButton);
    });

    // Debería mostrar alerta de campos requeridos
    await waitFor(() => {
      expect(screen.getByText(/complete todos los campos requeridos/i)).toBeInTheDocument();
    });
  });

  test('Debería mostrar botón de volver al menú', async () => {
    render(
      <RouterWrapper>
        <Clientes />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('← Volver al Menú Principal')).toBeInTheDocument();
    });
  });
});


