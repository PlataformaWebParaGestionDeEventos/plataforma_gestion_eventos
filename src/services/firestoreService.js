// Servicio de Firestore para gestión de eventos
import logger from '../core/utils/logger';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDoc,
  arrayUnion,
  arrayRemove 
} from "firebase/firestore";
import { db } from "../config/credenciales";
import { authService } from "./authService";
import n8nService from "./n8nService";
import qrService from "./qrService";

export const firestoreService = {
  // Crear evento CON INTEGRACIÓN n8n
  async crearEvento(eventData) {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { success: false, error: "Usuario no autenticado" };
      }

      const evento = {
        ...eventData,
        capacidadMaxima: parseInt(eventData.capacidadMaxima),
        organizadorId: user.uid,
        organizadorEmail: user.email,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        participantes: [],
        asistentes: [],
        inscripcionesAbiertas: true,  // ✅ Cambiado de inscripcionesCerradas a inscripcionesAbiertas
        estadoWorkflow: 'iniciado'
      };

      // 1. Guardar evento en Firestore
      const docRef = await addDoc(collection(db, "eventos"), evento);
      const eventoId = docRef.id;
      
      // 2. Enviar evento a n8n (iniciar workflow automático)
      try {
        logger.log('🚀 Enviando evento creado a n8n...');
        const n8nResult = await n8nService.enviarEventoCreado({
          ...evento,
          id: eventoId,
          participantes: evento.participantes || []
        });
        
        // Actualizar estado del workflow en Firestore
        await updateDoc(doc(db, "eventos", eventoId), {
          workflowN8n: {
            iniciado: n8nResult.success,
            fechaInicio: new Date().toISOString(),
            ultimoEstado: n8nResult.success ? 'workflow_iniciado' : 'error_workflow',
            error: n8nResult.success ? null : n8nResult.error
          }
        });
        
        logger.log('✅ Workflow n8n iniciado:', n8nResult.success);
        
      } catch (n8nError) {
        logger.warn('⚠️ Error en n8n (no crítico):', n8nError);
        // No fallar la creación del evento si n8n falla
      }
      
      return { 
        success: true, 
        id: eventoId,
        message: 'Evento creado y workflow iniciado'
      };
      
    } catch (error) {
      console.error('Error al crear evento:', error);
      return { success: false, error: "Error al crear evento" };
    }
  },

  // Obtener eventos publicados
  async obtenerEventosPublicados() {
    try {
      logger.log('Intentando obtener eventos publicados...');
      const q = query(
        collection(db, "eventos"),
        where("estado", "==", "publicado")
        // Removido temporalmente orderBy para evitar el error de índice
      );
      
      const querySnapshot = await getDocs(q);
      logger.log('Eventos encontrados:', querySnapshot.size);
      
      const eventos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Ordenar en el cliente por fecha de inicio
      .sort((a, b) => {
        const fechaA = new Date(a.eventoFechaInicio || a.fecha || 0);
        const fechaB = new Date(b.eventoFechaInicio || b.fecha || 0);
        return fechaA - fechaB;
      });

      logger.log('Eventos mapeados:', eventos);
      return { success: true, eventos };
    } catch (error) {
      console.error('Error en obtenerEventosPublicados:', error);
      return { success: false, error: "Error al cargar eventos", eventos: [] };
    }
  },

  // Obtener eventos de un organizador
  async obtenerEventosOrganizador(organizadorId) {
    try {
      const q = query(
        collection(db, "eventos"),
        where("organizadorId", "==", organizadorId)
        // Removido temporalmente orderBy para evitar el error de índice
      );
      
      const querySnapshot = await getDocs(q);
      const eventos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Ordenar en el cliente por fecha de creación
      .sort((a, b) => {
        const fechaA = a.fechaCreacion?.toDate?.() || new Date(a.fechaCreacion) || new Date();
        const fechaB = b.fechaCreacion?.toDate?.() || new Date(b.fechaCreacion) || new Date();
        return fechaB - fechaA; // Más recientes primero
      });

      return { success: true, eventos };
    } catch (err) {
      console.error('Error al cargar eventos:', err);
      return { success: false, error: "Error al cargar eventos", eventos: [] };
    }
  },

  // Actualizar evento
  async actualizarEvento(eventoId, eventData) {
    try {
      const eventoRef = doc(db, "eventos", eventoId);
      await updateDoc(eventoRef, {
        ...eventData,
        capacidadMaxima: parseInt(eventData.capacidadMaxima),
        fechaActualizacion: new Date()
      });

      return { success: true };
    } catch (err) {
      console.error('Error al actualizar evento:', err);
      return { success: false, error: "Error al actualizar evento" };
    }
  },

  // Eliminar evento
  async eliminarEvento(eventoId) {
    try {
      await deleteDoc(doc(db, "eventos", eventoId));
      return { success: true };
    } catch (err) {
      console.error('Error al eliminar evento:', err);
      return { success: false, error: "Error al eliminar evento" };
    }
  },

  // Verificar conflictos de horario (actualizado para rangos de fechas)
  async verificarConflictoHorario(fechaInicio, fechaFin, ubicacion, excludeEventId = null) {
    try {
      // Obtener todos los eventos para verificar solapamientos
      const q = query(
        collection(db, "eventos"),
        where("ubicacion", "==", ubicacion)
      );

      const querySnapshot = await getDocs(q);
      const conflictingEvents = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(evento => {
          // No comparar con el mismo evento si estamos editando
          if (evento.id === excludeEventId) return false;
          
          // Solo verificar eventos publicados o en borrador
          if (evento.estado !== 'publicado' && evento.estado !== 'borrador') return false;
          
          // Obtener fechas del evento existente (compatibilidad con modelo antiguo)
          const eventoInicio = evento.fechaInicio || evento.fecha;
          const eventoFin = evento.fechaFin || evento.fecha;
          
          // Verificar solapamiento de fechas
          const fechasSeSuperponen = 
            (fechaInicio <= eventoFin && fechaFin >= eventoInicio);
          
          return fechasSeSuperponen;
        });

      return { hasConflict: conflictingEvents.length > 0, events: conflictingEvents };
    } catch (error) {
      console.error('Error verificando conflictos:', error);
      return { hasConflict: false, events: [] };
    }
  },

  // Obtener evento por ID
  async obtenerEventoPorId(eventoId) {
    try {
      const eventoDoc = await getDoc(doc(db, "eventos", eventoId));
      if (eventoDoc.exists()) {
        return { 
          success: true, 
          evento: { id: eventoDoc.id, ...eventoDoc.data() } 
        };
      }
      return { success: false, error: "Evento no encontrado" };
    } catch (err) {
      console.error('Error al obtener evento:', err);
      return { success: false, error: "Error al obtener evento" };
    }
  },

  // Inscribir alumno a un evento CON INTEGRACIÓN n8n
  async inscribirAlumnoEvento(eventoId, alumnoId, alumnoEmail, alumnoNombre = null, alumnoApellido = null) {
    try {
      // 1. Verificar si el evento existe y tiene espacio
      const eventoResult = await this.obtenerEventoPorId(eventoId);
      if (!eventoResult.success) {
        return { success: false, error: "Evento no encontrado" };
      }

      const evento = eventoResult.evento;
      
      // 2. ✅ MEJORADO: Auto-cerrar inscripciones si ya llegó la hora de inicio del evento
      const fechaEventoParaValidar = evento.fechaInicio || evento.fecha;
      const horaEventoParaValidar = evento.horaInicio || evento.hora || '00:00';
      
      if (this.yaLlegoHoraDeInicio(fechaEventoParaValidar, horaEventoParaValidar) && evento.inscripcionesAbiertas) {
        logger.log('🔒 Auto-cerrando inscripciones: ya llegó la hora de inicio del evento');
        await this.cerrarInscripcionesYEnviarLista(eventoId);
        return { 
          success: false, 
          error: "Las inscripciones se cerraron automáticamente al llegar la hora de inicio del evento" 
        };
      }
      
      // 3. Verificar si ya está inscrito
      if (evento.participantes && evento.participantes.includes(alumnoId)) {
        return { success: false, error: "Ya estás inscrito en este evento" };
      }

      // 4. Verificar capacidad
      const participantesActuales = evento.participantes ? evento.participantes.length : 0;
      if (participantesActuales >= evento.capacidadMaxima) {
        return { success: false, error: "El evento ha alcanzado su capacidad máxima" };
      }

      // 5. Verificar si las inscripciones están cerradas
      if (!evento.inscripcionesAbiertas) {
        return { success: false, error: "Las inscripciones están cerradas" };
      }

      // ✅ NUEVO: Calcular días del evento para generar QRs
      const fechaInicio = evento.fechaInicio || evento.fecha;
      const fechaFin = evento.fechaFin || evento.fecha || fechaInicio;
      
      // Importar formatters para calcular días
      const { default: formatters } = await import('../core/utils/formatters.js');
      const diasEvento = formatters.calcularDiasEvento(fechaInicio, fechaFin);
      
      logger.log(`📅 Generando QRs para ${diasEvento.length} día(s) del evento`);

      // 6. ✅ NUEVO: Generar QRs para todos los días del evento
      const qrsResult = qrService.generarQRsParaEvento(eventoId, alumnoId, alumnoEmail, diasEvento);
      
      if (!qrsResult.success) {
        console.error('❌ Error generando QRs:', qrsResult.error);
        return { success: false, error: "Error generando códigos QR" };
      }

      logger.log(`✅ ${qrsResult.totalQRs} QR(s) generado(s) exitosamente`);

      // 7. Inscribir al alumno en Firestore con QRs por día
      const participanteInfo = {
        id: alumnoId,
        uid: alumnoId,
        email: alumnoEmail,
        nombre: alumnoNombre || 'Estudiante',
        apellido: alumnoApellido || '',
        fechaInscripcion: new Date().toISOString(),
        estado: 'inscrito',
        asistio: false,
        qrsPorDia: qrsResult.qrsPorDia  // ✅ NUEVO: Objeto con QRs por día
      };

      const eventoRef = doc(db, "eventos", eventoId);
      await updateDoc(eventoRef, {
        participantes: arrayUnion(alumnoId),
        participantesInfo: arrayUnion(participanteInfo)
      });

      logger.log('✅ Alumno inscrito en Firestore con QRs por día');

      // 8. Notificar a n8n para enviar confirmación CON QR (no bloquear si falla)
      try {
        logger.log('📧 Enviando confirmación de inscripción con QRs via n8n...');
        
        const alumno = {
          uid: alumnoId,
          email: alumnoEmail,
          nombre: alumnoNombre || 'Estudiante',
          apellido: alumnoApellido || '',
        };
        
        const n8nResult = await n8nService.enviarInscripcion(evento, alumno);
        
        // Leer el documento del evento de nuevo para obtener el estado más reciente
        const eventoActualDoc = await getDoc(eventoRef);
        const eventoActualData = eventoActualDoc.data();

        // Construir el nuevo objeto workflowN8n de forma segura
        const workflowActual = eventoActualData.workflowN8n || {};
        const inscripcionesActuales = workflowActual.inscripciones || {};

        const workflowN8nActualizado = {
          ...workflowActual, // Mantiene los datos anteriores (como el error 404)
          inscripciones: {
            ...inscripcionesActuales, // Mantiene las inscripciones de otros alumnos
            [alumnoId]: {             // Añade la nueva inscripción
              confirmacionEnviada: n8nResult.success,
              qrEnviado: n8nResult.success,
              fechaConfirmacion: new Date().toISOString(),
              error: n8nResult.success ? null : n8nResult.error,
            },
          },
        };

        // Actualizar el documento con el objeto completo
        await updateDoc(eventoRef, {
          workflowN8n: workflowN8nActualizado,
        });
        
        logger.log('📧 Confirmación n8n:', n8nResult.success ? 'enviada con QR' : 'falló');
        
      } catch (n8nError) {
        logger.warn('⚠️ Error al enviar confirmación n8n (no crítico):', n8nError);
      }

      // 9. Verificar si se debe cerrar inscripciones (capacidad llena o llegó la hora)
      const nuevosParticipantes = participantesActuales + 1;
      const fechaEvento = evento.fechaInicio || evento.fecha;
      const horaEvento = evento.horaInicio || evento.hora || '00:00';
      const deberaCerrar = nuevosParticipantes >= evento.capacidadMaxima || 
                           this.yaLlegoHoraDeInicio(fechaEvento, horaEvento);
      
      if (deberaCerrar) {
        const razon = nuevosParticipantes >= evento.capacidadMaxima 
          ? 'capacidad máxima alcanzada' 
          : 'llegó la hora de inicio del evento';
        logger.log(`🔒 Cerrando inscripciones: ${razon}`);
        await this.cerrarInscripcionesYEnviarLista(eventoId);
      }

      return { 
        success: true, 
        message: "Inscripción exitosa",
        data: {
          participante: participanteInfo,
          qrs: {
            totalQRs: qrsResult.totalQRs,
            diasEvento: diasEvento,
            qrsPorDia: qrsResult.qrsPorDia  // ✅ Array de QRs por día
          },
          confirmacionEnviada: true,
          inscripcionesCerradas: deberaCerrar
        }
      };

    } catch (error) {
      console.error('Error en inscripción:', error);
      return { success: false, error: "Error al inscribirse al evento" };
    }
  },

  // Desinscribir alumno de un evento
  async desinscribirAlumnoEvento(eventoId, alumnoId) {
    try {
      const eventoResult = await this.obtenerEventoPorId(eventoId);
      if (!eventoResult.success) {
        return { success: false, error: "Evento no encontrado" };
      }

      const evento = eventoResult.evento;
      
      // Verificar si está inscrito
      if (!evento.participantes || !evento.participantes.includes(alumnoId)) {
        return { success: false, error: "No estás inscrito en este evento" };
      }

      // Encontrar la información del participante
      const participanteInfo = evento.participantesInfo?.find(p => p.id === alumnoId);

      // Desinscribir al alumno
      const eventoRef = doc(db, "eventos", eventoId);
      const updateData = {
        participantes: arrayRemove(alumnoId)
      };

      if (participanteInfo) {
        updateData.participantesInfo = arrayRemove(participanteInfo);
      }

      await updateDoc(eventoRef, updateData);

      return { success: true, message: "Desinscripción exitosa" };
    } catch (error) {
      console.error('Error en desinscripción:', error);
      return { success: false, error: "Error al desinscribirse del evento" };
    }
  },

  /**
   * Eliminar participante de un evento (por organizador)
   * Elimina al participante de participantes, participantesInfo, asistentes y asistenciaQR
   */
  async eliminarParticipante(eventoId, alumnoId) {
    try {
      const eventoResult = await this.obtenerEventoPorId(eventoId);
      if (!eventoResult.success) {
        return { success: false, error: "Evento no encontrado" };
      }

      const evento = eventoResult.evento;
      
      // Verificar si está inscrito
      if (!evento.participantes || !evento.participantes.includes(alumnoId)) {
        return { success: false, error: "El participante no está inscrito en este evento" };
      }

      // Encontrar la información del participante
      const participanteInfo = evento.participantesInfo?.find(p => p.id === alumnoId || p.uid === alumnoId);
      
      if (!participanteInfo) {
        return { success: false, error: "No se encontró la información del participante" };
      }

      // ✅ CORRECCIÓN: Filtrar arrays en lugar de usar arrayRemove
      const eventoRef = doc(db, "eventos", eventoId);
      
      // Remover de participantes
      const participantesActualizados = evento.participantes.filter(id => id !== alumnoId);
      
      // Remover de participantesInfo (filtrar por id o uid)
      const participantesInfoActualizados = (evento.participantesInfo || []).filter(
        p => p.id !== alumnoId && p.uid !== alumnoId
      );
      
      // ✅ OPTIMIZACIÓN: Solo actualizar campos necesarios
      // ❌ ELIMINADO: asistentes (redundante, se calcula dinámicamente)
      // ❌ ELIMINADO: asistenciaQR (ya no se usa)
      const updateData = {
        participantes: participantesActualizados,
        participantesInfo: participantesInfoActualizados
      };

      // ✅ Eliminar de asistenciasPorDia si está presente
      if (evento.asistenciasPorDia) {
        for (const [fecha, diaData] of Object.entries(evento.asistenciasPorDia)) {
          if (diaData.asistentes?.includes(alumnoId)) {
            // Eliminar de asistentes del día
            updateData[`asistenciasPorDia.${fecha}.asistentes`] = 
              diaData.asistentes.filter(id => id !== alumnoId);
            
            // Eliminar de participantesInfo del día
            updateData[`asistenciasPorDia.${fecha}.participantesInfo`] = 
              (diaData.participantesInfo || []).filter(p => (p.uid || p.id) !== alumnoId);
          }
        }
      }

      await updateDoc(eventoRef, updateData);

      logger.log(`✅ Participante ${alumnoId} eliminado del evento ${eventoId}`);

      return { 
        success: true, 
        message: "Participante eliminado exitosamente",
        participanteEliminado: participanteInfo
      };

    } catch (error) {
      console.error('Error eliminando participante:', error);
      return { success: false, error: "Error al eliminar participante" };
    }
  },

  // Obtener participantes de un evento (para organizadores)
  async obtenerParticipantesEvento(eventoId) {
    try {
      const eventoResult = await this.obtenerEventoPorId(eventoId);
      if (!eventoResult.success) {
        return { success: false, error: "Evento no encontrado" };
      }

      const evento = eventoResult.evento;
      const participantes = evento.participantesInfo || [];

      return { 
        success: true, 
        participantes,
        totalParticipantes: participantes.length,
        capacidadMaxima: evento.capacidadMaxima,
        espaciosDisponibles: evento.capacidadMaxima - participantes.length
      };
    } catch (error) {
      console.error('Error obteniendo participantes:', error);
      return { success: false, error: "Error al obtener participantes" };
    }
  },

  // ========== SISTEMA DE ASISTENCIAS POR DÍA ==========

  /**
   * Marcar asistencia de un participante (ACTUALIZADO: soporta múltiples días)
   * @param {string} eventoId - ID del evento
   * @param {string} alumnoId - UID del alumno
   * @param {string} metodo - 'manual' o 'qr'
   * @param {string} organizadorUid - UID del organizador
   * @param {string} qrId - ID del QR escaneado (opcional)
   * @param {string} fechaDia - Fecha específica del día (YYYY-MM-DD). Si no se provee, usa fecha actual
   * @returns {Promise<Object>}
   */
  async marcarAsistencia(eventoId, alumnoId, metodo = 'manual', organizadorUid = null, qrId = null, fechaDia = null) {
    try {
      const eventoResult = await this.obtenerEventoPorId(eventoId);
      if (!eventoResult.success) {
        return { success: false, error: "Evento no encontrado" };
      }

      const evento = eventoResult.evento;
      
      // Verificar si está inscrito
      if (!evento.participantes || !evento.participantes.includes(alumnoId)) {
        return { success: false, error: "El alumno no está inscrito en este evento" };
      }

      // Determinar fecha del día (si no se provee, usar fecha actual)
      const fechaAsistencia = fechaDia || new Date().toISOString().split('T')[0];
      
      // Verificar si la fecha está dentro del rango del evento
      const fechaInicio = evento.fechaInicio || evento.fecha;
      const fechaFin = evento.fechaFin || evento.fecha || fechaInicio;
      
      if (fechaAsistencia < fechaInicio || fechaAsistencia > fechaFin) {
        return { 
          success: false, 
          error: `La fecha ${fechaAsistencia} está fuera del rango del evento` 
        };
      }

      // Verificar si ya tiene asistencia marcada PARA ESTE DÍA ESPECÍFICO
      const asistenciasDelDia = evento.asistenciasPorDia?.[fechaAsistencia]?.asistentes || [];
      if (asistenciasDelDia.includes(alumnoId)) {
        return { 
          success: false, 
          error: `La asistencia para el día ${fechaAsistencia} ya fue marcada` 
        };
      }

      // Buscar datos del participante
      const participanteInfo = evento.participantesInfo?.find(p => p.id === alumnoId || p.uid === alumnoId);
      
      if (!participanteInfo) {
        return { success: false, error: "Participante no encontrado en la lista de inscritos" };
      }

      // Crear registro de asistencia para el día
      const registroAsistencia = {
        uid: alumnoId,
        id: alumnoId,
        email: participanteInfo.email || 'desconocido',
        nombre: participanteInfo.nombre || 'Estudiante',
        apellido: participanteInfo.apellido || '',
        metodo,
        timestamp: new Date().toISOString(),
        organizadorUid: organizadorUid || 'sistema'
      };

      const eventoRef = doc(db, "eventos", eventoId);
      
      // Actualizar asistencias del día específico
      const asistentesDelDiaActualizados = Array.from(
        new Set([...asistenciasDelDia, alumnoId])
      );

      const participantesDelDiaActualizados = [
        ...(evento.asistenciasPorDia?.[fechaAsistencia]?.participantesInfo || []),
        registroAsistencia
      ];

      // ✅ OPTIMIZACIÓN: Preparar datos de actualización (solo asistenciasPorDia)
      // ❌ ELIMINADO: asistentes[] global (redundante, se calcula con formatters.obtenerAsistentesGlobales())
      // ❌ ELIMINADO: asistenciaQR (duplicado completo de asistenciasPorDia)
      const updateData = {
        // Actualizar asistencias del día específico (ÚNICA FUENTE DE VERDAD)
        [`asistenciasPorDia.${fechaAsistencia}.asistentes`]: asistentesDelDiaActualizados,
        [`asistenciasPorDia.${fechaAsistencia}.participantesInfo`]: participantesDelDiaActualizados,
        [`asistenciasPorDia.${fechaAsistencia}.fecha`]: fechaAsistencia
      };

      // ✅ Guardar qrId en qrUsados para evitar reutilización
      if (qrId && metodo === 'qr') {
        updateData[`qrUsados.${qrId}`] = {
          timestamp: new Date().toISOString(),
          userId: alumnoId,
          metodo: 'qr',
          organizadorUid: organizadorUid || 'sistema',
          fecha: fechaAsistencia
        };
      }
      
      // ✅ Actualizar TODO en una sola operación (evita race conditions)
      await updateDoc(eventoRef, updateData);

      logger.log(`✅ Asistencia marcada para ${alumnoId} el día ${fechaAsistencia} vía ${metodo}${qrId ? ` (QR: ${qrId})` : ''}`);
      
      return { 
        success: true, 
        message: "Asistencia marcada exitosamente",
        fecha: fechaAsistencia
      };
      
    } catch (error) {
      console.error('Error marcando asistencia:', error);
      return { success: false, error: "Error al marcar asistencia" };
    }
  },

  /**
   * Obtener asistencias de un día específico
   * @param {string} eventoId - ID del evento
   * @param {string} fechaDia - Fecha del día (YYYY-MM-DD)
   * @returns {Promise<Object>}
   */
  async obtenerAsistenciaDelDia(eventoId, fechaDia) {
    try {
      const eventoResult = await this.obtenerEventoPorId(eventoId);
      if (!eventoResult.success) {
        return { success: false, error: "Evento no encontrado" };
      }

      const evento = eventoResult.evento;
      const asistenciasDelDia = evento.asistenciasPorDia?.[fechaDia] || {
        fecha: fechaDia,
        asistentes: [],
        participantesInfo: []
      };

      return {
        success: true,
        asistencias: asistenciasDelDia,
        totalAsistentes: asistenciasDelDia.asistentes?.length || 0,
        totalInscritos: evento.participantes?.length || 0
      };
      
    } catch (error) {
      console.error('Error obteniendo asistencias del día:', error);
      return { success: false, error: "Error al obtener asistencias" };
    }
  },

  /**
   * Obtener resumen completo de asistencias (todos los días)
   * @param {string} eventoId - ID del evento
   * @returns {Promise<Object>}
   */
  async obtenerResumenAsistencias(eventoId) {
    try {
      const eventoResult = await this.obtenerEventoPorId(eventoId);
      if (!eventoResult.success) {
        return { success: false, error: "Evento no encontrado" };
      }

      const evento = eventoResult.evento;
      const fechaInicio = evento.fechaInicio || evento.fecha;
      const fechaFin = evento.fechaFin || evento.fecha || fechaInicio;
      
      // Importar formatters para calcular días
      const { calcularDiasEvento, esEventoMultiDia } = await import('../core/utils/formatters.js').then(m => m.default);
      
      const diasEvento = calcularDiasEvento(fechaInicio, fechaFin);
      const esMultiDia = esEventoMultiDia(fechaInicio, fechaFin);
      
      // Construir resumen por día
      const resumenPorDia = {};
      diasEvento.forEach(dia => {
        const asistenciasDelDia = evento.asistenciasPorDia?.[dia] || {
          fecha: dia,
          asistentes: [],
          participantesInfo: []
        };
        
        resumenPorDia[dia] = {
          fecha: dia,
          totalAsistentes: asistenciasDelDia.asistentes?.length || 0,
          asistentes: asistenciasDelDia.asistentes || [],
          participantesInfo: asistenciasDelDia.participantesInfo || []
        };
      });

      // Calcular estadísticas generales
      const totalInscritos = evento.participantes?.length || 0;
      const asistentesUnicos = Array.from(new Set(evento.asistentes || []));
      
      // Calcular participantes con asistencia perfecta vs parcial
      const participantesConAsistenciaPerfecta = [];
      const participantesConAsistenciaParcial = [];
      
      evento.participantes?.forEach(participanteId => {
        let diasAsistidos = 0;
        const diasFaltantes = [];
        
        diasEvento.forEach(dia => {
          if (resumenPorDia[dia]?.asistentes.includes(participanteId)) {
            diasAsistidos++;
          } else {
            diasFaltantes.push(dia);
          }
        });
        
        const participanteInfo = evento.participantesInfo?.find(p => 
          p.id === participanteId || p.uid === participanteId
        );
        
        if (participanteInfo) {
          const datosParticipante = {
            uid: participanteId,
            id: participanteId,
            nombre: participanteInfo.nombre || 'Sin nombre',
            apellido: participanteInfo.apellido || '',
            email: participanteInfo.email,
            diasAsistidos,
            totalDias: diasEvento.length,
            porcentajeAsistencia: ((diasAsistidos / diasEvento.length) * 100).toFixed(2)
          };
          
          if (diasAsistidos === diasEvento.length) {
            participantesConAsistenciaPerfecta.push(datosParticipante);
          } else if (diasAsistidos > 0) {
            participantesConAsistenciaParcial.push({
              ...datosParticipante,
              diasFaltantes
            });
          }
        }
      });

      return {
        success: true,
        evento: {
          id: evento.id,
          titulo: evento.titulo,
          fechaInicio,
          fechaFin
        },
        esMultiDia,
        totalDias: diasEvento.length,
        diasEvento,
        totalInscritos,
        totalAsistentesUnicos: asistentesUnicos.length,
        porcentajeAsistenciaGeneral: totalInscritos > 0 
          ? ((asistentesUnicos.length / totalInscritos) * 100).toFixed(2)
          : '0.00',
        resumenPorDia,
        participantesConAsistenciaPerfecta,
        participantesConAsistenciaParcial
      };
      
    } catch (error) {
      console.error('Error obteniendo resumen de asistencias:', error);
      return { success: false, error: "Error al obtener resumen" };
    }
  },

  // ========== NUEVAS FUNCIONES PARA n8n ==========

  /**
   * Cerrar inscripciones y enviar lista a n8n
   */
  async cerrarInscripcionesYEnviarLista(eventoId) {
    try {
      const eventoResult = await this.obtenerEventoPorId(eventoId);
      if (!eventoResult.success) {
        throw new Error('Evento no encontrado');
      }

      const evento = eventoResult.evento;
      const listaInscritos = evento.participantesInfo || [];

      // 1. Cerrar inscripciones en Firestore
      const eventoRef = doc(db, "eventos", eventoId);
      await updateDoc(eventoRef, {
        inscripcionesAbiertas: false,  // ✅ Cambiado de inscripcionesCerradas: true
        fechaCierreInscripciones: new Date().toISOString(),
        estadoWorkflow: 'inscripciones_cerradas'
      });

      logger.log('🔒 Inscripciones cerradas en Firestore');

      // 2. Enviar lista a n8n
      try {
        const n8nResult = await n8nService.enviarListaInscritos(evento, listaInscritos);
        
        await updateDoc(eventoRef, {
          'workflowN8n.listaEnviada': {
            enviada: n8nResult.success,
            fechaEnvio: new Date().toISOString(),
            totalInscritos: listaInscritos.length,
            error: n8nResult.success ? null : n8nResult.error
          }
        });

        logger.log('📋 Lista de inscritos enviada a n8n:', n8nResult.success);

      } catch (n8nError) {
        logger.warn('⚠️ Error enviando lista a n8n:', n8nError);
      }

      return {
        success: true,
        message: 'Inscripciones cerradas y lista enviada',
        data: {
          totalInscritos: listaInscritos.length,
          fechaCierre: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Error cerrando inscripciones:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Enviar asistencias a n8n (ACTUALIZADO: soporta eventos multi-día)
   */
  async enviarAsistenciasN8n(eventoId) {
    try {
      const eventoResult = await this.obtenerEventoPorId(eventoId);
      if (!eventoResult.success) {
        throw new Error('Evento no encontrado');
      }

      const evento = eventoResult.evento;
      
      // Obtener resumen completo de asistencias
      const resumenResult = await this.obtenerResumenAsistencias(eventoId);
      if (!resumenResult.success) {
        throw new Error('Error al obtener resumen de asistencias');
      }

      logger.log(`📊 Enviando asistencias: ${resumenResult.totalAsistentesUnicos}/${resumenResult.totalInscritos}`);
      logger.log(`📅 Evento multi-día: ${resumenResult.esMultiDia ? 'Sí' : 'No'} (${resumenResult.totalDias} días)`);

      // Enviar a n8n con el resumen completo
      const n8nResult = await n8nService.enviarAsistencias(
        evento, 
        resumenResult
      );

      // Actualizar estado en Firestore
      const eventoRef = doc(db, "eventos", eventoId);
      await updateDoc(eventoRef, {
        'workflowN8n.asistenciasEnviadas': {
          enviadas: n8nResult.success,
          fechaEnvio: new Date().toISOString(),
          totalAsistentesUnicos: resumenResult.totalAsistentesUnicos,
          totalInscritos: resumenResult.totalInscritos,
          porcentajeAsistencia: resumenResult.porcentajeAsistenciaGeneral,
          totalDias: resumenResult.totalDias,
          esMultiDia: resumenResult.esMultiDia,
          participantesConAsistenciaPerfecta: resumenResult.participantesConAsistenciaPerfecta.length,
          participantesConAsistenciaParcial: resumenResult.participantesConAsistenciaParcial.length,
          error: n8nResult.success ? null : n8nResult.error
        },
        estadoWorkflow: n8nResult.success ? 'asistencias_enviadas' : 'error_asistencias'
      });

      return {
        success: n8nResult.success,
        message: n8nResult.success 
          ? 'Asistencias enviadas correctamente a n8n' 
          : 'Error al enviar asistencias',
        data: {
          totalInscritos: resumenResult.totalInscritos,
          totalAsistentes: resumenResult.totalAsistentesUnicos,
          porcentajeAsistencia: resumenResult.porcentajeAsistenciaGeneral,
          totalDias: resumenResult.totalDias,
          esMultiDia: resumenResult.esMultiDia,
          participantesConAsistenciaPerfecta: resumenResult.participantesConAsistenciaPerfecta.length,
          participantesConAsistenciaParcial: resumenResult.participantesConAsistenciaParcial.length,
          n8nResponse: n8nResult
        }
      };

    } catch (error) {
      console.error('Error enviando asistencias a n8n:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Verificar si es el día del evento
   */
  /**
   * Verificar si ya llegó la hora de inicio del evento (cierre de inscripciones)
   * @param {string} fechaEvento - Fecha del evento (YYYY-MM-DD)
   * @param {string} horaEvento - Hora de inicio del evento (HH:MM)
   * @returns {boolean} - true si ya pasó la hora de inicio
   */
  yaLlegoHoraDeInicio(fechaEvento, horaEvento = '00:00') {
    if (!fechaEvento) return false;
    
    try {
      // Crear fecha/hora del inicio del evento
      const fechaHoraEvento = new Date(`${fechaEvento}T${horaEvento}:00`);
      const ahora = new Date();
      
      // Retornar true si ya pasó la hora de inicio
      return ahora >= fechaHoraEvento;
    } catch (error) {
      logger.error('Error al comparar fecha/hora:', error);
      return false;
    }
  },

  // DEPRECATED: Mantener por compatibilidad pero usar yaLlegoHoraDeInicio() en su lugar
  esElDiaDelEvento(fechaEvento) {
    const hoy = new Date().toDateString();
    const fechaEventoDate = new Date(fechaEvento).toDateString();
    return hoy === fechaEventoDate;
  },

  /**
   * Obtener eventos con inscripciones que deberían cerrarse
   * Verifica capacidad llena o si llegó la hora de inicio
   */
  async verificarEventosParaCerrar() {
    try {
      const q = query(
        collection(db, "eventos"),
        where("estado", "==", "publicado"),
        where("inscripcionesAbiertas", "==", true)
      );

      const querySnapshot = await getDocs(q);
      const eventosParaCerrar = [];

      querySnapshot.forEach((doc) => {
        const evento = { id: doc.id, ...doc.data() };
        const participantesActuales = evento.participantes?.length || 0;
        const capacidadLlena = participantesActuales >= evento.capacidadMaxima;
        
        const fechaEvento = evento.fechaInicio || evento.fecha;
        const horaEvento = evento.horaInicio || evento.hora || '00:00';
        const yaLlegoHora = this.yaLlegoHoraDeInicio(fechaEvento, horaEvento);

        if (capacidadLlena || yaLlegoHora) {
          eventosParaCerrar.push({
            ...evento,
            motivo: capacidadLlena ? 'capacidad_maxima' : 'hora_inicio_evento'
          });
        }
      });

      return { success: true, eventos: eventosParaCerrar };

    } catch (error) {
      console.error('Error verificando eventos para cerrar:', error);
      return { success: false, error: error.message };
    }
  }
};

export default firestoreService;