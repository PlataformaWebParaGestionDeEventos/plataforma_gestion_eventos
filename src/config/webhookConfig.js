/**
 * 🤖 CONFIGURACIÓN DE WEBHOOKS N8N
 * 
 * Sistema dinámico para seleccionar webhooks según el entorno.
 * Automáticamente usa desarrollo o producción según VITE_APP_ENV.
 */

/**
 * Obtiene el entorno actual de ejecución
 * @returns {'development' | 'production' | 'test'}
 */
export const getEnvironment = () => {
  return import.meta.env.VITE_APP_ENV || 'development';
};

/**
 * Verifica si estamos en producción
 * @returns {boolean}
 */
export const isProduction = () => {
  return getEnvironment() === 'production';
};

/**
 * Obtiene la URL base de n8n
 * @returns {string}
 */
export const getN8nBaseUrl = () => {
  return import.meta.env.VITE_N8N_BASE_URL || '';
};

/**
 * Obtiene la URL del frontend según el entorno
 * @returns {string}
 */
export const getAppUrl = () => {
  const env = getEnvironment();
  if (env === 'production') {
    return import.meta.env.VITE_APP_URL_PROD || window.location.origin;
  }
  return import.meta.env.VITE_APP_URL_DEV || 'http://localhost:5173';
};

/**
 * Mapa de webhooks disponibles
 * Automáticamente selecciona DEV o PROD según el entorno
 */
const WEBHOOK_PATHS = {
  eventoCreado: {
    dev: import.meta.env.VITE_N8N_WEBHOOK_EVENTO_CREADO_DEV || '/webhook-test/evento-creado',
    prod: import.meta.env.VITE_N8N_WEBHOOK_EVENTO_CREADO_PROD || '/webhook/evento-creado'
  },
  inscripcion: {
    dev: import.meta.env.VITE_N8N_WEBHOOK_INSCRIPCION_DEV || '/webhook-test/inscripcion-confirmacion',
    prod: import.meta.env.VITE_N8N_WEBHOOK_INSCRIPCION_PROD || '/webhook/inscripcion-confirmacion'
  },
  listaInscritos: {
    dev: import.meta.env.VITE_N8N_WEBHOOK_LISTA_INSCRITOS_DEV || '/webhook-test/lista-inscritos',
    prod: import.meta.env.VITE_N8N_WEBHOOK_LISTA_INSCRITOS_PROD || '/webhook/lista-inscritos'
  },
  asistencias: {
    dev: import.meta.env.VITE_N8N_WEBHOOK_ASISTENCIAS_DEV || '/webhook-test/asistencias-finales',
    prod: import.meta.env.VITE_N8N_WEBHOOK_ASISTENCIAS_PROD || '/webhook/asistencias-finales'
  },
  eventoFinalizado: {
    dev: import.meta.env.VITE_N8N_WEBHOOK_EVENTO_FINALIZADO_DEV || '/webhook-test/evento-finalizado',
    prod: import.meta.env.VITE_N8N_WEBHOOK_EVENTO_FINALIZADO_PROD || '/webhook/evento-finalizado'
  }
};

/**
 * Obtiene el path del webhook según el nombre y entorno
 * @param {keyof typeof WEBHOOK_PATHS} webhookName - Nombre del webhook
 * @returns {string} Path del webhook
 * 
 * @example
 * // En desarrollo
 * getWebhookPath('inscripcion') // → '/webhook-test/inscripcion-confirmacion'
 * 
 * // En producción
 * getWebhookPath('inscripcion') // → '/webhook/inscripcion-confirmacion'
 */
export const getWebhookPath = (webhookName) => {
  const webhook = WEBHOOK_PATHS[webhookName];
  
  if (!webhook) {
    console.warn(`⚠️ Webhook "${webhookName}" no encontrado. Webhooks disponibles:`, Object.keys(WEBHOOK_PATHS));
    return '';
  }

  const env = getEnvironment();
  return env === 'production' ? webhook.prod : webhook.dev;
};

/**
 * Obtiene la URL completa del webhook (base + path)
 * @param {keyof typeof WEBHOOK_PATHS} webhookName - Nombre del webhook
 * @returns {string} URL completa del webhook
 * 
 * @example
 * // En desarrollo con n8n local
 * getWebhookUrl('inscripcion') 
 * // → 'http://localhost:5678/webhook-test/inscripcion-confirmacion'
 * 
 * // En producción
 * getWebhookUrl('inscripcion')
 * // → 'https://n8n-gestioneventos.duckdns.org/webhook/inscripcion-confirmacion'
 */
export const getWebhookUrl = (webhookName) => {
  const baseUrl = getN8nBaseUrl();
  const path = getWebhookPath(webhookName);
  
  if (!baseUrl || !path) {
    console.error('❌ Error al construir URL de webhook:', { baseUrl, path, webhookName });
    return '';
  }

  // Asegurar que no haya doble slash
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${cleanBase}${cleanPath}`;
};

/**
 * Obtiene todas las URLs de webhooks configuradas
 * @returns {Object} Objeto con todas las URLs
 * 
 * @example
 * const urls = getAllWebhookUrls();
 * console.log(urls.inscripcion);
 * // → 'https://n8n-gestioneventos.duckdns.org/webhook-test/inscripcion-confirmacion'
 */
export const getAllWebhookUrls = () => {
  return {
    eventoCreado: getWebhookUrl('eventoCreado'),
    inscripcion: getWebhookUrl('inscripcion'),
    listaInscritos: getWebhookUrl('listaInscritos'),
    asistencias: getWebhookUrl('asistencias'),
    eventoFinalizado: getWebhookUrl('eventoFinalizado')
  };
};

/**
 * Información de configuración del sistema
 * Útil para debugging
 */
export const getConfigInfo = () => {
  return {
    environment: getEnvironment(),
    isProduction: isProduction(),
    n8nBaseUrl: getN8nBaseUrl(),
    appUrl: getAppUrl(),
    webhooks: getAllWebhookUrls()
  };
};

// Exportar por defecto un objeto con todas las funciones
export default {
  getEnvironment,
  isProduction,
  getN8nBaseUrl,
  getAppUrl,
  getWebhookPath,
  getWebhookUrl,
  getAllWebhookUrls,
  getConfigInfo
};
