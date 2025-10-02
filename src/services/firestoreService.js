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

export const firestoreService = {
  // Crear evento
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
        asistentes: []
      };

      const docRef = await addDoc(collection(db, "eventos"), evento);
      return { success: true, id: docRef.id };
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      return { success: false, error: "Error al actualizar evento" };
    }
  },

  // Eliminar evento
  async eliminarEvento(eventoId) {
    try {
      await deleteDoc(doc(db, "eventos", eventoId));
      return { success: true };
    } catch (error) {
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
    } catch (error) {
      return { success: false, error: "Error al obtener evento" };
    }
  },

  // Inscribir alumno a un evento
  async inscribirAlumnoEvento(eventoId, alumnoId, alumnoEmail) {
    try {
      // Primero verificar si el evento existe y tiene espacio
      const eventoResult = await this.obtenerEventoPorId(eventoId);
      if (!eventoResult.success) {
        return { success: false, error: "Evento no encontrado" };
      }

      const evento = eventoResult.evento;
      
      // Verificar si ya está inscrito
      if (evento.participantes && evento.participantes.includes(alumnoId)) {
        return { success: false, error: "Ya estás inscrito en este evento" };
      }

      // Verificar capacidad
      const participantesActuales = evento.participantes ? evento.participantes.length : 0;
      if (participantesActuales >= evento.capacidadMaxima) {
        return { success: false, error: "El evento ha alcanzado su capacidad máxima" };
      }

      // Inscribir al alumno
      const eventoRef = doc(db, "eventos", eventoId);
      await updateDoc(eventoRef, {
        participantes: arrayUnion(alumnoId),
        participantesInfo: arrayUnion({
          id: alumnoId,
          email: alumnoEmail,
          fechaInscripcion: new Date()
        })
      });

      return { success: true, message: "Inscripción exitosa" };
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
  }
};

export default firestoreService;