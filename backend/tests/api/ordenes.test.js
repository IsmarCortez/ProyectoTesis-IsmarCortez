const request = require('supertest');
const app = require('../../index');
const { cleanTestDatabase, seedTestData } = require('../setup');

describe('API Órdenes', () => {
  beforeAll(async () => {
    await cleanTestDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await cleanTestDatabase();
  });

  describe('GET /api/ordenes', () => {
    test('Debería obtener todas las órdenes', async () => {
      const response = await request(app)
        .get('/api/ordenes')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/ordenes', () => {
    test('Debería crear una orden con cliente existente', async () => {
      const nuevaOrden = {
        fk_id_cliente: '1',
        fk_id_vehiculo: '1',
        fk_id_servicio: '1',
        comentario_cliente_orden: 'Test de orden',
        nivel_combustible_orden: 'Medium',
        odometro_auto_cliente_orden: '50000',
        fk_id_estado_orden: '1',
        observaciones_orden: 'Observaciones de prueba',
        estado_vehiculo: 'Bueno'
      };

      const response = await request(app)
        .post('/api/ordenes')
        .send(nuevaOrden)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Orden registrada exitosamente.');
    });

    test('Debería crear una orden para Consumidor Final (CF)', async () => {
      const ordenCF = {
        fk_id_cliente: '', // Vacío para CF
        fk_id_vehiculo: '1',
        fk_id_servicio: '1',
        comentario_cliente_orden: 'Orden para Consumidor Final',
        nivel_combustible_orden: 'Full',
        odometro_auto_cliente_orden: '30000',
        fk_id_estado_orden: '1',
        observaciones_orden: 'Cliente walk-in',
        estado_vehiculo: 'Regular'
      };

      const response = await request(app)
        .post('/api/ordenes')
        .send(ordenCF)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Orden registrada exitosamente.');
    });

    test('Debería fallar sin campos requeridos', async () => {
      const ordenIncompleta = {
        fk_id_cliente: '1'
        // Faltan campos requeridos
      };

      const response = await request(app)
        .post('/api/ordenes')
        .send(ordenIncompleta)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/ordenes/buscar-cliente-nit/:nit', () => {
    test('Debería encontrar cliente por NIT', async () => {
      const response = await request(app)
        .get('/api/ordenes/buscar-cliente-nit/123456789')
        .expect(200);

      expect(response.body).toHaveProperty('PK_id_cliente');
      expect(response.body).toHaveProperty('nombre_cliente');
      expect(response.body).toHaveProperty('NIT', '123456789');
    });

    test('Debería retornar 404 para NIT inexistente', async () => {
      const response = await request(app)
        .get('/api/ordenes/buscar-cliente-nit/999999999')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'No existe un cliente con ese NIT.');
    });
  });

  describe('PUT /api/ordenes/:id', () => {
    test('Debería actualizar una orden existente', async () => {
      const datosActualizados = {
        fk_id_cliente: '1',
        fk_id_vehiculo: '1',
        fk_id_servicio: '2',
        comentario_cliente_orden: 'Orden actualizada',
        nivel_combustible_orden: 'Low',
        odometro_auto_cliente_orden: '51000',
        fk_id_estado_orden: '2',
        observaciones_orden: 'Observaciones actualizadas',
        estado_vehiculo: 'Excelente'
      };

      const response = await request(app)
        .put('/api/ordenes/1')
        .send(datosActualizados)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Orden actualizada exitosamente.');
    });

    test('Debería fallar al actualizar orden inexistente', async () => {
      const response = await request(app)
        .put('/api/ordenes/999')
        .send({ fk_id_estado_orden: '2' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Orden no encontrada.');
    });
  });

  describe('DELETE /api/ordenes/:id', () => {
    test('Debería eliminar una orden existente', async () => {
      const response = await request(app)
        .delete('/api/ordenes/2') // Orden CF creada anteriormente
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Orden eliminada exitosamente.');
    });

    test('Debería fallar al eliminar orden inexistente', async () => {
      const response = await request(app)
        .delete('/api/ordenes/999')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Orden no encontrada.');
    });
  });
});

