import React from 'react';
import { useEventosAlumno } from '../../core/hooks/useEventosAlumno';
import QRGenerator from '../../components/qr/QRGenerator';
import { authService } from '../../services/authService';

const MisEventos = ({ onVerDetalle }) => {
  const { eventosInscritos, desinscribirseEvento, loading, error } = useEventosAlumno();
  const currentUser = authService.getCurrentUser();

  const handleDesinscripcion = async (eventoId) => {
    if (window.confirm('¿Estás seguro de que quieres desinscribirte de este evento?')) {
      const result = await desinscribirseEvento(eventoId);
      if (result.success) {
        alert('Te has desinscrito exitosamente del evento');
      } else {
        alert(result.error || 'Error al desinscribirse del evento');
      }
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
          <h2 className="fw-bold text-primary mb-1">Mis Inscripciones</h2>
          <p className="text-muted mb-0">Eventos en los que estás inscrito</p>
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
                📚 Eventos Inscritos ({eventosInscritos.length})
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
                    const fechaEvento = new Date(evento.fecha);
                    const hoy = new Date();
                    const esEventoPasado = fechaEvento < hoy;
                    const participanteInfo = evento.participantesInfo?.find(p => 
                      p.id === currentUser?.uid || p.uid === currentUser?.uid
                    );
                    const asistio = evento.asistentes?.includes(currentUser?.uid);

                    return (
                      <div key={evento.id} className="col-12 col-md-6 col-xl-4">
                        <div className="card h-100 border-0 shadow-sm position-relative">
                          {/* Badge de estado */}
                          <div className="position-absolute top-0 end-0 m-3">
                            {esEventoPasado ? (
                              <span className={`badge ${asistio ? 'bg-success' : 'bg-secondary'}`}>
                                {asistio ? '✅ Asistió' : '❌ No asistió'}
                              </span>
                            ) : (
                              <span className="badge bg-primary">📅 Próximo</span>
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
                                <strong>{evento.fecha} - {evento.hora}</strong>
                              </div>
                              <div className="mb-1">
                                <i className="bi bi-geo-alt me-2"></i>
                                {evento.ubicacion}
                              </div>
                              {participanteInfo && participanteInfo.fechaInscripcion && (
                                <div className="mb-1">
                                  <i className="bi bi-person-check me-2"></i>
                                  Inscrito: {(() => {
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
                              {/* Mostrar estado de asistencia o botón QR */}
                              {participanteInfo?.asistio ? (
                                // Si ya asistió, mostrar badge de confirmación
                                <div className="alert alert-success mb-2 py-2 px-3 d-flex align-items-center justify-content-between">
                                  <div>
                                    <i className="bi bi-check-circle-fill me-2"></i>
                                    <strong>Asistencia Registrada</strong>
                                  </div>
                                  <span className="badge bg-success">
                                    {evento.asistenciaQR?.[currentUser?.uid]?.metodo === 'qr' ? '📱 QR' : '✋ Manual'}
                                  </span>
                                </div>
                              ) : participanteInfo?.qrData?.qrString ? (
                                // Si NO ha asistido, mostrar botón Ver QR
                                <QRGenerator
                                  qrString={participanteInfo.qrData.qrString}
                                  eventoNombre={evento.titulo}
                                  eventoFecha={evento.fecha}
                                  eventoHora={evento.hora}
                                  participanteNombre={currentUser?.displayName || currentUser?.email || 'Estudiante'}
                                />
                              ) : null}

                              <button 
                                className="btn btn-outline-primary-custom btn-sm"
                                onClick={() => onVerDetalle(evento.id)}
                              >
                                <i className="bi bi-eye me-2"></i>
                                Ver detalles
                              </button>
                              
                              {!esEventoPasado && !participanteInfo?.asistio && (
                                <button 
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleDesinscripcion(evento.id)}
                                >
                                  <i className="bi bi-x-circle me-2"></i>
                                  Desinscribirse
                                </button>
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