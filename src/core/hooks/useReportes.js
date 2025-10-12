import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/credenciales';
import reportesService from '../../services/reportesService';
import logger from '../utils/logger';

/**
 * Hook personalizado para generar reportes y estadísticas de eventos
 * @param {string} organizadorEmail - Email del organizador
 * @param {string} eventoId - ID del evento (opcional, para reportes individuales)
 */
const useReportes = (organizadorEmail, eventoId = null) => {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar eventos del organizador
  useEffect(() => {
    const cargarEventos = async () => {
      if (!organizadorEmail) return;

      try {
        setCargando(true);
        logger.info('📊 Cargando eventos para reportes...');
        
        // ✅ Removido orderBy para evitar necesidad de índice compuesto
        const q = query(
          collection(db, 'eventos'),
          where('organizador', '==', organizadorEmail)
        );

        const snapshot = await getDocs(q);
        let eventosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Si se especificó un eventoId, filtrar solo ese evento
        if (eventoId) {
          eventosData = eventosData.filter(evento => evento.id === eventoId);
          logger.log(`✅ Reporte individual para evento: ${eventoId}`);
        }

        // Ordenar en cliente por fecha (descendente)
        eventosData.sort((a, b) => {
          const fechaA = new Date(a.fecha || '1970-01-01');
          const fechaB = new Date(b.fecha || '1970-01-01');
          return fechaB - fechaA;
        });

        setEventos(eventosData);
        setError(null);
        logger.log(`✅ ${eventosData.length} eventos cargados para reportes`);
      } catch (err) {
        logger.error('❌ Error cargando eventos para reportes:', err);
        setError('Error al cargar datos de reportes');
      } finally {
        setCargando(false);
      }
    };

    cargarEventos();
    
    // ⚡ Refetch automático cada 2 minutos (optimizado para reportes)
    // Los reportes no necesitan actualizarse tan frecuentemente
    const intervalId = setInterval(() => {
      logger.log('🔄 Refetch automático de reportes (cada 2 min)');
      cargarEventos();
    }, 2 * 60 * 1000); // 120 segundos

    return () => clearInterval(intervalId);
  }, [organizadorEmail, eventoId]);

  // ========== ESTADÍSTICAS GENERALES ==========
  const estadisticasGenerales = useMemo(() => 
    reportesService.calcularEstadisticasGenerales(eventos), 
  [eventos]);

  // ========== EVENTOS POR TIPO ==========
  const eventosPorTipo = useMemo(() => 
    reportesService.agruparEventosPorTipo(eventos), 
  [eventos]);

  // ========== EVENTOS POR MES ==========
  const eventosPorMes = useMemo(() => 
    reportesService.agruparEventosPorMes(eventos), 
  [eventos]);

  // ========== TOP EVENTOS POR ASISTENCIA ==========
  const topEventosPorAsistencia = useMemo(() => 
    reportesService.obtenerTopEventosPorAsistencia(eventos, 5), 
  [eventos]);

  // ========== TOP EVENTOS POR INSCRIPCIONES ==========
  const topEventosPorInscripciones = useMemo(() => 
    reportesService.obtenerTopEventosPorInscripciones(eventos, 5), 
  [eventos]);

  // ========== TASA DE CONVERSIÓN (Inscripciones → Asistencia) ==========
  const tasaConversion = useMemo(() => 
    reportesService.calcularTasaConversion(eventos), 
  [eventos]);

  // ========== ESTADO DE INSCRIPCIONES ==========
  const estadoInscripciones = useMemo(() => 
    reportesService.calcularEstadoInscripciones(eventos), 
  [eventos]);

  return {
    eventos,
    cargando,
    error,
    estadisticasGenerales,
    eventosPorTipo,
    eventosPorMes,
    topEventosPorAsistencia,
    topEventosPorInscripciones,
    tasaConversion,
    estadoInscripciones
  };
};

export default useReportes;
