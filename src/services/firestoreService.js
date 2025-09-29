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
  orderBy,
  getDoc 
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
      const q = query(
        collection(db, "eventos"),
        where("estado", "==", "publicado"),
        orderBy("fecha", "asc")
      );
      
      const querySnapshot = await getDocs(q);
      const eventos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, eventos };
    } catch (error) {
      return { success: false, error: "Error al cargar eventos", eventos: [] };
    }
  },

  // Obtener eventos de un organizador
  async obtenerEventosOrganizador(organizadorId) {
    try {
      const q = query(
        collection(db, "eventos"),
        where("organizadorId", "==", organizadorId),
        orderBy("fechaCreacion", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const eventos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

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
  }
};

export default firestoreService;