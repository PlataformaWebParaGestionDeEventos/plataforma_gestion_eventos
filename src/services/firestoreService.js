// Servicio de Firestore para gestión de eventos
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
        inscripcionesCerradas: false,
        estadoWorkflow: 'iniciado'
      };

      // 1. Guardar evento en Firestore
      const docRef = await addDoc(collection(db, "eventos"), evento);
      const eventoId = docRef.id;
      
      // 2. Notificar a n8n que se creó un evento (iniciar workflow)
      try {
        console.log('🚀 Iniciando workflow n8n para evento creado...');
        const n8nResult = await n8nService.notificarEventoCreado(
          { ...evento, id: eventoId },
          user
        );
        
        // Actualizar estado del workflow en Firestore
        await updateDoc(doc(db, "eventos", eventoId), {
          workflowN8n: {
            iniciado: n8nResult.success,
            fechaInicio: new Date().toISOString(),
            ultimoEstado: n8nResult.success ? 'workflow_iniciado' : 'error_workflow',
            error: n8nResult.success ? null : n8nResult.error
          }
        });
        
        console.log('✅ Workflow n8n iniciado:', n8nResult.success);
        
      } catch (n8nError) {
        console.warn('⚠️ Error en n8n (no crítico):', n8nError);
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
      console.log('Intentando obtener eventos publicados...');
      const q = query(
        collection(db, "eventos"),
        where("estado", "==", "publicado")
        // Removido temporalmente orderBy para evitar el error de índice
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Eventos encontrados:', querySnapshot.size);
      
      const eventos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Ordenar en el cliente por fecha
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      console.log('Eventos mapeados:', eventos);
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

  // Verificar conflictos de horario
  async verificarConflictoHorario(fecha, hora, ubicacion, excludeEventId = null) {
    try {
      const q = query(
        collection(db, "eventos"),
        where("fecha", "==", fecha),
        where("hora", "==", hora),
        where("ubicacion", "==", ubicacion)
      );

      const querySnapshot = await getDocs(q);
      const conflictingEvents = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(evento => 
          evento.id !== excludeEventId && 
          (evento.estado === 'publicado' || evento.estado === 'borrador')
        );

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
  async inscribirAlumnoEvento(eventoId, alumnoId, alumnoEmail, alumnoNombre = null) {
    try {
      // 1. Verificar si el evento existe y tiene espacio
      const eventoResult = await this.obtenerEventoPorId(eventoId);
      if (!eventoResult.success) {
        return { success: false, error: "Evento no encontrado" };
      }

      const evento = eventoResult.evento;
      
      // 2. Verificar si ya está inscrito
      if (evento.participantes && evento.participantes.includes(alumnoId)) {
        return { success: false, error: "Ya estás inscrito en este evento" };
      }

      // 3. Verificar capacidad
      const participantesActuales = evento.participantes ? evento.participantes.length : 0;
      if (participantesActuales >= evento.capacidadMaxima) {
        return { success: false, error: "El evento ha alcanzado su capacidad máxima" };
      }

      // 4. Verificar si las inscripciones están cerradas
      if (evento.inscripcionesCerradas) {
        return { success: false, error: "Las inscripciones están cerradas" };
      }

      // 5. Inscribir al alumno en Firestore
      const participanteInfo = {
        id: alumnoId,
        uid: alumnoId,
        email: alumnoEmail,
        nombre: alumnoNombre || 'Estudiante',
        fechaInscripcion: new Date().toISOString(),
        estado: 'inscrito',
        asistio: false
      };

      const eventoRef = doc(db, "eventos", eventoId);
      await updateDoc(eventoRef, {
        participantes: arrayUnion(alumnoId),
        participantesInfo: arrayUnion(participanteInfo)
      });

      console.log('✅ Alumno inscrito en Firestore');

      // 6. Notificar a n8n para enviar confirmación (no bloquear si falla)
      try {
        console.log('📧 Enviando confirmación de inscripción via n8n...');
        
        const alumno = {
          uid: alumnoId,
          email: alumnoEmail,
          nombre: alumnoNombre || 'Estudiante'
        };
        
        const n8nResult = await n8nService.notificarInscripcion(evento, alumno);
        
        // Actualizar estado en Firestore
        await updateDoc(eventoRef, {
          [`workflowN8n.inscripciones.${alumnoId}`]: {
            confirmacionEnviada: n8nResult.success,
            fechaConfirmacion: new Date().toISOString(),
            error: n8nResult.success ? null : n8nResult.error
          }
        });
        
        console.log('📧 Confirmación n8n:', n8nResult.success ? 'enviada' : 'falló');
        
      } catch (n8nError) {
        console.warn('⚠️ Error al enviar confirmación n8n (no crítico):', n8nError);
      }

      // 7. Verificar si se debe cerrar inscripciones
      const nuevosParticipantes = participantesActuales + 1;
      const deberaCerrar = nuevosParticipantes >= evento.capacidadMaxima || 
                           this.esElDiaDelEvento(evento.fecha);
      
      if (deberaCerrar) {
        console.log('🔒 Cerrando inscripciones y enviando lista a n8n...');
        await this.cerrarInscripcionesYEnviarLista(eventoId);
      }

      return { 
        success: true, 
        message: "Inscripción exitosa",
        data: {
          participante: participanteInfo,
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

  // Marcar asistencia de un participante
  async marcarAsistencia(eventoId, alumnoId) {
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

      // Verificar si ya tiene asistencia marcada
      if (evento.asistentes && evento.asistentes.includes(alumnoId)) {
        return { success: false, error: "La asistencia ya fue marcada" };
      }

      // Marcar asistencia
      const eventoRef = doc(db, "eventos", eventoId);
      await updateDoc(eventoRef, {
        asistentes: arrayUnion(alumnoId)
      });

      return { success: true, message: "Asistencia marcada exitosamente" };
    } catch (error) {
      console.error('Error marcando asistencia:', error);
      return { success: false, error: "Error al marcar asistencia" };
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
        inscripcionesCerradas: true,
        fechaCierreInscripciones: new Date().toISOString(),
        estadoWorkflow: 'inscripciones_cerradas'
      });

      console.log('🔒 Inscripciones cerradas en Firestore');

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

        console.log('📋 Lista de inscritos enviada a n8n:', n8nResult.success);

      } catch (n8nError) {
        console.warn('⚠️ Error enviando lista a n8n:', n8nError);
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
   * Enviar asistencias a n8n (reemplaza "Exportar Lista")
   */
  async enviarAsistenciasN8n(eventoId) {
    try {
      const eventoResult = await this.obtenerEventoPorId(eventoId);
      if (!eventoResult.success) {
        throw new Error('Evento no encontrado');
      }

      const evento = eventoResult.evento;
      const inscritos = evento.participantesInfo || [];
      const asistentes = inscritos.filter(p => evento.asistentes?.includes(p.uid || p.id));

      console.log(`📊 Enviando asistencias: ${asistentes.length}/${inscritos.length}`);

      // Enviar a n8n
      const n8nResult = await n8nService.enviarAsistencias(evento, asistentes, inscritos);

      // Actualizar estado en Firestore
      const eventoRef = doc(db, "eventos", eventoId);
      await updateDoc(eventoRef, {
        'workflowN8n.asistenciasEnviadas': {
          enviadas: n8nResult.success,
          fechaEnvio: new Date().toISOString(),
          totalAsistentes: asistentes.length,
          porcentajeAsistencia: (asistentes.length / inscritos.length * 100).toFixed(2),
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
          totalInscritos: inscritos.length,
          totalAsistentes: asistentes.length,
          porcentajeAsistencia: (asistentes.length / inscritos.length * 100).toFixed(2),
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
  esElDiaDelEvento(fechaEvento) {
    const hoy = new Date().toDateString();
    const fechaEventoDate = new Date(fechaEvento).toDateString();
    return hoy === fechaEventoDate;
  },

  /**
   * Obtener eventos con inscripciones que deberían cerrarse
   */
  async verificarEventosParaCerrar() {
    try {
      const q = query(
        collection(db, "eventos"),
        where("estado", "==", "publicado"),
        where("inscripcionesCerradas", "==", false)
      );

      const querySnapshot = await getDocs(q);
      const eventosParaCerrar = [];

      querySnapshot.forEach((doc) => {
        const evento = { id: doc.id, ...doc.data() };
        const participantesActuales = evento.participantes?.length || 0;
        const capacidadLlena = participantesActuales >= evento.capacidadMaxima;
        const esDiaEvento = this.esElDiaDelEvento(evento.fecha);

        if (capacidadLlena || esDiaEvento) {
          eventosParaCerrar.push({
            ...evento,
            motivo: capacidadLlena ? 'capacidad_maxima' : 'dia_evento'
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