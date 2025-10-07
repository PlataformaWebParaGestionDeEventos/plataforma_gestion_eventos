import React, { useState, useEffect, useCallback } from "react";
import appFirebase, { db } from "../../config/credenciales";
import { getAuth, signOut } from "firebase/auth";
import { collection, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import firestoreService from "../../services/firestoreService";
import GestionParticipantes from "../../components/GestionParticipantes";
import GestionAsistencia from "../GestionAsistencia";
import Reportes from "../Reportes";
const auth = getAuth(appFirebase);

const HomeOrganizador = ({ correoUsuario }) => {
    const [vistaActual, setVistaActual] = useState('dashboard');
    const [eventos, setEventos] = useState([]);
    const [cargandoEventos, setCargandoEventos] = useState(false);
    const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
    const [eventoEditando, setEventoEditando] = useState(null);
    const [eventoParticipantes, setEventoParticipantes] = useState(null);
    const [eventoAsistencia, setEventoAsistencia] = useState(null);

    // Estados para el formulario de eventos
    const [nuevoEvento, setNuevoEvento] = useState({
        titulo: '',
        descripcion: '',
        fecha: '',
        hora: '',
        ubicacion: '',
        capacidadMaxima: '',
        tipo: 'conferencia',
        estado: 'borrador',
        expositor: ''
    });

    // Estado para mostrar errores de validación en tiempo real
    const [erroresValidacion, setErroresValidacion] = useState({});

    // Función para manejar cambios en el formulario con validación en tiempo real
    const manejarCambioFormulario = (campo, valor) => {
        setNuevoEvento({...nuevoEvento, [campo]: valor});
        
        // Validar en tiempo real
        const errores = {...erroresValidacion};
        
        switch(campo) {
            case 'titulo':
                if (valor.length < 10) {
                    errores.titulo = 'Mínimo 10 caracteres';
                } else if (valor.length > 100) {
                    errores.titulo = 'Máximo 100 caracteres';
                } else {
                    delete errores.titulo;
                }
                break;
                
            case 'descripcion':
                if (valor.length < 20) {
                    errores.descripcion = 'Mínimo 20 caracteres';
                } else if (valor.length > 500) {
                    errores.descripcion = 'Máximo 500 caracteres';
                } else {
                    delete errores.descripcion;
                }
                break;
                
            case 'capacidadMaxima': {
                const capacidad = parseInt(valor);
                if (capacidad < 1) {
                    errores.capacidadMaxima = 'Mínimo 1 persona';
                } else if (capacidad > 1000) {
                    errores.capacidadMaxima = 'Máximo 1000 personas';
                } else {
                    delete errores.capacidadMaxima;
                }
                break;
            }
                
            case 'fecha':
            case 'hora': {
                const campoActualizado = {...nuevoEvento, [campo]: valor};
                if (campoActualizado.fecha && campoActualizado.hora) {
                    const fechaEvento = new Date(campoActualizado.fecha + 'T' + campoActualizado.hora);
                    const ahora = new Date();
                    const unAnoDespues = new Date();
                    unAnoDespues.setFullYear(unAnoDespues.getFullYear() + 1);
                    
                    if (fechaEvento <= ahora) {
                        errores.fechaHora = 'La fecha y hora deben ser futuras';
                    } else if (fechaEvento > unAnoDespues) {
                        errores.fechaHora = 'La fecha no puede ser mayor a 1 año desde hoy';
                    } else {
                        delete errores.fechaHora;
                    }
                }
                break;
            }
        }
        
        setErroresValidacion(errores);
    };

    const usuario = auth.currentUser;

    // Cargar eventos del organizador
    const cargarEventos = useCallback(async () => {
        const usuarioActual = auth.currentUser;
        if (!usuarioActual) return;
        
        setCargandoEventos(true);
        try {
            const q = query(
                collection(db, "eventos"),
                where("organizadorId", "==", usuarioActual.uid),
                orderBy("fechaCreacion", "desc")
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
        if (vistaActual === 'eventos' || vistaActual === 'dashboard') {
            cargarEventos();
        }
    }, [vistaActual, cargarEventos]);

    // Cargar eventos en tiempo real para el dashboard
    useEffect(() => {
        if (vistaActual === 'dashboard') {
            // Cargar inmediatamente
            cargarEventos();
            
            // Actualizar cada 30 segundos para datos en tiempo real
            const intervalo = setInterval(() => {
                cargarEventos();
            }, 30000); // 30 segundos

            return () => clearInterval(intervalo);
        }
    }, [vistaActual, cargarEventos]);

    // Función para validar el formulario
    const validarFormulario = () => {
        const errores = [];
        
        // Validar fecha futura
        const fechaEvento = new Date(nuevoEvento.fecha + 'T' + nuevoEvento.hora);
        const ahora = new Date();
        
        if (fechaEvento <= ahora) {
            errores.push('La fecha y hora del evento debe ser futura');
        }
        
        // Validar capacidad máxima
        if (parseInt(nuevoEvento.capacidadMaxima) < 1) {
            errores.push('La capacidad máxima debe ser al menos 1');
        }
        
        if (parseInt(nuevoEvento.capacidadMaxima) > 1000) {
            errores.push('La capacidad máxima no puede exceder 1000 personas');
        }
        
        // Validar título
        if (nuevoEvento.titulo.length < 10) {
            errores.push('El título debe tener al menos 10 caracteres');
        }
        
        if (nuevoEvento.titulo.length > 100) {
            errores.push('El título no puede exceder 100 caracteres');
        }
        
        // Validar descripción
        if (nuevoEvento.descripcion.length < 20) {
            errores.push('La descripción debe tener al menos 20 caracteres');
        }
        
        if (nuevoEvento.descripcion.length > 500) {
            errores.push('La descripción no puede exceder 500 caracteres');
        }
        
        return errores;
    };

    // Verificar conflictos de horario (misma fecha Y/O misma ubicación)
    const verificarConflictoHorario = () => {
        const fechaEvento = nuevoEvento.fecha;
        const ubicacionEvento = nuevoEvento.ubicacion.toLowerCase().trim();
        
        return eventos.some(evento => {
            // No comparar con el mismo evento si estamos editando
            if (eventoEditando && evento.id === eventoEditando.id) {
                return false;
            }
            
            // Solo verificar eventos publicados o en borrador
            if (evento.estado !== 'publicado' && evento.estado !== 'borrador') {
                return false;
            }
            
            // Verificar misma fecha Y/O misma ubicación
            const mismaFecha = evento.fecha === fechaEvento;
            const mismaUbicacion = evento.ubicacion.toLowerCase().trim() === ubicacionEvento;
            
            return mismaFecha || mismaUbicacion;
        });
    };

    // Función para crear evento
    const crearEvento = async (e) => {
        e.preventDefault();
        if (!usuario) return;

        // Validar formulario
        const errores = validarFormulario();
        if (errores.length > 0) {
            alert('Errores de validación:\n' + errores.join('\n'));
            return;
        }

        // Verificar conflictos de horario
        if (verificarConflictoHorario()) {
            alert('⚠️ CONFLICTO DETECTADO\n\nYa existe un evento en la misma fecha o en la misma ubicación.\n\nPor favor, elige otra fecha u otra ubicación para evitar conflictos.');
            return;
        }

        try {
            console.log('🚀 Creando evento con integración n8n...');
            
            const resultado = await firestoreService.crearEvento(
                {
                    ...nuevoEvento,
                    capacidadMaxima: parseInt(nuevoEvento.capacidadMaxima),
                    organizadorId: usuario.uid,
                    organizadorEmail: usuario.email,
                    participantes: [],
                    asistentes: []
                },
                usuario
            );

            if (resultado.success) {
                alert('Evento creado exitosamente!');
                setNuevoEvento({
                    titulo: '',
                    descripcion: '',
                    fecha: '',
                    hora: '',
                    ubicacion: '',
                    capacidadMaxima: '',
                    tipo: 'conferencia',
                    estado: 'borrador',
                    expositor: ''
                });
                setMostrandoFormulario(false);
                cargarEventos();
            } else {
                alert(`Error al crear el evento: ${resultado.error}`);
            }
        } catch (error) {
            console.error("Error al crear evento:", error);
            alert('Error al crear el evento. Verifica tu conexión y configuración.');
        }
    };

    // Función para eliminar evento
    const eliminarEvento = async (eventoId, tituloEvento) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar el evento "${tituloEvento}"?`)) {
            return;
        }

        try {
            await deleteDoc(doc(db, "eventos", eventoId));
            alert('Evento eliminado exitosamente!');
            cargarEventos();
        } catch (error) {
            console.error("Error al eliminar evento:", error);
            alert('Error al eliminar el evento. Intenta de nuevo.');
        }
    };

    // Función para iniciar edición de evento
    const iniciarEdicion = (evento) => {
        setEventoEditando(evento);
        setNuevoEvento({
            titulo: evento.titulo,
            descripcion: evento.descripcion,
            fecha: evento.fecha,
            hora: evento.hora,
            ubicacion: evento.ubicacion,
            capacidadMaxima: evento.capacidadMaxima,
            tipo: evento.tipo,
            estado: evento.estado,
            expositor: evento.expositor || ''
        });
        setMostrandoFormulario(true);
    };

    // Función para actualizar evento
    const actualizarEvento = async (e) => {
        e.preventDefault();
        if (!usuario || !eventoEditando) return;

        // Validar formulario
        const errores = validarFormulario();
        if (errores.length > 0) {
            alert('Errores de validación:\n' + errores.join('\n'));
            return;
        }

        // Verificar conflictos de horario
        if (verificarConflictoHorario()) {
            alert('⚠️ CONFLICTO DETECTADO\n\nYa existe un evento en la misma fecha o en la misma ubicación.\n\nPor favor, elige otra fecha u otra ubicación para evitar conflictos.');
            return;
        }

        try {
            await updateDoc(doc(db, "eventos", eventoEditando.id), {
                ...nuevoEvento,
                capacidadMaxima: parseInt(nuevoEvento.capacidadMaxima),
                fechaActualizacion: new Date()
            });

            alert('Evento actualizado exitosamente!');
            setNuevoEvento({
                titulo: '',
                descripcion: '',
                fecha: '',
                hora: '',
                ubicacion: '',
                capacidadMaxima: '',
                tipo: 'conferencia',
                estado: 'borrador',
                expositor: ''
            });
            setEventoEditando(null);
            setMostrandoFormulario(false);
            cargarEventos();
        } catch (error) {
            console.error("Error al actualizar evento:", error);
            alert('Error al actualizar el evento. Verifica que hayas aplicado las reglas de Firestore.');
        }
    };

    // Función para cancelar edición
    const cancelarEdicion = () => {
        setEventoEditando(null);
        setNuevoEvento({
            titulo: '',
            descripcion: '',
            fecha: '',
            hora: '',
            ubicacion: '',
            capacidadMaxima: '',
            tipo: 'conferencia',
            estado: 'borrador',
            expositor: ''
        });
        setMostrandoFormulario(false);
    };

    // Función para ver participantes de un evento
    const verParticipantes = (evento) => {
        setEventoParticipantes(evento);
        setVistaActual('participantes');
    };

    // Función para volver de la vista de participantes
    const volverDeParticipantes = () => {
        setEventoParticipantes(null);
        setVistaActual('eventos');
    };

    // Función para ver gestión de asistencia
    const verGestionAsistencia = (evento) => {
        setEventoAsistencia(evento);
        setVistaActual('asistencia');
    };

    // Función para volver de la vista de asistencia
    const volverDeAsistencia = () => {
        setEventoAsistencia(null);
        setVistaActual('eventos');
        // Recargar eventos para actualizar estadísticas
        cargarEventos();
    };

    return (
        <div className="min-vh-100 bg-light">
            {/* Navbar Responsive */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
                <div className="container-fluid">
                    <span className="navbar-brand fs-5 fw-bold">
                        UPAO Eventos - Organizador
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
                                    className={`nav-link btn btn-link text-white border-0 ${vistaActual === 'dashboard' ? 'active fw-bold' : ''}`}
                                    onClick={() => setVistaActual('dashboard')}
                                >
                                    Inicio
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className={`nav-link btn btn-link text-white border-0 ${vistaActual === 'eventos' ? 'active fw-bold' : ''}`}
                                    onClick={() => setVistaActual('eventos')}
                                >
                                    Eventos
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className={`nav-link btn btn-link text-white border-0 ${vistaActual === 'reportes' ? 'active fw-bold' : ''}`}
                                    onClick={() => setVistaActual('reportes')}
                                >
                                    Reportes
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
                {vistaActual === 'participantes' && eventoParticipantes && (
                    <GestionParticipantes 
                        evento={eventoParticipantes} 
                        onVolver={volverDeParticipantes}
                        onIrAGestionAsistencia={() => verGestionAsistencia(eventoParticipantes)}
                    />
                )}

                {vistaActual === 'asistencia' && eventoAsistencia && (
                    <GestionAsistencia 
                        eventoId={eventoAsistencia.id} 
                        onVolver={volverDeAsistencia}
                    />
                )}

                {vistaActual === 'dashboard' && (
                    <div className="container-fluid py-4">
                        {/* Header */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="text-center text-md-start">
                                    <h1 className="h3 fw-bold text-primary mb-1">Inicio - Gestión de Eventos</h1>
                                    <p className="text-muted mb-0">Bienvenido, {correoUsuario}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Tarjetas de estadísticas responsive */}
                        <div className="row g-3 mb-4">
                            <div className="col-6 col-md-3">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body text-center p-3">
                                        <div className="fs-2 text-primary mb-2">📅</div>
                                        <h5 className="card-title text-primary mb-1 fs-6">Total Eventos</h5>
                                        <h3 className="text-primary mb-0">{eventos.length}</h3>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-6 col-md-3">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body text-center p-3">
                                        <div className="fs-2 text-primary mb-2">✅</div>
                                        <h5 className="card-title text-primary mb-1 fs-6">Publicados</h5>
                                        <h3 className="text-primary mb-0">{eventos.filter(e => e.estado === 'publicado').length}</h3>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-6 col-md-3">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body text-center p-3">
                                        <div className="fs-2 text-warning mb-2">📝</div>
                                        <h5 className="card-title text-warning mb-1 fs-6">Borradores</h5>
                                        <h3 className="text-warning mb-0">{eventos.filter(e => e.estado === 'borrador').length}</h3>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-6 col-md-3">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body text-center p-3">
                                        <div className="fs-2 text-info mb-2">👥</div>
                                        <h5 className="card-title text-info mb-1 fs-6">Participantes</h5>
                                        <h3 className="text-info mb-0">{eventos.reduce((total, evento) => total + (evento.participantes?.length || 0), 0)}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Acciones rápidas */}
                        <div className="row">
                            <div className="col-12">
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-white border-0">
                                        <h5 className="mb-0 fw-bold text-dark">Acciones Rápidas</h5>
                                    </div>
                                    <div className="card-body p-4">
                                        <div className="row g-3">
                                            <div className="col-12 col-sm-6 col-lg-4">
                                                <button 
                                                    className="btn btn-primary w-100 py-3" 
                                                    onClick={() => {setVistaActual('eventos'); setMostrandoFormulario(true)}}
                                                >
                                                    <div className="fs-4 mb-1">➕</div>
                                                    <div className="fw-semibold">Crear Nuevo Evento</div>
                                                </button>
                                            </div>
                                            <div className="col-12 col-sm-6 col-lg-4">
                                                <button 
                                                    className="btn btn-outline-primary w-100 py-3" 
                                                    onClick={() => setVistaActual('eventos')}
                                                >
                                                    <div className="fs-4 mb-1">📋</div>
                                                    <div className="fw-semibold">Ver Mis Eventos</div>
                                                </button>
                                            </div>
                                            <div className="col-12 col-sm-6 col-lg-4">
                                                <button 
                                                    className="btn btn-outline-info w-100 py-3"
                                                    onClick={() => setVistaActual('reportes')}
                                                >
                                                    <div className="fs-4 mb-1">📊</div>
                                                    <div className="fw-semibold">Reportes</div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {vistaActual === 'eventos' && (
                    <div className="container-fluid py-4">
                        {/* Header con botón responsive */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
                                    <div>
                                        <h2 className="h3 fw-bold text-primary mb-1">Gestión de Eventos</h2>
                                        <p className="text-muted mb-0">Crea, edita y gestiona tus eventos académicos</p>
                                    </div>
                                    <button 
                                        className="btn btn-primary flex-shrink-0"
                                        onClick={() => {
                                            if (mostrandoFormulario) {
                                                cancelarEdicion();
                                            } else {
                                                setEventoEditando(null);
                                                setMostrandoFormulario(true);
                                            }
                                        }}
                                    >
                                        {mostrandoFormulario ? 'Cancelar' : 'Nuevo Evento'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Formulario responsive para crear evento */}
                        {mostrandoFormulario && (
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card border-0 shadow-sm">
                                        <div className="card-header bg-white border-0">
                                            <h5 className="mb-0 fw-bold text-dark">
                                                {eventoEditando ? 'Editar Evento' : 'Crear Nuevo Evento'}
                                            </h5>
                                        </div>
                                        <div className="card-body p-4">
                                            <form onSubmit={eventoEditando ? actualizarEvento : crearEvento}>
                                                <div className="row g-3">
                                                    <div className="col-12 col-md-8">
                                                        <label className="form-label fw-semibold">Título del Evento *</label>
                                                        <input
                                                            type="text"
                                                            className={`form-control ${erroresValidacion.titulo ? 'is-invalid' : nuevoEvento.titulo.length >= 10 ? 'is-valid' : ''}`}
                                                            value={nuevoEvento.titulo}
                                                            onChange={(e) => manejarCambioFormulario('titulo', e.target.value)}
                                                            required
                                                        />
                                                        {erroresValidacion.titulo && (
                                                            <div className="invalid-feedback">{erroresValidacion.titulo}</div>
                                                        )}
                                                        <small className="text-muted">{nuevoEvento.titulo.length}/100 caracteres</small>
                                                    </div>
                                                    <div className="col-12 col-md-4">
                                                        <label className="form-label fw-semibold">Tipo de Evento</label>
                                                        <select
                                                            className="form-select"
                                                            value={nuevoEvento.tipo}
                                                            onChange={(e) => setNuevoEvento({...nuevoEvento, tipo: e.target.value})}
                                                        >
                                                            <option value="conferencia">Conferencia</option>
                                                            <option value="seminario">Seminario</option>
                                                            <option value="taller">Taller</option>
                                                            <option value="curso">Curso</option>
                                                            <option value="charla">Charla</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="row g-3 mt-1">
                                                    <div className="col-12">
                                                        <label className="form-label fw-semibold">Descripción *</label>
                                                        <textarea
                                                            className={`form-control ${erroresValidacion.descripcion ? 'is-invalid' : nuevoEvento.descripcion.length >= 20 ? 'is-valid' : ''}`}
                                                            rows="3"
                                                            value={nuevoEvento.descripcion}
                                                            onChange={(e) => manejarCambioFormulario('descripcion', e.target.value)}
                                                            required
                                                        ></textarea>
                                                        {erroresValidacion.descripcion && (
                                                            <div className="invalid-feedback">{erroresValidacion.descripcion}</div>
                                                        )}
                                                        <small className="text-muted">{nuevoEvento.descripcion.length}/500 caracteres</small>
                                                    </div>
                                                </div>

                                                <div className="row g-3 mt-1">
                                                    <div className="col-6 col-md-3">
                                                        <label className="form-label fw-semibold">Fecha *</label>
                                                        <input
                                                            type="date"
                                                            className={`form-control ${erroresValidacion.fechaHora ? 'is-invalid' : ''}`}
                                                            value={nuevoEvento.fecha}
                                                            onChange={(e) => manejarCambioFormulario('fecha', e.target.value)}
                                                            min={new Date().toISOString().split('T')[0]}
                                                            max={(() => {
                                                                const unAnoDespues = new Date();
                                                                unAnoDespues.setFullYear(unAnoDespues.getFullYear() + 1);
                                                                return unAnoDespues.toISOString().split('T')[0];
                                                            })()}
                                                            required
                                                        />
                                                        {erroresValidacion.fechaHora && (
                                                            <div className="invalid-feedback">{erroresValidacion.fechaHora}</div>
                                                        )}
                                                    </div>
                                                    <div className="col-6 col-md-3">
                                                        <label className="form-label fw-semibold">Hora *</label>
                                                        <input
                                                            type="time"
                                                            className={`form-control ${erroresValidacion.fechaHora ? 'is-invalid' : ''}`}
                                                            value={nuevoEvento.hora}
                                                            onChange={(e) => manejarCambioFormulario('hora', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-6 col-md-3">
                                                        <label className="form-label fw-semibold">Capacidad *</label>
                                                        <input
                                                            type="number"
                                                            className={`form-control ${erroresValidacion.capacidadMaxima ? 'is-invalid' : nuevoEvento.capacidadMaxima && parseInt(nuevoEvento.capacidadMaxima) >= 1 ? 'is-valid' : ''}`}
                                                            min="1"
                                                            max="1000"
                                                            value={nuevoEvento.capacidadMaxima}
                                                            onChange={(e) => manejarCambioFormulario('capacidadMaxima', e.target.value)}
                                                            required
                                                        />
                                                        {erroresValidacion.capacidadMaxima && (
                                                            <div className="invalid-feedback">{erroresValidacion.capacidadMaxima}</div>
                                                        )}
                                                    </div>
                                                    <div className="col-6 col-md-3">
                                                        <label className="form-label fw-semibold">Estado</label>
                                                        <select
                                                            className="form-select"
                                                            value={nuevoEvento.estado}
                                                            onChange={(e) => setNuevoEvento({...nuevoEvento, estado: e.target.value})}
                                                        >
                                                            <option value="borrador">📝 Borrador</option>
                                                            <option value="publicado">✅ Publicado</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="row g-3 mt-1">
                                                    <div className="col-12 col-md-6">
                                                        <label className="form-label fw-semibold">Ubicación *</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Ej: Auditorio Principal, Aula 205, Biblioteca Central"
                                                            value={nuevoEvento.ubicacion}
                                                            onChange={(e) => setNuevoEvento({...nuevoEvento, ubicacion: e.target.value})}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-12 col-md-6">
                                                        <label className="form-label fw-semibold">Expositor(es)</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Ej: Dr. Juan Pérez, Ing. María García"
                                                            value={nuevoEvento.expositor}
                                                            onChange={(e) => setNuevoEvento({...nuevoEvento, expositor: e.target.value})}
                                                        />
                                                        <small className="text-muted">Nombre(s) del/los expositor(es)</small>
                                                    </div>
                                                </div>

                                                <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                                                    <button type="submit" className="btn btn-primary">
                                                        {eventoEditando ? 'Actualizar Evento' : 'Crear Evento'}
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-secondary"
                                                        onClick={cancelarEdicion}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Lista de eventos responsive */}
                        <div className="row">
                            <div className="col-12">
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0 fw-bold text-dark">Mis Eventos</h5>
                                        <span className="badge bg-primary fs-6">{eventos.length} evento{eventos.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="card-body p-4">
                                        {cargandoEventos ? (
                                            <div className="text-center py-5">
                                                <div className="spinner-border text-primary mb-3" role="status">
                                                    <span className="visually-hidden">Cargando...</span>
                                                </div>
                                                <p className="text-muted">Cargando eventos...</p>
                                            </div>
                                        ) : eventos.length === 0 ? (
                                            <div className="text-center py-5">
                                                <div className="mb-4">
                                                    <span className="text-muted" style={{fontSize: '4rem'}}> </span>
                                                </div>
                                                <h5 className="text-muted mb-3">No tienes eventos creados</h5>
                                                <p className="text-muted mb-4">¡Crea tu primer evento académico!</p>
                                                <button 
                                                    className="btn btn-primary"
                                                    onClick={() => {
                                                        setEventoEditando(null);
                                                        setMostrandoFormulario(true);
                                                    }}
                                                >
                                                    Crear Primer Evento
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="row g-4">
                                                {eventos.map(evento => (
                                                    <div key={evento.id} className="col-12 col-md-6 col-xl-4">
                                                        <div className="card h-100 border-0 shadow-sm event-card">
                                                            {/* Header del evento */}
                                                            <div className="card-header bg-gradient border-0 d-flex justify-content-between align-items-center p-3">
                                                                <span className="badge bg-primary text-white">
                                                                    {evento.tipo}
                                                                </span>
                                                                <span className={`badge ${evento.estado === 'publicado' ? 'bg-primary' : 'bg-warning'}`}>
                                                                    {evento.estado === 'publicado' ? '✅ Publicado' : '📝 Borrador'}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Cuerpo del evento */}
                                                            <div className="card-body p-4">
                                                                <h6 className="card-title fw-bold text-dark mb-3" style={{lineHeight: '1.3'}}>
                                                                    {evento.titulo}
                                                                </h6>
                                                                <p className="card-text text-muted small mb-3" style={{lineHeight: '1.4'}}>
                                                                    {evento.descripcion.length > 100 
                                                                        ? evento.descripcion.substring(0, 100) + '...' 
                                                                        : evento.descripcion
                                                                    }
                                                                </p>
                                                                
                                                                {/* Información del evento */}
                                                                <div className="border rounded p-3 bg-light">
                                                                    <div className="row g-1 small">
                                                                        <div className="col-12">
                                                                            <div className="d-flex align-items-center">
                                                                                <span className="me-2">📅</span>
                                                                                <span>{evento.fecha} - {evento.hora}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-12">
                                                                            <div className="d-flex align-items-center">
                                                                                <span className="me-2">📍</span>
                                                                                <span>{evento.ubicacion}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-12">
                                                                            <div className="d-flex align-items-center">
                                                                                <span className="me-2">👥</span>
                                                                                <span>{evento.participantes?.length || 0}/{evento.capacidadMaxima}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Footer con botones */}
                                                            <div className="card-footer bg-white border-0 p-3">
                                                                <div className="d-flex flex-column gap-2">
                                                                    <button 
                                                                        className="btn btn-outline-primary btn-sm"
                                                                        onClick={() => iniciarEdicion(evento)}
                                                                    >
                                                                        ✏️ Editar
                                                                    </button>
                                                                    
                                                                    {/* Botón de Gestión de Asistencia (QR + Manual) */}
                                                                    <button 
                                                                        className="btn btn-primary btn-sm"
                                                                        onClick={() => verGestionAsistencia(evento)}
                                                                        title="Escanear QR y registrar asistencia"
                                                                    >
                                                                        <i className="bi bi-qr-code-scan me-1"></i>
                                                                        Gestión de Asistencia
                                                                    </button>
                                                                    
                                                                    <div className="row g-2">
                                                                        <div className="col-6">
                                                                            <button 
                                                                                className="btn btn-outline-info btn-sm w-100"
                                                                                onClick={() => verParticipantes(evento)}
                                                                            >
                                                                                👥 Participantes
                                                                            </button>
                                                                        </div>
                                                                        <div className="col-6">
                                                                            <button 
                                                                                className="btn btn-outline-danger btn-sm w-100"
                                                                                onClick={() => eliminarEvento(evento.id, evento.titulo)}
                                                                            >
                                                                                Eliminar
                                                                            </button>
                                                                        </div>
                                                                    </div>
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

                {/* Vista de Reportes */}
                {vistaActual === 'reportes' && (
                    <Reportes correoOrganizador={correoUsuario} />
                )}
            </main>
        </div>
    );
};

export default HomeOrganizador;
