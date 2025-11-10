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
   * ✅ NUEVO: Generar código QR único para un día específico del evento
   * @param {string} eventoId - ID del evento
   * @param {string} userId - ID del usuario
   * @param {string} userEmail - Email del usuario
   * @param {string} fechaDia - Fecha específica del día (YYYY-MM-DD)
   * @returns {Object} Datos del QR generado
   */
  generarQRPorDia(eventoId, userId, userEmail, fechaDia, ponenteKey = null) {
    try {
      const timestamp = new Date().toISOString();
      
      // Generar ID único para el QR incluyendo la fecha
      const qrId = `qr_${fechaDia}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Crear payload con información del QR
      const payload = {
        qrId,           // ✅ ID único del QR
        eventoId,
        userId,
        userEmail,
        fechaDia,       // ✅ NUEVO: Fecha específica del día
        timestamp,
        usado: false,
        version: '3.0'  // ✅ Nueva versión con fechaDia
      };

      // ✅ NUEVO: Agregar ponenteKey si se proporciona (para modo por ponente)
      if (ponenteKey) {
        payload.ponenteKey = ponenteKey;
      }

      // Generar token de seguridad (hash con qrId + fechaDia)
      const dataString = `${qrId}|${eventoId}|${userId}|${fechaDia}|${timestamp}`;
      const token = CryptoJS.SHA256(dataString + SECRET_KEY).toString();

      // Estructura completa del QR
      const qrData = {
        ...payload,
        token,
        // Expiración: hasta las 23:59 del día específico
        expirationBuffer: 24 * 60 * 60 * 1000
      };

      // Convertir a string para el QR
      const qrString = JSON.stringify(qrData);

      return {
        success: true,
        qrString,
        qrData,
        token,
        qrId,
        fechaDia
      };

    } catch (error) {
      logger.error('Error generando QR para día específico:', error);
      return {
        success: false,
        error: 'Error al generar código QR'
      };
    }
  },

  /**
   * ✅ NUEVO: Generar QRs para todos los días de un evento
   * @param {string} eventoId - ID del evento
   * @param {string} userId - ID del usuario
   * @param {string} userEmail - Email del usuario
   * @param {string[]} diasEvento - Array de fechas (YYYY-MM-DD)
   * @returns {Object} { success, qrsPorDia: {fecha: qrData} }
   */
  generarQRsParaEvento(eventoId, userId, userEmail, diasEvento) {
    try {
      const qrsPorDia = {};
      
      diasEvento.forEach(fecha => {
        const qrResult = this.generarQRPorDia(eventoId, userId, userEmail, fecha);
        
        if (qrResult.success) {
          qrsPorDia[fecha] = {
            qrString: qrResult.qrString,
            qrId: qrResult.qrId,
            token: qrResult.token,
            fechaDia: fecha,
            generadoEn: new Date().toISOString(),
            usado: false
          };
        } else {
          logger.error(`Error generando QR para fecha ${fecha}`);
        }
      });
      
      return {
        success: true,
        qrsPorDia,
        totalQRs: Object.keys(qrsPorDia).length
      };
      
    } catch (error) {
      logger.error('Error generando QRs para evento:', error);
      return {
        success: false,
        error: 'Error al generar códigos QR para el evento'
      };
    }
  },

  /**
   * Validar código QR escaneado (ahora con validación de fecha específica)
   * @param {string} qrString - String del QR escaneado
   * @param {string} eventoIdEsperado - ID del evento actual
   * @param {string} fechaEscaneo - Fecha en que se escanea (YYYY-MM-DD), si no se provee usa hoy
   * @returns {Object} Resultado de la validación
   */
  async validarQR(qrString, eventoIdEsperado, fechaEscaneo = null) {
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
      
      // ✅ NUEVO: Validar que tenga fechaDia (versión 3.0)
      if (!qrData.fechaDia) {
        return {
          success: false,
          error: 'QR inválido: Sin fecha específica del día',
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

      // ✅ ACTUALIZADO: SIN validación de fecha - El organizador decide cuándo tomar asistencia
      // Esto permite escanear QRs en cualquier momento (antes, durante o después del evento)
      // El control de cuándo se puede tomar asistencia lo tiene el organizador mediante el campo "asistenciaAbierta"
      console.log(`✅ QR para fecha: ${qrData.fechaDia} - Validación de fecha deshabilitada (control por organizador)`);

      // ✅ Verificar integridad del token (fórmula con qrId + fechaDia)
      const dataString = `${qrData.qrId}|${qrData.eventoId}|${qrData.userId}|${qrData.fechaDia}|${qrData.timestamp}`;
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

      // ✅ CORREGIDO: Validar según modo de asistencia (NO validar ambos)
      const modoAsistencia = evento.modoAsistencia || 'por_dia';
      const fechaDia = qrData.fechaDia;
      
      if (modoAsistencia === 'por_ponente' && qrData.ponenteKey) {
        // 🔧 MODO POR PONENTE: Solo validar asistencia del ponente específico
        const asistenciasPonente = evento.asistenciasPorPonente?.[qrData.ponenteKey]?.asistentes || [];
        
        if (asistenciasPonente.includes(qrData.userId)) {
          return {
            success: false,
            error: `Ya se registró la asistencia para este ponente`,
            estado: 'asistencia_ya_registrada_ponente',
            ponenteKey: qrData.ponenteKey
          };
        }
      } else {
        // 🔧 MODO POR DÍA: Solo validar asistencia del día específico
        const asistentesDelDia = evento.asistenciasPorDia?.[fechaDia]?.asistentes || [];
        
        if (asistentesDelDia.includes(qrData.userId)) {
          return {
            success: false,
            error: `Ya se registró la asistencia para el día ${fechaDia}`,
            estado: 'asistencia_ya_registrada',
            fechaDia: fechaDia
          };
        }
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
   * @param {string} fechaDia - Fecha del día del QR (YYYY-MM-DD)
   * @param {string} ponenteKey - Clave del ponente (para modo por ponente)
   * @returns {Object} Resultado del registro
   */
  async registrarAsistenciaQR(eventoId, userId, organizadorUid = null, qrId = null, fechaDia = null, ponenteKey = null) {
    try {
      // Importar firestoreService dinámicamente para evitar dependencia circular
      const { default: firestoreService } = await import('./firestoreService');
      
      // ✅ ACTUALIZADO: Pasar fechaDia y ponenteKey del QR para registrar asistencia correctamente
      const resultado = await firestoreService.marcarAsistencia(
        eventoId, 
        userId, 
        'qr', 
        organizadorUid,
        qrId,         // ✅ Pasar el qrId para marcarlo como usado
        fechaDia,     // ✅ Pasar fecha del QR para registrar asistencia del día correcto
        ponenteKey    // ✅ NUEVO: Pasar ponenteKey para modo por ponente
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
        // 🔧 FIX: Validar que participantesInfo sea un array antes de usar .find()
        let participanteInfo = null;
        if (Array.isArray(eventoResult.evento.participantesInfo)) {
          participanteInfo = eventoResult.evento.participantesInfo.find(
            p => p.id === userId || p.uid === userId
          );
        }
        
        return {
          success: true,
          mensaje: '✅ Asistencia registrada exitosamente',
          participante: participanteInfo,
          timestamp: new Date().toISOString(),
          qrId,      // ✅ Devolver qrId usado
          fechaDia   // ✅ NUEVO: Devolver fecha del día registrado
        };
      }

      return {
        success: true,
        mensaje: '✅ Asistencia registrada exitosamente',
        timestamp: new Date().toISOString(),
        qrId,
        fechaDia
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
      
      // ✅ OPTIMIZACIÓN: Usar formatters.obtenerAsistentesGlobales() en lugar de evento.asistentes
      const formatters = (await import('../core/utils/formatters')).default;
      const asistentesGlobales = formatters.obtenerAsistentesGlobales(evento);
      
      const totalInscritos = evento.participantes?.length || 0;
      const totalAsistentes = asistentesGlobales.length;
      
      // Contar por método de registro desde asistenciasPorDia
      let asistentesPorQR = 0;
      let asistentesManual = 0;
      
      asistentesGlobales.forEach(uid => {
        // Obtener método desde asistenciasPorDia (primera ocurrencia)
        const metodo = formatters.obtenerMetodoRegistro(evento, uid);
        
        if (metodo === 'qr') {
          asistentesPorQR++;
        } else if (metodo === 'manual') {
          asistentesManual++;
        }
      });

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
