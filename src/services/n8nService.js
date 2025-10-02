/**
 * Servicio de integración con n8n para automatización de eventos académicos
 * Maneja todos los webhooks y comunicación con los workflows de n8n
 */

const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL;

class N8nService {
  constructor() {
    this.endpoints = {
      eventoCreado: import.meta.env.VITE_N8N_WEBHOOK_EVENTO_CREADO,
      inscripcion: import.meta.env.VITE_N8N_WEBHOOK_INSCRIPCION,
      listaInscritos: import.meta.env.VITE_N8N_WEBHOOK_LISTA_INSCRITOS,
      asistencias: import.meta.env.VITE_N8N_WEBHOOK_ASISTENCIAS
    };
  }

  /**
   * Método genérico para enviar datos a n8n
   */
  async enviarWebhook(endpoint, datos, descripcion = 'webhook') {
    console.log(`🔍 [n8n] Iniciando envío de ${descripcion}...`);
    console.log(`🔍 [n8n] Base URL: ${N8N_BASE_URL}`);
    console.log(`🔍 [n8n] Endpoint: ${endpoint}`);
    
    if (!N8N_BASE_URL) {
      console.warn('⚠️ n8n no configurado, simulando envío');
      return {
        success: false,
        error: 'n8n no configurado',
        simulado: true
      };
    }

    const url = `${N8N_BASE_URL}${endpoint}`;
    
    try {
      console.log(`🔄 Enviando ${descripcion} a n8n:`, { url, datos });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...datos,
          timestamp: new Date().toISOString(),
          source: 'eventos-upao-app'
        }),
      });

      console.log(`🔍 [n8n] Response status: ${response.status}`);
      console.log(`🔍 [n8n] Response ok: ${response.ok}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [n8n] Error response: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const resultado = await response.json();
      console.log(`✅ ${descripcion} enviado exitosamente:`, resultado);
      
      return {
        success: true,
        data: resultado,
        message: `${descripcion} procesado correctamente`
      };

    } catch (error) {
      console.error(`❌ Error en ${descripcion}:`, error);
      console.error(`❌ Error stack:`, error.stack);
      
      return {
        success: false,
        error: error.message,
        message: `Error al procesar ${descripcion}`
      };
    }
  }

  /**
   * 1. Webhook: Evento Creado
   * Inicia el workflow cuando se crea un evento
   */
  async notificarEventoCreado(evento, organizador) {
    const datos = {
      // Datos del evento
      eventoId: evento.id,
      titulo: evento.titulo,
      descripcion: evento.descripcion,
      fecha: evento.fecha,
      hora: evento.hora,
      fechaFin: evento.fechaFin || evento.fecha,
      horaFin: evento.horaFin || '23:59',
      ubicacion: evento.ubicacion,
      tipo: evento.tipo,
      capacidadMaxima: evento.capacidadMaxima,
      estado: evento.estado || 'publicado',
      
      // Datos del organizador
      organizadorId: organizador.uid,
      organizadorEmail: organizador.email,
      organizadorNombre: organizador.displayName || 'Organizador',
      
      // Fechas importantes calculadas
      fechaLimiteInscripcion: this.calcularFechaLimiteInscripcion(evento.fecha),
      fechaRecordatorio: this.calcularFechaRecordatorio(evento.fecha),
      
      // Configuración del workflow
      workflowConfig: {
        enviarConfirmacion: true,
        enviarRecordatorio: true,
        generarCertificados: true,
        crearEncuesta: true
      }
    };

    return await this.enviarWebhook(
      this.endpoints.eventoCreado,
      datos,
      'evento creado'
    );
  }

  /**
   * 2. Webhook: Inscripción de Alumno
   * Envía confirmación inmediata de inscripción
   */
  async notificarInscripcion(evento, alumno) {
    const datos = {
      // Datos de la inscripción
      inscripcionId: `${evento.id}-${alumno.uid}-${Date.now()}`,
      
      // Datos del evento
      eventoId: evento.id,
      eventoTitulo: evento.titulo,
      eventoDescripcion: evento.descripcion,
      eventoFecha: evento.fecha,
      eventoHora: evento.hora,
      eventoUbicacion: evento.ubicacion,
      eventoTipo: evento.tipo,
      
      // Datos del alumno
      alumnoId: alumno.uid,
      alumnoEmail: alumno.email,
      alumnoNombre: alumno.nombre || alumno.displayName || 'Estudiante',
      
      // Timestamps
      fechaInscripcion: new Date().toISOString(),
      fechaEvento: `${evento.fecha}T${evento.hora}:00`,
      
      // Configuración de emails
      emailConfig: {
        asunto: `Confirmación de Inscripción - ${evento.titulo}`,
        template: 'confirmacion-inscripcion',
        idioma: 'es'
      }
    };

    return await this.enviarWebhook(
      this.endpoints.inscripcion,
      datos,
      'inscripción de alumno'
    );
  }

  /**
   * 3. Webhook: Lista de Inscritos
   * Envía lista cuando se cierra inscripción
   */
  async enviarListaInscritos(evento, listaInscritos) {
    const datos = {
      // Datos del evento
      eventoId: evento.id,
      eventoTitulo: evento.titulo,
      eventoFecha: evento.fecha,
      eventoHora: evento.hora,
      capacidadMaxima: evento.capacidadMaxima,
      
      // Estado de inscripciones
      inscripcionesCerradas: true,
      fechaCierreInscripciones: new Date().toISOString(),
      motivoCierre: this.determinarMotivoCierre(evento, listaInscritos),
      
      // Lista de inscritos
      totalInscritos: listaInscritos.length,
      inscritos: listaInscritos.map(inscrito => ({
        id: inscrito.uid,
        email: inscrito.email,
        nombre: inscrito.nombre,
        fechaInscripcion: inscrito.fechaInscripcion,
        estado: 'inscrito'
      })),
      
      // Configuración para siguiente fase
      nextSteps: {
        generarListaAsistencia: true,
        crearEncuestaSatisfaccion: true,
        prepararCertificados: true
      }
    };

    return await this.enviarWebhook(
      this.endpoints.listaInscritos,
      datos,
      'lista de inscritos'
    );
  }

  /**
   * 4. Webhook: Lista de Asistencias
   * Envía quiénes realmente asistieron al evento
   */
  async enviarAsistencias(evento, asistentes, inscritos) {
    const datos = {
      // Datos del evento
      eventoId: evento.id,
      eventoTitulo: evento.titulo,
      eventoFecha: evento.fecha,
      fechaFinEvento: new Date().toISOString(),
      
      // Estadísticas de asistencia
      totalInscritos: inscritos.length,
      totalAsistentes: asistentes.length,
      porcentajeAsistencia: (asistentes.length / inscritos.length * 100).toFixed(2),
      
      // Lista de asistentes
      asistentes: asistentes.map(asistente => ({
        id: asistente.uid || asistente.id,
        email: asistente.email,
        nombre: asistente.nombre,
        fechaInscripcion: asistente.fechaInscripcion,
        horaAsistencia: new Date().toISOString(),
        estado: 'asistio'
      })),
      
      // Lista de no asistentes (para referencia)
      noAsistentes: inscritos
        .filter(inscrito => !asistentes.find(a => a.uid === inscrito.uid))
        .map(noAsistente => ({
          id: noAsistente.uid,
          email: noAsistente.email,
          nombre: noAsistente.nombre,
          estado: 'no_asistio'
        })),
      
      // Configuración para siguiente fase
      nextSteps: {
        enviarEncuestaSatisfaccion: true,
        validarAsistencia: true,
        generarCertificados: false // Solo después de encuesta
      }
    };

    return await this.enviarWebhook(
      this.endpoints.asistencias,
      datos,
      'lista de asistencias'
    );
  }

  /**
   * Métodos auxiliares
   */
  calcularFechaLimiteInscripcion(fechaEvento) {
    const fecha = new Date(fechaEvento);
    return fecha.toISOString().split('T')[0]; // Mismo día del evento
  }

  calcularFechaRecordatorio(fechaEvento) {
    const fecha = new Date(fechaEvento);
    fecha.setDate(fecha.getDate() - 1); // 1 día antes
    return fecha.toISOString().split('T')[0];
  }

  determinarMotivoCierre(evento, inscritos) {
    const capacidadLlena = inscritos.length >= evento.capacidadMaxima;
    const esDiaEvento = new Date().toDateString() === new Date(evento.fecha).toDateString();
    
    if (capacidadLlena) return 'capacidad_maxima';
    if (esDiaEvento) return 'dia_evento';
    return 'manual';
  }

  /**
   * Validar configuración
   */
  validarConfiguracion() {
    const errores = [];
    
    if (!N8N_BASE_URL) {
      errores.push('VITE_N8N_BASE_URL no configurada');
    }
    
    Object.entries(this.endpoints).forEach(([key, endpoint]) => {
      if (!endpoint) {
        errores.push(`Endpoint ${key} no configurado`);
      }
    });
    
    return {
      valida: errores.length === 0,
      errores,
      configuracion: {
        baseUrl: N8N_BASE_URL,
        endpoints: this.endpoints
      }
    };
  }

  /**
   * Método de prueba para validar conectividad
   */
  async probarConexion() {
    if (!N8N_BASE_URL) {
      return {
        success: false,
        error: 'URL base de n8n no configurada'
      };
    }

    try {
      const response = await fetch(`${N8N_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Conexión exitosa' : 'Error de conexión'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Instancia singleton
const n8nService = new N8nService();

export default n8nService;