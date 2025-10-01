// Hook optimizado con React Query para gestión de eventos desde la perspectiva del alumno
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { firestoreService } from '../../services/firestoreService';
import { getAuth } from 'firebase/auth';
import appFirebase from '../../config/credenciales';

const auth = getAuth(appFirebase);

// Claves de queries para React Query
export const eventosQueryKeys = {
  all: ['eventos'],
  publicados: () => [...eventosQueryKeys.all, 'publicados'],
  inscripciones: (userId) => [...eventosQueryKeys.all, 'inscripciones', userId],
};

export const useEventosAlumno = () => {
  const queryClient = useQueryClient();
  const user = auth.currentUser;

  // Query para obtener eventos publicados
  const {
    data: eventosData,
    isLoading: loadingEventos,
    error: errorEventos,
    refetch: refetchEventos
  } = useQuery({
    queryKey: eventosQueryKeys.publicados(),
    queryFn: async () => {
      console.log('React Query: Obteniendo eventos publicados...');
      const result = await firestoreService.obtenerEventosPublicados();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al obtener eventos');
      }
      
      console.log('React Query: Eventos obtenidos:', result.eventos.length);
      return result.eventos;
    },
    enabled: !!user, // Solo ejecuta si hay usuario autenticado
    staleTime: 2 * 60 * 1000, // 2 minutos para eventos (datos más dinámicos)
    gcTime: 5 * 60 * 1000, // 5 minutos en caché
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
        throw new Error('Usuario no autenticado');
      }
      
      console.log('React Query: Inscribiendo usuario al evento:', eventoId);
      const result = await firestoreService.inscribirAlumnoEvento(eventoId, user.uid, user.email);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al inscribirse al evento');
      }
      
      return result;
    },
    onSuccess: (data, eventoId) => {
      console.log('React Query: Inscripción exitosa, invalidando caché');
      // Invalidar caché para recargar eventos
      queryClient.invalidateQueries({ queryKey: eventosQueryKeys.publicados() });
      
      // Opcional: Actualización optimista del caché
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
      console.error('React Query: Error en inscripción:', error);
    }
  });

  // Mutación para desinscribirse de un evento
  const desinscripcionMutation = useMutation({
    mutationFn: async (eventoId) => {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      
      console.log('React Query: Desinscribiendo usuario del evento:', eventoId);
      const result = await firestoreService.desinscribirAlumnoEvento(eventoId, user.uid);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al desinscribirse del evento');
      }
      
      return result;
    },
    onSuccess: (data, eventoId) => {
      console.log('React Query: Desinscripción exitosa, invalidando caché');
      // Invalidar caché para recargar eventos
      queryClient.invalidateQueries({ queryKey: eventosQueryKeys.publicados() });
      
      // Opcional: Actualización optimista del caché
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
      console.error('React Query: Error en desinscripción:', error);
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