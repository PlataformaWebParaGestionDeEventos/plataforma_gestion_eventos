/**
 * Componente QRGenerator
 * Genera y muestra código QR para inscripción a eventos
 * ✅ ACTUALIZADO: Soporte multi-día con selector de fechas
 */

import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import toastHelper from '../../core/utils/toastHelper';
import formatters from '../../core/utils/formatters';
import './QRGenerator.css';

const QRGenerator = ({ 
  qrsPorDia,           // ✅ NUEVO: Objeto con QRs por día { "2025-10-23": {...}, ... }
  eventoNombre, 
  eventoFechaInicio,   // ✅ NUEVO: Para mostrar rango
  eventoFechaFin,      // ✅ NUEVO: Para mostrar rango
  asistenciasPorDia,   // ✅ NUEVO: Para verificar si ya asistió { "2025-10-23": {asistentes: [...]} }
  participanteUid,     // ✅ NUEVO: UID del participante
  participanteNombre,
  // Props antiguas (mantener compatibilidad temporal)
  qrString,
  eventoFecha,
  eventoHora
}) => {
  const [showModal, setShowModal] = useState(false);
  const qrRef = useRef(null);

  // ✅ NUEVO: Soporte multi-día
  const esMultiDia = qrsPorDia && Object.keys(qrsPorDia).length > 0;
  
  // ✅ Detectar si es modo por ponente (las keys tienen formato: ponente_FECHA_HORA_INDEX)
  const esPorPonente = esMultiDia && Object.keys(qrsPorDia)[0]?.startsWith('ponente_');
  
  // ✅ Obtener array de QRs (por día o por ponente)
  const qrsArray = esMultiDia ? Object.entries(qrsPorDia).map(([key, qr]) => ({
    key,
    ...qr
  })).sort((a, b) => a.fechaDia.localeCompare(b.fechaDia)) : [];
  
  // ✅ Si es por ponente, agrupar por día
  const qrsPorDiaAgrupados = esPorPonente ? qrsArray.reduce((acc, qr) => {
    if (!acc[qr.fechaDia]) acc[qr.fechaDia] = [];
    acc[qr.fechaDia].push(qr);
    return acc;
  }, {}) : {};
  
  // ✅ Array de días únicos
  const diasEvento = esPorPonente 
    ? Object.keys(qrsPorDiaAgrupados).sort()
    : esMultiDia 
      ? Object.keys(qrsPorDia).sort() 
      : [];
  
  // ✅ Estado para el día y QR seleccionado
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => {
    if (!esMultiDia) return null;
    
    if (esPorPonente) {
      // Para modo ponente, seleccionar primer día con QRs sin usar
      const diaSinAsistencia = diasEvento.find(dia => {
        const qrsDia = qrsPorDiaAgrupados[dia] || [];
        return qrsDia.some(qr => !qr.usado);
      });
      return diaSinAsistencia || diasEvento[0] || null;
    } else {
      // Para modo por día, buscar primer día sin asistencia
      const diaSinAsistencia = diasEvento.find(dia => {
        const asistentes = asistenciasPorDia?.[dia]?.asistentes || [];
        return !asistentes.includes(participanteUid);
      });
      return diaSinAsistencia || diasEvento[0] || null;
    }
  });
  
  const [qrSeleccionado, setQrSeleccionado] = useState(() => {
    if (!esPorPonente || !diaSeleccionado) return null;
    const qrsDia = qrsPorDiaAgrupados[diaSeleccionado] || [];
    // 🔧 FIX: Seleccionar primer QR NO usado
    const qrNoUsado = qrsDia.find(qr => !qr.usado);
    return qrNoUsado?.key || qrsDia[0]?.key || null;
  });

  // ✅ Verificar si ya asistió (por día o por ponente)
  const yaAsistioDiaSeleccionado = () => {
    if (!esMultiDia || !diaSeleccionado) return false;
    
    // 🔧 FIX: Si es modo por ponente, verificar el QR específico seleccionado
    if (esPorPonente && qrSeleccionado) {
      const qr = qrsPorDia[qrSeleccionado];
      return qr?.usado === true;
    }
    
    // Si es modo por día, verificar asistencias del día
    const asistentes = asistenciasPorDia?.[diaSeleccionado]?.asistentes || [];
    return asistentes.includes(participanteUid);
  };

  // ✅ Obtener QR actual (por día o por ponente)
  const obtenerQRActual = () => {
    if (!esMultiDia) return { qrString, qrId: null };
    
    if (esPorPonente && qrSeleccionado) {
      const qr = qrsPorDia[qrSeleccionado];
      return { 
        qrString: qr?.qrString,
        qrId: qr?.qrId,
        nombrePonente: qr?.nombrePonente,
        temaPonente: qr?.temaPonente,
        horaPonente: qr?.horaPonente
      };
    } else {
      const qr = qrsPorDia?.[diaSeleccionado];
      return { 
        qrString: qr?.qrString,
        qrId: qr?.qrId 
      };
    }
  };
  
  const qrActual = obtenerQRActual();
  const qrStringActual = qrActual.qrString;

  /**
   * Descargar QR como imagen PNG
   */
  const descargarQR = () => {
    try {
      const canvas = qrRef.current?.querySelector('canvas');
      if (!canvas) {
        toastHelper.error('Error al obtener el código QR');
        return;
      }

      // Crear canvas temporal con información adicional
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      
      // Dimensiones del canvas final
      const padding = 40;
      const infoHeight = 120;
      const qrSize = canvas.width;
      tempCanvas.width = qrSize + (padding * 2);
      tempCanvas.height = qrSize + infoHeight + (padding * 2);

      // Fondo blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Header con título
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(0, 0, tempCanvas.width, 80);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Código QR - Evento UPAO', tempCanvas.width / 2, 50);

      // Información del evento
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Evento:', padding, 110);
      
      ctx.font = '16px Arial';
      ctx.fillStyle = '#4b5563';
      ctx.fillText(eventoNombre, padding, 135);
      
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 14px Arial';
      // 🔧 FIX: Usar eventoFechaInicio si eventoFecha no está definido
      const fechaMostrar = eventoFecha || formatters.formatDate(eventoFechaInicio) || 'Ver evento';
      ctx.fillText(`Fecha: ${fechaMostrar}`, padding, 160);

      // Dibujar el QR
      const qrY = infoHeight + padding;
      ctx.drawImage(canvas, padding, qrY);

      // Footer con instrucciones
      const footerY = qrY + qrSize + 20;
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Presenta este QR al ingresar al evento', tempCanvas.width / 2, footerY);
      ctx.fillText(`Participante: ${participanteNombre}`, tempCanvas.width / 2, footerY + 20);

      // Descargar
      const url = tempCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR-${eventoNombre.replace(/\s+/g, '_')}-${Date.now()}.png`;
      link.click();

      toastHelper.success('✅ Código QR descargado exitosamente');

    } catch (error) {
      console.error('Error descargando QR:', error);
      toastHelper.error('❌ Error al descargar el código QR');
    }
  };

  /**
   * Compartir QR (Web Share API)
   */
  const compartirQR = async () => {
    try {
      const canvas = qrRef.current?.querySelector('canvas');
      if (!canvas) {
        toastHelper.error('Error al obtener el código QR');
        return;
      }

      // Convertir canvas a blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toastHelper.error('Error al generar imagen');
          return;
        }

        const file = new File([blob], `QR-Evento-${eventoNombre}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `QR - ${eventoNombre}`,
            text: `Mi código QR para el evento: ${eventoNombre}`,
            files: [file]
          });
        } else {
          toastHelper.info('Tu navegador no soporta la función de compartir. Descarga el QR e envíalo manualmente.');
        }
      }, 'image/png');

    } catch (error) {
      console.error('Error compartiendo QR:', error);
      toastHelper.error('❌ Error al compartir el código QR');
    }
  };

  /**
   * Imprimir QR
   */
  const imprimirQR = () => {
    const ventanaImpresion = window.open('', '', 'width=800,height=600');
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir QR - ${eventoNombre}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .header h1 {
              color: #2563eb;
              margin-bottom: 10px;
            }
            .info {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              width: 100%;
              max-width: 400px;
            }
            .info p {
              margin: 5px 0;
            }
            .qr-container {
              border: 2px solid #e5e7eb;
              padding: 20px;
              border-radius: 8px;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Código QR - Evento UPAO</h1>
            <p><strong>${eventoNombre}</strong></p>
          </div>
          
          <div class="info">
            <p><strong>Fecha:</strong> ${eventoFecha || formatters.formatDate(eventoFechaInicio) || 'Ver evento'}</p>
            <p><strong>Hora:</strong> ${eventoHora || 'Ver horario'}</p>
            <p><strong>Participante:</strong> ${participanteNombre}</p>
          </div>
          
          <div class="qr-container">
            ${qrRef.current?.innerHTML || ''}
          </div>
          
          <div class="footer">
            <p>Presenta este código QR al ingresar al evento</p>
            <p>Generado el ${new Date().toLocaleString('es-PE')}</p>
          </div>
          
          <button onclick="window.print()" style="
            margin-top: 20px;
            padding: 10px 20px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
          ">Imprimir</button>
        </body>
      </html>
    `;
    
    ventanaImpresion.document.write(html);
    ventanaImpresion.document.close();
  };

  return (
    <>
      {/* Botón para abrir modal */}
      <button 
        className="btn-ver-qr"
        onClick={() => setShowModal(true)}
        title="Ver código QR"
      >
        <i className="bi bi-qr-code"></i> Ver QR
      </button>

      {/* Modal con QR */}
      {showModal && (
        <div className="qr-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="qr-modal-close"
              onClick={() => setShowModal(false)}
              title="Cerrar"
            >
              <i className="bi bi-x-lg">❌</i>
            </button>

            <div className="qr-modal-header">
              <h3>
                <i className="bi bi-qr-code"></i> Tu Código QR
              </h3>
              <p className="text-muted">Presenta este código al ingresar al evento</p>
            </div>

            <div className="qr-modal-body">
              {/* ✅ NUEVO: Selector de días */}
              {esMultiDia && diasEvento.length > 0 && (
                <div className="qr-selector-dias">
                  <p className="qr-selector-label">
                    <i className="bi bi-calendar-week"></i> {esPorPonente ? 'Selecciona el día y ponente:' : 'Selecciona el día:'}
                  </p>
                  
                  {/* Selector de días */}
                  <div className="qr-dias-grid">
                    {diasEvento.map((dia) => {
                      const asistentes = asistenciasPorDia?.[dia]?.asistentes || [];
                      const yaAsistio = asistentes.includes(participanteUid);
                      const esSeleccionado = dia === diaSeleccionado;

                      return (
                        <button
                          key={dia}
                          className={`qr-dia-btn ${esSeleccionado ? 'activo' : ''} ${yaAsistio ? 'asistido' : ''}`}
                          onClick={() => {
                            setDiaSeleccionado(dia);
                            if (esPorPonente) {
                              const qrsDia = qrsPorDiaAgrupados[dia] || [];
                              // 🔧 FIX: Seleccionar primer ponente NO usado
                              const qrNoUsado = qrsDia.find(qr => !qr.usado);
                              setQrSeleccionado(qrNoUsado?.key || qrsDia[0]?.key || null);
                            }
                          }}
                          title={yaAsistio ? 'Asistencia registrada' : 'Clic para ver QR'}
                        >
                          <span className="qr-dia-nombre">
                            {formatters.formatearNombreDia(dia)}
                          </span>
                          <span className="qr-dia-fecha">{dia}</span>
                          {yaAsistio && (
                            <i className="bi bi-check-circle-fill qr-dia-check"></i>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* ✅ NUEVO: Selector de ponentes (solo si es modo por ponente) */}
                  {esPorPonente && diaSeleccionado && (
                    <div className="qr-ponentes-list" style={{ marginTop: '15px' }}>
                      <p className="qr-selector-label" style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
                        <i className="bi bi-person-badge"></i> Ponentes del día:
                      </p>
                      <div className="qr-ponentes-grid">
                        {(qrsPorDiaAgrupados[diaSeleccionado] || []).map((qr) => {
                          const esSeleccionado = qr.key === qrSeleccionado;
                          // 🔧 FIX: Verificar correctamente si el QR del ponente ya fue usado
                          const yaUsado = qr.usado === true;
                          
                          return (
                            <button
                              key={qr.key}
                              className={`qr-ponente-btn ${esSeleccionado ? 'activo' : ''} ${yaUsado ? 'usado' : ''}`}
                              onClick={() => setQrSeleccionado(qr.key)}
                              disabled={yaUsado}
                              style={{
                                padding: '12px',
                                border: esSeleccionado ? '2px solid #2563eb' : '1px solid #e5e7eb',
                                borderRadius: '8px',
                                backgroundColor: esSeleccionado ? '#eff6ff' : yaUsado ? '#f3f4f6' : 'white',
                                cursor: yaUsado ? 'not-allowed' : 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s',
                                opacity: yaUsado ? 0.6 : 1
                              }}
                              title={yaUsado ? '✅ Asistencia ya registrada' : 'Clic para ver QR'}
                            >
                              <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#1f2937', marginBottom: '4px' }}>
                                {yaUsado ? '✅' : '👤'} {qr.nombrePonente}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>
                                📝 {qr.temaPonente}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🕐 {qr.horaPonente}</span>
                                {yaUsado && (
                                  <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    ✓ Asistido
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ✅ Código QR o mensaje de asistencia */}
              {esMultiDia && yaAsistioDiaSeleccionado() ? (
                <div className="qr-asistencia-registrada">
                  <i className="bi bi-check-circle"></i>
                  <h4>Asistencia Registrada</h4>
                  <p>Ya registraste tu asistencia para este día</p>
                  <small>{formatters.formatearNombreDia(diaSeleccionado)}</small>
                </div>
              ) : (
                <>
                  {/* Código QR */}
                  <div className="qr-canvas-container" ref={qrRef}>
                    <QRCodeCanvas
                      value={qrStringActual || qrString || ''}
                      size={280}
                      level="H"
                      includeMargin={true}
                      imageSettings={{
                        src: "/logo_upao.jpeg",
                        height: 40,
                        width: 40,
                        excavate: true
                      }}
                    />
                  </div>

                  {/* Instrucciones */}
                  <div className="qr-instructions">
                    <p>
                      <i className="bi bi-info-circle"></i> 
                      El organizador escaneará este código al momento de tu ingreso al evento
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* ✅ Footer: solo mostrar botones si NO ha asistido */}
            {!(esMultiDia && yaAsistioDiaSeleccionado()) && (
              <div className="qr-modal-footer">
                <button 
                  className="btn-qr-action btn-qr-download"
                  onClick={descargarQR}
                >
                  <i className="bi bi-download"></i> Descargar
                </button>
                
                <button 
                  className="btn-qr-action btn-qr-share"
                  onClick={compartirQR}
                >
                  <i className="bi bi-share"></i> Compartir
                </button>
                
                <button 
                  className="btn-qr-action btn-qr-print"
                  onClick={imprimirQR}
                >
                  <i className="bi bi-printer"></i> Imprimir
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default QRGenerator;
