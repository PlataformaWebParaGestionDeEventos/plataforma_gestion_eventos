// Hook personalizado para gestión de eventos
import { useState, useCallback } from 'react';
import { firestoreService } from '../../services/firestoreService';
import { useAuth } from './useAuth';

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Cargar eventos
  const loadEvents = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (options.filterByOrganizer && user) {
        // Cargar eventos del organizador actual
        result = await firestoreService.obtenerEventosOrganizador(user.uid);
      } else {
        // Cargar eventos publicados
        result = await firestoreService.obtenerEventosPublicados();
      }

      if (result.success) {
        setEvents(result.eventos);
      } else {
        setError(result.error);
        setEvents([]);
      }
    } catch (err) {
      setError('Error al cargar eventos');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Crear evento
  const createEvent = async (eventData) => {
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await firestoreService.crearEvento(eventData);
      if (result.success) {
        await loadEvents({ filterByOrganizer: true }); // Recargar eventos del organizador
      } else {
        setError(result.error);
      }
      return result;
    } catch (err) {
      const errorMsg = 'Error al crear evento';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar evento
  const updateEvent = async (eventoId, eventData) => {
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await firestoreService.actualizarEvento(eventoId, eventData);
      if (result.success) {
        await loadEvents({ filterByOrganizer: true }); // Recargar eventos del organizador
      } else {
        setError(result.error);
      }
      return result;
    } catch (err) {
      const errorMsg = 'Error al actualizar evento';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Eliminar evento
  const deleteEvent = async (eventoId) => {
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await firestoreService.eliminarEvento(eventoId);
      if (result.success) {
        await loadEvents({ filterByOrganizer: true }); // Recargar eventos del organizador
      } else {
        setError(result.error);
      }
      return result;
    } catch (err) {
      const errorMsg = 'Error al eliminar evento';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Verificar conflictos de horario
  const checkScheduleConflict = async (fecha, hora, ubicacion, excludeEventId = null) => {
    try {
      const result = await firestoreService.verificarConflictoHorario(fecha, hora, ubicacion, excludeEventId);
      return result.hasConflict;
    } catch (err) {
      console.error('Error verificando conflictos:', err);
      return false;
    }
  };

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    loadEvents,
    checkScheduleConflict
  };
};

export default useEvents;