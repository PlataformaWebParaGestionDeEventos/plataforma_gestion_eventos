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
  }
};

export default formatters;