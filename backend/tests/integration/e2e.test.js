const request = require('supertest');
const app = require('../../index');
const { cleanTestDatabase, seedTestData } = require('../setup');

describe('Tests de Integración End-to-End', () => {
  beforeAll(async () => {
    await cleanTestDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await cleanTestDatabase();
  });

  describe('Flujo completo de gestión de órdenes', () => {
    test('Flujo completo: Cliente → Vehículo → Orden → Notificación', async () => {
      // 1. Crear cliente
      const nuevoCliente = {
        nombre_cliente: 'Carlos',
        apellido_cliente: 'Mendoza',
        NIT: '555666777',
        telefono_cliente: '55556666',
        correo_cliente: 'carlos@test.com'
      };

      const clienteResponse = await request(app)
        .post('/api/clientes')
        .send(nuevoCliente)
        .expect(201);

      expect(clienteResponse.body).toHaveProperty('message', 'Cliente registrado exitosamente.');

      // 2. Verificar que el cliente se puede buscar por NIT
      const buscarClienteResponse = await request(app)
        .get('/api/clientes/nit/555666777')
        .expect(200);

      expect(buscarClienteResponse.body).toHaveProperty('nombre_cliente', 'Carlos');
      expect(buscarClienteResponse.body).toHaveProperty('NIT', '555666777');

      // 3. Crear vehículo para el cliente
      const nuevoVehiculo = {
        fk_id_cliente: buscarClienteResponse.body.PK_id_cliente,
        placa_vehiculo: 'XYZ789',
        marca_vehiculo: 'Honda',
        modelo_vehiculo: 'Civic',
        anio_vehiculo: 2021,
        color_vehiculo: 'Azul'
      };

      const vehiculoResponse = await request(app)
        .post('/api/vehiculos')
        .send(nuevoVehiculo)
        .expect(201);

      expect(vehiculoResponse.body).toHaveProperty('message', 'Vehículo registrado exitosamente.');

      // 4. Crear orden de servicio
      const nuevaOrden = {
        fk_id_cliente: buscarClienteResponse.body.PK_id_cliente,
        fk_id_vehiculo: '1', // ID del vehículo creado
        fk_id_servicio: '1',
        comentario_cliente_orden: 'Mantenimiento preventivo',
        nivel_combustible_orden: 'Medium',
        odometro_auto_cliente_orden: '25000',
        fk_id_estado_orden: '1',
        observaciones_orden: 'Cliente solicita revisión completa',
        estado_vehiculo: 'Excelente'
      };

      const ordenResponse = await request(app)
        .post('/api/ordenes')
        .send(nuevaOrden)
        .expect(201);

      expect(ordenResponse.body).toHaveProperty('message', 'Orden registrada exitosamente.');

      // 5. Verificar que la orden aparece en el listado
      const ordenesResponse = await request(app)
        .get('/api/ordenes')
        .expect(200);

      const ordenCreada = ordenesResponse.body.find(orden => 
        orden.NIT === '555666777' && orden.nombre_cliente === 'Carlos'
      );

      expect(ordenCreada).toBeDefined();
      expect(ordenCreada).toHaveProperty('estado_vehiculo', 'Excelente');

      // 6. Actualizar estado de la orden
      const actualizacionOrden = {
        fk_id_cliente: buscarClienteResponse.body.PK_id_cliente,
        fk_id_vehiculo: '1',
        fk_id_servicio: '1',
        comentario_cliente_orden: 'Mantenimiento preventivo',
        nivel_combustible_orden: 'Medium',
        odometro_auto_cliente_orden: '25000',
        fk_id_estado_orden: '2', // Cambiar a "En Proceso"
        observaciones_orden: 'Cliente solicita revisión completa',
        estado_vehiculo: 'Excelente'
      };

      const actualizarResponse = await request(app)
        .put(`/api/ordenes/${ordenCreada.pk_id_orden}`)
        .send(actualizacionOrden)
        .expect(200);

      expect(actualizarResponse.body).toHaveProperty('message', 'Orden actualizada exitosamente.');

      // 7. Verificar que el cambio de estado se registró
      const ordenActualizada = await request(app)
        .get('/api/ordenes')
        .expect(200);

      const ordenModificada = ordenActualizada.body.find(orden => 
        orden.pk_id_orden === ordenCreada.pk_id_orden
      );

      expect(ordenModificada).toHaveProperty('estado_orden', 'En Proceso');
    });

    test('Flujo Consumidor Final: Orden sin cliente específico', async () => {
      // 1. Crear orden para Consumidor Final
      const ordenCF = {
        fk_id_cliente: '', // Vacío para CF
        fk_id_vehiculo: '1',
        fk_id_servicio: '2',
        comentario_cliente_orden: 'Reparación de emergencia',
        nivel_combustible_orden: 'Low',
        odometro_auto_cliente_orden: '45000',
        fk_id_estado_orden: '1',
        observaciones_orden: 'Cliente walk-in, vehículo con falla',
        estado_vehiculo: 'Regular'
      };

      const ordenResponse = await request(app)
        .post('/api/ordenes')
        .send(ordenCF)
        .expect(201);

      expect(ordenResponse.body).toHaveProperty('message', 'Orden registrada exitosamente.');

      // 2. Verificar que la orden se creó correctamente
      const ordenesResponse = await request(app)
        .get('/api/ordenes')
        .expect(200);

      const ordenCFCreada = ordenesResponse.body.find(orden => 
        orden.comentario_cliente_orden === 'Reparación de emergencia'
      );

      expect(ordenCFCreada).toBeDefined();
      expect(ordenCFCreada).toHaveProperty('estado_vehiculo', 'Regular');
      // Para CF, fk_id_cliente debería ser null
      expect(ordenCFCreada.fk_id_cliente).toBeNull();
    });
  });

  describe('Flujo de gestión de clientes', () => {
    test('Flujo completo: Crear → Buscar → Actualizar → Eliminar cliente', async () => {
      // 1. Crear cliente
      const cliente = {
        nombre_cliente: 'Ana',
        apellido_cliente: 'Rodríguez',
        NIT: '111222333',
        telefono_cliente: '11112222',
        correo_cliente: 'ana@test.com'
      };

      await request(app)
        .post('/api/clientes')
        .send(cliente)
        .expect(201);

      // 2. Buscar cliente por NIT
      const buscarResponse = await request(app)
        .get('/api/clientes/nit/111222333')
        .expect(200);

      expect(buscarResponse.body).toHaveProperty('nombre_cliente', 'Ana');

      // 3. Actualizar cliente
      const datosActualizados = {
        nombre_cliente: 'Ana María',
        apellido_cliente: 'Rodríguez',
        NIT: '111222333',
        telefono_cliente: '99998888',
        correo_cliente: 'anamaria@test.com'
      };

      await request(app)
        .put(`/api/clientes/${buscarResponse.body.PK_id_cliente}`)
        .send(datosActualizados)
        .expect(200);

      // 4. Verificar actualización
      const clienteActualizado = await request(app)
        .get('/api/clientes/nit/111222333')
        .expect(200);

      expect(clienteActualizado.body).toHaveProperty('nombre_cliente', 'Ana María');
      expect(clienteActualizado.body).toHaveProperty('telefono_cliente', '99998888');

      // 5. Eliminar cliente
      await request(app)
        .delete(`/api/clientes/${buscarResponse.body.PK_id_cliente}`)
        .expect(200);

      // 6. Verificar eliminación
      await request(app)
        .get('/api/clientes/nit/111222333')
        .expect(404);
    });
  });

  describe('Validaciones de integridad de datos', () => {
    test('No se puede crear orden con vehículo inexistente', async () => {
      const ordenInvalida = {
        fk_id_cliente: '1',
        fk_id_vehiculo: '999', // Vehículo inexistente
        fk_id_servicio: '1',
        comentario_cliente_orden: 'Test',
        nivel_combustible_orden: 'Medium',
        odometro_auto_cliente_orden: '10000',
        fk_id_estado_orden: '1',
        observaciones_orden: 'Test',
        estado_vehiculo: 'Bueno'
      };

      const response = await request(app)
        .post('/api/ordenes')
        .send(ordenInvalida);

      // Debería fallar o manejar el error apropiadamente
      expect(response.status).not.toBe(201);
    });

    test('No se puede crear cliente con NIT duplicado', async () => {
      const cliente1 = {
        nombre_cliente: 'Cliente 1',
        apellido_cliente: 'Test',
        NIT: '999888777',
        telefono_cliente: '11111111'
      };

      const cliente2 = {
        nombre_cliente: 'Cliente 2',
        apellido_cliente: 'Test',
        NIT: '999888777', // Mismo NIT
        telefono_cliente: '22222222'
      };

      // Crear primer cliente
      await request(app)
        .post('/api/clientes')
        .send(cliente1)
        .expect(201);

      // Intentar crear segundo cliente con mismo NIT
      const response = await request(app)
        .post('/api/clientes')
        .send(cliente2);

      expect(response.status).toBe(400);
    });
  });

  describe('Rendimiento de consultas complejas', () => {
    test('Consulta de órdenes con joins debe ser eficiente', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/ordenes')
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      console.log(`⏱️  Tiempo de consulta compleja: ${queryTime}ms`);

      expect(queryTime).toBeLessThan(1000); // Menos de 1 segundo
      expect(response.body).toBeInstanceOf(Array);
    });

    test('Múltiples consultas simultáneas', async () => {
      const startTime = Date.now();

      const requests = [
        request(app).get('/api/clientes'),
        request(app).get('/api/vehiculos'),
        request(app).get('/api/ordenes'),
        request(app).get('/api/servicios')
      ];

      const responses = await Promise.all(requests);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      console.log(`⏱️  ${requests.length} consultas simultáneas: ${totalTime}ms`);

      expect(totalTime).toBeLessThan(2000); // Menos de 2 segundos
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});


