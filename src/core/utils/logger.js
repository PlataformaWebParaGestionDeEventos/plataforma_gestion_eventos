/**
 * Sistema de logging condicional
 * Solo muestra logs en desarrollo, oculta en producción
 */

const isDev = import.meta.env.MODE === 'development';

export const logger = {
  /**
   * Log informativo general (solo desarrollo)
   */
  log: (...args) => {
    if (isDev) console.log(...args);
  },

  /**
   * Advertencias (solo desarrollo)
   */
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },

  /**
   * Errores (siempre se muestran)
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Información (solo desarrollo)
   */
  info: (...args) => {
    if (isDev) console.info(...args);
  },

  /**
   * Debug detallado (solo desarrollo)
   */
  debug: (...args) => {
    if (isDev) console.debug(...args);
  },

  /**
   * Tabla de datos (solo desarrollo)
   */
  table: (data) => {
    if (isDev) console.table(data);
  },

  /**
   * Grupo de logs (solo desarrollo)
   */
  group: (label) => {
    if (isDev) console.group(label);
  },

  groupEnd: () => {
    if (isDev) console.groupEnd();
  }
};

export default logger;
