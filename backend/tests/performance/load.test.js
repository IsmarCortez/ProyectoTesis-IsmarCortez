const request = require('supertest');
const app = require('../../index');

describe('Tests de Rendimiento', () => {
  describe('Carga de API', () => {
    test('GET /api/clientes - Tiempo de respuesta < 500ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/clientes')
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`⏱️  Tiempo de respuesta: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(500);
    });

    test('GET /api/ordenes - Tiempo de respuesta < 800ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/ordenes')
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`⏱️  Tiempo de respuesta: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(800);
    });

    test('GET /api/vehiculos - Tiempo de respuesta < 600ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/vehiculos')
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`⏱️  Tiempo de respuesta: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(600);
    });
  });

  describe('Tests de Carga Concurrente', () => {
    test('Múltiples requests simultáneos a /api/clientes', async () => {
      const numRequests = 10;
      const requests = [];
      
      const startTime = Date.now();
      
      // Crear múltiples requests simultáneos
      for (let i = 0; i < numRequests; i++) {
        requests.push(
          request(app)
            .get('/api/clientes')
            .expect(200)
        );
      }
      
      // Ejecutar todos los requests
      const responses = await Promise.all(requests);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      console.log(`⏱️  ${numRequests} requests simultáneos completados en: ${totalTime}ms`);
      console.log(`📊 Tiempo promedio por request: ${totalTime / numRequests}ms`);
      
      // Verificar que todos los requests fueron exitosos
      expect(responses).toHaveLength(numRequests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // El tiempo total no debería ser más de 2 segundos
      expect(totalTime).toBeLessThan(2000);
    });

    test('Carga de creación de órdenes', async () => {
      const numOrders = 5;
      const requests = [];
      
      const startTime = Date.now();
      
      // Crear múltiples órdenes simultáneamente
      for (let i = 0; i < numOrders; i++) {
        const orden = {
          fk_id_cliente: '',
          fk_id_vehiculo: '1',
          fk_id_servicio: '1',
          comentario_cliente_orden: `Orden de carga ${i}`,
          nivel_combustible_orden: 'Medium',
          odometro_auto_cliente_orden: `${50000 + i}`,
          fk_id_estado_orden: '1',
          observaciones_orden: 'Test de carga',
          estado_vehiculo: 'Bueno'
        };
        
        requests.push(
          request(app)
            .post('/api/ordenes')
            .send(orden)
        );
      }
      
      // Ejecutar todos los requests
      const responses = await Promise.all(requests);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      console.log(`⏱️  ${numOrders} órdenes creadas en: ${totalTime}ms`);
      console.log(`📊 Tiempo promedio por orden: ${totalTime / numOrders}ms`);
      
      // Verificar que al menos algunas órdenes se crearon exitosamente
      const successfulResponses = responses.filter(r => r.status === 201);
      expect(successfulResponses.length).toBeGreaterThan(0);
      
      // El tiempo total no debería ser más de 5 segundos
      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe('Tests de Memoria', () => {
    test('Verificar uso de memoria en requests múltiples', async () => {
      const initialMemory = process.memoryUsage();
      console.log(`🧠 Memoria inicial: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);
      
      // Realizar múltiples requests
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(request(app).get('/api/clientes'));
      }
      
      await Promise.all(requests);
      
      const finalMemory = process.memoryUsage();
      console.log(`🧠 Memoria final: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
      
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      console.log(`📈 Incremento de memoria: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
      
      // El incremento de memoria no debería ser excesivo (menos de 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Tests de Base de Datos', () => {
    test('Tiempo de consulta compleja', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/ordenes')
        .expect(200);
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      console.log(`⏱️  Tiempo de consulta compleja: ${queryTime}ms`);
      
      // La consulta no debería tomar más de 1 segundo
      expect(queryTime).toBeLessThan(1000);
      
      // Verificar que la respuesta tiene la estructura esperada
      expect(response.body).toBeInstanceOf(Array);
    });
  });
});

