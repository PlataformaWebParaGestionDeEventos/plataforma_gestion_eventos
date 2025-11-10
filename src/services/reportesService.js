/**
 * Servicio de Reportes
 * Lógica pura de cálculo de estadísticas y análisis
 */

/**
 * ============================================
 * FUNCIONES HELPER PARA ASISTENTES
 * ============================================
 */

/**
 * Obtener asistentes únicos globales del evento
 * @param {Object} evento - Evento completo
 * @returns {Array} Array de UIDs únicos que asistieron
 */
const obtenerAsistentesGlobales = (evento) => {
  if (!evento) return [];
  
  const asistentesSet = new Set();
  
  // Si tiene asistenciasPorDia
  if (evento.asistenciasPorDia) {
    Object.values(evento.asistenciasPorDia).forEach(dia => {
      if (dia.asistentes && Array.isArray(dia.asistentes)) {
        dia.asistentes.forEach(uid => asistentesSet.add(uid));
      }
    });
  }
  
  // Si tiene asistenciasPorPonente
  if (evento.asistenciasPorPonente) {
    Object.values(evento.asistenciasPorPonente).forEach(ponente => {
      if (ponente.asistentes && Array.isArray(ponente.asistentes)) {
        ponente.asistentes.forEach(uid => asistentesSet.add(uid));
      }
    });
  }
  
  // Fallback al array global de asistentes
  if (evento.asistentes && Array.isArray(evento.asistentes)) {
    evento.asistentes.forEach(uid => asistentesSet.add(uid));
  }
  
  return Array.from(asistentesSet);
};

/**
 * ============================================
 * ESTADÍSTICAS GENERALES
 * ============================================
 */

/**
 * Calcula estadísticas generales de los eventos
 */
export const calcularEstadisticasGenerales = (eventos) => {
  // 🔧 FIX: Validar que eventos sea un array
  const eventosArray = Array.isArray(eventos) ? eventos : [];
  
  const totalEventos = eventosArray.length;
  const eventosPublicados = eventosArray.filter(e => e.estado === 'publicado').length;
  const eventosBorrador = eventosArray.filter(e => e.estado === 'borrador').length;
  const eventosCancelados = eventosArray.filter(e => e.estado === 'cancelado').length;

  const totalInscritos = eventosArray.reduce((sum, e) => sum + (e.participantes?.length || 0), 0);
  // ✅ FIX: Usar obtenerAsistentesGlobales en lugar de e.asistentes
  const totalAsistentes = eventosArray.reduce((sum, e) => sum + obtenerAsistentesGlobales(e).length, 0);
  const totalCapacidad = eventosArray.reduce((sum, e) => sum + (parseInt(e.capacidadMaxima) || 0), 0);

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
};

/**
 * Agrupa eventos por tipo
 */
export const agruparEventosPorTipo = (eventos) => {
  // 🔧 FIX: Validar que eventos sea un array
  const eventosArray = Array.isArray(eventos) ? eventos : [];
  const tipos = {};
  
  eventosArray.forEach(evento => {
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
    // ✅ FIX: Usar obtenerAsistentesGlobales
    tipos[tipo].asistentes += obtenerAsistentesGlobales(evento).length;
  });

  return Object.values(tipos).sort((a, b) => b.cantidad - a.cantidad);
};

/**
 * Agrupa eventos por mes
 */
export const agruparEventosPorMes = (eventos) => {
  // 🔧 FIX: Validar que eventos sea un array
  const eventosArray = Array.isArray(eventos) ? eventos : [];
  const meses = {};
  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  eventosArray.forEach(evento => {
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
      // ✅ FIX: Usar obtenerAsistentesGlobales
      meses[clave].asistentes += obtenerAsistentesGlobales(evento).length;
    } catch (error) {
      console.error('Error procesando fecha:', evento.fecha, error);
    }
  });

  return Object.values(meses).sort((a, b) => a.orden - b.orden);
};

/**
 * Obtiene top eventos por asistencia
 */
export const obtenerTopEventosPorAsistencia = (eventos, limite = 5) => {
  // 🔧 FIX: Validar que eventos sea un array
  const eventosArray = Array.isArray(eventos) ? eventos : [];
  return [...eventosArray]
    .map(e => {
      const asistentes = obtenerAsistentesGlobales(e);
      return { ...e, _asistentesCount: asistentes.length };
    })
    .filter(e => e._asistentesCount > 0)
    .sort((a, b) => b._asistentesCount - a._asistentesCount)
    .slice(0, limite)
    .map(e => ({
      id: e.id,
      titulo: e.titulo,
      asistentes: e._asistentesCount,
      inscritos: e.participantes?.length || 0,
      porcentaje: e.participantes?.length > 0
        ? ((e._asistentesCount / e.participantes?.length) * 100).toFixed(1)
        : 0,
      fecha: e.fecha
    }));
};

/**
 * Obtiene top eventos por inscripciones
 */
export const obtenerTopEventosPorInscripciones = (eventos, limite = 5) => {
  // 🔧 FIX: Validar que eventos sea un array
  const eventosArray = Array.isArray(eventos) ? eventos : [];
  return [...eventosArray]
    .filter(e => e.participantes && e.participantes.length > 0)
    .sort((a, b) => (b.participantes?.length || 0) - (a.participantes?.length || 0))
    .slice(0, limite)
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
};

/**
 * Calcula tasa de conversión (Inscripciones → Asistencia)
 */
export const calcularTasaConversion = (eventos) => {
  // 🔧 FIX: Validar que eventos sea un array
  const eventosArray = Array.isArray(eventos) ? eventos : [];
  // ✅ FIX: Usar obtenerAsistentesGlobales
  const eventosConDatos = eventosArray.filter(e => {
    const asistentes = obtenerAsistentesGlobales(e);
    return e.participantes && e.participantes.length > 0 && asistentes.length > 0;
  });

  return eventosConDatos.map(e => {
    const asistentes = obtenerAsistentesGlobales(e);
    const inscritos = e.participantes?.length || 0;
    const asistieron = asistentes.length;
    return {
      titulo: e.titulo,
      inscritos,
      asistieron,
      noAsistieron: inscritos - asistieron,
      tasa: inscritos > 0
        ? ((asistieron / inscritos) * 100).toFixed(1)
        : 0,
      fecha: e.fecha
    };
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
};

/**
 * Calcula estado de inscripciones
 */
export const calcularEstadoInscripciones = (eventos) => {
  // 🔧 FIX: Validar que eventos sea un array
  const eventosArray = Array.isArray(eventos) ? eventos : [];
  let abiertas = 0;
  let cerradas = 0;
  let completas = 0;

  eventosArray.forEach(evento => {
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
    total: eventosArray.length
  };
};

/**
 * ============================================
 * REPORTES PARA EVENTO INDIVIDUAL
 * ============================================
 */

/**
 * Obtener método de registro de un asistente
 * @param {Object} evento - Evento completo
 * @param {String} uid - UID del asistente
 * @returns {String} 'qr' o 'manual'
 */
const obtenerMetodoRegistro = (evento, uid) => {
  if (!evento || !uid) return 'manual';
  
  // Buscar en asistenciasPorDia
  if (evento.asistenciasPorDia) {
    for (const dia of Object.values(evento.asistenciasPorDia)) {
      if (dia.participantesInfo && Array.isArray(dia.participantesInfo)) {
        const participante = dia.participantesInfo.find(p => p.uid === uid || p.id === uid);
        if (participante && participante.metodo) {
          return participante.metodo;
        }
      }
    }
  }
  
  // Buscar en asistenciasPorPonente
  if (evento.asistenciasPorPonente) {
    for (const ponente of Object.values(evento.asistenciasPorPonente)) {
      if (ponente.participantesInfo && Array.isArray(ponente.participantesInfo)) {
        const participante = ponente.participantesInfo.find(p => p.uid === uid || p.id === uid);
        if (participante && participante.metodo) {
          return participante.metodo;
        }
      }
    }
  }
  
  return 'manual'; // Por defecto
};

/**
 * Calcular estadísticas específicas de un evento individual
 * @param {Object} evento - Evento con todas sus propiedades
 * @returns {Object} Estadísticas del evento
 */
export const calcularEstadisticasEvento = (evento) => {
  if (!evento) return null;

  const totalInscritos = evento.participantes?.length || 0;
  // ✅ FIX: Usar capacidadMaxima en lugar de cuposDisponibles
  const publicoObjetivo = evento.capacidadMaxima || 0;
  
  // Obtener asistentes únicos (global del evento)
  const asistentesUnicos = obtenerAsistentesGlobales(evento);
  const totalAsistentes = asistentesUnicos.length;
  
  // Calcular porcentajes
  const porcentajeInscritosVsObjetivo = publicoObjetivo > 0 
    ? ((totalInscritos / publicoObjetivo) * 100).toFixed(1) 
    : 0;
    
  const porcentajeAsistentesVsInscritos = totalInscritos > 0 
    ? ((totalAsistentes / totalInscritos) * 100).toFixed(1) 
    : 0;
  
  // Calcular asistencias por método
  let asistentesPorQR = 0;
  let asistentesManual = 0;
  
  asistentesUnicos.forEach(uid => {
    const metodo = obtenerMetodoRegistro(evento, uid);
    if (metodo === 'qr') asistentesPorQR++;
    else if (metodo === 'manual') asistentesManual++;
  });
  
  return {
    totalInscritos,
    publicoObjetivo,
    totalAsistentes,
    noAsistieron: totalInscritos - totalAsistentes,
    porcentajeInscritosVsObjetivo,
    porcentajeAsistentesVsInscritos,
    asistentesPorQR,
    asistentesManual,
    porcentajeQR: totalAsistentes > 0 ? ((asistentesPorQR / totalAsistentes) * 100).toFixed(1) : 0,
    porcentajeManual: totalAsistentes > 0 ? ((asistentesManual / totalAsistentes) * 100).toFixed(1) : 0
  };
};

/**
 * Calcular estadísticas por día del evento
 * @param {Object} evento - Evento multi-día
 * @returns {Array} Array de estadísticas por día
 */
export const calcularEstadisticasPorDia = (evento) => {
  if (!evento || !evento.asistenciasPorDia) return [];

  const estadisticasPorDia = [];
  const dias = Object.keys(evento.asistenciasPorDia).sort();
  
  dias.forEach(fechaDia => {
    const asistenciasDia = evento.asistenciasPorDia[fechaDia];
    const asistentes = asistenciasDia.asistentes || [];
    const participantesInfo = asistenciasDia.participantesInfo || [];
    
    // Contar por método
    const porQR = participantesInfo.filter(p => p.metodo === 'qr').length;
    const porManual = participantesInfo.filter(p => p.metodo === 'manual').length;
    
    estadisticasPorDia.push({
      fecha: fechaDia,
      totalAsistentes: asistentes.length,
      asistentesPorQR: porQR,
      asistentesManual: porManual,
      porcentajeQR: asistentes.length > 0 ? ((porQR / asistentes.length) * 100).toFixed(1) : 0,
      porcentajeManual: asistentes.length > 0 ? ((porManual / asistentes.length) * 100).toFixed(1) : 0
    });
  });
  
  return estadisticasPorDia;
};

/**
 * Calcular estadísticas por ponente del evento
 * @param {Object} evento - Evento con modo por ponente
 * @returns {Array} Array de estadísticas por ponente
 */
export const calcularEstadisticasPorPonente = (evento) => {
  if (!evento || !evento.asistenciasPorPonente) return [];

  const estadisticasPorPonente = [];
  const ponentes = Object.keys(evento.asistenciasPorPonente);
  
  ponentes.forEach(ponenteKey => {
    const asistenciasPonente = evento.asistenciasPorPonente[ponenteKey];
    const asistentes = asistenciasPonente.asistentes || [];
    const participantesInfo = asistenciasPonente.participantesInfo || [];
    
    // Contar por método
    const porQR = participantesInfo.filter(p => p.metodo === 'qr').length;
    const porManual = participantesInfo.filter(p => p.metodo === 'manual').length;
    
    estadisticasPorPonente.push({
      ponenteKey,
      nombrePonente: asistenciasPonente.nombrePonente || 'Desconocido',
      temaPonente: asistenciasPonente.temaPonente || '',
      fechaDia: asistenciasPonente.fechaDia || '',
      horaPonente: asistenciasPonente.horaPonente || '',
      totalAsistentes: asistentes.length,
      asistentesPorQR: porQR,
      asistentesManual: porManual,
      porcentajeQR: asistentes.length > 0 ? ((porQR / asistentes.length) * 100).toFixed(1) : 0,
      porcentajeManual: asistentes.length > 0 ? ((porManual / asistentes.length) * 100).toFixed(1) : 0
    });
  });
  
  return estadisticasPorPonente.sort((a, b) => a.fechaDia.localeCompare(b.fechaDia) || a.horaPonente.localeCompare(b.horaPonente));
};

/**
 * Calcular promedio de estadísticas de eventos finalizados
 * @param {Array} eventos - Array de eventos finalizados
 * @returns {Object} Estadísticas promedio
 */
export const calcularPromedioEventosFinalizados = (eventos) => {
  const eventosFinalizados = eventos.filter(e => e.estado === 'finalizado');
  
  if (eventosFinalizados.length === 0) {
    return {
      totalEventos: 0,
      promedioInscritos: 0,
      promedioAsistentes: 0,
      promedioAsistencia: 0,
      promedioCuposLlenados: 0,
      totalInscritosAcumulado: 0,
      totalAsistentesAcumulado: 0
    };
  }
  
  let totalInscritosAcumulado = 0;
  let totalAsistentesAcumulado = 0;
  let totalCuposLlenados = 0;
  
  eventosFinalizados.forEach(evento => {
    const inscritos = evento.participantes?.length || 0;
    const asistentes = obtenerAsistentesGlobales(evento).length;
    // ✅ FIX: Usar capacidadMaxima en lugar de cuposDisponibles
    const cupos = evento.capacidadMaxima || 0;
    
    totalInscritosAcumulado += inscritos;
    totalAsistentesAcumulado += asistentes;
    
    if (cupos > 0) {
      totalCuposLlenados += (inscritos / cupos) * 100;
    }
  });
  
  const totalEventos = eventosFinalizados.length;
  
  return {
    totalEventos,
    promedioInscritos: (totalInscritosAcumulado / totalEventos).toFixed(1),
    promedioAsistentes: (totalAsistentesAcumulado / totalEventos).toFixed(1),
    promedioAsistencia: totalInscritosAcumulado > 0 
      ? ((totalAsistentesAcumulado / totalInscritosAcumulado) * 100).toFixed(1) 
      : 0,
    promedioCuposLlenados: (totalCuposLlenados / totalEventos).toFixed(1),
    totalInscritosAcumulado,
    totalAsistentesAcumulado
  };
};

const reportesService = {
  calcularEstadisticasGenerales,
  agruparEventosPorTipo,
  agruparEventosPorMes,
  obtenerTopEventosPorAsistencia,
  obtenerTopEventosPorInscripciones,
  calcularTasaConversion,
  calcularEstadoInscripciones,
  // Funciones para eventos individuales
  calcularEstadisticasEvento,
  calcularEstadisticasPorDia,
  calcularEstadisticasPorPonente,
  calcularPromedioEventosFinalizados
};

export default reportesService;
