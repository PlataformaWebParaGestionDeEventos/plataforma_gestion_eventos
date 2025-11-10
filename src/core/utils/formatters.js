// Utilidades para formato de datos
export const formatters = {
  // Formatear fecha para mostrar
  formatDate: (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Formatear hora para mostrar
  formatTime: (time) => {
    if (!time) return '';
    return time;
  },

  // Formatear fecha y hora juntas
  formatDateTime: (date, time) => {
    if (!date || !time) return '';
    return `${formatters.formatDate(date)} a las ${time}`;
  },

  // Truncar texto con ellipsis
  truncateText: (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Capitalizar primera letra
  capitalize: (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  // Formatear número de participantes
  formatParticipants: (current, max) => {
    return `${current || 0}/${max}`;
  },

  // Calcular porcentaje de capacidad
  getCapacityPercentage: (current, max) => {
    if (!max) return 0;
    return Math.round(((current || 0) / max) * 100);
  },

  // Formatear estado del evento
  formatEventStatus: (status) => {
    const statusMap = {
      'borrador': '📝 Borrador',
      'publicado': '✅ Publicado',
      'cancelado': '❌ Cancelado',
      'finalizado': '🏁 Finalizado'
    };
    return statusMap[status] || status;
  },

  // Formatear tipo de evento
  formatEventType: (type) => {
    const typeMap = {
      'conferencia': 'Conferencia',
      'seminario': 'Seminario',
      'taller': 'Taller',
      'curso': 'Curso',
      'charla': 'Charla'
    };
    return typeMap[type] || type;
  },

  // ========== FUNCIONES PARA EVENTOS MULTI-DÍA ==========

  /**
   * Calcular todos los días entre fechaInicio y fechaFin (inclusive)
   * @param {string} fechaInicio - Fecha en formato YYYY-MM-DD
   * @param {string} fechaFin - Fecha en formato YYYY-MM-DD
   * @returns {string[]} Array de fechas en formato YYYY-MM-DD
   */
  calcularDiasEvento: (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return [];
    
    const dias = [];
    const inicio = new Date(fechaInicio + 'T00:00:00');
    const fin = new Date(fechaFin + 'T00:00:00');
    
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      dias.push(d.toISOString().split('T')[0]);
    }
    
    return dias;
  },

  /**
   * Verificar si un evento dura más de un día
   * @param {string} fechaInicio - Fecha en formato YYYY-MM-DD
   * @param {string} fechaFin - Fecha en formato YYYY-MM-DD
   * @returns {boolean}
   */
  esEventoMultiDia: (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return false;
    return fechaInicio !== fechaFin;
  },

  /**
   * Formatear rango de fechas (muestra solo una si son iguales)
   * @param {string} fechaInicio - Fecha en formato YYYY-MM-DD
   * @param {string} fechaFin - Fecha en formato YYYY-MM-DD
   * @returns {string} Fecha formateada
   */
  formatearRangoFechas: (fechaInicio, fechaFin) => {
    if (!fechaInicio) return 'No especificada';
    
    if (!fechaFin || fechaInicio === fechaFin) {
      // Evento de un solo día
      return formatters.formatDate(fechaInicio);
    }
    
    // Evento multi-día
    const inicio = new Date(fechaInicio + 'T00:00:00');
    const fin = new Date(fechaFin + 'T00:00:00');
    
    const opcionesInicio = { day: 'numeric', month: 'short' };
    const opcionesFin = { day: 'numeric', month: 'short', year: 'numeric' };
    
    const fechaInicioFormateada = inicio.toLocaleDateString('es-ES', opcionesInicio);
    const fechaFinFormateada = fin.toLocaleDateString('es-ES', opcionesFin);
    
    return `${fechaInicioFormateada} al ${fechaFinFormateada}`;
  },

  /**
   * Obtener la fecha actual en formato YYYY-MM-DD
   * @returns {string}
   */
  obtenerFechaActual: () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  },

  /**
   * Verificar si una fecha está dentro del rango del evento
   * @param {string} fecha - Fecha a verificar (YYYY-MM-DD)
   * @param {string} fechaInicio - Fecha inicio del evento
   * @param {string} fechaFin - Fecha fin del evento
   * @returns {boolean}
   */
  esFechaDentroDelEvento: (fecha, fechaInicio, fechaFin) => {
    if (!fecha || !fechaInicio || !fechaFin) return false;
    
    const fechaCheck = new Date(fecha + 'T00:00:00');
    const inicio = new Date(fechaInicio + 'T00:00:00');
    const fin = new Date(fechaFin + 'T00:00:00');
    
    return fechaCheck >= inicio && fechaCheck <= fin;
  },

  /**
   * Verificar si hoy es el último día del evento
   * @param {string} fechaFin - Fecha fin del evento
   * @returns {boolean}
   */
  esUltimoDiaDelEvento: (fechaFin) => {
    if (!fechaFin) return false;
    const hoy = formatters.obtenerFechaActual();
    return hoy === fechaFin;
  },

  /**
   * Formatear nombre del día para mostrar (Ej: "Lunes 20 Oct")
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @returns {string}
   */
  formatearNombreDia: (fecha) => {
    if (!fecha) return '';
    
    const date = new Date(fecha + 'T00:00:00');
    const opciones = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'short' 
    };
    
    return date.toLocaleDateString('es-ES', opciones);
  },

  /**
   * Calcular porcentaje de asistencia de un participante
   * @param {number} diasAsistidos - Días que asistió
   * @param {number} totalDias - Total de días del evento
   * @returns {string} Porcentaje formateado
   */
  calcularPorcentajeAsistenciaParticipante: (diasAsistidos, totalDias) => {
    if (!totalDias || totalDias === 0) return '0.00';
    return ((diasAsistidos / totalDias) * 100).toFixed(2);
  },

  /**
   * ✅ NUEVO: Obtener lista de asistentes únicos desde asistenciasPorDia
   * Reemplaza el campo redundante evento.asistentes[]
   * @param {Object} evento - Objeto del evento
   * @returns {string[]} Array de UIDs únicos que asistieron al menos 1 día
   */
  obtenerAsistentesGlobales: (evento) => {
    if (!evento || !evento.asistenciasPorDia) {
      return [];
    }
    
    // Obtener todos los asistentes de todos los días
    const todosLosAsistentes = Object.values(evento.asistenciasPorDia)
      .flatMap(dia => dia.asistentes || []);
    
    // Retornar únicos
    return Array.from(new Set(todosLosAsistentes));
  },

  /**
   * ✅ NUEVO: Obtener método de registro de un participante para un día específico
   * Reemplaza evento.asistenciaQR[uid][fecha].metodo
   * @param {Object} evento - Objeto del evento
   * @param {string} uid - UID del participante
   * @param {string} fecha - Fecha en formato YYYY-MM-DD (opcional, usa primera encontrada)
   * @returns {string|null} 'qr' | 'manual' | null
   */
  obtenerMetodoRegistro: (evento, uid, fecha = null) => {
    if (!evento || !evento.asistenciasPorDia) {
      return null;
    }

    // Si se especifica fecha, buscar en ese día
    if (fecha && evento.asistenciasPorDia[fecha]) {
      // 🔧 FIX: Validar que participantesInfo sea un array antes de usar .find()
      const participantesInfo = evento.asistenciasPorDia[fecha].participantesInfo;
      const participante = Array.isArray(participantesInfo)
        ? participantesInfo.find(p => (p.uid || p.id) === uid)
        : null;
      return participante?.metodo || null;
    }

    // Si no se especifica fecha, buscar en cualquier día (primera ocurrencia)
    for (const dia of Object.values(evento.asistenciasPorDia)) {
      // 🔧 FIX: Validar que participantesInfo sea un array antes de usar .find()
      const participantesInfo = dia.participantesInfo;
      const participante = Array.isArray(participantesInfo)
        ? participantesInfo.find(p => (p.uid || p.id) === uid)
        : null;
      if (participante) {
        return participante.metodo || null;
      }
    }

    return null;
  }
};

export default formatters;