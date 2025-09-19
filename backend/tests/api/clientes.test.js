const request = require('supertest');
const app = require('../../index');
const { cleanTestDatabase, seedTestData } = require('../setup');

describe('API Clientes', () => {
  beforeAll(async () => {
    await cleanTestDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await cleanTestDatabase();
  });

  describe('GET /api/clientes', () => {
    test('Debería obtener todos los clientes', async () => {
      const response = await request(app)
        .get('/api/clientes')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('PK_id_cliente');
      expect(response.body[0]).toHaveProperty('nombre_cliente');
      expect(response.body[0]).toHaveProperty('NIT');
    });
  });

  describe('GET /api/clientes/nit/:nit', () => {
    test('Debería encontrar cliente por NIT válido', async () => {
      const response = await request(app)
        .get('/api/clientes/nit/123456789')
        .expect(200);

      expect(response.body).toHaveProperty('PK_id_cliente');
      expect(response.body).toHaveProperty('nombre_cliente', 'Juan');
      expect(response.body).toHaveProperty('NIT', '123456789');
    });

    test('Debería retornar 404 para NIT inexistente', async () => {
      const response = await request(app)
        .get('/api/clientes/nit/999999999')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'No existe un cliente con ese NIT.');
    });
  });

  describe('POST /api/clientes', () => {
    test('Debería crear un nuevo cliente', async () => {
      const nuevoCliente = {
        nombre_cliente: 'María',
        apellido_cliente: 'González',
        NIT: '987654321',
        telefono_cliente: '87654321',
        correo_cliente: 'maria@test.com'
      };

      const response = await request(app)
        .post('/api/clientes')
        .send(nuevoCliente)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Cliente registrado exitosamente.');
    });

    test('Debería fallar con NIT duplicado', async () => {
      const clienteDuplicado = {
        nombre_cliente: 'Pedro',
        apellido_cliente: 'López',
        NIT: '123456789', // NIT ya existente
        telefono_cliente: '11111111'
      };

      const response = await request(app)
        .post('/api/clientes')
        .send(clienteDuplicado)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('Debería fallar sin campos requeridos', async () => {
      const clienteIncompleto = {
        nombre_cliente: 'Ana'
        // Faltan campos requeridos
      };

      const response = await request(app)
        .post('/api/clientes')
        .send(clienteIncompleto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/clientes/:id', () => {
    test('Debería actualizar un cliente existente', async () => {
      const datosActualizados = {
        nombre_cliente: 'Juan Carlos',
        apellido_cliente: 'Pérez',
        NIT: '123456789',
        telefono_cliente: '99999999',
        correo_cliente: 'juancarlos@test.com'
      };

      const response = await request(app)
        .put('/api/clientes/1')
        .send(datosActualizados)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Cliente actualizado exitosamente.');
    });

    test('Debería fallar al actualizar cliente inexistente', async () => {
      const response = await request(app)
        .put('/api/clientes/999')
        .send({ nombre_cliente: 'Test' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Cliente no encontrado.');
    });
  });

  describe('DELETE /api/clientes/:id', () => {
    test('Debería eliminar un cliente existente', async () => {
      const response = await request(app)
        .delete('/api/clientes/2') // Cliente creado en test anterior
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Cliente eliminado exitosamente.');
    });

    test('Debería fallar al eliminar cliente inexistente', async () => {
      const response = await request(app)
        .delete('/api/clientes/999')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Cliente no encontrado.');
    });
  });
});

