import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import appFirebase, { db } from "../../config/credenciales";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import firestoreService from "../../services/firestoreService";
import { useAuth } from "../../core/hooks/useAuth";
import GestionParticipantes from "../../components/GestionParticipantes";
import toastHelper from "../../core/utils/toastHelper";
import logger from "../../core/utils/logger";
const auth = getAuth(appFirebase);

const HomeOrganizador = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, userData } = useAuth();
    
    // Detectar vista actual según la ruta
    const [vistaLocal, setVistaLocal] = useState(null); // Para vistas internas como 'participantes'
    const vistaActual = vistaLocal || (location.pathname === '/organizador' ? 'dashboard' : 
                        location.pathname.startsWith('/organizador/eventos') ? 'eventos' : 'dashboard');
    
    // Limpiar vistaLocal cuando cambia la ruta
    useEffect(() => {
        setVistaLocal(null);
    }, [location.pathname]);
    
    const setVistaActual = (vista) => {
        if (vista === 'participantes') {
            // Manejo especial para vista de participantes (no es una ruta)
            setVistaLocal('participantes');
        } else {
            // Limpiar vista local y navegar a ruta
            setVistaLocal(null);
            if (vista === 'dashboard') {
                navigate('/organizador');
            } else if (vista === 'eventos') {
                navigate('/organizador/eventos');
            } else if (vista === 'reportes') {
                navigate('/organizador/reportes');
            }
        }
    };
    const [eventos, setEventos] = useState([]);
    const [cargandoEventos, setCargandoEventos] = useState(false);
    const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
    const [eventoEditando, setEventoEditando] = useState(null);
    const [eventoParticipantes, setEventoParticipantes] = useState(null);

    // Estados para el formulario de eventos
    const [nuevoEvento, setNuevoEvento] = useState({
        titulo: '',
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        horaInicio: '',
        horaFin: '',
        ubicacion: '',
        capacidadMaxima: '',
        tipo: 'conferencia',
        estado: 'borrador',
        expositores: [] // Array de {nombre, correo, hora, tema}
    });

    // Estado para el formulario de expositores
    const [expositorActual, setExpositorActual] = useState({
        nombre: '',
        correo: '',
        hora: '',
        tema: ''
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
            logger.error("❌ Error al cargar eventos:", error);
            toastHelper.error('❌ Error al cargar eventos. Verifica tu conexión.');
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
        
        // Validar fechas
        if (!nuevoEvento.fechaInicio || !nuevoEvento.fechaFin) {
            errores.push('Las fechas de inicio y fin son obligatorias');
        } else {
            // Validar fecha futura
            const fechaInicio = new Date(nuevoEvento.fechaInicio + 'T' + nuevoEvento.horaInicio);
            const ahora = new Date();
            
            if (fechaInicio <= ahora) {
                errores.push('La fecha y hora de inicio debe ser futura');
            }
            
            // Validar que fechaFin >= fechaInicio
            if (!validarFechas(nuevoEvento.fechaInicio, nuevoEvento.fechaFin)) {
                errores.push('La fecha de fin debe ser igual o posterior a la fecha de inicio');
            }
        }
        
        // Validar horas
        if (!nuevoEvento.horaInicio || !nuevoEvento.horaFin) {
            errores.push('Las horas de inicio y fin son obligatorias');
        } else {
            // Validar rango de horas (06:00 - 23:00)
            if (!validarRangoHora(nuevoEvento.horaInicio)) {
                errores.push('La hora de inicio debe estar entre 06:00 y 23:00');
            }
            
            if (!validarRangoHora(nuevoEvento.horaFin)) {
                errores.push('La hora de fin debe estar entre 06:00 y 23:00');
            }
            
            // Validar que horaFin > horaInicio si es el mismo día
            if (!validarHoras(
                nuevoEvento.horaInicio, 
                nuevoEvento.horaFin,
                nuevoEvento.fechaInicio,
                nuevoEvento.fechaFin
            )) {
                errores.push('La hora de fin debe ser posterior a la hora de inicio para eventos del mismo día');
            }
        }
        
        // Validar expositores
        if (nuevoEvento.expositores.length === 0) {
            errores.push('Debe agregar al menos 1 expositor');
        } else {
            // Validar que todos los expositores tengan campos completos
            const expositoresIncompletos = nuevoEvento.expositores.some(exp => !validarExpositorCompleto(exp));
            if (expositoresIncompletos) {
                errores.push('Todos los expositores deben tener nombre, hora y tema completos');
            }
            
            // Validar que no haya horas duplicadas
            if (!validarExpositoresUnicos(nuevoEvento.expositores)) {
                errores.push('No puede haber dos expositores a la misma hora');
            }
            
            // Validar que todas las horas de expositores estén dentro del rango del evento
            const expositoresFueraDeRango = nuevoEvento.expositores.some(exp => 
                !validarHoraExpositor(
                    exp.hora, 
                    nuevoEvento.horaInicio, 
                    nuevoEvento.horaFin,
                    nuevoEvento.fechaInicio,
                    nuevoEvento.fechaFin
                )
            );
            if (expositoresFueraDeRango) {
                errores.push('Todas las horas de los expositores deben estar dentro del horario del evento');
            }
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
        const fechaInicio = nuevoEvento.fechaInicio;
        const fechaFin = nuevoEvento.fechaFin;
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
            
            // Verificar solapamiento de fechas Y/O misma ubicación
            const eventoInicio = evento.fechaInicio || evento.fecha;
            const eventoFin = evento.fechaFin || evento.fecha;
            const fechasSeSuperponen = 
                (fechaInicio <= eventoFin && fechaFin >= eventoInicio);
            const mismaUbicacion = evento.ubicacion.toLowerCase().trim() === ubicacionEvento;
            
            return fechasSeSuperponen || mismaUbicacion;
        });
    };

    // ===== FUNCIONES DE VALIDACIÓN PARA NUEVO MODELO =====
    
    // Validar que la hora esté en el rango permitido (06:00 - 23:00)
    const validarRangoHora = (hora) => {
        if (!hora) return false;
        const [hours] = hora.split(':').map(Number);
        return hours >= 6 && hours <= 23;
    };

    // Validar que fechaFin >= fechaInicio
    const validarFechas = (fechaInicio, fechaFin) => {
        if (!fechaInicio || !fechaFin) return false;
        return new Date(fechaFin) >= new Date(fechaInicio);
    };

    // Validar que horaFin > horaInicio
    const validarHoras = (horaInicio, horaFin, fechaInicio, fechaFin) => {
        if (!horaInicio || !horaFin) return false;
        
        // Si es el mismo día, horaFin debe ser mayor que horaInicio
        if (fechaInicio === fechaFin) {
            return horaFin > horaInicio;
        }
        
        // Si son días diferentes, cualquier combinación es válida
        return true;
    };

    // Validar que la hora del expositor esté dentro del rango del evento
    const validarHoraExpositor = (horaExpositor, horaInicio, horaFin, fechaInicio, fechaFin) => {
        if (!horaExpositor || !horaInicio || !horaFin) return false;
        
        // Si el evento es de un solo día
        if (fechaInicio === fechaFin) {
            return horaExpositor >= horaInicio && horaExpositor <= horaFin;
        }
        
        // Si el evento es de múltiples días, solo verificar rango general
        return horaExpositor >= horaInicio && horaExpositor <= horaFin;
    };

    // Validar que no haya horas duplicadas de expositores
    const validarExpositoresUnicos = (expositores) => {
        const horas = expositores.map(exp => exp.hora);
        return horas.length === new Set(horas).size;
    };

    // Validar que un expositor tenga todos los campos completos
    const validarExpositorCompleto = (expositor) => {
        return expositor.nombre.trim() !== '' && 
               expositor.correo.trim() !== '' &&
               expositor.hora.trim() !== '' && 
               expositor.tema.trim() !== '';
    };

    // Agregar expositor a la lista
    const agregarExpositor = () => {
        // Validar que todos los campos estén completos
        if (!validarExpositorCompleto(expositorActual)) {
            toastHelper.error('❌ Todos los campos del expositor son obligatorios');
            return;
        }

        // Validar que la hora esté en el rango permitido
        if (!validarRangoHora(expositorActual.hora)) {
            toastHelper.error('❌ La hora del expositor debe estar entre 06:00 y 23:00');
            return;
        }

        // Validar que la hora del expositor esté dentro del horario del evento
        if (!validarHoraExpositor(
            expositorActual.hora, 
            nuevoEvento.horaInicio, 
            nuevoEvento.horaFin,
            nuevoEvento.fechaInicio,
            nuevoEvento.fechaFin
        )) {
            toastHelper.error('❌ La hora del expositor debe estar dentro del horario del evento');
            return;
        }

        // Validar que no exista otra exposición a la misma hora
        const horaExiste = nuevoEvento.expositores.some(exp => exp.hora === expositorActual.hora);
        if (horaExiste) {
            toastHelper.error('❌ Ya existe una exposición programada a esa hora');
            return;
        }

        // Agregar a la lista
        setNuevoEvento({
            ...nuevoEvento,
            expositores: [...nuevoEvento.expositores, { ...expositorActual }]
        });

        // Limpiar formulario
        setExpositorActual({ nombre: '', correo: '', hora: '', tema: '' });
        toastHelper.success('✅ Expositor agregado correctamente');
    };

    // Eliminar expositor de la lista
    const eliminarExpositor = (index) => {
        const nuevosExpositores = nuevoEvento.expositores.filter((_, i) => i !== index);
        setNuevoEvento({
            ...nuevoEvento,
            expositores: nuevosExpositores
        });
        toastHelper.info('🗑️ Expositor eliminado');
    };

    // Función para crear evento
    const crearEvento = async (e) => {
        e.preventDefault();
        if (!usuario) return;

        // Validar formulario
        const errores = validarFormulario();
        if (errores.length > 0) {
            toastHelper.error(`❌ Errores de validación:\n${errores.join('\n')}`);
            logger.warn('Errores de validación:', errores);
            return;
        }

        // Verificar conflictos de horario
        if (verificarConflictoHorario()) {
            toastHelper.warning('⚠️ Ya existe un evento en la misma fecha o ubicación. Elige otra fecha u otra ubicación.');
            logger.warn('Conflicto de horario detectado');
            return;
        }

        try {
            logger.log('🚀 Creando evento con integración n8n...');
            toastHelper.info('🔄 Creando evento...');
            
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
                toastHelper.success('✅ Evento creado exitosamente!');
                logger.log('✅ Evento creado:', resultado);
                setNuevoEvento({
                    titulo: '',
                    descripcion: '',
                    fechaInicio: '',
                    fechaFin: '',
                    horaInicio: '09:00',
                    horaFin: '18:00',
                    ubicacion: '',
                    capacidadMaxima: '',
                    tipo: 'conferencia',
                    estado: 'borrador',
                    expositores: []
                });
                setExpositorActual({ nombre: '', hora: '', tema: '' });
                setMostrandoFormulario(false);
                cargarEventos();
            } else {
                toastHelper.error(`❌ Error al crear el evento: ${resultado.error}`);
                logger.error('Error creando evento:', resultado.error);
            }
        } catch (error) {
            logger.error("❌ Error al crear evento:", error);
            toastHelper.error('❌ Error al crear el evento. Verifica tu conexión.');
        }
    };

    // Función para eliminar evento
    const eliminarEvento = async (eventoId, tituloEvento) => {
        const confirmed = await toastHelper.confirm(`¿Estás seguro de que quieres eliminar el evento "${tituloEvento}"?`);
        if (!confirmed) return;

        try {
            toastHelper.info('🔄 Eliminando evento...');
            await deleteDoc(doc(db, "eventos", eventoId));
            toastHelper.success('🗑️ Evento eliminado exitosamente!');
            logger.log('✅ Evento eliminado:', eventoId);
            cargarEventos();
        } catch (error) {
            logger.error("❌ Error al eliminar evento:", error);
            toastHelper.error('❌ Error al eliminar el evento. Intenta de nuevo.');
        }
    };

    // Función para iniciar edición de evento
    const iniciarEdicion = (evento) => {
        setEventoEditando(evento);
        setNuevoEvento({
            titulo: evento.titulo,
            descripcion: evento.descripcion,
            fechaInicio: evento.fechaInicio || evento.fecha || '',
            fechaFin: evento.fechaFin || evento.fecha || '',
            horaInicio: evento.horaInicio || evento.hora || '09:00',
            horaFin: evento.horaFin || '18:00',
            ubicacion: evento.ubicacion,
            capacidadMaxima: evento.capacidadMaxima,
            tipo: evento.tipo,
            estado: evento.estado,
            expositores: evento.expositores || []
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
            toastHelper.error(`❌ Errores de validación:\n${errores.join('\n')}`);
            logger.warn('Errores de validación:', errores);
            return;
        }

        // Verificar conflictos de horario
        if (verificarConflictoHorario()) {
            toastHelper.warning('⚠️ Ya existe un evento en la misma fecha o ubicación. Elige otra fecha u otra ubicación.');
            logger.warn('Conflicto de horario detectado');
            return;
        }

        try {
            toastHelper.info('🔄 Actualizando evento...');
            await updateDoc(doc(db, "eventos", eventoEditando.id), {
                ...nuevoEvento,
                capacidadMaxima: parseInt(nuevoEvento.capacidadMaxima),
                fechaActualizacion: new Date()
            });

            toastHelper.success('✅ Evento actualizado exitosamente!');
            logger.log('✅ Evento actualizado:', eventoEditando.id);
            setNuevoEvento({
                titulo: '',
                descripcion: '',
                fechaInicio: '',
                fechaFin: '',
                horaInicio: '09:00',
                horaFin: '18:00',
                ubicacion: '',
                capacidadMaxima: '',
                tipo: 'conferencia',
                estado: 'borrador',
                expositores: []
            });
            setExpositorActual({ nombre: '', hora: '', tema: '' });
            setEventoEditando(null);
            setMostrandoFormulario(false);
            cargarEventos();
        } catch (error) {
            logger.error("❌ Error al actualizar evento:", error);
            toastHelper.error('❌ Error al actualizar el evento. Verifica las reglas de Firestore.');
        }
    };

    // Función para cancelar edición
    const cancelarEdicion = () => {
        setEventoEditando(null);
        setNuevoEvento({
            titulo: '',
            descripcion: '',
            fechaInicio: '',
            fechaFin: '',
            horaInicio: '09:00',
            horaFin: '18:00',
            ubicacion: '',
            capacidadMaxima: '',
            tipo: 'conferencia',
            estado: 'borrador',
            expositores: []
        });
        setExpositorActual({ nombre: '', hora: '', tema: '' });
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
        setVistaLocal(null); // Limpiar vista local para que se muestre la vista por defecto (eventos)
    };

    // Función para ver gestión de asistencia
    const verGestionAsistencia = (evento) => {
        navigate(`/organizador/asistencia/${evento.id}`);
    };

    // Función para cerrar inscripciones manualmente
    const cerrarInscripcionesManual = async (evento) => {
        const confirmacion = await toastHelper.confirm(
            `¿Cerrar inscripciones del evento "${evento.titulo}"?\n\n` +
            `📊 Inscritos: ${evento.participantes?.length || 0}/${evento.capacidadMaxima}\n\n` +
            `Esta acción:\n` +
            `🔒 Cerrará las inscripciones inmediatamente\n` +
            `📧 Enviará la lista final de inscritos a n8n\n` +
            `❌ Los alumnos NO podrán inscribirse después\n\n` +
            `¿Continuar?`
        );

        if (!confirmacion) return;

        try {
            logger.log('🔒 Cerrando inscripciones manualmente:', evento.id);
            toastHelper.info('🔄 Cerrando inscripciones...');
            
            const result = await firestoreService.cerrarInscripcionesYEnviarLista(evento.id);
            
            if (result.success) {
                toastHelper.success('✅ Inscripciones cerradas y lista enviada a n8n');
                logger.log('✅ Cierre manual exitoso:', result);
                await cargarEventos(); // Recargar para mostrar estado actualizado
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            logger.error('❌ Error cerrando inscripciones:', error);
            toastHelper.error(`Error al cerrar inscripciones: ${error.message}`);
        }
    };

    return (
        <>
            {/* Contenido principal sin navbar (el layout lo maneja) */}
            {vistaActual === 'participantes' && eventoParticipantes && (
                    <GestionParticipantes 
                        evento={eventoParticipantes} 
                        onVolver={volverDeParticipantes}
                        onIrAGestionAsistencia={() => verGestionAsistencia(eventoParticipantes)}
                    />
                )}

                {vistaActual === 'dashboard' && (
                    <div className="container-fluid py-4">
                        {/* Header */}
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="text-center text-md-start">
                                    <h1 className="h3 fw-bold text-primary mb-1">Inicio - Gestión de Eventos</h1>
                                    <p className="text-muted mb-0">Bienvenido, {userData?.nombre && userData?.apellido ? `${userData.nombre} ${userData.apellido}` : user?.email}</p>
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
                                                    className="btn btn-outline-primary w-100 py-3" 
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
                                                    <div className="col-12 col-md-6">
                                                        <label className="form-label fw-semibold">Fecha de Inicio *</label>
                                                        <input
                                                            type="date"
                                                            className={`form-control ${erroresValidacion.fechaHora ? 'is-invalid' : ''}`}
                                                            value={nuevoEvento.fechaInicio}
                                                            onChange={(e) => setNuevoEvento({...nuevoEvento, fechaInicio: e.target.value})}
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
                                                    <div className="col-12 col-md-6">
                                                        <label className="form-label fw-semibold">Fecha de Fin *</label>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={nuevoEvento.fechaFin}
                                                            onChange={(e) => setNuevoEvento({...nuevoEvento, fechaFin: e.target.value})}
                                                            min={nuevoEvento.fechaInicio || new Date().toISOString().split('T')[0]}
                                                            max={(() => {
                                                                const unAnoDespues = new Date();
                                                                unAnoDespues.setFullYear(unAnoDespues.getFullYear() + 1);
                                                                return unAnoDespues.toISOString().split('T')[0];
                                                            })()}
                                                            required
                                                        />
                                                        <small className="text-muted">Puede ser igual o posterior a la fecha de inicio</small>
                                                    </div>
                                                </div>

                                                <div className="row g-3 mt-1">
                                                    <div className="col-6 col-md-3">
                                                        <label className="form-label fw-semibold">Hora de Inicio *</label>
                                                        <input
                                                            type="time"
                                                            className="form-control"
                                                            value={nuevoEvento.horaInicio}
                                                            onChange={(e) => setNuevoEvento({...nuevoEvento, horaInicio: e.target.value})}
                                                            min="06:00"
                                                            max="23:00"
                                                            required
                                                        />
                                                        <small className="text-muted">6:00 AM - 11:00 PM</small>
                                                    </div>
                                                    <div className="col-6 col-md-3">
                                                        <label className="form-label fw-semibold">Hora de Fin *</label>
                                                        <input
                                                            type="time"
                                                            className="form-control"
                                                            value={nuevoEvento.horaFin}
                                                            onChange={(e) => setNuevoEvento({...nuevoEvento, horaFin: e.target.value})}
                                                            min="06:00"
                                                            max="23:00"
                                                            required
                                                        />
                                                        <small className="text-muted">6:00 AM - 11:00 PM</small>
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
                                                    <div className="col-12">
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
                                                </div>

                                                {/* Sección de Expositores */}
                                                <div className="row g-3 mt-3">
                                                    <div className="col-12">
                                                        <div className="card border-primary">
                                                            <div className="card-header bg-primary text-white">
                                                                <h6 className="mb-0">
                                                                    <i className="bi bi-people-fill me-2"></i>
                                                                    Expositores * (Mínimo 1)
                                                                </h6>
                                                            </div>
                                                            <div className="card-body">
                                                                {/* Formulario para agregar expositor */}
                                                                <div className="row g-2 mb-3">
                                                                    <div className="col-12 col-md-3">
                                                                        <input
                                                                            type="text"
                                                                            className="form-control"
                                                                            placeholder="Nombre del expositor"
                                                                            value={expositorActual.nombre}
                                                                            onChange={(e) => setExpositorActual({...expositorActual, nombre: e.target.value})}
                                                                        />
                                                                    </div>
                                                                    <div className="col-12 col-md-3">
                                                                        <input
                                                                            type="email"
                                                                            className="form-control"
                                                                            placeholder="Correo del expositor"
                                                                            value={expositorActual.correo}
                                                                            onChange={(e) => setExpositorActual({...expositorActual, correo: e.target.value})}
                                                                        />
                                                                    </div>
                                                                    <div className="col-6 col-md-2">
                                                                        <input
                                                                            type="time"
                                                                            className="form-control"
                                                                            placeholder="Hora"
                                                                            value={expositorActual.hora}
                                                                            onChange={(e) => setExpositorActual({...expositorActual, hora: e.target.value})}
                                                                            min="06:00"
                                                                            max="23:00"
                                                                        />
                                                                    </div>
                                                                    <div className="col-6 col-md-2">
                                                                        <input
                                                                            type="text"
                                                                            className="form-control"
                                                                            placeholder="Tema a exponer"
                                                                            value={expositorActual.tema}
                                                                            onChange={(e) => setExpositorActual({...expositorActual, tema: e.target.value})}
                                                                        />
                                                                    </div>
                                                                    <div className="col-12 col-md-2">
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-primary w-100"
                                                                            onClick={agregarExpositor}
                                                                        >
                                                                            <i className="bi bi-plus-circle me-1"></i>
                                                                            Agregar
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                
                                                                <small className="text-muted d-block mb-3">
                                                                    <i className="bi bi-info-circle me-1"></i>
                                                                    Las horas de los expositores deben estar entre {nuevoEvento.horaInicio} y {nuevoEvento.horaFin}
                                                                </small>

                                                                {/* Tabla de expositores agregados */}
                                                                {nuevoEvento.expositores.length > 0 ? (
                                                                    <div className="table-responsive">
                                                                        <table className="table table-sm table-bordered">
                                                                            <thead className="table-light">
                                                                                <tr>
                                                                                    <th>Expositor</th>
                                                                                    <th>Correo</th>
                                                                                    <th style={{width: '100px'}}>Hora</th>
                                                                                    <th>Tema</th>
                                                                                    <th style={{width: '80px'}}>Acción</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {nuevoEvento.expositores
                                                                                    .sort((a, b) => a.hora.localeCompare(b.hora))
                                                                                    .map((exp, index) => (
                                                                                    <tr key={index}>
                                                                                        <td>{exp.nombre}</td>
                                                                                        <td className="text-muted small">{exp.correo}</td>
                                                                                        <td className="text-center">
                                                                                            <span className="badge bg-info">{exp.hora}</span>
                                                                                        </td>
                                                                                        <td>{exp.tema}</td>
                                                                                        <td className="text-center">
                                                                                            <button
                                                                                                type="button"
                                                                                                className="btn btn-sm btn-outline-danger"
                                                                                                onClick={() => eliminarExpositor(index)}
                                                                                            >
                                                                                                <i className="bi bi-trash"></i>
                                                                                            </button>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                ) : (
                                                                    <div className="alert alert-warning mb-0">
                                                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                                                        Debe agregar al menos 1 expositor para crear el evento
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
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
                                                                    <div className="small text-muted mb-3">
                                                                    <div className="mb-1">
                                                                        <strong>Fecha(s):</strong> {evento.fechaInicio || evento.fecha || 'No especificada'} 
                                                                        {evento.fechaFin && evento.fechaFin !== evento.fechaInicio && ` al ${evento.fechaFin}`}
                                                                    </div>
                                                                    <div className="mb-1">
                                                                        <strong>Horario:</strong> {evento.horaInicio || evento.hora || 'No especificada'}
                                                                        {evento.horaFin && ` - ${evento.horaFin}`}
                                                                    </div>
                                                                    <div className="mb-1"><strong>Ubicación:</strong> {evento.ubicacion}</div>
                                                                    <div><strong>Participantes:</strong> {evento.participantes?.length || 0}/{evento.capacidadMaxima}</div>
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
                                                                        Editar
                                                                    </button>
                                                                    
                                                                    {/* Botones de acciones principales */}
                                                                    <div className="row g-2 mb-2">
                                                                        <div className="col-6">
                                                                            <button 
                                                                                className="btn btn-outline-primary btn-sm w-100"
                                                                                onClick={() => verGestionAsistencia(evento)}
                                                                                title="Escanear QR y registrar asistencia"
                                                                            >
                                                                                <i className="bi bi-qr-code-scan me-1"></i>
                                                                                Gestión Asistencia
                                                                            </button>
                                                                        </div>
                                                                        <div className="col-6">
                                                                            <button 
                                                                                className={`btn btn-sm w-100 ${evento.inscripcionesAbiertas ? 'btn-outline-danger' : 'btn-secondary'}`}
                                                                                onClick={() => cerrarInscripcionesManual(evento)}
                                                                                disabled={!evento.inscripcionesAbiertas}
                                                                                title={evento.inscripcionesAbiertas ? 'Cerrar inscripciones manualmente' : 'Inscripciones ya cerradas'}
                                                                            >
                                                                                <i className={`bi ${evento.inscripcionesAbiertas ? 'bi-lock-fill' : 'bi-lock'} me-1`}></i>
                                                                                {evento.inscripcionesAbiertas ? 'Cerrar Inscripciones' : 'Cerrado'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="row g-2 mb-2">
                                                                        <div className="col-12">
                                                                            <button 
                                                                                className="btn btn-outline-primary btn-sm w-100"
                                                                                onClick={() => verParticipantes(evento)}
                                                                            >
                                                                                Participantes
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="row g-2">
                                                                        <div className="col-12">
                                                                            <button 
                                                                                className="btn btn-outline-danger btn-sm w-100"
                                                                                onClick={() => eliminarEvento(evento.id, evento.titulo)}
                                                                            >
                                                                                Eliminar Evento
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
        </>
    );
};

export default HomeOrganizador;
