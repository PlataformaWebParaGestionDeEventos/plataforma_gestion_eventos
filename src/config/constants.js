// Constantes de la aplicación
export const APP_CONFIG = {
  NAME: 'Gestión de Eventos UPAO',
  VERSION: '1.0.0',
  AUTHOR: 'NoctisCode - BC156'
};

export const USER_ROLES = {
  ALUMNO: 'alumno',
  ORGANIZADOR: 'organizador'
};

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

export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: true
  },
  EVENT: {
    TITLE_MIN_LENGTH: 10,
    TITLE_MAX_LENGTH: 100,
    DESCRIPTION_MIN_LENGTH: 20,
    DESCRIPTION_MAX_LENGTH: 500,
    CAPACITY_MIN: 1,
    CAPACITY_MAX: 1000
  }
};

export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  EVENTS: 'eventos'
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD_ALUMNO: '/alumno',
  DASHBOARD_ORGANIZADOR: '/organizador'
};

export default {
  APP_CONFIG,
  USER_ROLES,
  EVENT_TYPES,
  EVENT_STATUS,
  VALIDATION_RULES,
  FIREBASE_COLLECTIONS,
  ROUTES
};