/**
 * @fileoverview Constantes globales de la aplicación
 * @module config/constants
 * @description Define todos los valores configurables para evitar números mágicos
 */

// ============================================
// 📱 CONFIGURACIÓN DE LA APLICACIÓN
// ============================================
export const APP_CONFIG = {
  NAME: 'Gestión de Eventos UPAO',
  VERSION: '2.0.0',
  AUTHOR: 'NoctisCode - BC156',
  ENVIRONMENT: import.meta.env.VITE_APP_ENV || 'development'
};

// ============================================
// 👥 ROLES DE USUARIO
// ============================================
export const USER_ROLES = {
  ALUMNO: 'alumno',
  ORGANIZADOR: 'organizador'
};

// ============================================
// 🎯 TIPOS Y ESTADOS DE EVENTOS
// ============================================
export const EVENT_TYPES = {
  CONFERENCIA: 'conferencia',
  SEMINARIO: 'seminario',
  TALLER: 'taller',
  CURSO: 'curso',
  CHARLA: 'charla'
};

export const EVENT_STATUS = {
  BORRADOR: 'borrador',
  PUBLICADO: 'publicado',
  CANCELADO: 'cancelado',
  FINALIZADO: 'finalizado'
};

/**
 * Modos de control de asistencia para eventos
 * @enum {string}
 */
export const ATTENDANCE_MODE = {
  BY_DAY: 'por_dia',      // QR y asistencia por día del evento
  BY_SPEAKER: 'por_ponente' // QR y asistencia por expositor
};

// ============================================
// ✅ REGLAS DE VALIDACIÓN
// ============================================
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: true
  },
  USER: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    APELLIDO_MIN_LENGTH: 2,
    APELLIDO_MAX_LENGTH: 100
  },
  EVENT: {
    TITLE_MIN_LENGTH: 10,
    TITLE_MAX_LENGTH: 100,
    DESCRIPTION_MIN_LENGTH: 20,
    DESCRIPTION_MAX_LENGTH: 500,
    CAPACITY_MIN: 1,
    CAPACITY_MAX: 1000,
    UBICACION_MIN_LENGTH: 3,
    UBICACION_MAX_LENGTH: 200
  },
  EXPOSITOR: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 200,
    EMAIL_MIN_LENGTH: 5,
    EMAIL_MAX_LENGTH: 200,
    HORA_LENGTH: 5, // HH:MM
    TEMA_MIN_LENGTH: 3,
    TEMA_MAX_LENGTH: 300,
    DURACION_MIN: 15, // minutos
    DURACION_MAX: 480 // 8 horas
  },
  QR: {
    TOKEN_LENGTH: 64, // SHA256 hash
    ID_MIN_LENGTH: 10,
    ID_MAX_LENGTH: 200,
    STRING_MIN_LENGTH: 10,
    STRING_MAX_LENGTH: 5000
  }
};

// ============================================
// 🕐 CONFIGURACIÓN DE TIEMPO
// ============================================
export const TIME_CONFIG = {
  // Rangos de hora permitidos para eventos (formato 24h)
  HORA_INICIO_MIN: '06:00',
  HORA_INICIO_MAX: '23:00',
  HORA_FIN_MIN: '07:00',
  HORA_FIN_MAX: '23:59',
  
  // Duración de eventos
  MAX_DIAS_EVENTO: 365, // Máximo días que puede durar un evento
  
  // Intervalos de actualización
  POLLING_INTERVAL_MS: 30000, // 30 segundos (deprecado - usar onSnapshot)
  MAINTENANCE_INTERVAL_MS: 300000 // 5 minutos
};

// ============================================
// 🔥 COLECCIONES DE FIREBASE
// ============================================
export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  EVENTS: 'eventos',
  INSCRIPTIONS: 'inscripciones' // Para uso futuro
};

// ============================================
// 🛣️ RUTAS DE LA APLICACIÓN
// ============================================
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD_ALUMNO: '/alumno',
  DASHBOARD_ORGANIZADOR: '/organizador',
  MIS_EVENTOS: '/alumno/mis-eventos',
  DETALLE_EVENTO: '/evento/:id',
  GESTION_ASISTENCIA: '/organizador/gestion-asistencia/:id',
  GESTION_PARTICIPANTES: '/organizador/gestion-participantes/:id',
  REPORTES: '/organizador/reportes',
  PERFIL: '/perfil',
  NOT_FOUND: '/404'
};

// ============================================
// 🎨 CONFIGURACIÓN UI
// ============================================
export const UI_CONFIG = {
  TOAST_DURATION: 3000, // Duración de toasts en ms
  DEBOUNCE_DELAY: 300,  // Delay para debounce en búsquedas
  MAX_FILE_SIZE_MB: 5,  // Tamaño máximo de archivos
  PAGINATION_SIZE: 10   // Elementos por página
};

// ============================================
// 🔐 CONFIGURACIÓN DE SEGURIDAD
// ============================================
export const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 900000, // 15 minutos
  SESSION_TIMEOUT_MS: 3600000  // 1 hora
};

// ============================================
// 📧 CONFIGURACIÓN DE N8N
// ============================================
export const N8N_CONFIG = {
  BASE_URL: import.meta.env.VITE_N8N_BASE_URL,
  WEBHOOKS: {
    EVENTO_CREADO: import.meta.env.VITE_APP_ENV === 'production'
      ? import.meta.env.VITE_N8N_WEBHOOK_EVENTO_CREADO_PROD
      : import.meta.env.VITE_N8N_WEBHOOK_EVENTO_CREADO_DEV,
    INSCRIPCION: import.meta.env.VITE_APP_ENV === 'production'
      ? import.meta.env.VITE_N8N_WEBHOOK_INSCRIPCION_PROD
      : import.meta.env.VITE_N8N_WEBHOOK_INSCRIPCION_DEV,
    LISTA_INSCRITOS: import.meta.env.VITE_APP_ENV === 'production'
      ? import.meta.env.VITE_N8N_WEBHOOK_LISTA_INSCRITOS_PROD
      : import.meta.env.VITE_N8N_WEBHOOK_LISTA_INSCRITOS_DEV,
    ASISTENCIAS: import.meta.env.VITE_APP_ENV === 'production'
      ? import.meta.env.VITE_N8N_WEBHOOK_ASISTENCIAS_PROD
      : import.meta.env.VITE_N8N_WEBHOOK_ASISTENCIAS_DEV
  }
};

// ============================================
// 📤 EXPORTACIÓN POR DEFECTO
// ============================================
export default {
  APP_CONFIG,
  USER_ROLES,
  EVENT_TYPES,
  EVENT_STATUS,
  ATTENDANCE_MODE,
  VALIDATION_RULES,
  TIME_CONFIG,
  FIREBASE_COLLECTIONS,
  ROUTES,
  UI_CONFIG,
  SECURITY_CONFIG,
  N8N_CONFIG
};