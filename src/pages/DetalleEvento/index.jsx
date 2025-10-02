import React, { useState, useEffect } from 'react';
import { useEventosAlumno } from '../../core/hooks/useEventosAlumno';

const DetalleEvento = ({ eventoId, onVolver }) => {
  const { obtenerEvento, inscribirseEvento, desinscribirseEvento, estaInscrito, loading } = useEventosAlumno();
  const [evento, setEvento] = useState(null);
  const [procesandoInscripcion, setProcesandoInscripcion] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (eventoId) {
      const eventoData = obtenerEvento(eventoId);
      setEvento(eventoData);
    }
  }, [eventoId, obtenerEvento]);

  const handleInscripcion = async () => {
    if (!evento) return;

    setProcesandoInscripcion(true);
    setMensaje('');

    try {
      const yaInscrito = estaInscrito(evento.id);
      let result;

      if (yaInscrito) {
        result = await desinscribirseEvento(evento.id);
        setMensaje(result.success ? 'Te has desinscrito exitosamente' : result.error);
      } else {
        result = await inscribirseEvento(evento.id);
        setMensaje(result.success ? '¡Inscripción exitosa!' : result.error);
      }

      // Actualizar el evento después de la inscripción/desinscripción
      if (result.success) {
        setTimeout(() => {
          const eventoActualizado = obtenerEvento(eventoId);
          setEvento(eventoActualizado);
        }, 1000);
      }
    } catch (err) {
      console.error('Error al procesar la inscripción:', err);
      setMensaje('Error al procesar la inscripción');
    } finally {
      setProcesandoInscripcion(false);
    }
  };

  if (loading || !evento) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <div className="spinner-border text-success mb-3" role="status">
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

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <button 
            className="btn btn-outline-success mb-4"
            onClick={onVolver}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver a eventos
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-gradient-success text-white">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h3 className="card-title fw-bold mb-1">{evento.titulo}</h3>
                  <span className="badge bg-light text-success">
                    {evento.tipo}
                  </span>
                </div>
                <span className={`badge ${yaInscrito ? 'bg-primary' : eventoLleno ? 'bg-danger' : 'bg-success'}`}>
                  {yaInscrito ? 'Inscrito' : eventoLleno ? 'Lleno' : 'Disponible'}
                </span>
              </div>
            </div>

            <div className="card-body p-4">
              {/* Mensaje de estado */}
              {mensaje && (
                <div className={`alert ${mensaje.includes('Error') || mensaje.includes('error') ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`} role="alert">
                  {mensaje}
                  <button type="button" className="btn-close" onClick={() => setMensaje('')}></button>
                </div>
              )}

              {/* Información principal */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <h5 className="text-success mb-3">📅 Información del Evento</h5>
                  <div className="list-group list-group-flush">
                    <div className="list-group-item border-0 px-0">
                      <strong>Fecha:</strong> {evento.fecha}
                    </div>
                    <div className="list-group-item border-0 px-0">
                      <strong>Hora:</strong> {evento.hora}
                    </div>
                    <div className="list-group-item border-0 px-0">
                      <strong>Ubicación:</strong> {evento.ubicacion}
                    </div>
                    <div className="list-group-item border-0 px-0">
                      <strong>Duración:</strong> {evento.duracion} horas
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <h5 className="text-success mb-3">👥 Participación</h5>
                  <div className="list-group list-group-flush">
                    <div className="list-group-item border-0 px-0">
                      <strong>Organizador:</strong> {evento.organizadorEmail}
                    </div>
                    <div className="list-group-item border-0 px-0">
                      <strong>Participantes:</strong> {evento.participantes?.length || 0}/{evento.capacidadMaxima}
                    </div>
                    <div className="list-group-item border-0 px-0">
                      <strong>Espacios disponibles:</strong> 
                      <span className={`ms-1 ${espaciosDisponibles <= 5 ? 'text-warning' : 'text-success'}`}>
                        {espaciosDisponibles}
                      </span>
                    </div>
                    {evento.requisitos && (
                      <div className="list-group-item border-0 px-0">
                        <strong>Requisitos:</strong> {evento.requisitos}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className="mb-4">
                <h5 className="text-success mb-3">📝 Descripción</h5>
                <p className="text-muted">{evento.descripcion}</p>
              </div>

              {/* Objetivos (si existen) */}
              {evento.objetivos && (
                <div className="mb-4">
                  <h5 className="text-success mb-3">🎯 Objetivos</h5>
                  <p className="text-muted">{evento.objetivos}</p>
                </div>
              )}

              {/* Recursos necesarios (si existen) */}
              {evento.recursosNecesarios && (
                <div className="mb-4">
                  <h5 className="text-success mb-3">🛠️ Recursos Necesarios</h5>
                  <p className="text-muted">{evento.recursosNecesarios}</p>
                </div>
              )}

              {/* Barra de progreso de capacidad */}
              <div className="mb-4">
                <h6 className="text-muted mb-2">Capacidad del evento</h6>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className={`progress-bar ${(evento.participantes?.length / evento.capacidadMaxima) > 0.8 ? 'bg-warning' : 'bg-success'}`}
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
                <button 
                  className={`btn btn-lg ${yaInscrito ? 'btn-outline-danger' : 'btn-success'}`}
                  onClick={handleInscripcion}
                  disabled={procesandoInscripcion || (!yaInscrito && eventoLleno)}
                >
                  {procesandoInscripcion ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Procesando...
                    </>
                  ) : yaInscrito ? (
                    '🚪 Desinscribirse del evento'
                  ) : eventoLleno ? (
                    '🚫 Evento lleno'
                  ) : (
                    '✅ Inscribirse al evento'
                  )}
                </button>
                
                {!yaInscrito && espaciosDisponibles <= 5 && espaciosDisponibles > 0 && (
                  <small className="text-warning text-center">
                    ⚠️ ¡Solo quedan {espaciosDisponibles} espacios disponibles!
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