/**
 * Componente QRScanner
 * Escanea códigos QR para registrar asistencia
 */

import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getAuth } from 'firebase/auth';
import appFirebase from '../../config/credenciales';
import qrService from '../../services/qrService';
import toastHelper from '../../core/utils/toastHelper';
import './QRScanner.css';

const auth = getAuth(appFirebase);

// ⚡ SOLUCIÓN DEFINITIVA: Flag global de módulo (persiste entre renders)
// Bloquea ABSOLUTAMENTE todos los eventos duplicados a nivel de módulo
let PROCESAMIENTO_GLOBAL_ACTIVO = false;
let ULTIMO_QR_PROCESADO = { texto: '', timestamp: 0 };

const QRScanner = ({ eventoId, eventoNombre, onAsistenciaRegistrada, fechaDiaSeleccionado = null }) => {
  const [scanner, setScanner] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [errorCamara, setErrorCamara] = useState(null);
  
  // 🔧 FIX: Refs locales (backup del flag global)
  const procesandoRef = React.useRef(false);
  const reinicioTimeoutRef = React.useRef(null);

  /**
   * Iniciar escáner QR
   */
  const iniciarScanner = () => {
    if (scanner) {
      scanner.clear().catch(err => console.log('Error clearing scanner:', err));
    }

    setScanning(true);
    setResultado(null);
    setErrorCamara(null);

    // Esperar a que el elemento qr-reader esté en el DOM
    setTimeout(() => {
      // Detectar si es móvil
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      const config = {
        fps: 10,
        qrbox: isMobile ? { width: 200, height: 200 } : { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
        // Configuración específica para móviles
        rememberLastUsedCamera: true,
        // Preferir cámara trasera en móviles
        videoConstraints: isMobile ? {
          facingMode: { ideal: "environment" }
        } : undefined
      };

      try {
        const html5QrcodeScanner = new Html5QrcodeScanner(
          "qr-reader",
          config,
          false
        );

        html5QrcodeScanner.render(onScanSuccess, onScanError);
        setScanner(html5QrcodeScanner);
      } catch (err) {
        console.error('Error iniciando escáner:', err);
        setErrorCamara('No se pudo acceder a la cámara. Asegúrate de dar permisos.');
        setScanning(false);
      }
    }, 100); // Pequeño delay para que el DOM se actualice
  };

  /**
   * Detener escáner QR
   */
  const detenerScanner = () => {
    if (scanner) {
      scanner.clear().catch(err => console.log('Error clearing scanner:', err));
      setScanner(null);
    }
    setScanning(false);
  };

  /**
   * ⚡ SOLUCIÓN DEFINITIVA: Callback cuando se escanea exitosamente
   * 🔒 PROTECCIÓN GLOBAL contra procesamiento duplicado
   */
  const onScanSuccess = async (decodedText) => {
    const ahora = Date.now();
    
    // ⛔ PROTECCIÓN 1 - FLAG GLOBAL (más rápido que refs)
    if (PROCESAMIENTO_GLOBAL_ACTIVO) {
      console.log('[🔒 BLOQUEADO GLOBAL] Ya hay procesamiento activo');
      return;
    }
    
    // ⛔ PROTECCIÓN 2 - DEBOUNCE GLOBAL (mismo QR en 3 segundos)
    if (ULTIMO_QR_PROCESADO.texto === decodedText && 
        (ahora - ULTIMO_QR_PROCESADO.timestamp) < 3000) {
      console.log('[🔒 BLOQUEADO DEBOUNCE] QR duplicado dentro de 3 segundos');
      return;
    }
    
    // ⛔ PROTECCIÓN 3 - REF LOCAL (backup)
    if (procesandoRef.current) {
      console.log('[🔒 BLOQUEADO REF] Ya hay procesamiento en el componente');
      return;
    }
    
    // ⚡ BLOQUEAR INMEDIATAMENTE (antes de cualquier operación async)
    PROCESAMIENTO_GLOBAL_ACTIVO = true;
    ULTIMO_QR_PROCESADO = { texto: decodedText, timestamp: ahora };
    procesandoRef.current = true;
    
    console.log('✅ QR aceptado, iniciando procesamiento...', decodedText.substring(0, 20));
    
    // PAUSAR scanner ANTES de procesar
    if (scanner) {
      try {
        await scanner.pause(true);
        console.log('Scanner pausado');
      } catch (err) {
        // Si pause falla, intentar clear
        scanner.clear().catch(e => console.log('Error:', e));
      }
      setScanner(null);
    }
    setScanning(false);
    setProcesando(true);

    try {
      // ✅ Validar QR pasando la fecha seleccionada (si aplica)
      console.log('📋 Validando QR para evento:', eventoId, 'Fecha seleccionada:', fechaDiaSeleccionado);
      const validacion = await qrService.validarQR(decodedText, eventoId, fechaDiaSeleccionado);
      console.log('✅ Resultado validación:', validacion);

      if (!validacion.success) {
        console.warn('❌ Validación fallida:', validacion.error);
        // ✅ SOLO mostrar toast de error - NO mostrar resultado visual
        toastHelper.error(`❌ ${validacion.error}`);
        
        // Limpiar resultado para evitar doble notificación
        setResultado(null);
        setProcesando(false);
        
        // ⚡ Liberar AMBOS flags (global y local)
        PROCESAMIENTO_GLOBAL_ACTIVO = false;
        procesandoRef.current = false;
        
        // Reiniciar scanner después de 2 segundos
        setTimeout(() => {
          iniciarScanner();
        }, 2000);
        return;
      }

      // Registrar asistencia
      const currentUser = auth.currentUser;
      const organizadorUid = currentUser?.uid || null;
      
      // ✅ Extraer qrId, fechaDia y ponenteKey del QR validado
      const qrId = validacion.qrData?.qrId || null;
      const fechaDia = validacion.qrData?.fechaDia || null;
      const ponenteKey = validacion.qrData?.ponenteKey || null;
      
      console.log('📝 Registrando asistencia - Usuario:', validacion.qrData.userId, 'QR ID:', qrId, 'Fecha:', fechaDia, 'Ponente:', ponenteKey);
      
      const registro = await qrService.registrarAsistenciaQR(
        eventoId, 
        validacion.qrData.userId,
        organizadorUid,
        qrId,
        fechaDia,     // ✅ Pasar fecha del QR para registrar asistencia del día correcto
        ponenteKey    // ✅ NUEVO: Pasar ponenteKey para modo por ponente
      );
      
      console.log('📋 Resultado registro:', registro);

      if (registro.success) {
        // ✅ SOLO mostrar toast de éxito - NO mostrar resultado visual para evitar doble notificación
        toastHelper.success(`✅ Asistencia registrada: ${registro.participante?.nombre || 'Participante'}`);
        
        // Limpiar resultado para que no se muestre el componente visual de éxito
        setResultado(null);

        // ✅ OPTIMIZADO: Notificar al componente padre y esperar a que recargue datos
        if (onAsistenciaRegistrada) {
          await onAsistenciaRegistrada(registro.participante);
          console.log('🔄 Datos recargados después de callback');
        }

        // 🔧 Limpiar timeout anterior si existe
        if (reinicioTimeoutRef.current) {
          clearTimeout(reinicioTimeoutRef.current);
        }

        // ⚡ Liberar flags INMEDIATAMENTE después del éxito
        PROCESAMIENTO_GLOBAL_ACTIVO = false;
        procesandoRef.current = false;
        
        // ✅ NO reiniciar automáticamente para evitar escanear el mismo QR dos veces
        // El usuario debe mover el teléfono y presionar "Iniciar Scanner" nuevamente

      } else {
        // ✅ SOLO mostrar toast de error - NO mostrar resultado visual
        toastHelper.error(`❌ ${registro.error}`);
        
        // Limpiar resultado para que no se muestre el componente visual de error
        setResultado(null);
        
        // ⚡ Liberar AMBOS flags (global y local)
        PROCESAMIENTO_GLOBAL_ACTIVO = false;
        procesandoRef.current = false;
        
        // Reiniciar scanner después de 2 segundos
        setTimeout(() => {
          iniciarScanner();
        }, 2000);
      }

    } catch (error) {
      console.error('Error procesando QR:', error);
      
      // Extraer mensaje de error más específico
      let mensajeError = 'Error al procesar el código QR';
      if (error.message) {
        if (error.message.includes('find is not a function')) {
          mensajeError = 'Error interno del sistema. Por favor, recarga la página e intenta de nuevo.';
        } else if (error.message.includes('participantesInfo')) {
          mensajeError = 'Error al actualizar información del participante. Contacta al administrador.';
        } else {
          mensajeError = error.message;
        }
      }
      
      // ✅ SOLO mostrar toast de error - NO mostrar resultado visual
      toastHelper.error(`❌ ${mensajeError}`);
      
      // Limpiar resultado para evitar doble notificación
      setResultado(null);
      
      // Reiniciar scanner después de 2 segundos
      setTimeout(() => {
        iniciarScanner();
      }, 2000);
    } finally {
      setProcesando(false);
      // ⚡ IMPORTANTE: Liberar AMBOS flags siempre en el finally
      PROCESAMIENTO_GLOBAL_ACTIVO = false;
      procesandoRef.current = false;
    }
  };

  /**
   * Callback cuando hay error en el escaneo
   */
  const onScanError = () => {
    // No hacer nada, errores normales de escaneo continuo
  };

  /**
   * ✅ Limpiar scanner y timeouts al desmontar
   */
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.log('Error clearing scanner:', err));
      }
      if (reinicioTimeoutRef.current) {
        clearTimeout(reinicioTimeoutRef.current);
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
            
            {errorCamara && (
              <div className="alert alert-warning mb-3" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {errorCamara}
                <br />
                <small>
                  En tu navegador, permite el acceso a la cámara cuando se solicite.
                  En configuración de tu navegador, asegúrate de dar permisos de cámara.
                </small>
              </div>
            )}
            
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
            <li>Permitir acceso a la cámara</li>
            <li>Asegúrate de tener buena iluminación</li>
            <li>Mantén el código QR centrado en el cuadro</li>
            <li>Evita reflejos en la pantalla del participante</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
