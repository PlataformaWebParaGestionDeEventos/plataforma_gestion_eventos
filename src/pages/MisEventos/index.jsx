import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventosAlumno } from '../../core/hooks/useEventosAlumno';
import { useButtonDebounce } from '../../core/hooks';
import QRGenerator from '../../components/qr/QRGenerator';
import { authService } from '../../services/authService';
import formatters from '../../core/utils/formatters';
import toastHelper from '../../core/utils/toastHelper';
import logger from '../../core/utils/logger';

const MisEventos = () => {
  const navigate = useNavigate();
  const { eventosInscritos, desinscribirseEvento, loading, error } = useEventosAlumno();
  const { isDisabled: isButtonDisabled, handleClick: handleButtonClick } = useButtonDebounce(5000);
  const currentUser = authService.getCurrentUser();

  const handleDesinscripcion = async (eventoId) => {
    const confirmed = await toastHelper.confirm('¿Estás seguro de que quieres desinscribirte de este evento?');
    if (!confirmed) return;
    
    try {
      const result = await desinscribirseEvento(eventoId);
      if (result.success) {
        toastHelper.success('✅ Te has desinscrito exitosamente del evento');
        logger.log('Desinscripción exitosa:', eventoId);
      } else {
        toastHelper.error(result.error || 'Error al desinscribirse del evento');
        logger.error('Error en desinscripción:', result.error);
      }
    } catch (err) {
      toastHelper.error('Error inesperado al procesar la desinscripción');
      logger.error('Error inesperado en desinscripción:', err);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Cargando tus inscripciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="fw-bold text-primary mb-1">
              Mis Inscripciones
            </h2>
            <p className="text-muted mb-0">
              Eventos en los que estás inscrito
            </p>
          </div>
        </div>

      {error && (
        <div className="row mb-3">
          <div className="col-12">
            <div className="alert alert-warning" role="alert">
              {error}
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0 fw-bold text-dark">
                Eventos Inscritos ({eventosInscritos.length})
              </h5>
            </div>
            <div className="card-body p-4">
              {eventosInscritos.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-4">
                    <i className="bi bi-calendar-x display-1 text-muted"></i>
                  </div>
                  <h5 className="text-muted mb-3">No tienes inscripciones activas</h5>
                  <p className="text-muted">
                    Explora los eventos disponibles y regístrate en los que te interesen.
                  </p>
                </div>
              ) : (
                <div className="row g-4">
                  {eventosInscritos.map(evento => {
                    const fechaEvento = new Date(evento.fecha + 'T' + evento.hora);
                    const hoy = new Date();
                    const esEventoPasado = fechaEvento < hoy;
                    
                    // 🔧 FIX: Validar que participantesInfo sea un array antes de usar .find()
                    const participanteInfo = Array.isArray(evento.participantesInfo)
                      ? evento.participantesInfo.find(p => p.id === currentUser?.uid || p.uid === currentUser?.uid)
                      : null;
                    
                    const asistio = evento.asistentes?.includes(currentUser?.uid);

                    return (
                      <div key={evento.id} className="col-12 col-md-6 col-xl-4">
                        <div className={`card h-100 border-0 shadow-sm position-relative ${esEventoPasado ? 'opacity-75' : ''}`}>
                          {/* Badge de estado */}
                          <div className="position-absolute top-0 end-0 m-3 d-flex flex-column gap-1">
                            {esEventoPasado ? (
                              <>
                                <span className="badge badge-gray-custom">
                                  🏁 Evento Finalizado
                                </span>
                                {asistio ? (
                                  <span className="badge badge-success-custom">
                                    ✅ Asististe
                                  </span>
                                ) : (
                                  <span className="badge bg-danger">
                                    ❌ Faltaste
                                  </span>
                                )}
                              </>
                            ) : evento.estado === 'finalizado' ? (
                              <span className="badge bg-secondary">Finalizado</span>
                            ) : evento.inscripcionesAbiertas === false ? (
                              <span className="badge bg-secondary">Cerrado</span>
                            ) : (
                              <span className="badge badge-primary-custom">Próximo</span>
                            )}
                          </div>

                          <div className="card-header bg-gradient border-0 p-3">
                            <span className="badge bg-primary text-white">
                              {evento.tipo}
                            </span>
                          </div>
                          
                          <div className="card-body p-4">
                            <h5 className="card-title fw-bold text-dark mb-3">
                              {evento.titulo}
                            </h5>
                            <p className="card-text text-muted mb-3">
                              {evento.descripcion.length > 100 
                                ? evento.descripcion.substring(0, 100) + '...' 
                                : evento.descripcion
                              }
                            </p>
                            
                            <div className="small text-muted mb-3">
                              <div className="mb-1">
                                <i className="bi bi-calendar-event me-2"></i>
                                <strong>Fecha(s):</strong> {evento.fechaInicio || evento.fecha || 'No especificada'} 
                                    {evento.fechaFin && evento.fechaFin !== evento.fechaInicio && ` al ${evento.fechaFin}`}
                              </div>
                              <div className="mb-1">
                                <i className="bi bi-calendar-event me-2"></i>
                                <strong>Horario:</strong> {evento.horaInicio || evento.hora || 'No especificada'} 
                                    {evento.horaFin && ` - ${evento.horaFin}`}
                              </div>
                              <div className="mb-1">
                                <i className="bi bi-geo-alt me-2"></i>
                                <strong>Ubicación:</strong> {evento.ubicacion}
                              </div>
                              {participanteInfo && participanteInfo.fechaInscripcion && (
                                <div className="mb-1">
                                  <i className="bi bi-person-check me-2"></i>
                                  <strong>Inscrito:</strong> {(() => {
                                    try {
                                      // Manejar diferentes formatos de fecha
                                      const fecha = participanteInfo.fechaInscripcion;
                                      if (fecha?.toDate) {
                                        // Es un Timestamp de Firestore
                                        return fecha.toDate().toLocaleDateString('es-ES');
                                      } else if (typeof fecha === 'string') {
                                        // Es un string ISO
                                        return new Date(fecha).toLocaleDateString('es-ES');
                                      } else {
                                        return 'Fecha no disponible';
                                      }
                                    } catch (error) {
                                      console.error('Error al formatear fecha:', error);
                                      return 'Fecha no disponible';
                                    }
                                  })()}
                                </div>
                              )}
                            </div>

                            {/* Información adicional */}
                            <div className="small">
                              <div className="d-flex justify-content-between mb-2">
                                <span>Participantes:</span>
                                <span className="fw-semibold">
                                  {evento.participantes?.length || 0}/{evento.capacidadMaxima}
                                </span>
                              </div>
                              <div className="progress mb-2" style={{ height: '6px' }}>
                                <div 
                                  className="progress-bar bg-primary"
                                  role="progressbar" 
                                  style={{ width: `${(evento.participantes?.length || 0) / evento.capacidadMaxima * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="card-footer bg-white border-0 p-4">
                            <div className="d-grid gap-2">
                              {/* EVENTOS FINALIZADOS */}
                              {esEventoPasado ? (
                                <>
                                  {asistio ? (
                                    <>
                                      {/* Asistió al evento - Mostrar botón certificado */}
                                      <div className="alert alert-success-custom mb-2 py-2 px-3">
                                        <i className="bi bi-check-circle-fill me-2"></i>
                                        <strong>¡Asistencia Registrada!</strong>
                                        <small className="d-block mt-1">
                                          {/* ✅ OPTIMIZADO: Usar formatters.obtenerMetodoRegistro() */}
                                          {formatters.obtenerMetodoRegistro(evento, currentUser?.uid) === 'qr' ? '📱 Método: QR' : '✋ Método: Manual'}
                                        </small>
                                      </div>
                                      <button 
                                        className="btn btn-success btn-sm"
                                        onClick={() => {
                                          toastHelper.info('📜 Certificado en proceso - Recibirás un email');
                                          logger.log('📜 Certificado solicitado para evento:', evento.id);
                                        }}
                                      >
                                        <i className="bi bi-award-fill me-2"></i>
                                        📜 Descargar Certificado
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {/* No asistió al evento */}
                                      <div className="alert alert-danger-custom mb-2 py-2 px-3">
                                        <i className="bi bi-x-circle-fill me-2"></i>
                                        <strong>No Asististe</strong>
                                        <small className="d-block mt-1">
                                          No se registró tu asistencia a este evento
                                        </small>
                                      </div>
                                    </>
                                  )}
                                  
                                  <button 
                                    className="btn btn-outline-primary-custom btn-sm"
                                    onClick={() => navigate(`/alumno/evento/${evento.id}`)}
                                  >
                                    <i className="bi bi-eye me-2"></i>
                                    Ver Detalles del Evento
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* EVENTOS PRÓXIMOS */}
                                  {participanteInfo?.asistio ? (
                                    // Ya asistió (llegó temprano)
                                    <div className="alert alert-success-custom mb-2 py-2 px-3 d-flex align-items-center justify-content-between">
                                      <div>
                                        <i className="bi bi-check-circle-fill me-2"></i>
                                        <strong>Asistencia Registrada</strong>
                                      </div>
                                      <span className="badge bg-success">
                                        {/* ✅ OPTIMIZADO: Usar formatters.obtenerMetodoRegistro() */}
                                        {formatters.obtenerMetodoRegistro(evento, currentUser?.uid) === 'qr' ? '📱 QR' : '✋ Manual'}
                                      </span>
                                    </div>
                                  ) : participanteInfo?.qrsPorDia ? (
                                    <QRGenerator
                                      qrsPorDia={participanteInfo.qrsPorDia}
                                      eventoNombre={evento.titulo}
                                      eventoFechaInicio={evento.fechaInicio || evento.fecha}
                                      eventoFechaFin={evento.fechaFin || evento.fecha || evento.fechaInicio}
                                      asistenciasPorDia={evento.asistenciasPorDia || {}}
                                      participanteUid={currentUser?.uid}
                                      participanteNombre={currentUser?.displayName || currentUser?.email || 'Estudiante'}
                                    />
                                  ) : null}

                                  <button 
                                    className="btn btn-outline-primary-custom btn-sm"
                                    onClick={() => navigate(`/alumno/evento/${evento.id}`)}
                                  >
                                    <i className="bi bi-eye me-2"></i>
                                    Ver Detalles
                                  </button>
                                  
                                  {/* Si las inscripciones están cerradas, mostrar botón de estado */}
                                  {evento.inscripcionesAbiertas === false ? (
                                    <button 
                                      className="btn btn-secondary btn-sm"
                                      disabled
                                    >
                                      <i className="bi bi-lock-fill me-2"></i>
                                      Inscripciones Cerradas
                                    </button>
                                  ) : !participanteInfo?.asistio ? (
                                    <button 
                                      className="btn btn-outline-danger btn-sm"
                                      onClick={handleButtonClick(() => handleDesinscripcion(evento.id))}
                                      disabled={isButtonDisabled}
                                    >
                                      <i className="bi bi-x-circle me-2"></i>
                                      Desinscribirse
                                    </button>
                                  ) : (
                                    <div className="alert alert-info-custom mb-0 py-2 px-3 small">
                                      <i className="bi bi-info-circle me-2"></i>
                                      No puedes desinscribirte después de marcar asistencia
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MisEventos;