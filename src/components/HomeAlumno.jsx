import React, { useState, useEffect, useCallback } from "react";
import appFirebase, { db } from "../credenciales";
import { getAuth, signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";

const auth = getAuth(appFirebase);

const HomeAlumno = ({ correoUsuario }) => {
    const [vistaActual, setVistaActual] = useState('eventos');
    const [eventos, setEventos] = useState([]);
    const [cargandoEventos, setCargandoEventos] = useState(false);

    // Cargar eventos publicados
    const cargarEventos = useCallback(async () => {
        setCargandoEventos(true);
        try {
            const q = query(
                collection(db, "eventos"),
                where("estado", "==", "publicado")
            );
            const querySnapshot = await getDocs(q);
            const eventosData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEventos(eventosData);
        } catch (error) {
            console.error("Error al cargar eventos:", error);
        } finally {
            setCargandoEventos(false);
        }
    }, []);

    useEffect(() => {
        cargarEventos();
    }, [cargarEventos]);

    return (
        <div className="min-vh-100 bg-light">
            {/* Navbar Responsive para Alumno */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-success shadow-sm">
                <div className="container-fluid">
                    <span className="navbar-brand fs-5 fw-bold">
                        UPAO Eventos - Estudiante
                    </span>
                    
                    {/* Botón hamburguesa para móvil */}
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
                    
                    {/* Menú colapsable */}
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <button 
                                    className={`nav-link btn btn-link text-white border-0 ${vistaActual === 'eventos' ? 'active fw-bold' : ''}`}
                                    onClick={() => setVistaActual('eventos')}
                                >
                                    Eventos Académicos
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className={`nav-link btn btn-link text-white border-0 ${vistaActual === 'mis-inscripciones' ? 'active fw-bold' : ''}`}
                                    onClick={() => setVistaActual('mis-inscripciones')}
                                >
                                    Mis Inscripciones
                                </button>
                            </li>
                        </ul>
                        
                        {/* Usuario y logout */}
                        <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center">
                            <span className="navbar-text text-light me-lg-3 mb-2 mb-lg-0 small">
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

            {/* Contenido principal */}
            <main className="flex-grow-1">
                {vistaActual === 'eventos' && (
                    <div className="container-fluid py-4">
                        {/* Header */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="text-center text-md-start">
                                    <h2 className="fw-bold text-success mb-1">Eventos Académicos Disponibles</h2>
                                    <p className="text-muted mb-0">Explora y regístrate en los eventos que te interesan</p>
                                </div>
                            </div>
                        </div>

                        {/* Lista de eventos */}
                        <div className="row">
                            <div className="col-12">
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0 fw-bold text-dark">🎯 Eventos Activos</h5>
                                        <span className="badge bg-success fs-6">{eventos.length} evento{eventos.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="card-body p-4">
                                        {cargandoEventos ? (
                                            <div className="text-center py-5">
                                                <div className="spinner-border text-success mb-3" role="status">
                                                    <span className="visually-hidden">Cargando...</span>
                                                </div>
                                                <p className="text-muted">Cargando eventos disponibles...</p>
                                            </div>
                                        ) : eventos.length === 0 ? (
                                            <div className="text-center py-5">
                                                <div className="mb-4">
                                                    <span className="text-muted" style={{fontSize: '4rem'}}>📭</span>
                                                </div>
                                                <h5 className="text-muted mb-3">No hay eventos disponibles</h5>
                                                <p className="text-muted">Los eventos aparecerán aquí cuando estén disponibles para inscripción.</p>
                                            </div>
                                        ) : (
                                            <div className="row g-4">
                                                {eventos.map(evento => (
                                                    <div key={evento.id} className="col-12 col-md-6 col-xl-4">
                                                        <div className="card h-100 border-0 shadow-sm event-card">
                                                            {/* Header del evento */}
                                                            <div className="card-header bg-gradient border-0 d-flex justify-content-between align-items-center p-3">
                                                                <span className="badge bg-success bg-opacity-10 text-success border border-success">
                                                                    {evento.tipo}
                                                                </span>
                                                                <span className="badge bg-primary">
                                                                    ✅ Disponible
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Cuerpo del evento */}
                                                            <div className="card-body p-4">
                                                                <h5 className="card-title fw-bold text-dark mb-3" style={{lineHeight: '1.3'}}>
                                                                    {evento.titulo}
                                                                </h5>
                                                                <p className="card-text text-muted mb-3" style={{lineHeight: '1.4'}}>
                                                                    {evento.descripcion.length > 150 
                                                                        ? evento.descripcion.substring(0, 150) + '...' 
                                                                        : evento.descripcion
                                                                    }
                                                                </p>
                                                                
                                                                {/* Información del evento */}
                                                                <div className="border rounded p-3 bg-light mb-3">
                                                                    <div className="row g-2 small">
                                                                        <div className="col-12">
                                                                            <div className="d-flex align-items-center">
                                                                                <span className="me-2">📅</span>
                                                                                <strong>{evento.fecha} - {evento.hora}</strong>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-12">
                                                                            <div className="d-flex align-items-center">
                                                                                <span className="me-2">📍</span>
                                                                                <span>{evento.ubicacion}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-12">
                                                                            <div className="d-flex align-items-center justify-content-between">
                                                                                <div>
                                                                                    <span className="me-2">👥</span>
                                                                                    <span>{evento.participantes?.length || 0}/{evento.capacidadMaxima} participantes</span>
                                                                                </div>
                                                                                <div className="progress" style={{width: '60px', height: '8px'}}>
                                                                                    <div 
                                                                                        className="progress-bar bg-success" 
                                                                                        style={{
                                                                                            width: `${((evento.participantes?.length || 0) / evento.capacidadMaxima) * 100}%`
                                                                                        }}
                                                                                    ></div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Footer con botón de inscripción */}
                                                            <div className="card-footer bg-white border-0 p-4">
                                                                <div className="d-grid">
                                                                    <button 
                                                                        className="btn btn-success btn-lg fw-semibold"
                                                                        disabled={(evento.participantes?.length || 0) >= evento.capacidadMaxima}
                                                                    >
                                                                        {(evento.participantes?.length || 0) >= evento.capacidadMaxima 
                                                                            ? '🚫 Evento Lleno' 
                                                                            : '📝 Inscribirme'
                                                                        }
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {vistaActual === 'mis-inscripciones' && (
                    <div className="container-fluid py-4">
                        <div className="row">
                            <div className="col-12">
                                <div className="text-center py-5">
                                    <div className="mb-4">
                                        <span className="text-muted" style={{fontSize: '4rem'}}>🚧</span>
                                    </div>
                                    <h3 className="text-muted mb-3">Sección en Desarrollo</h3>
                                    <p className="text-muted">La vista de "Mis Inscripciones" estará disponible próximamente.</p>
                                    <button 
                                        className="btn btn-success"
                                        onClick={() => setVistaActual('eventos')}
                                    >
                                        ← Volver a Eventos
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default HomeAlumno;
