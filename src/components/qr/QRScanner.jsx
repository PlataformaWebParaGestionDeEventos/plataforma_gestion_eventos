/**
 * Componente QRScanner
 * Escanea códigos QR para registrar asistencia
 */

import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import qrService from '../../services/qrService';
import './QRScanner.css';

const QRScanner = ({ eventoId, eventoNombre, onAsistenciaRegistrada }) => {
  const [scanner, setScanner] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [procesando, setProcesando] = useState(false);

  /**
   * Iniciar escáner QR
   */
  const iniciarScanner = () => {
    if (scanner) {
      scanner.clear();
    }

    setScanning(true);
    setResultado(null);

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
      },
      false
    );

    html5QrcodeScanner.render(onScanSuccess, onScanError);
    setScanner(html5QrcodeScanner);
  };

  /**
   * Detener escáner QR
   */
  const detenerScanner = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setScanning(false);
  };

  /**
   * Callback cuando se escanea exitosamente
   */
  const onScanSuccess = async (decodedText) => {
    console.log('QR escaneado:', decodedText);

    // Detener el scanner inmediatamente
    detenerScanner();
    setProcesando(true);

    try {
      // Validar QR
      const validacion = await qrService.validarQR(decodedText, eventoId);

      if (!validacion.success) {
        setResultado({
          tipo: 'error',
          mensaje: validacion.error,
          estado: validacion.estado,
          timestamp: validacion.timestamp
        });
        setProcesando(false);
        return;
      }

      // Registrar asistencia
      const registro = await qrService.registrarAsistenciaQR(eventoId, validacion.qrData.userId);

      if (registro.success) {
        setResultado({
          tipo: 'success',
          mensaje: '✅ Asistencia registrada exitosamente',
          participante: registro.participante,
          timestamp: registro.timestamp
        });

        // Notificar al componente padre
        if (onAsistenciaRegistrada) {
          onAsistenciaRegistrada(registro.participante);
        }

        // Auto-reiniciar después de 3 segundos
        setTimeout(() => {
          setResultado(null);
          iniciarScanner();
        }, 3000);

      } else {
        setResultado({
          tipo: 'error',
          mensaje: registro.error,
          estado: 'error_registro'
        });
      }

    } catch (error) {
      console.error('Error procesando QR:', error);
      setResultado({
        tipo: 'error',
        mensaje: 'Error al procesar el código QR',
        estado: 'error'
      });
    } finally {
      setProcesando(false);
    }
  };

  /**
   * Callback cuando hay error en el escaneo
   */
  const onScanError = () => {
    // No hacer nada, errores normales de escaneo continuo
  };

  /**
   * Limpiar scanner al desmontar
   */
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  /**
   * Renderizar icono según estado
   */
  const renderIcono = () => {
    if (!resultado) return null;

    switch (resultado.tipo) {
      case 'success':
        return <i className="bi bi-check-circle-fill text-success"></i>;
      case 'error':
        switch (resultado.estado) {
          case 'duplicado':
            return <i className="bi bi-exclamation-triangle-fill text-warning"></i>;
          case 'evento_incorrecto':
          case 'no_inscrito':
          case 'expirado':
            return <i className="bi bi-x-circle-fill text-danger"></i>;
          default:
            return <i className="bi bi-shield-fill-exclamation text-danger"></i>;
        }
      default:
        return null;
    }
  };

  /**
   * Obtener color de badge según estado
   */
  const getBadgeColor = () => {
    if (!resultado) return '';

    switch (resultado.tipo) {
      case 'success':
        return 'badge-success';
      case 'error':
        switch (resultado.estado) {
          case 'duplicado':
            return 'badge-warning';
          default:
            return 'badge-danger';
        }
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="qr-scanner-container">
      <div className="qr-scanner-header">
        <h4>
          <i className="bi bi-upc-scan"></i> Escáner de Códigos QR
        </h4>
        <p className="text-muted mb-0">
          {eventoNombre}
        </p>
      </div>

      <div className="qr-scanner-body">
        {!scanning && !resultado && (
          <div className="qr-scanner-start">
            <div className="qr-icon-placeholder">
              <i className="bi bi-qr-code-scan"></i>
            </div>
            <h5>Listo para escanear</h5>
            <p>Presiona el botón para activar la cámara y escanear códigos QR</p>
            <button 
              className="btn-iniciar-scanner"
              onClick={iniciarScanner}
            >
              <i className="bi bi-camera-fill"></i> Iniciar Escáner
            </button>
          </div>
        )}

        {scanning && (
          <div className="qr-scanner-active">
            <div id="qr-reader"></div>
            <button 
              className="btn-detener-scanner"
              onClick={detenerScanner}
            >
              <i className="bi bi-stop-circle"></i> Detener
            </button>
          </div>
        )}

        {procesando && (
          <div className="qr-scanner-processing">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Procesando...</span>
            </div>
            <p>Validando código QR...</p>
          </div>
        )}

        {resultado && !procesando && (
          <div className={`qr-scanner-result ${resultado.tipo === 'success' ? 'result-success' : 'result-error'}`}>
            <div className="result-icon">
              {renderIcono()}
            </div>

            <div className="result-content">
              <span className={`badge ${getBadgeColor()}`}>
                {resultado.tipo === 'success' ? 'VÁLIDO' : 'ERROR'}
              </span>

              <h5>{resultado.mensaje}</h5>

              {resultado.participante && (
                <div className="participante-info">
                  <p>
                    <strong>
                      <i className="bi bi-person-circle"></i> {resultado.participante.nombre || resultado.participante.email}
                    </strong>
                  </p>
                  <small className="text-muted">
                    {resultado.participante.email}
                  </small>
                </div>
              )}

              {resultado.timestamp && (
                <small className="text-muted">
                  <i className="bi bi-clock"></i> {new Date(resultado.timestamp).toLocaleString('es-PE')}
                </small>
              )}
            </div>

            <div className="result-actions">
              {resultado.tipo === 'success' ? (
                <p className="text-success mb-0">
                  <i className="bi bi-arrow-clockwise"></i> Escaneando siguiente...
                </p>
              ) : (
                <button 
                  className="btn-reintentar"
                  onClick={iniciarScanner}
                >
                  <i className="bi bi-arrow-clockwise"></i> Escanear de nuevo
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="qr-scanner-footer">
        <div className="scanner-tips">
          <h6>
            <i className="bi bi-lightbulb"></i> Consejos para escanear:
          </h6>
          <ul>
            <li>Asegúrate de tener buena iluminación</li>
            <li>Mantén el código QR centrado en el cuadro</li>
            <li>Evita reflejos en la pantalla del participante</li>
            <li>El escaneo es automático, no necesitas tomar foto</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
