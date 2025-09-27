import React, { useState } from 'react';
// import { getFileUrl } from './config/cloudinary';

const ImprimirOrden = ({ orden, onClose }) => {
  const [descargando, setDescargando] = useState(false);

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-GT');
  };

  const formatearCombustible = (combustible) => {
    const niveles = {
      'Empty': 'Vacío',
      'Low': 'Bajo',
      'Medium': 'Medio',
      'High': 'Alto',
      'Full': 'Lleno'
    };
    return niveles[combustible] || combustible;
  };

  const handleImprimir = async () => {
    try {
      setDescargando(true);
      console.log(`🖨️ Descargando PDF para orden #${orden.pk_id_orden}...`);
      
      // Llamar al endpoint del backend para generar el PDF
      const response = await fetch(`http://localhost:4000/api/ordenes/${orden.pk_id_orden}/pdf`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Obtener el PDF como blob
      const pdfBlob = await response.blob();
      
      // Crear URL temporal para el blob
      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      
      // Crear enlace temporal para descarga
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `orden_${orden.pk_id_orden}.pdf`;
      
      // Simular click para descargar
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(pdfUrl);
      
      console.log(`✅ PDF descargado exitosamente para orden #${orden.pk_id_orden}`);
      
    } catch (error) {
      console.error('❌ Error descargando PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="print-container">
      {/* Controles de impresión - solo visibles en pantalla */}
      <div className="no-print d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
        <div>
          <h4>Descargar PDF de Orden #{orden.pk_id_orden}</h4>
          <p className="mb-0 text-muted">
            <small>📄 Se generará un PDF profesional con el mismo formato que se envía por email</small>
          </p>
        </div>
        <div>
          <button 
            className="btn btn-primary me-2" 
            onClick={handleImprimir}
            disabled={descargando}
          >
            {descargando ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Generando PDF...
              </>
            ) : (
              <>
                🖨️ Descargar PDF
              </>
            )}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            ❌ Cerrar
          </button>
        </div>
      </div>

      {/* Contenido de la orden para impresión */}
      <div className="orden-print">
        {/* Encabezado con logo */}
        <div className="orden-header text-center mb-4">
          <img 
            src="/LogoTecnoAuto.jpg" 
            alt="Logo TecnoAuto" 
            className="logo-orden mb-2"
            style={{ maxHeight: '80px', maxWidth: '200px' }}
          />
          <h2 className="mb-1">TECNO AUTO</h2>
          <h4 className="text-muted mb-0">Taller Mecánico</h4>
          <p className="mb-0">Orden de Trabajo #{orden.pk_id_orden}</p>
        </div>

        {/* Información de la orden */}
        <div className="orden-info mb-3">
          <div className="row">
            <div className="col-6">
              <strong>Fecha de Ingreso:</strong><br />
              {formatearFecha(orden.fecha_ingreso_orden)}
            </div>
            <div className="col-6 text-end">
              <strong>Estado:</strong><br />
              <span className={`badge ${
                orden.estado_orden === 'Pendiente' ? 'bg-warning' :
                orden.estado_orden === 'En Proceso' ? 'bg-info' :
                orden.estado_orden === 'Completado' ? 'bg-success' :
                orden.estado_orden === 'Cancelado' ? 'bg-danger' : 'bg-secondary'
              }`}>
                {orden.estado_orden}
              </span>
            </div>
          </div>
          
        </div>



        {/* Información del cliente */}
        <div className="seccion-orden mb-3">
          <h5 className="border-bottom pb-1">📋 INFORMACIÓN DEL CLIENTE</h5>
          <div className="row">
            <div className="col-6">
              <strong>Nombre:</strong> {orden.nombre_cliente} {orden.apellido_cliente}
            </div>
            <div className="col-6">
              <strong>NIT:</strong> {orden.NIT}
            </div>
          </div>
          {orden.telefono_cliente && (
            <div className="row mt-1">
              <div className="col-12">
                <strong>Teléfono:</strong> {orden.telefono_cliente}
              </div>
            </div>
          )}
        </div>

        {/* Información del vehículo */}
        <div className="seccion-orden mb-3">
          <h5 className="border-bottom pb-1">🚗 INFORMACIÓN DEL VEHÍCULO</h5>
          <div className="row">
            <div className="col-6">
              <strong>Placa:</strong> {orden.placa_vehiculo}
            </div>
            <div className="col-6">
              <strong>Marca:</strong> {orden.marca_vehiculo}
            </div>
          </div>
          <div className="row mt-1">
            <div className="col-6">
              <strong>Modelo:</strong> {orden.modelo_vehiculo}
            </div>
            <div className="col-6">
              <strong>Año:</strong> {orden.anio_vehiculo}
            </div>
          </div>
          {orden.estado_vehiculo && (
            <div className="row mt-1">
              <div className="col-12">
                <strong>Estado del Vehículo:</strong> {orden.estado_vehiculo}
              </div>
            </div>
          )}
        </div>

        {/* Servicio y detalles técnicos */}
        <div className="seccion-orden mb-3">
          <h5 className="border-bottom pb-1">🔧 SERVICIO Y DETALLES TÉCNICOS</h5>
          <div className="row">
            <div className="col-6">
              <strong>Tipo de Servicio:</strong><br />
              {orden.servicio}
            </div>
            <div className="col-6">
              <strong>Nivel de Combustible:</strong><br />
              {formatearCombustible(orden.nivel_combustible_orden)}
            </div>
          </div>
          <div className="row mt-1">
            <div className="col-6">
              <strong>Odómetro:</strong><br />
              {orden.odometro_auto_cliente_orden ? `${orden.odometro_auto_cliente_orden} km` : 'No especificado'}
            </div>
          </div>
        </div>

        {/* Comentarios y observaciones */}
        {orden.comentario_cliente_orden && (
          <div className="seccion-orden mb-3">
            <h5 className="border-bottom pb-1">💬 COMENTARIO DEL CLIENTE</h5>
            <p className="mb-0">{orden.comentario_cliente_orden}</p>
          </div>
        )}

        {orden.observaciones_orden && (
          <div className="seccion-orden mb-3">
            <h5 className="border-bottom pb-1">📝 OBSERVACIONES DEL TALLER</h5>
            <p className="mb-0">{orden.observaciones_orden}</p>
          </div>
        )}

        {/* Multimedia */}
        <div className="seccion-orden mb-3">
          <h5 className="border-bottom pb-1">📷 ARCHIVOS MULTIMEDIA</h5>
          <div className="row">
            <div className="col-6">
              <strong>Imágenes:</strong><br />
              {[orden.imagen_1, orden.imagen_2, orden.imagen_3, orden.imagen_4].filter(img => img && img !== 'sin_imagen.jpg').length} archivo(s)
            </div>
            <div className="col-6">
              <strong>Video:</strong><br />
              {orden.video && orden.video !== 'sin_video.mp4' ? 'Sí' : 'No'}
            </div>
          </div>
        </div>

        {/* Pie de página */}
        <div className="orden-footer mt-3 pt-3 border-top">
          <div className="row">
            <div className="col-6">
              <strong>Fecha de Impresión:</strong><br />
              {new Date().toLocaleString('es-GT')}
            </div>
            <div className="col-6 text-end">
              <strong>Firma del Cliente:</strong><br />
              _____________________
            </div>
          </div>
          <div className="row mt-2">
            <div className="col-6">
              <strong>Firma del Técnico:</strong><br />
              _____________________
            </div>
            <div className="col-6 text-end">
              <strong>Sello del Taller:</strong><br />
              [ÁREA PARA SELLO]
            </div>
          </div>
        </div>

        {/* Notas importantes */}
        <div className="notas-importantes mt-3 p-2 bg-light rounded">
          <h6 className="text-center mb-1">⚠️ NOTAS IMPORTANTES</h6>
          <ul className="mb-0 small">
            <li>Garantia de servicio de 1 mes o 1000 km</li>
            <li>El taller no se hace responsable por objetos personales dejados en el vehículo</li>
            <li>Los trabajos adicionales deben ser autorizados por el cliente</li>
          </ul>
        </div>
      </div>

      {/* Estilos CSS para impresión */}
      <style jsx>{`
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-size: 10px;
            line-height: 1.2;
          }
          
          .no-print {
            display: none !important;
          }
          
          .orden-print {
            font-size: 10px !important;
            line-height: 1.2 !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 10px !important;
            page-break-inside: avoid;
          }
          
          .logo-orden {
            max-height: 50px !important;
            max-width: 120px !important;
          }
          
          .orden-header {
            padding-bottom: 10px !important;
            margin-bottom: 15px !important;
          }
          
          .orden-header h2 {
            font-size: 16px !important;
            margin-bottom: 5px !important;
          }
          
          .orden-header h4 {
            font-size: 12px !important;
            margin-bottom: 5px !important;
          }
          
          .orden-header p {
            font-size: 11px !important;
            margin-bottom: 5px !important;
          }
          
          .seccion-orden {
            margin-bottom: 12px !important;
            page-break-inside: avoid;
          }
          
          .seccion-orden h5 {
            font-size: 11px !important;
            font-weight: bold !important;
            margin-bottom: 5px !important;
            padding-bottom: 3px !important;
          }
          
          .orden-info {
            margin-bottom: 15px !important;
          }
          
          .orden-info .row {
            margin-bottom: 8px !important;
          }
          
          .orden-footer {
            margin-top: 15px !important;
            padding-top: 10px !important;
            page-break-inside: avoid;
          }
          
          .notas-importantes {
            margin-top: 12px !important;
            padding: 8px !important;
            background-color: #f8f9fa !important;
            border: 1px solid #dee2e6 !important;
          }
          
          .notas-importantes h6 {
            font-size: 10px !important;
            margin-bottom: 5px !important;
          }
          
          .notas-importantes ul {
            margin-bottom: 0 !important;
          }
          
          .notas-importantes li {
            font-size: 9px !important;
            margin-bottom: 2px !important;
          }
          
          .row {
            margin-bottom: 5px !important;
          }
          
          .col-6 {
            padding: 0 5px !important;
          }
          
          /* Evitar saltos de página en elementos importantes */
          .orden-header,
          .orden-info,
          .seccion-orden,
          .orden-footer,
          .notas-importantes {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
        
        .orden-print {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        
        .seccion-orden {
          margin-bottom: 20px;
        }
        
        .seccion-orden h5 {
          color: #495057;
          margin-bottom: 10px;
        }
        
        .orden-header {
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
        }
        
        .orden-footer {
          border-top: 2px solid #007bff;
        }
        
        .notas-importantes {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
        }
      `}</style>
    </div>
  );
};

export default ImprimirOrden;
