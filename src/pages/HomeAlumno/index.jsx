import React from "react";
import { useNavigate } from "react-router-dom";
import { useEventosAlumno } from "../../core/hooks/useEventosAlumno";
import { useAuth } from "../../core/hooks/useAuth";
import { useButtonDebounce } from "../../core/hooks";
import formatters from "../../core/utils/formatters";

const HomeAlumno = () => {
    const navigate = useNavigate();
    const { user, userData } = useAuth();
    const { isDisabled: isButtonDisabled, handleClick: handleButtonClick } = useButtonDebounce(5000);
    
    const { 
        eventosDisponibles,
        inscribirseEvento,
        estaInscrito,
        loading,
        error,
        // Nuevos estados específicos de React Query
        isInscribiendo,
        isDesinscribiendo
    } = useEventosAlumno();

    const handleInscripcion = async (evento) => {
        const yaInscrito = estaInscrito(evento.id);
        
        if (yaInscrito) {
            navigate(`/alumno/evento/${evento.id}`);
        } else {
            // React Query maneja automáticamente el loading state
            const result = await inscribirseEvento(evento.id);
            if (result.success) {
                navigate(`/alumno/evento/${evento.id}`);
            }
        }
    };

    const verDetalleEvento = (eventoId) => {
        navigate(`/alumno/evento/${eventoId}`);
    };

    return (
        <div className="container-fluid py-4">
                        <div className="row mb-4">
                            <div className="col-12">
                                <h2 className="fw-bold text-primary mb-1">Eventos Académicos Disponibles</h2>
                                <p className="text-muted mb-0">
                                    {userData?.nombre && userData?.apellido 
                                        ? `Bienvenido, ${userData.nombre} ${userData.apellido}` 
                                        : user?.email 
                                            ? `Bienvenido, ${user.email}`
                                            : 'Explora y regístrate en los eventos que te interesan'}
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="row mb-3">
                                <div className="col-12">
                                    <div className="alert alert-warning-custom" role="alert">
                                        {error}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="row">
                            <div className="col-12">
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-white border-0">
                                        <h5 className="mb-0 fw-bold text-dark">Eventos Activos ({eventosDisponibles.length})</h5>
                                    </div>
                                    <div className="card-body p-4">
                                        {loading ? (
                                            <div className="text-center py-5">
                                                <div className="spinner-border text-primary mb-3" role="status">
                                                    <span className="visually-hidden">Cargando...</span>
                                                </div>
                                                <p className="text-muted">Cargando eventos disponibles...</p>
                                            </div>
                                        ) : eventosDisponibles.length === 0 ? (
                                            <div className="text-center py-5">
                                                <h5 className="text-muted mb-3">No hay eventos disponibles</h5>
                                                <p className="text-muted">Los eventos aparecerán aquí cuando estén disponibles.</p>
                                            </div>
                                        ) : (
                                            <div className="row g-4">
                                                {eventosDisponibles.map(evento => {
                                                    const yaInscrito = estaInscrito(evento.id);
                                                    const inscripcionesCerradas = evento.inscripcionesAbiertas === false;  // ✅ Corregido: usar inscripcionesAbiertas
                                                    
                                                    return (
                                                        <div key={evento.id} className="col-12 col-md-6 col-xl-4">
                                                            <div className="card h-100 border-0 shadow-sm">
                                                                <div className="card-header bg-gradient border-0 d-flex justify-content-between align-items-center p-3">
                                                                    <span className="badge bg-primary text-white">
                                                                        {evento.tipo}
                                                                    </span>
                                                                    {/* Badge del estado del EVENTO (no del usuario) */}
                                                                    <span className={`badge ${
                                                                        evento.estado === 'finalizado' ? 'bg-secondary' : 
                                                                        inscripcionesCerradas ? 'bg-danger' : 
                                                                        'bg-primary'
                                                                    }`}>
                                                                        {evento.estado === 'finalizado' ? 'Finalizado' : 
                                                                         inscripcionesCerradas ? 'Cerrado' : 
                                                                         'Disponible'}
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
                                                                            <strong>Fecha(s):</strong> {formatters.formatearRangoFechas(
                                                                                evento.fechaInicio || evento.fecha,
                                                                                evento.fechaFin || evento.fecha
                                                                            )}
                                                                        </div>
                                                                        <div className="mb-1">
                                                                            <strong>Horario:</strong> {evento.horaInicio || evento.hora || 'No especificada'}
                                                                            {evento.horaFin && ` - ${evento.horaFin}`}
                                                                        </div>
                                                                        <div className="mb-1"><strong>Ubicación:</strong> {evento.ubicacion}</div>
                                                                        <div><strong>Participantes:</strong> {evento.participantes?.length || 0}/{evento.capacidadMaxima}</div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="card-footer bg-white border-0 p-4">
                                                                    <div className="d-grid gap-2">
                                                                        <button 
                                                                            className="btn btn-outline-primary btn-sm"
                                                                            onClick={() => verDetalleEvento(evento.id)}
                                                                            disabled={isInscribiendo || isDesinscribiendo}
                                                                        >
                                                                            Ver detalles
                                                                        </button>
                                                                        <button 
                                                                            className={`btn fw-semibold ${yaInscrito ? 'btn-info-custom' : inscripcionesCerradas ? 'btn-secondary' : 'btn-primary-custom'}`}
                                                                            onClick={handleButtonClick(() => handleInscripcion(evento))}
                                                                            disabled={isInscribiendo || isDesinscribiendo || (inscripcionesCerradas && !yaInscrito) || isButtonDisabled}
                                                                        >
                                                                            {(isInscribiendo || isDesinscribiendo) ? (
                                                                                <>
                                                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                                    {isInscribiendo ? 'Inscribiendo...' : 'Procesando...'}
                                                                                </>
                                                                            ) : yaInscrito ? '✅ Ya inscrito' : inscripcionesCerradas ? '🔒 Inscripciones cerradas' : 'Inscribirme'}
                                                                        </button>
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

export default HomeAlumno;