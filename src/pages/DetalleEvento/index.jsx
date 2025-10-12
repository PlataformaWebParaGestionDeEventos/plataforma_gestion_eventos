import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventosAlumno } from '../../core/hooks/useEventosAlumno';
import toastHelper from '../../core/utils/toastHelper';
import logger from '../../core/utils/logger';

const DetalleEvento = () => {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const { obtenerEvento, inscribirseEvento, estaInscrito, loading } = useEventosAlumno();
  const [evento, setEvento] = useState(null);
  const [procesandoInscripcion, setProcesandoInscripcion] = useState(false);

  useEffect(() => {
    if (eventoId) {
      const eventoData = obtenerEvento(eventoId);
      setEvento(eventoData);
    }
  }, [eventoId, obtenerEvento]);

  const handleInscripcion = async () => {
    if (!evento) return;

    // Validar si las inscripciones están cerradas
    if (!evento.inscripcionesAbiertas) {
      toastHelper.warning('⚠️ Las inscripciones para este evento están cerradas');
      return;
    }

    setProcesandoInscripcion(true);

    try {
      logger.log('📝 Iniciando inscripción al evento:', evento.id);
      
      const result = await inscribirseEvento(evento.id);
      
      if (result.success) {
        toastHelper.success('✅ ¡Inscripción exitosa! Revisa tu email para más detalles');
        logger.log('✅ Inscripción exitosa');
        
        // Actualizar el evento después de la inscripción
        setTimeout(() => {
          const eventoActualizado = obtenerEvento(eventoId);
          setEvento(eventoActualizado);
        }, 1000);
      } else {
        toastHelper.error(result.error || '❌ Error al inscribirse al evento');
        logger.error('❌ Error en inscripción:', result.error);
      }
    } catch (err) {
      logger.error('❌ Error al procesar la inscripción:', err);
      toastHelper.error('❌ Error inesperado al procesar la inscripción');
    } finally {
      setProcesandoInscripcion(false);
    }
  };

  if (loading || !evento) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Cargando detalles del evento...</p>
        </div>
      </div>
    );
  }

  const yaInscrito = estaInscrito(evento.id);
  const espaciosDisponibles = evento.capacidadMaxima - (evento.participantes?.length || 0);
  const eventoLleno = espaciosDisponibles <= 0;
  const inscripcionesCerradas = !evento.inscripcionesAbiertas;

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <button 
            className="btn btn-outline-primary-custom mb-4"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h3 className="card-title fw-bold mb-2 text-primary">{evento.titulo}</h3>
                  <span className="badge bg-primary text-white">
                    {evento.tipo}
                  </span>
                </div>
                <span className={`badge ${yaInscrito ? 'bg-info' : eventoLleno ? 'bg-danger' : 'bg-primary'}`}>
                  {yaInscrito ? 'Inscrito' : eventoLleno ? 'Lleno' : 'Disponible'}
                </span>
              </div>
            </div>

            <div className="card-body p-4">
              {/* Información principal */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <h5 className="text-primary mb-3">Información del Evento</h5>
                  <div className="list-group list-group-flush">
                    <div className="list-group-item border-0 px-0">
                      <strong>📅 Fecha(s) :</strong> {evento.fechaInicio || evento.fecha || 'No especificada'}
                      {evento.fechaFin && evento.fechaFin !== evento.fechaInicio && ` al ${evento.fechaFin}`}
                    </div>
                    <div className="list-group-item border-0 px-0">
                      <strong>🕐 Horario:</strong> {evento.horaInicio || evento.hora || 'No especificada'}
                      {evento.horaFin && ` - ${evento.horaFin}`}
                    </div>
                    <div className="list-group-item border-0 px-0">
                      <strong>📍 Ubicación:</strong> {evento.ubicacion}
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <h5 className="text-primary mb-3">Flyer del Evento</h5>
                  <div className="alert alert-info-custom" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>El flyer con el cronograma de expositores será generado y enviado por correo al inscribirte.</strong>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className="mb-4">
                <h5 className="text-primary mb-3">Descripción</h5>
                <p className="text-muted">{evento.descripcion}</p>
              </div>

              {/* Objetivos (si existen) */}
              {evento.objetivos && (
                <div className="mb-4">
                  <h5 className="text-primary mb-3">🎯 Objetivos</h5>
                  <p className="text-muted">{evento.objetivos}</p>
                </div>
              )}

              {/* Recursos necesarios (si existen) */}
              {evento.recursosNecesarios && (
                <div className="mb-4">
                  <h5 className="text-primary mb-3">🛠️ Recursos Necesarios</h5>
                  <p className="text-muted">{evento.recursosNecesarios}</p>
                </div>
              )}

              {/* Barra de progreso de capacidad */}
              <div className="mb-4">
                <h6 className="text-muted mb-2">Capacidad del evento</h6>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className={`progress-bar ${(evento.participantes?.length / evento.capacidadMaxima) > 0.8 ? 'bg-warning' : 'bg-primary'}`}
                    role="progressbar" 
                    style={{ width: `${(evento.participantes?.length || 0) / evento.capacidadMaxima * 100}%` }}
                  ></div>
                </div>
                <small className="text-muted">
                  {evento.participantes?.length || 0} de {evento.capacidadMaxima} participantes
                </small>
              </div>

              {/* Botón de inscripción */}
              <div className="d-grid gap-2">
                {yaInscrito ? (
                  <div className="alert alert-success-custom mb-0">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    <strong>Ya estás inscrito en este evento</strong>
                    <p className="mb-0 mt-2 small">
                      Para desinscribirte, ve a la sección "Mis Inscripciones"
                    </p>
                  </div>
                ) : inscripcionesCerradas ? (
                  <button 
                    className="btn btn-lg btn-secondary"
                    disabled
                  >
                    🔒 Inscripciones Cerradas
                  </button>
                ) : (
                  <button 
                    className="btn btn-lg btn-primary-custom"
                    onClick={handleInscripcion}
                    disabled={procesandoInscripcion || eventoLleno}
                  >
                    {procesandoInscripcion ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Procesando...
                      </>
                    ) : eventoLleno ? (
                      '🚫 Evento lleno'
                    ) : (
                      '✅ Inscribirse al evento'
                    )}
                  </button>
                )}
                
                {!yaInscrito && !inscripcionesCerradas && espaciosDisponibles <= 5 && espaciosDisponibles > 0 && (
                  <small className="text-warning text-center">
                    ⚠️ ¡Solo quedan {espaciosDisponibles} espacios disponibles!
                  </small>
                )}
                
                {inscripcionesCerradas && !yaInscrito && (
                  <small className="text-muted text-center">
                    El organizador ha cerrado las inscripciones para este evento
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleEvento;