// Hook optimizado con React Query para gestión de eventos desde la perspectiva del alumno
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { firestoreService } from '../../services/firestoreService';
import { useAuth } from './useAuth';
import logger from '../utils/logger';
import toastHelper from '../utils/toastHelper';

// Claves de queries para React Query
export const eventosQueryKeys = {
  all: ['eventos'],
  publicados: () => [...eventosQueryKeys.all, 'publicados'],
  inscripciones: (userId) => [...eventosQueryKeys.all, 'inscripciones', userId],
};

export const useEventosAlumno = () => {
  const queryClient = useQueryClient();
  const { user, userData } = useAuth();

  // ✅ Query para obtener eventos publicados con actualización automática
  // 🔄 Actualiza cada 5 segundos para reflejar cambios en tiempo real
  const {
    data: eventosData,
    isLoading: loadingEventos,
    error: errorEventos,
    refetch: refetchEventos
  } = useQuery({
    queryKey: eventosQueryKeys.publicados(),
    queryFn: async () => {
      logger.log('React Query: Obteniendo eventos publicados...');
      const result = await firestoreService.obtenerEventosPublicados();
      
      if (!result.success) {
        const errorMsg = result.error || 'Error al obtener eventos';
        logger.error('Error obteniendo eventos:', errorMsg);
        toastHelper.error(`Error al cargar eventos: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      logger.log(`${result.eventos.length} eventos obtenidos`);
      return result.eventos;
    },
    enabled: !!user, // Solo ejecuta si hay usuario autenticado
    staleTime: 3 * 1000, // ✅ 3 segundos - Muy frecuente para tiempo real
    gcTime: 5 * 60 * 1000, // 5 minutos en caché
    refetchInterval: 5000, // ✅ Refetch cada 5 segundos - Tiempo real
    refetchIntervalInBackground: false, // Solo cuando la pestaña está activa
    refetchOnWindowFocus: true, // Actualizar al volver al tab
  });

  // Separar eventos disponibles e inscritos usando useMemo para optimización
  const { eventosDisponibles, eventosInscritos } = useMemo(() => {
    if (!eventosData || !user) {
      return { eventosDisponibles: [], eventosInscritos: [] };
    }

    const inscritos = eventosData.filter(evento => 
      evento.participantes && evento.participantes.includes(user.uid)
    );

    return {
      eventosDisponibles: eventosData,
      eventosInscritos: inscritos
    };
  }, [eventosData, user]);

  // Mutación para inscribirse a un evento
  const inscripcionMutation = useMutation({
    mutationFn: async (eventoId) => {
      if (!user) {
        const errorMsg = 'Usuario no autenticado';
        logger.error('❌', errorMsg);
        toastHelper.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      logger.log('📝 Inscribiendo usuario al evento:', eventoId);
      const result = await firestoreService.inscribirAlumnoEvento(
        eventoId, 
        user.uid, 
        user.email,
        userData?.nombre || null,
        userData?.apellido || null
      );
      
      if (!result.success) {
        const errorMsg = result.error || 'Error al inscribirse al evento';
        logger.error('❌ Error en inscripción:', errorMsg);
        throw new Error(errorMsg);
      }
      
      return result;
    },
    onSuccess: (data, eventoId) => {
      logger.log('✅ Inscripción exitosa, actualizando caché');
      toastHelper.success('✅ ¡Inscripción exitosa! Revisa tu email');
      
      // Invalidar caché para recargar eventos
      queryClient.invalidateQueries({ queryKey: eventosQueryKeys.publicados() });
      
      // Actualización optimista del caché
      queryClient.setQueryData(eventosQueryKeys.publicados(), (oldData) => {
        if (!oldData) return oldData;
        
        return oldData.map(evento => {
          if (evento.id === eventoId) {
            return {
              ...evento,
              participantes: [...(evento.participantes || []), user.uid]
            };
          }
          return evento;
        });
      });
    },
    onError: (error) => {
      logger.error('❌ Error en inscripción:', error);
      toastHelper.error(error.message || 'Error al inscribirse');
    }
  });

  // Mutación para desinscribirse de un evento
  const desinscripcionMutation = useMutation({
    mutationFn: async (eventoId) => {
      if (!user) {
        const errorMsg = 'Usuario no autenticado';
        logger.error('❌', errorMsg);
        toastHelper.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      logger.log('🚪 Desinscribiendo usuario del evento:', eventoId);
      const result = await firestoreService.desinscribirAlumnoEvento(eventoId, user.uid);
      
      if (!result.success) {
        const errorMsg = result.error || 'Error al desinscribirse del evento';
        logger.error('❌ Error en desinscripción:', errorMsg);
        throw new Error(errorMsg);
      }
      
      return result;
    },
    onSuccess: (data, eventoId) => {
      logger.log('✅ Desinscripción exitosa, actualizando caché');
      toastHelper.info('ℹ️ Te has desinscrito del evento');
      
      // Invalidar caché para recargar eventos
      queryClient.invalidateQueries({ queryKey: eventosQueryKeys.publicados() });
      
      // Actualización optimista del caché
      queryClient.setQueryData(eventosQueryKeys.publicados(), (oldData) => {
        if (!oldData) return oldData;
        
        return oldData.map(evento => {
          if (evento.id === eventoId) {
            return {
              ...evento,
              participantes: (evento.participantes || []).filter(uid => uid !== user.uid)
            };
          }
          return evento;
        });
      });
    },
    onError: (error) => {
      logger.error('❌ Error en desinscripción:', error);
      toastHelper.error(error.message || 'Error al desinscribirse');
    }
  });

  // Funciones helper mejoradas
  const inscribirseEvento = async (eventoId) => {
    try {
      await inscripcionMutation.mutateAsync(eventoId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const desinscribirseEvento = async (eventoId) => {
    try {
      await desinscripcionMutation.mutateAsync(eventoId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const estaInscrito = (eventoId) => {
    return eventosInscritos.some(evento => evento.id === eventoId);
  };

  const obtenerEvento = (eventoId) => {
    return eventosDisponibles.find(evento => evento.id === eventoId) || null;
  };

  const cargarEventos = () => {
    refetchEventos();
  };

  // Estados unificados
  const loading = loadingEventos || inscripcionMutation.isPending || desinscripcionMutation.isPending;
  const error = errorEventos?.message || inscripcionMutation.error?.message || desinscripcionMutation.error?.message;

  return {
    // Datos
    eventosDisponibles,
    eventosInscritos,
    
    // Acciones
    inscribirseEvento,
    desinscribirseEvento,
    estaInscrito,
    obtenerEvento,
    cargarEventos,
    
    // Estados
    loading,
    error,
    
    // Estados específicos de React Query (para uso avanzado)
    loadingEventos,
    isInscribiendo: inscripcionMutation.isPending,
    isDesinscribiendo: desinscripcionMutation.isPending,
    
    // Funciones de mutación directas (para uso avanzado)
    inscripcionMutation,
    desinscripcionMutation,
  };
};

export default useEventosAlumno;