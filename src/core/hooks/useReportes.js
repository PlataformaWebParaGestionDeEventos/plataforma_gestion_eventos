import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/credenciales';

/**
 * Hook personalizado para generar reportes y estadísticas de eventos
 */
const useReportes = (organizadorEmail) => {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar eventos del organizador
  useEffect(() => {
    const cargarEventos = async () => {
      if (!organizadorEmail) return;

      try {
        setCargando(true);
        // ✅ Removido orderBy para evitar necesidad de índice compuesto
        const q = query(
          collection(db, 'eventos'),
          where('organizador', '==', organizadorEmail)
        );

        const snapshot = await getDocs(q);
        const eventosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Ordenar en cliente por fecha (descendente)
        eventosData.sort((a, b) => {
          const fechaA = new Date(a.fecha || '1970-01-01');
          const fechaB = new Date(b.fecha || '1970-01-01');
          return fechaB - fechaA;
        });

        setEventos(eventosData);
        setError(null);
      } catch (err) {
        console.error('Error cargando eventos para reportes:', err);
        setError('Error al cargar datos de reportes');
      } finally {
        setCargando(false);
      }
    };

    cargarEventos();
  }, [organizadorEmail]);

  // ========== ESTADÍSTICAS GENERALES ==========
  const estadisticasGenerales = useMemo(() => {
    const totalEventos = eventos.length;
    const eventosPublicados = eventos.filter(e => e.estado === 'publicado').length;
    const eventosBorrador = eventos.filter(e => e.estado === 'borrador').length;
    const eventosCancelados = eventos.filter(e => e.estado === 'cancelado').length;

    const totalInscritos = eventos.reduce((sum, e) => sum + (e.participantes?.length || 0), 0);
    const totalAsistentes = eventos.reduce((sum, e) => sum + (e.asistentes?.length || 0), 0);
    const totalCapacidad = eventos.reduce((sum, e) => sum + (parseInt(e.capacidadMaxima) || 0), 0);

    const promedioAsistencia = totalInscritos > 0 
      ? ((totalAsistentes / totalInscritos) * 100).toFixed(1)
      : 0;

    const promedioOcupacion = totalCapacidad > 0
      ? ((totalInscritos / totalCapacidad) * 100).toFixed(1)
      : 0;

    return {
      totalEventos,
      eventosPublicados,
      eventosBorrador,
      eventosCancelados,
      totalInscritos,
      totalAsistentes,
      totalCapacidad,
      promedioAsistencia,
      promedioOcupacion
    };
  }, [eventos]);

  // ========== EVENTOS POR TIPO ==========
  const eventosPorTipo = useMemo(() => {
    const tipos = {};
    
    eventos.forEach(evento => {
      const tipo = evento.tipo || 'Sin tipo';
      if (!tipos[tipo]) {
        tipos[tipo] = {
          tipo,
          cantidad: 0,
          inscritos: 0,
          asistentes: 0
        };
      }
      tipos[tipo].cantidad++;
      tipos[tipo].inscritos += (evento.participantes?.length || 0);
      tipos[tipo].asistentes += (evento.asistentes?.length || 0);
    });

    return Object.values(tipos).sort((a, b) => b.cantidad - a.cantidad);
  }, [eventos]);

  // ========== EVENTOS POR MES ==========
  const eventosPorMes = useMemo(() => {
    const meses = {};
    const mesesNombres = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    eventos.forEach(evento => {
      if (!evento.fecha) return;

      try {
        const fecha = new Date(evento.fecha);
        const mes = fecha.getMonth();
        const año = fecha.getFullYear();
        const clave = `${año}-${mes}`;
        const nombre = `${mesesNombres[mes]} ${año}`;

        if (!meses[clave]) {
          meses[clave] = {
            mes: nombre,
            eventos: 0,
            inscritos: 0,
            asistentes: 0,
            orden: fecha.getTime()
          };
        }

        meses[clave].eventos++;
        meses[clave].inscritos += (evento.participantes?.length || 0);
        meses[clave].asistentes += (evento.asistentes?.length || 0);
      } catch (error) {
        console.error('Error procesando fecha:', evento.fecha, error);
      }
    });

    return Object.values(meses).sort((a, b) => a.orden - b.orden);
  }, [eventos]);

  // ========== TOP EVENTOS POR ASISTENCIA ==========
  const topEventosPorAsistencia = useMemo(() => {
    return [...eventos]
      .filter(e => e.asistentes && e.asistentes.length > 0)
      .sort((a, b) => (b.asistentes?.length || 0) - (a.asistentes?.length || 0))
      .slice(0, 5)
      .map(e => ({
        id: e.id,
        titulo: e.titulo,
        asistentes: e.asistentes?.length || 0,
        inscritos: e.participantes?.length || 0,
        porcentaje: e.participantes?.length > 0
          ? ((e.asistentes?.length / e.participantes?.length) * 100).toFixed(1)
          : 0,
        fecha: e.fecha
      }));
  }, [eventos]);

  // ========== TOP EVENTOS POR INSCRIPCIONES ==========
  const topEventosPorInscripciones = useMemo(() => {
    return [...eventos]
      .filter(e => e.participantes && e.participantes.length > 0)
      .sort((a, b) => (b.participantes?.length || 0) - (a.participantes?.length || 0))
      .slice(0, 5)
      .map(e => ({
        id: e.id,
        titulo: e.titulo,
        inscritos: e.participantes?.length || 0,
        capacidad: e.capacidadMaxima || 0,
        ocupacion: e.capacidadMaxima > 0
          ? ((e.participantes?.length / e.capacidadMaxima) * 100).toFixed(1)
          : 0,
        fecha: e.fecha
      }));
  }, [eventos]);

  // ========== TASA DE CONVERSIÓN (Inscripciones → Asistencia) ==========
  const tasaConversion = useMemo(() => {
    const eventosConDatos = eventos.filter(e => 
      e.participantes && e.participantes.length > 0 &&
      e.asistentes && e.asistentes.length > 0
    );

    return eventosConDatos.map(e => ({
      titulo: e.titulo,
      inscritos: e.participantes?.length || 0,
      asistieron: e.asistentes?.length || 0,
      noAsistieron: (e.participantes?.length || 0) - (e.asistentes?.length || 0),
      tasa: e.participantes?.length > 0
        ? ((e.asistentes?.length / e.participantes?.length) * 100).toFixed(1)
        : 0,
      fecha: e.fecha
    })).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [eventos]);

  // ========== ESTADO DE INSCRIPCIONES ==========
  const estadoInscripciones = useMemo(() => {
    let abiertas = 0;
    let cerradas = 0;
    let completas = 0;

    eventos.forEach(evento => {
      const inscritos = evento.participantes?.length || 0;
      const capacidad = parseInt(evento.capacidadMaxima) || 0;

      if (evento.inscripcionesCerradas) {
        cerradas++;
      } else if (inscritos >= capacidad) {
        completas++;
      } else {
        abiertas++;
      }
    });

    return {
      abiertas,
      cerradas,
      completas,
      total: eventos.length
    };
  }, [eventos]);

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
