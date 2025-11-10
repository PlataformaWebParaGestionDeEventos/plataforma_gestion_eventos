/**
 * @fileoverview Esquemas de validación para eventos y expositores
 * @module core/validation/eventoValidation
 * @description Validación centralizada usando Yup para mantener consistencia y separación de responsabilidades
 */

import * as Yup from 'yup';
import { 
  VALIDATION_RULES, 
  EVENT_TYPES, 
  EVENT_STATUS, 
  ATTENDANCE_MODE,
  TIME_CONFIG 
} from '../../config/constants.js';

// ============================================
// 🎯 ESQUEMA: EXPOSITOR
// ============================================

/**
 * Validación para un expositor individual
 * @type {Yup.ObjectSchema}
 */
export const expositorSchema = Yup.object({
  nombre: Yup.string()
    .min(VALIDATION_RULES.EXPOSITOR.NAME_MIN_LENGTH, `El nombre debe tener al menos ${VALIDATION_RULES.EXPOSITOR.NAME_MIN_LENGTH} caracteres`)
    .max(VALIDATION_RULES.EXPOSITOR.NAME_MAX_LENGTH, `El nombre no puede exceder ${VALIDATION_RULES.EXPOSITOR.NAME_MAX_LENGTH} caracteres`)
    .required('El nombre del expositor es obligatorio'),
  
  correo: Yup.string()
    .email('Debe ser un correo electrónico válido')
    .min(VALIDATION_RULES.EXPOSITOR.EMAIL_MIN_LENGTH, `El correo debe tener al menos ${VALIDATION_RULES.EXPOSITOR.EMAIL_MIN_LENGTH} caracteres`)
    .max(VALIDATION_RULES.EXPOSITOR.EMAIL_MAX_LENGTH, `El correo no puede exceder ${VALIDATION_RULES.EXPOSITOR.EMAIL_MAX_LENGTH} caracteres`)
    .required('El correo del expositor es obligatorio'),
  
  tema: Yup.string()
    .min(VALIDATION_RULES.EXPOSITOR.TEMA_MIN_LENGTH, `El tema debe tener al menos ${VALIDATION_RULES.EXPOSITOR.TEMA_MIN_LENGTH} caracteres`)
    .max(VALIDATION_RULES.EXPOSITOR.TEMA_MAX_LENGTH, `El tema no puede exceder ${VALIDATION_RULES.EXPOSITOR.TEMA_MAX_LENGTH} caracteres`)
    .required('El tema de la ponencia es obligatorio'),
  
  // ✅ NUEVOS CAMPOS
  dia: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'El día debe estar en formato YYYY-MM-DD')
    .required('El día de la ponencia es obligatorio'),
  
  hora: Yup.string()
    .matches(/^\d{2}:\d{2}$/, 'La hora debe estar en formato HH:MM')
    .test('hora-valida', 'La hora debe estar en formato 24h válido', (value) => {
      if (!value) return false;
      const [horas, minutos] = value.split(':').map(Number);
      return horas >= 0 && horas <= 23 && minutos >= 0 && minutos <= 59;
    })
    .required('La hora de inicio es obligatoria'),
  
  duracion: Yup.number()
    .min(VALIDATION_RULES.EXPOSITOR.DURACION_MIN, `La duración mínima es ${VALIDATION_RULES.EXPOSITOR.DURACION_MIN} minutos`)
    .max(VALIDATION_RULES.EXPOSITOR.DURACION_MAX, `La duración máxima es ${VALIDATION_RULES.EXPOSITOR.DURACION_MAX} minutos`)
    .required('La duración de la ponencia es obligatoria'),
  
  break: Yup.boolean()
    .default(false)
    .required('Debe indicar si incluye break')
}).required();

// ============================================
// 📅 ESQUEMA: EVENTO
// ============================================

/**
 * Validación completa para creación/edición de eventos
 * @type {Yup.ObjectSchema}
 */
export const eventoSchema = Yup.object({
  titulo: Yup.string()
    .min(VALIDATION_RULES.EVENT.TITLE_MIN_LENGTH, `El título debe tener al menos ${VALIDATION_RULES.EVENT.TITLE_MIN_LENGTH} caracteres`)
    .max(VALIDATION_RULES.EVENT.TITLE_MAX_LENGTH, `El título no puede exceder ${VALIDATION_RULES.EVENT.TITLE_MAX_LENGTH} caracteres`)
    .required('El título del evento es obligatorio'),
  
  descripcion: Yup.string()
    .min(VALIDATION_RULES.EVENT.DESCRIPTION_MIN_LENGTH, `La descripción debe tener al menos ${VALIDATION_RULES.EVENT.DESCRIPTION_MIN_LENGTH} caracteres`)
    .max(VALIDATION_RULES.EVENT.DESCRIPTION_MAX_LENGTH, `La descripción no puede exceder ${VALIDATION_RULES.EVENT.DESCRIPTION_MAX_LENGTH} caracteres`)
    .required('La descripción del evento es obligatoria'),
  
  ubicacion: Yup.string()
    .min(VALIDATION_RULES.EVENT.UBICACION_MIN_LENGTH, `La ubicación debe tener al menos ${VALIDATION_RULES.EVENT.UBICACION_MIN_LENGTH} caracteres`)
    .max(VALIDATION_RULES.EVENT.UBICACION_MAX_LENGTH, `La ubicación no puede exceder ${VALIDATION_RULES.EVENT.UBICACION_MAX_LENGTH} caracteres`)
    .required('La ubicación del evento es obligatoria'),
  
  capacidadMaxima: Yup.number()
    .min(VALIDATION_RULES.EVENT.CAPACITY_MIN, `La capacidad mínima es ${VALIDATION_RULES.EVENT.CAPACITY_MIN}`)
    .max(VALIDATION_RULES.EVENT.CAPACITY_MAX, `La capacidad máxima es ${VALIDATION_RULES.EVENT.CAPACITY_MAX}`)
    .integer('La capacidad debe ser un número entero')
    .required('La capacidad máxima es obligatoria'),
  
  tipo: Yup.string()
    .oneOf(Object.values(EVENT_TYPES), 'Tipo de evento inválido')
    .required('El tipo de evento es obligatorio'),
  
  estado: Yup.string()
    .oneOf(Object.values(EVENT_STATUS), 'Estado de evento inválido')
    .required('El estado del evento es obligatorio'),
  
  // ✅ MODELO UNIFICADO: Usar siempre fechaInicio/fechaFin/horaInicio/horaFin
  fechaInicio: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de inicio debe estar en formato YYYY-MM-DD')
    .test('fecha-futura', 'La fecha de inicio debe ser igual o posterior a hoy', (value) => {
      if (!value) return false;
      const fecha = new Date(value + 'T00:00:00');
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      return fecha >= hoy;
    })
    .required('La fecha de inicio es obligatoria'),
  
  fechaFin: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de fin debe estar en formato YYYY-MM-DD')
    .test('fecha-posterior', 'La fecha de fin debe ser igual o posterior a la fecha de inicio', function(value) {
      const { fechaInicio } = this.parent;
      if (!value || !fechaInicio) return false;
      return new Date(value) >= new Date(fechaInicio);
    })
    .test('duracion-maxima', `El evento no puede durar más de ${TIME_CONFIG.MAX_DIAS_EVENTO} días`, function(value) {
      const { fechaInicio } = this.parent;
      if (!value || !fechaInicio) return false;
      const inicio = new Date(fechaInicio);
      const fin = new Date(value);
      const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
      return dias <= TIME_CONFIG.MAX_DIAS_EVENTO;
    })
    .required('La fecha de fin es obligatoria'),
  
  horaInicio: Yup.string()
    .matches(/^\d{2}:\d{2}$/, 'La hora de inicio debe estar en formato HH:MM')
    .test('hora-valida', 'La hora debe estar en formato 24h válido', (value) => {
      if (!value) return false;
      const [horas, minutos] = value.split(':').map(Number);
      return horas >= 0 && horas <= 23 && minutos >= 0 && minutos <= 59;
    })
    .required('La hora de inicio es obligatoria'),
  
  horaFin: Yup.string()
    .matches(/^\d{2}:\d{2}$/, 'La hora de fin debe estar en formato HH:MM')
    .test('hora-valida', 'La hora debe estar en formato 24h válido', (value) => {
      if (!value) return false;
      const [horas, minutos] = value.split(':').map(Number);
      return horas >= 0 && horas <= 23 && minutos >= 0 && minutos <= 59;
    })
    .test('hora-posterior', 'La hora de fin debe ser posterior a la hora de inicio', function(value) {
      const { horaInicio, fechaInicio, fechaFin } = this.parent;
      if (!value || !horaInicio) return false;
      
      // Si es el mismo día, validar que la hora fin sea posterior
      if (fechaInicio === fechaFin) {
        const [horasInicio, minutosInicio] = horaInicio.split(':').map(Number);
        const [horasFin, minutosFin] = value.split(':').map(Number);
        const minutosInicioTotal = horasInicio * 60 + minutosInicio;
        const minutosFinTotal = horasFin * 60 + minutosFin;
        return minutosFinTotal > minutosInicioTotal;
      }
      
      return true; // Si es diferente día, no validar hora
    })
    .required('La hora de fin es obligatoria'),
  
  // ✅ NUEVO: Modo de asistencia
  modoAsistencia: Yup.string()
    .oneOf(Object.values(ATTENDANCE_MODE), 'Modo de asistencia inválido')
    .default(ATTENDANCE_MODE.BY_DAY)
    .required('El modo de asistencia es obligatorio'),
  
  // ✅ Array de expositores (mínimo 1)
  expositores: Yup.array()
    .of(expositorSchema)
    .min(1, 'Debe agregar al menos un expositor')
    .max(20, 'No puede haber más de 20 expositores')
    .required('Los expositores son obligatorios')
    .test('expositores-en-rango-fechas', 'Todos los expositores deben estar dentro del rango de fechas del evento', function(expositores) {
      const { fechaInicio, fechaFin } = this.parent;
      if (!expositores || !fechaInicio || !fechaFin) return false;
      
      return expositores.every(expositor => {
        const diaExpositor = expositor.dia;
        return diaExpositor >= fechaInicio && diaExpositor <= fechaFin;
      });
    })
    .test('no-solapamiento-horarios', 'Los expositores no pueden tener horarios que se solapen en el mismo día', function(expositores) {
      if (!expositores || expositores.length <= 1) return true;
      
      // Agrupar por día
      const expositoresPorDia = {};
      expositores.forEach(exp => {
        if (!expositoresPorDia[exp.dia]) {
          expositoresPorDia[exp.dia] = [];
        }
        expositoresPorDia[exp.dia].push(exp);
      });
      
      // Verificar solapamientos en cada día
      for (const dia in expositoresPorDia) {
        const expsDelDia = expositoresPorDia[dia];
        
        for (let i = 0; i < expsDelDia.length; i++) {
          for (let j = i + 1; j < expsDelDia.length; j++) {
            const exp1 = expsDelDia[i];
            const exp2 = expsDelDia[j];
            
            const [h1, m1] = exp1.hora.split(':').map(Number);
            const [h2, m2] = exp2.hora.split(':').map(Number);
            
            const inicio1 = h1 * 60 + m1;
            const fin1 = inicio1 + exp1.duracion;
            const inicio2 = h2 * 60 + m2;
            const fin2 = inicio2 + exp2.duracion;
            
            // Verificar solapamiento
            if ((inicio1 < fin2 && fin1 > inicio2)) {
              return this.createError({
                message: `Los horarios de ${exp1.nombre} y ${exp2.nombre} se solapan el día ${dia}`,
                path: 'expositores'
              });
            }
          }
        }
      }
      
      return true;
    }),
  
  // ✅ NUEVO: Control de inscripciones y asistencias
  inscripcionesAbiertas: Yup.boolean()
    .default(true),
  
  asistenciaAbierta: Yup.boolean()
    .default(true)
}).required();

// ============================================
// 🔄 ESQUEMA: ACTUALIZACIÓN DE EVENTO
// ============================================

/**
 * Validación para actualización parcial de eventos
 * Similar a eventoSchema pero todos los campos son opcionales
 */
export const eventoUpdateSchema = eventoSchema.partial();

// ============================================
// 📤 FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Valida los datos de un evento
 * @param {Object} data - Datos del evento a validar
 * @param {boolean} isUpdate - Si es una actualización (permite campos parciales)
 * @returns {Promise<{isValid: boolean, errors: Object|null, data: Object|null}>}
 */
export async function validateEvento(data, isUpdate = false) {
  try {
    const schema = isUpdate ? eventoUpdateSchema : eventoSchema;
    const validData = await schema.validate(data, { abortEarly: false });
    return {
      isValid: true,
      errors: null,
      data: validData
    };
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      const errors = {};
      error.inner.forEach(err => {
        errors[err.path] = err.message;
      });
      return {
        isValid: false,
        errors,
        data: null
      };
    }
    throw error;
  }
}

/**
 * Valida un expositor individual
 * @param {Object} data - Datos del expositor a validar
 * @returns {Promise<{isValid: boolean, errors: Object|null, data: Object|null}>}
 */
export async function validateExpositor(data) {
  try {
    const validData = await expositorSchema.validate(data, { abortEarly: false });
    return {
      isValid: true,
      errors: null,
      data: validData
    };
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      const errors = {};
      error.inner.forEach(err => {
        errors[err.path] = err.message;
      });
      return {
        isValid: false,
        errors,
        data: null
      };
    }
    throw error;
  }
}

/**
 * Valida sincronamente (sin async/await) - útil para validación en tiempo real
 * @param {Object} data - Datos a validar
 * @param {Yup.ObjectSchema} schema - Esquema Yup a usar
 * @returns {{isValid: boolean, errors: Object|null}}
 */
export function validateSync(data, schema) {
  try {
    schema.validateSync(data, { abortEarly: false });
    return { isValid: true, errors: null };
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      const errors = {};
      error.inner.forEach(err => {
        errors[err.path] = err.message;
      });
      return { isValid: false, errors };
    }
    throw error;
  }
}

// ============================================
// 📤 EXPORTACIÓN
// ============================================

export default {
  eventoSchema,
  eventoUpdateSchema,
  expositorSchema,
  validateEvento,
  validateExpositor,
  validateSync
};
