// Hook personalizado para gestión de eventos desde la perspectiva del alumno
import { useState, useEffect, useCallback } from 'react';
import { firestoreService } from '../../services/firestoreService';
import { getAuth } from 'firebase/auth';
import appFirebase from '../../config/credenciales';

const auth = getAuth(appFirebase);

export const useEventosAlumno = () => {
  const [eventosDisponibles, setEventosDisponibles] = useState([]);
  const [eventosInscritos, setEventosInscritos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar eventos disponibles y eventos en los que está inscrito
  const cargarEventos = useCallback(async () => {
    const user = auth.currentUser;
    console.log('Usuario actual en cargarEventos:', user);
    
    if (!user) {
      console.log('No hay usuario autenticado');
      setError('Usuario no autenticado');
      return;
    }

    console.log('Iniciando carga de eventos...');
    setLoading(true);
    setError(null);
    
    try {
      // Cargar eventos publicados disponibles
      console.log('Llamando a firestoreService.obtenerEventosPublicados...');
      const resultEventos = await firestoreService.obtenerEventosPublicados();
      console.log('Resultado de obtenerEventosPublicados:', resultEventos);
      
      if (resultEventos.success) {
        const eventos = resultEventos.eventos;
        console.log('Eventos obtenidos:', eventos);
        
        // Separar eventos disponibles de eventos inscritos
        const inscritos = eventos.filter(evento => 
          evento.participantes && evento.participantes.includes(user.uid)
        );
        
        // Mostrar todos los eventos publicados como disponibles
        const disponibles = eventos;

        console.log('Eventos disponibles:', disponibles.length);
        console.log('Eventos inscritos:', inscritos.length);

        setEventosDisponibles(disponibles);
        setEventosInscritos(inscritos);
      } else {
        console.error('Error obteniendo eventos:', resultEventos.error);
        setError(resultEventos.error);
        setEventosDisponibles([]);
        setEventosInscritos([]);
      }
    } catch (err) {
      console.error('Error en cargarEventos:', err);
      setError('Error al cargar eventos');
      setEventosDisponibles([]);
      setEventosInscritos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Inscribirse a un evento
  const inscribirseEvento = async (eventoId) => {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const result = await firestoreService.inscribirAlumnoEvento(eventoId, user.uid, user.email);
      
      if (result.success) {
        // Recargar eventos después de la inscripción
        await cargarEventos();
      }
      
      return result;
    } catch (err) {
      console.error('Error en inscribirseEvento:', err);
      return { success: false, error: 'Error al inscribirse al evento' };
    }
  };

  // Desinscribirse de un evento
  const desinscribirseEvento = async (eventoId) => {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const result = await firestoreService.desinscribirAlumnoEvento(eventoId, user.uid);
      
      if (result.success) {
        // Recargar eventos después de la desinscripción
        await cargarEventos();
      }
      
      return result;
    } catch (err) {
      console.error('Error en desinscribirseEvento:', err);
      return { success: false, error: 'Error al desinscribirse del evento' };
    }
  };

  // Verificar si está inscrito en un evento
  const estaInscrito = (eventoId) => {
    return eventosInscritos.some(evento => evento.id === eventoId);
  };

  // Obtener un evento específico por ID
  const obtenerEvento = (eventoId) => {
    const eventoDisponible = eventosDisponibles.find(evento => evento.id === eventoId);
    const eventoInscrito = eventosInscritos.find(evento => evento.id === eventoId);
    return eventoDisponible || eventoInscrito || null;
  };

  // Cargar eventos al montar el componente
  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  return {
    eventosDisponibles,
    eventosInscritos,
    inscribirseEvento,
    desinscribirseEvento,
    estaInscrito,
    obtenerEvento,
    cargarEventos,
    loading,
    error
  };
};

export default useEventosAlumno;