import React, { useState } from "react";
import appFirebase from "../../config/credenciales";
import { getAuth, signOut } from "firebase/auth";
import { useEventosAlumno } from "../../core/hooks/useEventosAlumno";
import DetalleEvento from "../DetalleEvento";
import MisEventos from "../MisEventos";

const auth = getAuth(appFirebase);

const HomeAlumno = ({ correoUsuario }) => {
    const [vistaActual, setVistaActual] = useState('eventos');
    const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
    
    const { 
        eventosDisponibles,
        eventosInscritos,
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
            setEventoSeleccionado(evento.id);
            setVistaActual('detalle-evento');
        } else {
            // React Query maneja automáticamente el loading state
            const result = await inscribirseEvento(evento.id);
            if (result.success) {
                setEventoSeleccionado(evento.id);
                setVistaActual('detalle-evento');
            }
        }
    };

    const volverAEventos = () => {
        setVistaActual('eventos');
        setEventoSeleccionado(null);
    };

    const verDetalleEvento = (eventoId) => {
        setEventoSeleccionado(eventoId);
        setVistaActual('detalle-evento');
    };

    if (vistaActual === 'detalle-evento' && eventoSeleccionado) {
        return (
            <div className="min-vh-100 bg-light">
                <nav className="navbar navbar-expand-lg navbar-dark navbar-custom shadow-sm">
                    <div className="container-fluid">
                        <span className="navbar-brand fs-5 fw-bold">
                            UPAO Eventos - Estudiante
                        </span>
                        <div className="d-flex align-items-center">
                            <span className="navbar-text text-light me-3 small">
                                {correoUsuario}
                            </span>
                            <button 
                                className="btn btn-outline-light btn-sm" 
                                onClick={() => signOut(auth)}
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </nav>
                <DetalleEvento 
                    eventoId={eventoSeleccionado} 
                    onVolver={volverAEventos}
                />
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light">
            <nav className="navbar navbar-expand-lg navbar-dark navbar-custom shadow-sm">
                <div className="container-fluid">
                    <span className="navbar-brand fs-5 fw-bold">
                        UPAO Eventos - Estudiante
                    </span>
                    
                    <button 
                        className="navbar-toggler" 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#navbarNav"
                        aria-controls="navbarNav" 
                        aria-expanded="false" 
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <button 
                                    className="nav-link btn btn-link text-white border-0"
                                    onClick={() => setVistaActual('eventos')}
                                >
                                    Eventos Académicos
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className="nav-link btn btn-link text-white border-0"
                                    onClick={() => setVistaActual('mis-inscripciones')}
                                >
                                    Mis Inscripciones ({eventosInscritos.length})
                                </button>
                            </li>
                        </ul>
                        
                        <div className="d-flex align-items-center">
                            <span className="navbar-text text-light me-3 small">
                                {correoUsuario}
                            </span>
                            <button 
                                className="btn btn-outline-light btn-sm" 
                                onClick={() => signOut(auth)}
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-grow-1">
                {vistaActual === 'eventos' && (
                    <div className="container-fluid py-4">
                        <div className="row mb-4">
                            <div className="col-12">
                                <h2 className="fw-bold text-primary mb-1">Eventos Académicos Disponibles</h2>
                                <p className="text-muted mb-0">Explora y regístrate en los eventos que te interesan</p>
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
                                        <h5 className="mb-0 fw-bold text-dark">🎯 Eventos Activos ({eventosDisponibles.length})</h5>
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
                                                    
                                                    return (
                                                        <div key={evento.id} className="col-12 col-md-6 col-xl-4">
                                                            <div className="card h-100 border-0 shadow-sm">
                                                                <div className="card-header bg-gradient border-0 d-flex justify-content-between align-items-center p-3">
                                                                    <span className="badge bg-primary text-white">
                                                                        {evento.tipo}
                                                                    </span>
                                                                    <span className={`badge ${yaInscrito ? 'bg-info' : 'bg-primary'}`}>
                                                                        {yaInscrito ? '✅ Inscrito' : '📝 Disponible'}
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
                                                                        <div><strong>📅 {evento.fecha} - {evento.hora}</strong></div>
                                                                        <div>📍 {evento.ubicacion}</div>
                                                                        <div>👥 {evento.participantes?.length || 0}/{evento.capacidadMaxima}</div>
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
                                                                            className={`btn fw-semibold ${yaInscrito ? 'btn-info' : 'btn-primary'}`}
                                                                            onClick={() => handleInscripcion(evento)}
                                                                            disabled={isInscribiendo || isDesinscribiendo}
                                                                        >
                                                                            {(isInscribiendo || isDesinscribiendo) ? (
                                                                                <>
                                                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                                    {isInscribiendo ? 'Inscribiendo...' : 'Procesando...'}
                                                                                </>
                                                                            ) : yaInscrito ? '✅ Ya inscrito' : '📝 Inscribirme'}
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
                )}

                {vistaActual === 'mis-inscripciones' && (
                    <MisEventos onVerDetalle={verDetalleEvento} />
                )}
            </main>
        </div>
    );
};

export default HomeAlumno;