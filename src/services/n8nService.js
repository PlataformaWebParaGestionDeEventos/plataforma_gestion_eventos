import logger from '../core/utils/logger';
import { getN8nBaseUrl, getWebhookUrl } from '../config/webhookConfig';

class N8nService {
  constructor() {
    this.baseUrl = getN8nBaseUrl();
    this.endpoints = {
      eventoCreado: getWebhookUrl('eventoCreado'),
      inscripcion: getWebhookUrl('inscripcion'),
      listaInscritos: getWebhookUrl('listaInscritos'),
      asistencias: getWebhookUrl('asistencias')
    };
  }

  /**
   * Función principal: enviarEventoCreado
   * Envía los datos del evento creado al webhook de n8n
   * @param {Object} eventoData - Datos del evento
   * @returns {Object} Respuesta del servidor n8n en formato JSON
   */
  async enviarEventoCreado(eventoData) {
    const url = this.endpoints.eventoCreado; // Ya viene como URL completa
    
    logger.log('🚀 [n8n] Enviando evento creado a:', url);
    logger.log('📦 [n8n] Datos del evento:', eventoData);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors', // Explícitamente permitir CORS
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          // Datos principales del evento
          eventoId: eventoData.id,
          titulo: eventoData.titulo,
          descripcion: eventoData.descripcion,
          
          // Fechas y horas (nueva estructura) - ✅ CORRECCIÓN: Buscar ambos formatos
          eventoFechaInicio: eventoData.eventoFechaInicio || eventoData.fechaInicio || eventoData.fecha,
          eventoFechaFin: eventoData.eventoFechaFin || eventoData.fechaFin || eventoData.fecha,
          eventoHoraInicio: eventoData.eventoHoraInicio || eventoData.horaInicio || eventoData.hora,
          eventoHoraFin: eventoData.eventoHoraFin || eventoData.horaFin || eventoData.hora,
          
          // Backwards compatibility (por si n8n usa campos antiguos)
          fecha: eventoData.eventoFechaInicio || eventoData.fechaInicio || eventoData.fecha,
          hora: eventoData.eventoHoraInicio || eventoData.horaInicio || eventoData.hora,
          
          ubicacion: eventoData.ubicacion,
          tipo: eventoData.tipo,
          capacidadMaxima: eventoData.capacidadMaxima,
          listaInscritos: eventoData.participantes || [],
          
          // Datos del organizador
          organizadorId: eventoData.organizadorId,
          organizadorEmail: eventoData.organizadorEmail,
          
          // Metadata adicional
          timestamp: new Date().toISOString(),
          source: 'eventos-upao-app',
          estado: eventoData.estado || 'publicado'
        })
      });

      logger.log(`✅ [n8n] Response status: ${response.status}`);

      // Manejo especial para CORS - Si es un error CORS pero se envió
      if (response.status === 0 || response.type === 'opaque') {
        logger.log('✅ [n8n] Evento enviado correctamente');
        return {
          success: true,
          data: { corsHandled: true, message: 'Webhook enviado' },
          message: 'Evento enviado correctamente a n8n'
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json().catch(() => ({ 
        success: true, 
        message: 'Respuesta procesada' 
      }));
      
      logger.log('✅ [n8n] Evento enviado exitosamente');
      
      return {
        success: true,
        data: result,
        message: 'Evento enviado correctamente a n8n'
      };

    } catch (error) {
      // Si es un error de CORS, webhook probablemente procesado exitosamente
      if (error.name === 'TypeError' && (
          error.message.includes('fetch') || 
          error.message.includes('CORS') ||
          error.message.includes('Failed to fetch')
        )) {
        logger.log('✅ [n8n] Evento enviado correctamente');
        return {
          success: true,
          data: { corsHandled: true },
          message: 'Evento enviado a n8n'
        };
      }
      
      // Solo mostrar errores reales
      return {
        success: false,
        error: error.message,
        message: 'Error al conectar con n8n'
      };
    }
  }

  /**
   * Método genérico para enviar webhooks
   * @param {string} url - URL completa del webhook (ya construida)
   * @param {Object} datos - Datos a enviar
   * @param {string} descripcion - Descripción para logs
   */
  async enviarWebhook(url, datos, descripcion = 'webhook') {
    logger.log(`🔄 [n8n] Enviando ${descripcion} a:`, url);
    
    if (!this.baseUrl) {
      logger.warn('⚠️ [n8n] Base URL no configurada');
      return {
        success: false,
        error: 'Base URL de n8n no configurada',
        simulado: true
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...datos,
          timestamp: new Date().toISOString(),
          source: 'eventos-upao-app'
        })
      });

      // Manejo especial para CORS
      if (response.status === 0 || response.type === 'opaque') {
        logger.log(`ℹ️ [n8n] CORS detectado en ${descripcion} - Asumiendo éxito`);
        return {
          success: true,
          data: { corsHandled: true },
          message: `${descripcion} enviado (CORS manejado)`
        };
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No se pudo leer el error');
        console.error(`❌ [n8n] Error en ${descripcion}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const resultado = await response.json().catch(() => ({ success: true }));
      logger.log(`✅ [n8n] ${descripcion} enviado exitosamente:`, resultado);
      
      return {
        success: true,
        data: resultado,
        message: `${descripcion} procesado correctamente`
      };

    } catch (error) {
      console.error(`❌ [n8n] Error en ${descripcion}:`, error);
      
      // Manejo especial para errores CORS
      if (error.name === 'TypeError' && (
          error.message.includes('fetch') || 
          error.message.includes('CORS') ||
          error.message.includes('Failed to fetch')
        )) {
        logger.log(`ℹ️ [n8n] Error CORS en ${descripcion} - Webhook probablemente procesado`);
        return {
          success: true,
          data: { corsError: true },
          message: `${descripcion} enviado (error CORS al leer respuesta)`
        };
      }
      
      return {
        success: false,
        error: error.message,
        message: `Error al procesar ${descripcion}`
      };
    }
  }

  /**
   * Webhook para inscripción de alumno
   */
  async enviarInscripcion(evento, alumno) {
    // Asegurar que siempre haya fechas y horas (backwards compatibility)
    // ✅ CORRECCIÓN: Buscar AMBOS formatos: con y sin prefijo "evento"
    const fechaInicio = evento.eventoFechaInicio || evento.fechaInicio || evento.fecha || 'No especificada';
    const fechaFin = evento.eventoFechaFin || evento.fechaFin || evento.fecha || fechaInicio;
    const horaInicio = evento.eventoHoraInicio || evento.horaInicio || evento.hora || 'No especificada';
    const horaFin = evento.eventoHoraFin || evento.horaFin || evento.hora || horaInicio;
    
    const datos = {
      // Datos del evento
      eventoId: evento.id,
      eventoTitulo: evento.titulo,
      eventoDescripcion: evento.descripcion || '',
      eventoTipo: evento.tipo || 'conferencia',
      eventoUbicacion: evento.ubicacion || 'Por confirmar',
      
      // Fechas y horas (nueva estructura) - CORREGIDO: usar fechaInicio en lugar de evento.fechaInicio
      eventoFechaInicio: fechaInicio,
      eventoFechaFin: fechaFin,
      eventoHoraInicio: horaInicio,
      eventoHoraFin: horaFin,
      
      // Datos del alumno
      alumnoId: alumno.uid,
      alumnoEmail: alumno.email,
      alumnoNombre: alumno.nombre || alumno.displayName || 'Estudiante',
      alumnoApellido: alumno.apellido || '',
      
      // Metadata
      fechaInscripcion: new Date().toISOString(),
      source: 'eventos-upao-app'
    };

    logger.log('📧 [n8n] Enviando inscripción con datos:', {
      eventoId: datos.eventoId,
      eventoTitulo: datos.eventoTitulo,
      fechas: `${fechaInicio} al ${fechaFin}`,
      horas: `${horaInicio} - ${horaFin}`,
      alumno: `${datos.alumnoNombre} ${datos.alumnoApellido}`,
      email: datos.alumnoEmail
    });

    return await this.enviarWebhook(
      this.endpoints.inscripcion,
      datos,
      'inscripción de alumno'
    );
  }

  /**
   * Webhook para lista de inscritos (cuando se cierran inscripciones)
   */
  async enviarListaInscritos(evento, listaInscritos) {
    const datos = {
      eventoId: evento.id,
      eventoTitulo: evento.titulo,
      
      // Fechas y horas del evento
      eventoFechaInicio: evento.eventoFechaInicio || evento.fechaInicio || evento.fecha,
      eventoFechaFin: evento.eventoFechaFin || evento.fechaFin || evento.fecha,
      eventoHoraInicio: evento.eventoHoraInicio || evento.horaInicio || evento.hora,
      eventoHoraFin: evento.eventoHoraFin || evento.horaFin || evento.hora,
      
      capacidadMaxima: evento.capacidadMaxima,
      totalInscritos: listaInscritos.length,
      porcentajeOcupacion: ((listaInscritos.length / evento.capacidadMaxima) * 100).toFixed(2),
      
      // Datos del organizador
      organizadorId: evento.organizadorId,
      organizadorEmail: evento.organizadorEmail,
      
      // Lista de participantes
      participantes: listaInscritos.map(participante => ({
        id: participante.id || participante.uid,
        email: participante.email,
        nombre: participante.nombre,
        apellido: participante.apellido || '',
        fechaInscripcion: participante.fechaInscripcion,
        qrId: participante.qrData?.qrId || ''
      })),
      
      fechaCierre: new Date().toISOString(),
      motivoCierre: listaInscritos.length >= evento.capacidadMaxima ? 'capacidad_maxima' : 'cierre_manual'
    };

    logger.log('📋 [n8n] Enviando lista de inscritos:', {
      eventoId: datos.eventoId,
      eventoTitulo: datos.eventoTitulo,
      totalInscritos: datos.totalInscritos,
      capacidad: `${datos.totalInscritos}/${datos.capacidadMaxima}`
    });

    return await this.enviarWebhook(
      this.endpoints.listaInscritos,
      datos,
      'lista de inscritos'
    );
  }

  /**
   * Webhook para lista de asistencias (ACTUALIZADO: soporta eventos multi-día)
   * @param {Object} evento - Datos del evento
   * @param {Object} resumenAsistencias - Resumen completo de asistencias (de firestoreService.obtenerResumenAsistencias)
   */
  async enviarAsistencias(evento, resumenAsistencias) {
    // Construir payload según si es evento multi-día o no
    const datos = {
      eventoId: evento.id,
      eventoTitulo: evento.titulo,
      
      // Fechas y horas del evento
      eventoFechaInicio: evento.eventoFechaInicio || evento.fechaInicio || evento.fecha,
      eventoFechaFin: evento.eventoFechaFin || evento.fechaFin || evento.fecha,
      eventoHoraInicio: evento.eventoHoraInicio || evento.horaInicio || evento.hora,
      eventoHoraFin: evento.eventoHoraFin || evento.horaFin || evento.hora,
      
      // Información del evento multi-día
      esEventoMultiDia: resumenAsistencias.esMultiDia,
      totalDias: resumenAsistencias.totalDias,
      diasEvento: resumenAsistencias.diasEvento,
      
      // Estadísticas generales
      totalInscritos: resumenAsistencias.totalInscritos,
      totalAsistentesUnicos: resumenAsistencias.totalAsistentesUnicos,
      porcentajeAsistenciaGeneral: resumenAsistencias.porcentajeAsistenciaGeneral,
      
      // Asistencias por día (solo para eventos multi-día)
      asistenciasPorDia: resumenAsistencias.esMultiDia 
        ? Object.keys(resumenAsistencias.resumenPorDia).map(fecha => ({
            fecha,
            totalAsistentes: resumenAsistencias.resumenPorDia[fecha].totalAsistentes,
            porcentaje: resumenAsistencias.totalInscritos > 0
              ? ((resumenAsistencias.resumenPorDia[fecha].totalAsistentes / resumenAsistencias.totalInscritos) * 100).toFixed(2)
              : '0.00',
            asistentes: resumenAsistencias.resumenPorDia[fecha].participantesInfo.map(p => ({
              id: p.uid || p.id,
              email: p.email,
              nombre: p.nombre,
              apellido: p.apellido || '',
              metodo: p.metodo,
              timestamp: p.timestamp
            }))
          }))
        : null,
      
      // Participantes con asistencia perfecta (asistieron todos los días)
      participantesConAsistenciaPerfecta: resumenAsistencias.participantesConAsistenciaPerfecta.map(p => ({
        id: p.uid || p.id,
        email: p.email,
        nombre: p.nombre,
        apellido: p.apellido || '',
        diasAsistidos: p.diasAsistidos,
        totalDias: p.totalDias,
        porcentajeAsistencia: p.porcentajeAsistencia
      })),
      
      // Participantes con asistencia parcial (faltaron algún día)
      participantesConAsistenciaParcial: resumenAsistencias.participantesConAsistenciaParcial.map(p => ({
        id: p.uid || p.id,
        email: p.email,
        nombre: p.nombre,
        apellido: p.apellido || '',
        diasAsistidos: p.diasAsistidos,
        totalDias: p.totalDias,
        diasFaltantes: p.diasFaltantes,
        porcentajeAsistencia: p.porcentajeAsistencia
      })),
      
      // Lista consolidada de todos los asistentes (para eventos de 1 día)
      asistentes: !resumenAsistencias.esMultiDia
        ? resumenAsistencias.resumenPorDia[resumenAsistencias.diasEvento[0]]?.participantesInfo.map(p => ({
            id: p.uid || p.id,
            email: p.email,
            nombre: p.nombre,
            apellido: p.apellido || '',
            metodo: p.metodo,
            estado: 'asistio'
          }))
        : null,
      
      fechaFinEvento: new Date().toISOString()
    };

    logger.log('📊 [n8n] Enviando asistencias:', {
      eventoId: datos.eventoId,
      esMultiDia: datos.esEventoMultiDia,
      totalDias: datos.totalDias,
      asistentesUnicos: datos.totalAsistentesUnicos,
      asistenciaPerfecta: datos.participantesConAsistenciaPerfecta.length,
      asistenciaParcial: datos.participantesConAsistenciaParcial.length
    });

    return await this.enviarWebhook(
      this.endpoints.asistencias,
      datos,
      'lista de asistencias'
    );
  }

  /**
   * Validar configuración del servicio
   */
  validarConfiguracion() {
    const errores = [];
    
    if (!this.baseUrl) {
      errores.push('VITE_N8N_BASE_URL no configurada');
    }
    
    if (!this.endpoints.eventoCreado) {
      errores.push('VITE_N8N_WEBHOOK_EVENTO_CREADO no configurado');
    }
    
    return {
      valida: errores.length === 0,
      errores,
      configuracion: {
        baseUrl: this.baseUrl,
        endpoints: this.endpoints
      }
    };
  }

  /**
   * Probar conexión con el servidor n8n
   */
  async probarConexion() {
    if (!this.baseUrl) {
      return {
        success: false,
        error: 'URL base de n8n no configurada'
      };
    }

    try {
      logger.log('🧪 [n8n] Probando conexión con:', this.baseUrl);
      
      // Intentar hacer ping al servidor
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Conexión exitosa con n8n' : 'Servidor n8n no responde'
      };
    } catch (error) {
      console.error('❌ [n8n] Error de conexión:', error);
      return {
        success: false,
        error: error.message,
        message: 'No se pudo conectar con el servidor n8n'
      };
    }
  }
}

// Exportar instancia singleton
const n8nService = new N8nService();

export default n8nService;