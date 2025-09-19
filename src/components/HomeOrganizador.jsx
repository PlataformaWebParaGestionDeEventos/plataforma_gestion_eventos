import React, { useState, useEffect, useCallback } from "react";
import appFirebase, { db } from "../credenciales";
import { getAuth, signOut } from "firebase/auth";
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
const auth = getAuth(appFirebase);

const HomeOrganizador = ({ correoUsuario }) => {
    const [vistaActual, setVistaActual] = useState('dashboard');
    const [eventos, setEventos] = useState([]);
    const [cargandoEventos, setCargandoEventos] = useState(false);
    const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
    const [eventoEditando, setEventoEditando] = useState(null);

    // Estados para el formulario de eventos
    const [nuevoEvento, setNuevoEvento] = useState({
        titulo: '',
        descripcion: '',
        fecha: '',
        hora: '',
        ubicacion: '',
        capacidadMaxima: '',
        tipo: 'conferencia',
        estado: 'borrador'
    });

    const usuario = auth.currentUser;

    // Cargar eventos del organizador
    const cargarEventos = useCallback(async () => {
        if (!usuario) return;
        
        setCargandoEventos(true);
        try {
            const q = query(
                collection(db, "eventos"),
                where("organizadorId", "==", usuario.uid),
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
    }, [usuario]);

    useEffect(() => {
        if (vistaActual === 'eventos') {
            cargarEventos();
        }
    }, [vistaActual, usuario, cargarEventos]);

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

    // Verificar conflictos de horario
    const verificarConflictoHorario = () => {
        const fechaEvento = nuevoEvento.fecha;
        const horaEvento = nuevoEvento.hora;
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
            
            // Verificar misma fecha, hora y ubicación
            return evento.fecha === fechaEvento && 
                   evento.hora === horaEvento && 
                   evento.ubicacion.toLowerCase().trim() === ubicacionEvento;
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
            alert('Ya existe un evento en la misma fecha, hora y ubicación. Por favor, elige otro horario o ubicación.');
            return;
        }

        try {
            await addDoc(collection(db, "eventos"), {
                ...nuevoEvento,
                capacidadMaxima: parseInt(nuevoEvento.capacidadMaxima),
                organizadorId: usuario.uid,
                organizadorEmail: usuario.email,
                fechaCreacion: new Date(),
                fechaActualizacion: new Date(),
                participantes: [],
                asistentes: []
            });

            alert('Evento creado exitosamente!');
            setNuevoEvento({
                titulo: '',
                descripcion: '',
                fecha: '',
                hora: '',
                ubicacion: '',
                capacidadMaxima: '',
                tipo: 'conferencia',
                estado: 'borrador'
            });
            setMostrandoFormulario(false);
            cargarEventos();
        } catch (error) {
            console.error("Error al crear evento:", error);
            alert('Error al crear el evento. Verifica que hayas aplicado las reglas de Firestore.');
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
            estado: evento.estado
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
            alert('Ya existe un evento en la misma fecha, hora y ubicación. Por favor, elige otro horario o ubicación.');
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
                estado: 'borrador'
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
            estado: 'borrador'
        });
        setMostrandoFormulario(false);
    };

    // Componente del Dashboard principal
    const DashboardPrincipal = () => (
        <div className="row">
            <div className="col-12 mb-4">
                <h1 className="h3 mb-3">Dashboard - Gestión de Eventos Académicos</h1>
                <p className="text-muted">Bienvenido, {correoUsuario}</p>
            </div>
            
            {/* Tarjetas de estadísticas */}
            <div className="col-md-3 mb-4">
                <div className="card border-primary">
                    <div className="card-body text-center">
                        <h5 className="card-title text-primary">📅 Total Eventos</h5>
                        <h2 className="text-primary">{eventos.length}</h2>
                    </div>
                </div>
            </div>
            
            <div className="col-md-3 mb-4">
                <div className="card border-success">
                    <div className="card-body text-center">
                        <h5 className="card-title text-success">✅ Publicados</h5>
                        <h2 className="text-success">{eventos.filter(e => e.estado === 'publicado').length}</h2>
                    </div>
                </div>
            </div>
            
            <div className="col-md-3 mb-4">
                <div className="card border-warning">
                    <div className="card-body text-center">
                        <h5 className="card-title text-warning">📝 Borradores</h5>
                        <h2 className="text-warning">{eventos.filter(e => e.estado === 'borrador').length}</h2>
                    </div>
                </div>
            </div>
            
            <div className="col-md-3 mb-4">
                <div className="card border-info">
                    <div className="card-body text-center">
                        <h5 className="card-title text-info">👥 Total Participantes</h5>
                        <h2 className="text-info">{eventos.reduce((total, evento) => total + (evento.participantes?.length || 0), 0)}</h2>
                    </div>
                </div>
            </div>

            {/* Acciones rápidas */}
            <div className="col-12">
                <div className="card">
                    <div className="card-header">
                        <h5 className="mb-0">🚀 Acciones Rápidas</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <button 
                                    className="btn btn-primary w-100" 
                                    onClick={() => {setVistaActual('eventos'); setMostrandoFormulario(true)}}
                                >
                                    ➕ Crear Nuevo Evento
                                </button>
                            </div>
                            <div className="col-md-4 mb-3">
                                <button 
                                    className="btn btn-outline-primary w-100" 
                                    onClick={() => setVistaActual('eventos')}
                                >
                                    📋 Ver Mis Eventos
                                </button>
                            </div>
                            <div className="col-md-4 mb-3">
                                <button className="btn btn-outline-secondary w-100">
                                    📊 Reportes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-vh-100" style={{backgroundColor: '#f8f9fa'}}>
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
                <div className="container">
                    <span className="navbar-brand">🎓 UPAO Events - Organizador</span>
                    <div className="navbar-nav ms-auto">
                        <button 
                            className={`nav-link btn btn-link text-white mx-1 ${vistaActual === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setVistaActual('dashboard')}
                        >
                            🏠 Dashboard
                        </button>
                        <button 
                            className={`nav-link btn btn-link text-white mx-1 ${vistaActual === 'eventos' ? 'active' : ''}`}
                            onClick={() => setVistaActual('eventos')}
                        >
                            📅 Eventos
                        </button>
                        <button 
                            className="btn btn-outline-light ms-3" 
                            onClick={() => signOut(auth)}
                        >
                            🚪 Cerrar Sesión
                        </button>
                    </div>
                </div>
            </nav>

            {/* Contenido principal */}
            <div className="container mt-4">
                {vistaActual === 'dashboard' && <DashboardPrincipal />}
                
                {vistaActual === 'eventos' && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2>📅 Gestión de Eventos</h2>
                            <button 
                                className="btn btn-primary"
                                onClick={() => {
                                    if (mostrandoFormulario) {
                                        cancelarEdicion();
                                    } else {
                                        setEventoEditando(null);
                                        setMostrandoFormulario(true);
                                    }
                                }}
                            >
                                {mostrandoFormulario ? '❌ Cancelar' : '➕ Nuevo Evento'}
                            </button>
                        </div>

                        {/* Formulario para crear evento */}
                        {mostrandoFormulario && (
                            <div className="card mb-4">
                                <div className="card-header">
                                    <h5 className="mb-0">
                                        {eventoEditando ? '✏️ Editar Evento' : '✨ Crear Nuevo Evento'}
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={eventoEditando ? actualizarEvento : crearEvento}>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Título del Evento *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={nuevoEvento.titulo}
                                                    onChange={(e) => setNuevoEvento({...nuevoEvento, titulo: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Tipo de Evento</label>
                                                <select
                                                    className="form-control"
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

                                        <div className="mb-3">
                                            <label className="form-label">Descripción *</label>
                                            <textarea
                                                className="form-control"
                                                rows="3"
                                                value={nuevoEvento.descripcion}
                                                onChange={(e) => setNuevoEvento({...nuevoEvento, descripcion: e.target.value})}
                                                required
                                            ></textarea>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Fecha *</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={nuevoEvento.fecha}
                                                    onChange={(e) => setNuevoEvento({...nuevoEvento, fecha: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Hora *</label>
                                                <input
                                                    type="time"
                                                    className="form-control"
                                                    value={nuevoEvento.hora}
                                                    onChange={(e) => setNuevoEvento({...nuevoEvento, hora: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Capacidad Máxima *</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    min="1"
                                                    value={nuevoEvento.capacidadMaxima}
                                                    onChange={(e) => setNuevoEvento({...nuevoEvento, capacidadMaxima: e.target.value})}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Ubicación *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Ej: Auditorio Principal, Aula 205, Biblioteca Central"
                                                value={nuevoEvento.ubicacion}
                                                onChange={(e) => setNuevoEvento({...nuevoEvento, ubicacion: e.target.value})}
                                                required
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Estado</label>
                                            <select
                                                className="form-control"
                                                value={nuevoEvento.estado}
                                                onChange={(e) => setNuevoEvento({...nuevoEvento, estado: e.target.value})}
                                            >
                                                <option value="borrador">📝 Borrador</option>
                                                <option value="publicado">✅ Publicado</option>
                                            </select>
                                        </div>

                                        <div className="d-flex gap-2">
                                            <button type="submit" className="btn btn-primary">
                                                {eventoEditando ? '💾 Actualizar Evento' : '💾 Crear Evento'}
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn btn-secondary"
                                                onClick={cancelarEdicion}
                                            >
                                                ❌ Cancelar
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Lista de eventos */}
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">📋 Mis Eventos</h5>
                            </div>
                            <div className="card-body">
                                {cargandoEventos ? (
                                    <div className="text-center">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Cargando...</span>
                                        </div>
                                        <p className="mt-2">Cargando eventos...</p>
                                    </div>
                                ) : eventos.length === 0 ? (
                                    <div className="text-center text-muted">
                                        <h5>📭 No tienes eventos creados</h5>
                                        <p>¡Crea tu primer evento académico!</p>
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => {
                                                setEventoEditando(null);
                                                setMostrandoFormulario(true);
                                            }}
                                        >
                                            ➕ Crear Primer Evento
                                        </button>
                                    </div>
                                ) : (
                                    <div className="row">
                                        {eventos.map(evento => (
                                            <div key={evento.id} className="col-md-6 col-lg-4 mb-4">
                                                <div className="card h-100">
                                                    <div className="card-header d-flex justify-content-between align-items-center">
                                                        <span className="badge bg-primary">{evento.tipo}</span>
                                                        <span className={`badge ${evento.estado === 'publicado' ? 'bg-success' : 'bg-warning'}`}>
                                                            {evento.estado === 'publicado' ? '✅ Publicado' : '📝 Borrador'}
                                                        </span>
                                                    </div>
                                                    <div className="card-body">
                                                        <h6 className="card-title">{evento.titulo}</h6>
                                                        <p className="card-text text-muted small">
                                                            {evento.descripcion.length > 100 
                                                                ? evento.descripcion.substring(0, 100) + '...' 
                                                                : evento.descripcion
                                                            }
                                                        </p>
                                                        <div className="small text-muted">
                                                            <div>📅 {evento.fecha} - {evento.hora}</div>
                                                            <div>📍 {evento.ubicacion}</div>
                                                            <div>👥 {evento.participantes?.length || 0}/{evento.capacidadMaxima}</div>
                                                        </div>
                                                    </div>
                                                    <div className="card-footer">
                                                        <div className="btn-group w-100">
                                                            <button 
                                                                className="btn btn-outline-primary btn-sm"
                                                                onClick={() => iniciarEdicion(evento)}
                                                            >
                                                                ✏️ Editar
                                                            </button>
                                                            <button className="btn btn-outline-info btn-sm">
                                                                👥 Participantes
                                                            </button>
                                                            <button 
                                                                className="btn btn-outline-danger btn-sm"
                                                                onClick={() => eliminarEvento(evento.id, evento.titulo)}
                                                            >
                                                                🗑️ Eliminar
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
                )}
            </div>
        </div>
    );
};

export default HomeOrganizador;
