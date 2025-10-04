/**
 * Servicio de Gestión de Códigos QR
 * Generación, validación y gestión de QR para asistencia a eventos
 */

import CryptoJS from 'crypto-js';
import { db } from '../config/credenciales';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const SECRET_KEY = import.meta.env.VITE_QR_SECRET_KEY || 'upao-eventos-secret-key-2025';

export const qrService = {
  /**
   * Generar código QR único para una inscripción
   * @param {string} eventoId - ID del evento
   * @param {string} userId - ID del usuario
   * @param {string} userEmail - Email del usuario
   * @returns {Object} Datos del QR generado
   */
  generarQR(eventoId, userId, userEmail) {
    try {
      const timestamp = new Date().toISOString();
      
      // Crear payload con información del QR
      const payload = {
        eventoId,
        userId,
        userEmail,
        timestamp,
        version: '1.0'
      };

      // Generar token de seguridad (hash)
      const dataString = JSON.stringify(payload);
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
        token
      };

    } catch (error) {
      console.error('Error generando QR:', error);
      return {
        success: false,
        error: 'Error al generar código QR'
      };
    }
  },

  /**
   * Validar código QR escaneado
   * @param {string} qrString - String del QR escaneado
   * @param {string} eventoIdEsperado - ID del evento actual
   * @returns {Object} Resultado de la validación
   */
  async validarQR(qrString, eventoIdEsperado) {
    try {
      // Parsear datos del QR
      const qrData = JSON.parse(qrString);
      
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

      // Verificar integridad del token
      const payloadSinToken = {
        eventoId: qrData.eventoId,
        userId: qrData.userId,
        userEmail: qrData.userEmail,
        timestamp: qrData.timestamp,
        version: qrData.version
      };
      
      const dataString = JSON.stringify(payloadSinToken);
      const tokenCalculado = CryptoJS.SHA256(dataString + SECRET_KEY).toString();

      if (tokenCalculado !== qrData.token) {
        return {
          success: false,
          error: 'QR inválido: Token de seguridad no válido',
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

      // Verificar si ya marcó asistencia
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
      console.error('Error validando QR:', error);
      return {
        success: false,
        error: 'Error al validar QR: ' + error.message,
        estado: 'error'
      };
    }
  },

  /**
   * Registrar asistencia usando QR validado
   * @param {string} eventoId - ID del evento
   * @param {string} userId - ID del usuario
   * @returns {Object} Resultado del registro
   */
  async registrarAsistenciaQR(eventoId, userId) {
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
      const asistentesActuales = evento.asistentes || [];

      // Verificar duplicado
      if (asistentesActuales.includes(userId)) {
        return {
          success: false,
          error: 'La asistencia ya fue registrada'
        };
      }

      // Registrar asistencia
      await updateDoc(eventoRef, {
        asistentes: [...asistentesActuales, userId],
        [`asistenciaQR.${userId}`]: {
          timestamp: new Date().toISOString(),
          metodo: 'qr'
        }
      });

      // Buscar info del participante
      const participanteInfo = evento.participantesInfo?.find(p => p.id === userId || p.uid === userId);

      return {
        success: true,
        mensaje: 'Asistencia registrada exitosamente',
        participante: participanteInfo,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error registrando asistencia:', error);
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
      const totalAsistentes = evento.asistentes?.length || 0;
      const asistentesPorQR = Object.keys(asistenciaQR).length;
      const asistentesManual = totalAsistentes - asistentesPorQR;

      return {
        success: true,
        estadisticas: {
          totalInscritos,
          totalAsistentes,
          asistentesPorQR,
          asistentesManual,
          porcentajeAsistencia: ((totalAsistentes / totalInscritos) * 100).toFixed(1),
          porcentajeQR: ((asistentesPorQR / totalAsistentes) * 100).toFixed(1)
        }
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default qrService;
