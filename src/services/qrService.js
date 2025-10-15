/**
 * Servicio de Gestión de Códigos QR
 * Generación, validación y gestión de QR para asistencia a eventos
 */

import CryptoJS from 'crypto-js';
import logger from '../core/utils/logger';
import { db } from '../config/credenciales';
import { doc, getDoc } from 'firebase/firestore';

const SECRET_KEY = import.meta.env.VITE_QR_SECRET_KEY || 'upao-eventos-secret-key-2025';

export const qrService = {
  /**
   * Generar código QR único e irrepetible para una inscripción
   * @param {string} eventoId - ID del evento
   * @param {string} userId - ID del usuario
   * @param {string} userEmail - Email del usuario
   * @returns {Object} Datos del QR generado
   */
  generarQR(eventoId, userId, userEmail) {
    try {
      const timestamp = new Date().toISOString();
      
      // Generar ID único para el QR (UUID v4 simulado)
      const qrId = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Crear payload con información del QR
      const payload = {
        qrId,           // ✅ ID único del QR
        eventoId,
        userId,
        userEmail,
        timestamp,
        usado: false,   // ✅ Estado inicial: no usado
        version: '2.0'  // ✅ Nueva versión con qrId
      };

      // Generar token de seguridad (hash con qrId)
      const dataString = `${qrId}|${eventoId}|${userId}|${timestamp}`;
      const token = CryptoJS.SHA256(dataString + SECRET_KEY).toString();

      // Estructura completa del QR
      const qrData = {
        ...payload,
        token,
        // Expiración: 24 horas después del evento (se valida en el backend)
        expirationBuffer: 24 * 60 * 60 * 1000 // 24 horas en ms
      };

      // Convertir a string para el QR
      const qrString = JSON.stringify(qrData);

      return {
        success: true,
        qrString,
        qrData,
        token,
        qrId  // ✅ Devolver qrId para guardarlo en Firestore
      };

    } catch (error) {
      logger.error('Error generando QR:', error);
      return {
        success: false,
        error: 'Error al generar código QR'
      };
    }
  },

  /**
   * Validar código QR escaneado (ahora con validación de QR único)
   * @param {string} qrString - String del QR escaneado
   * @param {string} eventoIdEsperado - ID del evento actual
   * @returns {Object} Resultado de la validación
   */
  async validarQR(qrString, eventoIdEsperado) {
    try {
      // Parsear datos del QR
      const qrData = JSON.parse(qrString);
      
      // ✅ Validar que tenga qrId (nueva versión)
      if (!qrData.qrId) {
        return {
          success: false,
          error: 'QR inválido: Formato antiguo o corrupto',
          estado: 'invalido'
        };
      }
      
      // Validaciones básicas
      if (!qrData.eventoId || !qrData.userId || !qrData.token) {
        return {
          success: false,
          error: 'QR inválido: Formato incorrecto',
          estado: 'invalido'
        };
      }

      // Verificar que el QR sea para el evento correcto
      if (qrData.eventoId !== eventoIdEsperado) {
        return {
          success: false,
          error: 'QR inválido: Este QR es de otro evento',
          estado: 'evento_incorrecto'
        };
      }

      // ✅ Verificar integridad del token (nueva fórmula con qrId)
      const dataString = `${qrData.qrId}|${qrData.eventoId}|${qrData.userId}|${qrData.timestamp}`;
      const tokenCalculado = CryptoJS.SHA256(dataString + SECRET_KEY).toString();

      if (tokenCalculado !== qrData.token) {
        return {
          success: false,
          error: 'QR inválido: Token de seguridad no válido o QR falsificado',
          estado: 'token_invalido'
        };
      }

      // Obtener evento de Firestore
      const eventoRef = doc(db, 'eventos', qrData.eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (!eventoSnap.exists()) {
        return {
          success: false,
          error: 'Evento no encontrado',
          estado: 'evento_no_existe'
        };
      }

      const evento = eventoSnap.data();

      // Verificar que el usuario está inscrito
      if (!evento.participantes || !evento.participantes.includes(qrData.userId)) {
        return {
          success: false,
          error: 'El usuario no está inscrito en este evento',
          estado: 'no_inscrito'
        };
      }

      // ✅ VALIDACIÓN CRÍTICA: Verificar si este QR específico ya fue usado
      if (evento.qrUsados && evento.qrUsados[qrData.qrId]) {
        const usoAnterior = evento.qrUsados[qrData.qrId];
        return {
          success: false,
          error: `⚠️ Este QR ya fue escaneado el ${new Date(usoAnterior.timestamp).toLocaleString('es-ES')}`,
          estado: 'qr_ya_usado',
          usoAnterior
        };
      }

      // Verificar si ya marcó asistencia (protección adicional)
      if (evento.asistentes && evento.asistentes.includes(qrData.userId)) {
        return {
          success: false,
          error: 'Ya se registró la asistencia anteriormente',
          estado: 'duplicado',
          timestamp: new Date().toISOString()
        };
      }

      // Verificar expiración (24h después del evento)
      const fechaEvento = new Date(evento.fecha + 'T' + evento.hora);
      const ahora = new Date();
      const expiracion = new Date(fechaEvento.getTime() + (qrData.expirationBuffer || 24 * 60 * 60 * 1000));

      if (ahora > expiracion) {
        return {
          success: false,
          error: 'QR expirado: Fuera del período válido',
          estado: 'expirado'
        };
      }

      // QR VÁLIDO
      return {
        success: true,
        estado: 'valido',
        qrData,
        evento,
        mensaje: 'QR válido - Listo para registrar asistencia'
      };

    } catch (error) {
      logger.error('Error validando QR:', error);
      return {
        success: false,
        error: 'Error al validar QR: ' + error.message,
        estado: 'error'
      };
    }
  },

  /**
   * Registrar asistencia usando QR validado (ahora marca el QR como usado)
   * @param {string} eventoId - ID del evento
   * @param {string} userId - ID del usuario
   * @param {string} organizadorUid - UID del organizador
   * @param {string} qrId - ID único del QR escaneado
   * @returns {Object} Resultado del registro
   */
  async registrarAsistenciaQR(eventoId, userId, organizadorUid = null, qrId = null) {
    try {
      // Importar firestoreService dinámicamente para evitar dependencia circular
      const { default: firestoreService } = await import('./firestoreService');
      
      // ✅ Usar la función centralizada marcarAsistencia con metodo='qr' y qrId
      const resultado = await firestoreService.marcarAsistencia(
        eventoId, 
        userId, 
        'qr', 
        organizadorUid,
        qrId  // ✅ Pasar el qrId para marcarlo como usado
      );

      if (!resultado.success) {
        return {
          success: false,
          error: resultado.error
        };
      }

      // Obtener info del participante para devolverla
      const eventoResult = await firestoreService.obtenerEventoPorId(eventoId);
      if (eventoResult.success) {
        const participanteInfo = eventoResult.evento.participantesInfo?.find(
          p => p.id === userId || p.uid === userId
        );
        
        return {
          success: true,
          mensaje: '✅ Asistencia registrada exitosamente',
          participante: participanteInfo,
          timestamp: new Date().toISOString(),
          qrId  // ✅ Devolver qrId usado
        };
      }

      return {
        success: true,
        mensaje: '✅ Asistencia registrada exitosamente',
        timestamp: new Date().toISOString(),
        qrId
      };

    } catch (error) {
      logger.error('Error registrando asistencia:', error);
      return {
        success: false,
        error: 'Error al registrar asistencia: ' + error.message
      };
    }
  },

  /**
   * Generar QR para múltiples inscritos (batch)
   * @param {Array} inscripciones - Array de objetos {eventoId, userId, userEmail}
   * @returns {Array} Array de QRs generados
   */
  generarQRBatch(inscripciones) {
    return inscripciones.map(inscripcion => {
      const result = this.generarQR(
        inscripcion.eventoId,
        inscripcion.userId,
        inscripcion.userEmail
      );
      
      return {
        ...inscripcion,
        ...result
      };
    });
  },

  /**
   * Obtener estadísticas de asistencia por QR
   * @param {string} eventoId - ID del evento
   * @returns {Object} Estadísticas
   */
  async obtenerEstadisticasQR(eventoId) {
    try {
      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (!eventoSnap.exists()) {
        return {
          success: false,
          error: 'Evento no encontrado'
        };
      }

      const evento = eventoSnap.data();
      const asistenciaQR = evento.asistenciaQR || {};
      
      const totalInscritos = evento.participantes?.length || 0;
      
      // Obtener participantes con asistencia (usar participantesInfo, no participantes)
      const participantes = evento.participantesInfo || [];
      let asistentesPorQR = 0;
      let asistentesManual = 0;
      
      // Contar por método de registro
      participantes.forEach(participante => {
        if (participante.asistio) {
          // Si tiene metodoRegistro, usarlo, sino verificar si está en asistenciaQR
          const metodo = participante.metodoRegistro || 
                        (asistenciaQR[participante.uid || participante.id] ? 'qr' : 'manual');
          
          if (metodo === 'qr') {
            asistentesPorQR++;
          } else {
            asistentesManual++;
          }
        }
      });
      
      const totalAsistentes = asistentesPorQR + asistentesManual;

      return {
        success: true,
        estadisticas: {
          totalInscritos,
          totalAsistentes,
          asistentesPorQR,
          asistentesManual,
          porcentajeAsistencia: totalInscritos > 0 ? ((totalAsistentes / totalInscritos) * 100).toFixed(1) : '0.0',
          porcentajeQR: totalAsistentes > 0 ? ((asistentesPorQR / totalAsistentes) * 100).toFixed(1) : '0.0'
        }
      };

    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default qrService;
