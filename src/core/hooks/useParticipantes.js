// Hook optimizado con React Query para gestión de participantes desde la perspectiva del organizador
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { firestoreService } from '../../services/firestoreService';
import { useAuth } from './useAuth';

// Claves de queries para participantes
export const participantesQueryKeys = {
  all: ['participantes'],
  byEvento: (eventoId) => [...participantesQueryKeys.all, 'evento', eventoId],
  estadisticas: (eventoId) => [...participantesQueryKeys.all, 'estadisticas', eventoId],
};

export const useParticipantes = (eventoId = null) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Query para obtener participantes de un evento específico
  const {
    data: participantesData,
    isLoading: loadingParticipantes,
    error: errorParticipantes,
    refetch: refetchParticipantes
  } = useQuery({
    queryKey: participantesQueryKeys.byEvento(eventoId),
    queryFn: async () => {
      if (!eventoId) throw new Error('ID de evento requerido');
      
      console.log('React Query: Obteniendo participantes del evento:', eventoId);
      const result = await firestoreService.obtenerParticipantesEvento(eventoId);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al obtener participantes');
      }
      
      console.log('React Query: Participantes obtenidos:', result.participantes.length);
      return result;
    },
    enabled: !!user && !!eventoId, // Solo ejecuta si hay usuario y eventoId
    staleTime: 1 * 60 * 1000, // 1 minuto (datos más dinámicos)
    gcTime: 3 * 60 * 1000, // 3 minutos en caché
  });

  // Calcular estadísticas usando useMemo
  const estadisticas = useMemo(() => {
    if (!participantesData) {
      return {
        totalParticipantes: 0,
        capacidadMaxima: 0,
        espaciosDisponibles: 0,
        porcentajeOcupacion: 0
      };
    }

    const total = participantesData.totalParticipantes;
    const capacidad = participantesData.capacidadMaxima;
    
    return {
      totalParticipantes: total,
      capacidadMaxima: capacidad,
      espaciosDisponibles: Math.max(0, capacidad - total),
      porcentajeOcupacion: capacidad > 0 ? (total / capacidad) * 100 : 0
    };
  }, [participantesData]);

  // Extraer lista de participantes
  const participantes = participantesData?.participantes || [];

  // Mutación para marcar asistencia
  const asistenciaMutation = useMutation({
    mutationFn: async ({ eventoId: evId, alumnoId }) => {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      
      console.log('React Query: Marcando asistencia para alumno:', alumnoId);
      const result = await firestoreService.marcarAsistencia(evId, alumnoId);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al marcar asistencia');
      }
      
      return result;
    },
    onSuccess: (data, variables) => {
      console.log('React Query: Asistencia marcada exitosamente, invalidando caché');
      // Invalidar caché para recargar participantes
      queryClient.invalidateQueries({ 
        queryKey: participantesQueryKeys.byEvento(variables.eventoId) 
      });
      
      // También invalidar eventos para actualizar contadores
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
    },
    onError: (error) => {
      console.error('React Query: Error al marcar asistencia:', error);
    }
  });

  // Función helper para cargar participantes manualmente
  const cargarParticipantes = (evId) => {
    if (evId && evId !== eventoId) {
      // Si es un evento diferente, invalidar esa query específica
      queryClient.invalidateQueries({ 
        queryKey: participantesQueryKeys.byEvento(evId) 
      });
    } else {
      // Refetch de la query actual
      refetchParticipantes();
    }
  };

  // Función para marcar asistencia
  const marcarAsistencia = async (evId, alumnoId) => {
    try {
      await asistenciaMutation.mutateAsync({ eventoId: evId, alumnoId });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Función para exportar participantes (mejorada)
  const exportarParticipantes = (eventoTitulo) => {
    if (participantes.length === 0) {
      return { success: false, error: 'No hay participantes para exportar' };
    }

    try {
      // Crear CSV con más información
      const headers = [
        'Email',
        'Fecha de Inscripción',
        'Estado',
        'Total Participantes',
        'Capacidad Máxima',
        'Espacios Disponibles'
      ];
      
      const csvContent = [
        headers.join(','),
        ...participantes.map((p, index) => [
          p.email,
          new Date(p.fechaInscripcion.toDate()).toLocaleDateString('es-ES'),
          'Inscrito',
          // Solo incluir estadísticas en la primera fila
          index === 0 ? estadisticas.totalParticipantes : '',
          index === 0 ? estadisticas.capacidadMaxima : '',
          index === 0 ? estadisticas.espaciosDisponibles : ''
        ].join(','))
      ].join('\n');

      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 
        `participantes_${eventoTitulo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { 
        success: true, 
        message: `Lista de ${participantes.length} participantes exportada exitosamente` 
      };
    } catch (err) {
      console.error('Error al exportar participantes:', err);
      return { success: false, error: 'Error al exportar la lista de participantes' };
    }
  };

  // Función placeholder para enviar recordatorios
  const enviarRecordatorio = async (evId, mensaje) => {
    // Simular envío de recordatorio
    console.log(`Enviando recordatorio para evento ${evId}: ${mensaje}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: true, 
          message: `Recordatorio enviado a ${participantes.length} participantes` 
        });
      }, 1000);
    });
  };

  // Estados unificados
  const loading = loadingParticipantes || asistenciaMutation.isPending;
  const error = errorParticipantes?.message || asistenciaMutation.error?.message;

  return {
    // Datos
    participantes,
    estadisticas,
    
    // Acciones
    cargarParticipantes,
    marcarAsistencia,
    exportarParticipantes,
    enviarRecordatorio,
    
    // Estados
    loading,
    error,
    
    // Estados específicos de React Query (para uso avanzado)
    loadingParticipantes,
    isMarcandoAsistencia: asistenciaMutation.isPending,
    
    // Funciones de mutación directas (para uso avanzado)
    asistenciaMutation,
    
    // Funciones de utilidad
    refetchParticipantes,
  };
};

export default useParticipantes;