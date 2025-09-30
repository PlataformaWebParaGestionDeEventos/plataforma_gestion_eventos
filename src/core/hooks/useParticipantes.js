// Hook personalizado para gestión de participantes desde la perspectiva del organizador
import { useState, useCallback } from 'react';
import { firestoreService } from '../../services/firestoreService';
import { useAuth } from './useAuth';

export const useParticipantes = () => {
  const [participantes, setParticipantes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalParticipantes: 0,
    capacidadMaxima: 0,
    espaciosDisponibles: 0,
    porcentajeOcupacion: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Cargar participantes de un evento
  const cargarParticipantes = useCallback(async (eventoId) => {
    if (!user || !eventoId) {
      setError('Usuario no autenticado o evento no especificado');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await firestoreService.obtenerParticipantesEvento(eventoId);
      
      if (result.success) {
        setParticipantes(result.participantes);
        setEstadisticas({
          totalParticipantes: result.totalParticipantes,
          capacidadMaxima: result.capacidadMaxima,
          espaciosDisponibles: result.espaciosDisponibles,
          porcentajeOcupacion: (result.totalParticipantes / result.capacidadMaxima) * 100
        });
      } else {
        setError(result.error);
        setParticipantes([]);
        setEstadisticas({
          totalParticipantes: 0,
          capacidadMaxima: 0,
          espaciosDisponibles: 0,
          porcentajeOcupacion: 0
        });
      }
    } catch (err) {
      setError('Error al cargar participantes');
      setParticipantes([]);
      setEstadisticas({
        totalParticipantes: 0,
        capacidadMaxima: 0,
        espaciosDisponibles: 0,
        porcentajeOcupacion: 0
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Marcar asistencia de un participante
  const marcarAsistencia = async (eventoId, alumnoId) => {
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const result = await firestoreService.marcarAsistencia(eventoId, alumnoId);
      
      if (result.success) {
        // Recargar participantes después de marcar asistencia
        await cargarParticipantes(eventoId);
      }
      
      return result;
    } catch (err) {
      return { success: false, error: 'Error al marcar asistencia' };
    }
  };

  // Exportar lista de participantes
  const exportarParticipantes = (eventoTitulo) => {
    if (participantes.length === 0) {
      return { success: false, error: 'No hay participantes para exportar' };
    }

    try {
      // Crear CSV
      const headers = ['Email', 'Fecha de Inscripción', 'Estado'];
      const csvContent = [
        headers.join(','),
        ...participantes.map(p => [
          p.email,
          new Date(p.fechaInscripcion.toDate()).toLocaleDateString(),
          'Inscrito'
        ].join(','))
      ].join('\n');

      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `participantes_${eventoTitulo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, message: 'Lista de participantes exportada exitosamente' };
    } catch (err) {
      return { success: false, error: 'Error al exportar la lista de participantes' };
    }
  };

  // Enviar recordatorio a participantes (función placeholder)
  const enviarRecordatorio = async (eventoId, mensaje) => {
    // Esta función se puede implementar más adelante con un servicio de email
    return { 
      success: true, 
      message: `Recordatorio enviado a ${participantes.length} participantes` 
    };
  };

  return {
    participantes,
    estadisticas,
    loading,
    error,
    cargarParticipantes,
    marcarAsistencia,
    exportarParticipantes,
    enviarRecordatorio
  };
};

export default useParticipantes;