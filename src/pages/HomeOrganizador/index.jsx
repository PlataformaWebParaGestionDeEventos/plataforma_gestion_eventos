import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import appFirebase, { db } from "../../config/credenciales";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import firestoreService from "../../services/firestoreService";
import { useAuth } from "../../core/hooks/useAuth";
import { useButtonDebounce } from "../../core/hooks";
import toastHelper from "../../core/utils/toastHelper";
import logger from "../../core/utils/logger";
import ExpositoresTable from "../../components/ExpositoresTable";  // ✅ NUEVO
const auth = getAuth(appFirebase);

const HomeOrganizador = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, userData } = useAuth();
    const { isDisabled: isButtonDisabled, handleClick: handleButtonClick } = useButtonDebounce(5000);
    
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
        modoAsistencia: 'por_dia', // ✅ NUEVO: por_dia | por_ponente
        expositores: [], // Array de {nombre, correo, hora, tema, dia, duracion, break}
        certificadosParticipantes: true, // ✅ NUEVO: Certificados para participantes
        certificadosPonentes: true,      // ✅ NUEVO: Certificados para ponentes
        certificadosOrganizadores: false // ✅ NUEVO: Certificados para organizadores
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
                
            case 'horaInicio':
            case 'horaFin':
                if (valor) {
                    const [hora] = valor.split(':').map(Number);
                    if (hora < 6 || hora >= 23) {
                        errores[campo] = 'La hora debe estar entre 6:00 AM y 11:00 PM';
                    } else {
                        delete errores[campo];
                    }
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

    // ✅ ACTUALIZADO: Verificar conflictos SOLO si los 3 se cumplen simultáneamente (ubicación + fecha + hora)
    const verificarConflictoHorario = () => {
        const fechaInicio = nuevoEvento.fechaInicio;
        const fechaFin = nuevoEvento.fechaFin;
        const horaInicio = nuevoEvento.horaInicio;
        const horaFin = nuevoEvento.horaFin;
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
            
            // ✅ NUEVO: Deben cumplirse LAS 3 CONDICIONES SIMULTÁNEAMENTE
            const eventoInicio = evento.fechaInicio || evento.fecha;
            const eventoFin = evento.fechaFin || evento.fecha;
            const eventoHoraInicio = evento.horaInicio || evento.hora || '00:00';
            const eventoHoraFin = evento.horaFin || evento.hora || '23:59';
            
            // 1. Verificar si es la misma ubicación
            const mismaUbicacion = evento.ubicacion.toLowerCase().trim() === ubicacionEvento;
            
            // 2. Verificar solapamiento de fechas
            const fechasSeSuperponen = 
                (fechaInicio <= eventoFin && fechaFin >= eventoInicio);
            
            // 3. Verificar solapamiento de horas
            const horasSeSuperponen = 
                (horaInicio < eventoHoraFin && horaFin > eventoHoraInicio);
            
            // ✅ CONFLICTO SOLO SI LAS 3 CONDICIONES SE CUMPLEN
            return mismaUbicacion && fechasSeSuperponen && horasSeSuperponen;
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
        // Agrupar expositores por día
        const expositoresPorDia = {};
        
        expositores.forEach(exp => {
            if (!expositoresPorDia[exp.dia]) {
                expositoresPorDia[exp.dia] = [];
            }
            expositoresPorDia[exp.dia].push(exp);
        });
        
        // Verificar solapamientos en cada día
        for (const dia in expositoresPorDia) {
            const exps = expositoresPorDia[dia];
            
            for (let i = 0; i < exps.length; i++) {
                for (let j = i + 1; j < exps.length; j++) {
                    const exp1 = exps[i];
                    const exp2 = exps[j];
                    
                    // Calcular minutos de inicio y fin para cada expositor
                    const [h1, m1] = exp1.hora.split(':').map(Number);
                    const inicio1 = h1 * 60 + m1;
                    const fin1 = inicio1 + (exp1.duracion || 60);
                    
                    const [h2, m2] = exp2.hora.split(':').map(Number);
                    const inicio2 = h2 * 60 + m2;
                    const fin2 = inicio2 + (exp2.duracion || 60);
                    
                    // Verificar si se solapan (NO hay conflicto si uno termina cuando el otro empieza)
                    const haySolapamiento = (inicio1 < fin2) && (fin1 > inicio2);
                    
                    if (haySolapamiento) {
                        return false; // Hay conflicto
                    }
                }
            }
        }
        
        return true; // No hay conflictos
    };

    // Validar que un expositor tenga todos los campos completos
    const validarExpositorCompleto = (expositor) => {
        return expositor.nombre.trim() !== '' && 
               expositor.correo.trim() !== '' &&
               expositor.hora.trim() !== '' && 
               expositor.tema.trim() !== '';
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
                // setExpositorActual({ nombre: '', hora: '', tema: '' }); // Ya no se usa
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
        // ✅ PERMITIR editar eventos finalizados
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
            expositores: evento.expositores || [],
            certificadosParticipantes: evento.certificadosParticipantes ?? true,
            certificadosPonentes: evento.certificadosPonentes ?? true,
            certificadosOrganizadores: evento.certificadosOrganizadores ?? false
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

        // ✅ ACTUALIZADO: Verificar conflictos (ubicación + fecha + hora)
        if (verificarConflictoHorario()) {
            toastHelper.warning('⚠️ Ya existe un evento en el mismo lugar, fecha y hora. Cambia alguno de estos valores.');
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
        setMostrandoFormulario(false);
    };

    // Función para ver participantes de un evento
    const verParticipantes = (evento) => {
        navigate(`/organizador/participantes/${evento.id}`);
    };

    // Función para ver gestión de asistencia
    const verGestionAsistencia = (evento) => {
        navigate(`/organizador/asistencia/${evento.id}`);
    };

    // Función para cerrar inscripciones manualmente
    const cerrarInscripcionesManual = async (evento) => {
        const confirmacion = await toastHelper.confirm(
            `¿Cerrar inscripciones del evento "${evento.titulo}"?\n\n` +
            `⚠️ Los alumnos NO podrán inscribirse después\n\n` +
            `¿Continuar?`
        );

        if (!confirmacion) return;

        try {
            logger.log('🔒 Cerrando inscripciones manualmente:', evento.id);
            toastHelper.info('🔄 Cerrando inscripciones...');
            
            const result = await firestoreService.cerrarInscripcionesYEnviarLista(evento.id);
            
            if (result.success) {
                toastHelper.success('✅ Inscripciones cerradas');
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

    // ✅ NUEVO: Reabrir inscripciones manualmente
    const reabrirInscripcionesManual = async (evento) => {
        const confirmacion = await toastHelper.confirm(
            `¿Reabrir inscripciones del evento "${evento.titulo}"?\n\n` +
            `Esta acción:\n` +
            `🔓 Permitirá nuevas inscripciones\n` +
            `✅ Los alumnos podrán inscribirse nuevamente\n\n` +
            `¿Continuar?`
        );

        if (!confirmacion) return;

        try {
            logger.log('🔓 Reabriendo inscripciones manualmente:', evento.id);
            toastHelper.info('🔄 Reabriendo inscripciones...');
            
            const result = await firestoreService.reabrirInscripciones(evento.id);
            
            if (result.success) {
                toastHelper.success('✅ Inscripciones reabiertas exitosamente');
                logger.log('✅ Reapertura exitosa:', result);
                await cargarEventos();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            logger.error('❌ Error reabriendo inscripciones:', error);
            toastHelper.error(`Error al reabrir inscripciones: ${error.message}`);
        }
    };

    // ✅ NUEVO: Cerrar asistencia manualmente
    const cerrarAsistenciaManual = async (evento) => {
        const confirmacion = await toastHelper.confirm(
            `¿Cerrar registro de asistencia del evento "${evento.titulo}"?\n\n` +
            `Esta acción:\n` +
            `🔒 Impedirá escanear QRs de asistencias\n` +
            `⚠️ No se podrá registrar más asistencias\n\n` +
            `¿Continuar?`
        );

        if (!confirmacion) return;

        try {
            logger.log('🔒 Cerrando asistencia manualmente:', evento.id);
            toastHelper.info('🔄 Cerrando asistencia...');
            
            const result = await firestoreService.cerrarAsistencia(evento.id);
            
            if (result.success) {
                toastHelper.success('✅ Asistencia cerrada exitosamente');
                logger.log('✅ Cierre de asistencia exitoso:', result);
                await cargarEventos();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            logger.error('❌ Error cerrando asistencia:', error);
            toastHelper.error(`Error al cerrar asistencia: ${error.message}`);
        }
    };

    // ✅ NUEVO: Reabrir asistencia manualmente
    const reabrirAsistenciaManual = async (evento) => {
        const confirmacion = await toastHelper.confirm(
            `¿Reabrir registro de asistencia del evento "${evento.titulo}"?\n\n` +
            `Esta acción:\n` +
            `🔓 Permitirá escanear QRs nuevamente\n` +
            `✅ Se podrá registrar asistencia tardía\n\n` +
            `¿Continuar?`
        );

        if (!confirmacion) return;

        try {
            logger.log('🔓 Reabriendo asistencia manualmente:', evento.id);
            toastHelper.info('🔄 Reabriendo asistencia...');
            
            const result = await firestoreService.reabrirAsistencia(evento.id);
            
            if (result.success) {
                toastHelper.success('✅ Asistencia reabierta exitosamente');
                logger.log('✅ Reapertura de asistencia exitosa:', result);
                await cargarEventos();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            logger.error('❌ Error reabriendo asistencia:', error);
            toastHelper.error(`Error al reabrir asistencia: ${error.message}`);
        }
    };

    // ✅ NUEVO: Finalizar evento
    const finalizarEvento = async (evento) => {
        // Validar que inscripciones y asistencias estén cerradas
        if (evento.inscripcionesAbiertas) {
            toastHelper.error('❌ Debes cerrar las inscripciones primero');
            return;
        }

        if (evento.asistenciaAbierta !== false) {
            toastHelper.error('❌ Debes cerrar el registro de asistencia primero');
            return;
        }

        const confirmacion = await toastHelper.confirm(
            `¿Finalizar el evento "${evento.titulo}"?\n\n` +
            `Esta acción:\n` +
            `✅ Cambiará el estado del evento a "FINALIZADO"\n` +
            `📊 Generará reportes y estadísticas finales\n` +
            `🏆 Habilitará la generación de certificados\n` +
            `🔒 El evento ya no podrá modificarse\n\n` +
            `¿Estás seguro de continuar?`
        );

        if (!confirmacion) return;

        try {
            logger.log('🏁 Finalizando evento:', evento.id);
            toastHelper.info('🔄 Finalizando evento...');
            
            const result = await firestoreService.finalizarEvento(evento.id);
            
            if (result.success) {
                toastHelper.success('✅ Evento finalizado exitosamente. Los reportes están disponibles.');
                logger.log('✅ Finalización de evento exitosa:', result);
                await cargarEventos();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            logger.error('❌ Error finalizando evento:', error);
            toastHelper.error(`Error al finalizar evento: ${error.message}`);
        }
    };

    return (
        <>
            {/* Contenido principal sin navbar (el layout lo maneja) */}
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
                                        <h3 className="text-primary mb-0">{Array.isArray(eventos) ? eventos.filter(e => e.estado === 'publicado').length : 0}</h3>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-6 col-md-3">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body text-center p-3">
                                        <div className="fs-2 text-warning mb-2">📝</div>
                                        <h5 className="card-title text-warning mb-1 fs-6">Borradores</h5>
                                        <h3 className="text-warning mb-0">{Array.isArray(eventos) ? eventos.filter(e => e.estado === 'borrador').length : 0}</h3>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-6 col-md-3">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body text-center p-3">
                                        <div className="fs-2 text-success mb-2">🏁</div>
                                        <h5 className="card-title text-success mb-1 fs-6">Finalizados</h5>
                                        <h3 className="text-success mb-0">{Array.isArray(eventos) ? eventos.filter(e => e.estado === 'finalizado').length : 0}</h3>
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
                                            <form onSubmit={handleButtonClick(eventoEditando ? actualizarEvento : crearEvento)}>
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
                                                            disabled={!nuevoEvento.fechaInicio}
                                                            required
                                                        />
                                                        <small className="text-muted">{!nuevoEvento.fechaInicio ? 'Selecciona primero la fecha de inicio' : 'Puede ser igual o posterior a la fecha de inicio'}</small>
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
                                                            disabled={!nuevoEvento.fechaInicio}
                                                            required
                                                        />
                                                        <small className="text-muted">{!nuevoEvento.fechaInicio ? 'Selecciona primero la fecha de inicio' : '6:00 AM - 11:00 PM'}</small>
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
                                                            disabled={!nuevoEvento.fechaInicio || !nuevoEvento.horaInicio}
                                                            required
                                                        />
                                                        <small className="text-muted">{!nuevoEvento.fechaInicio || !nuevoEvento.horaInicio ? 'Selecciona primero fecha y hora de inicio' : '6:00 AM - 11:00 PM'}</small>
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
                                                            <option value="borrador">Borrador</option>
                                                            <option value="publicado">Publicado</option>
                                                            <option value="finalizado">Finalizado</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* ✅ NUEVO: Modo de Asistencia */}
                                                <div className="row g-3 mt-3">
                                                    <div className="col-12">
                                                        <div className="alert alert-info d-flex align-items-start border-0 shadow-sm">
                                                            <i className="bi bi-info-circle-fill fs-4 me-3"></i>
                                                            <div className="flex-grow-1">
                                                                <h6 className="fw-bold mb-2">Modo de Registro de Asistencia</h6>
                                                                {eventoEditando && (
                                                                    <div className="alert alert-warning py-2 px-3 mb-2">
                                                                        <small><i className="bi bi-lock-fill me-1"></i> No se puede cambiar el modo de asistencia en eventos existentes</small>
                                                                    </div>
                                                                )}
                                                                <div className="row g-3">
                                                                    <div className="col-12 col-md-6">
                                                                        <div className="form-check">
                                                                            <input 
                                                                                className="form-check-input" 
                                                                                type="radio" 
                                                                                name="modoAsistencia" 
                                                                                id="modoPorDia"
                                                                                value="por_dia"
                                                                                checked={nuevoEvento.modoAsistencia === 'por_dia'}
                                                                                onChange={(e) => setNuevoEvento({...nuevoEvento, modoAsistencia: e.target.value})}
                                                                                disabled={!!eventoEditando}
                                                                            />
                                                                            <label className="form-check-label" htmlFor="modoPorDia">
                                                                                <div className="fw-semibold">Por Día</div>
                                                                                <small className="text-muted d-block">
                                                                                    Un QR único por cada día del evento.
                                                                                </small>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-12 col-md-6">
                                                                        <div className="form-check">
                                                                            <input 
                                                                                className="form-check-input" 
                                                                                type="radio" 
                                                                                name="modoAsistencia" 
                                                                                id="modoPorPonente"
                                                                                value="por_ponente"
                                                                                checked={nuevoEvento.modoAsistencia === 'por_ponente'}
                                                                                onChange={(e) => setNuevoEvento({...nuevoEvento, modoAsistencia: e.target.value})}
                                                                                disabled={!!eventoEditando}
                                                                            />
                                                                            <label className="form-check-label" htmlFor="modoPorPonente">
                                                                                <div className="fw-semibold">Por Ponente</div>
                                                                                <small className="text-muted d-block">
                                                                                    Un QR por cada expositor/ponencia.
                                                                                </small>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
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

                                                {/* ✅ NUEVO: Configuración de Certificados */}
                                                <div className="row g-3 mt-3">
                                                    <div className="col-12">
                                                        <div className="alert alert-light border d-flex align-items-start">
                                                            <i className="bi bi-award-fill fs-4 me-3 text-warning"></i>
                                                            <div className="flex-grow-1">
                                                                <h6 className="fw-bold mb-2">Certificados del Evento</h6>
                                                                <p className="text-muted small mb-3">
                                                                    Selecciona quiénes recibirán certificados al finalizar el evento
                                                                </p>
                                                                <div className="row g-3">
                                                                    <div className="col-12 col-md-4">
                                                                        <div className="form-check form-switch">
                                                                            <input 
                                                                                className="form-check-input" 
                                                                                type="checkbox" 
                                                                                id="certParticipantes"
                                                                                checked={nuevoEvento.certificadosParticipantes}
                                                                                onChange={(e) => setNuevoEvento({
                                                                                    ...nuevoEvento, 
                                                                                    certificadosParticipantes: e.target.checked
                                                                                })}
                                                                            />
                                                                            <label className="form-check-label" htmlFor="certParticipantes">
                                                                                <div className="fw-semibold">Participantes</div>
                                                                                <small className="text-muted d-block">
                                                                                    Asistentes que registraron su asistencia
                                                                                </small>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-12 col-md-4">
                                                                        <div className="form-check form-switch">
                                                                            <input 
                                                                                className="form-check-input" 
                                                                                type="checkbox" 
                                                                                id="certPonentes"
                                                                                checked={nuevoEvento.certificadosPonentes}
                                                                                onChange={(e) => setNuevoEvento({
                                                                                    ...nuevoEvento, 
                                                                                    certificadosPonentes: e.target.checked
                                                                                })}
                                                                            />
                                                                            <label className="form-check-label" htmlFor="certPonentes">
                                                                                <div className="fw-semibold">Ponentes</div>
                                                                                <small className="text-muted d-block">
                                                                                    Expositores del evento
                                                                                </small>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-12 col-md-4">
                                                                        <div className="form-check form-switch">
                                                                            <input 
                                                                                className="form-check-input" 
                                                                                type="checkbox" 
                                                                                id="certOrganizadores"
                                                                                checked={nuevoEvento.certificadosOrganizadores}
                                                                                onChange={(e) => setNuevoEvento({
                                                                                    ...nuevoEvento, 
                                                                                    certificadosOrganizadores: e.target.checked
                                                                                })}
                                                                            />
                                                                            <label className="form-check-label" htmlFor="certOrganizadores">
                                                                                <div className="fw-semibold">Organizadores</div>
                                                                                <small className="text-muted d-block">
                                                                                    Staff organizador del evento
                                                                                </small>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ✅ NUEVO: Componente de Expositores */}
                                                <div className="row g-3 mt-3">
                                                    <div className="col-12">
                                                        <ExpositoresTable 
                                                            expositores={nuevoEvento.expositores}
                                                            setExpositores={(expositores) => setNuevoEvento({...nuevoEvento, expositores})}
                                                            fechaInicio={nuevoEvento.fechaInicio}
                                                            fechaFin={nuevoEvento.fechaFin}
                                                            horaInicio={nuevoEvento.horaInicio}
                                                            horaFin={nuevoEvento.horaFin}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                                                    <button type="submit" className="btn btn-primary" disabled={isButtonDisabled}>
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

                        {/* Lista de eventos responsive - ✅ OCULTAR cuando se muestra el formulario */}
                        {!mostrandoFormulario && (
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
                                                                <span className={`badge ${
                                                                    evento.estado === 'publicado' ? 'bg-primary' : 
                                                                    evento.estado === 'finalizado' ? 'bg-secondary' : 
                                                                    'bg-warning'
                                                                }`}>
                                                                    {evento.estado === 'publicado' ? 'Publicado' : 
                                                                     evento.estado === 'finalizado' ? 'Finalizado' : 
                                                                     'Borrador'}
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
                                                                        onClick={handleButtonClick(() => iniciarEdicion(evento))}
                                                                        disabled={evento.estado === 'finalizado' || isButtonDisabled}
                                                                        title={evento.estado === 'finalizado' ? 'Los eventos finalizados no pueden editarse' : 'Editar evento'}
                                                                    >
                                                                        {evento.estado === 'finalizado' ? '🔒 Finalizado' : 'Editar'}
                                                                    </button>
                                                                    
                                                                    {/* ✅ NUEVO: Controles Manuales de Inscripciones (solo si no está finalizado) */}
                                                                    {evento.estado !== 'finalizado' && (
                                                                    <>
                                                                    <div className="alert alert-primary mb-2 py-2 px-3">
                                                                        <small className="fw-semibold d-block mb-1">
                                                                            <i className="bi bi-clipboard-check me-1"></i>
                                                                            Inscripciones
                                                                        </small>
                                                                        <div className="row g-2">
                                                                            <div className="col-6">
                                                                                <button 
                                                                                    className={`btn btn-sm w-100 ${evento.inscripcionesAbiertas ? 'btn-danger' : 'btn-secondary'}`}
                                                                                    onClick={handleButtonClick(() => cerrarInscripcionesManual(evento))}
                                                                                    disabled={!evento.inscripcionesAbiertas || isButtonDisabled}
                                                                                    title={evento.inscripcionesAbiertas ? 'Cerrar inscripciones' : 'Ya cerradas'}
                                                                                >
                                                                                    <i className="bi bi-lock-fill"></i>
                                                                                    {evento.inscripcionesAbiertas ? 'Cerrar' : 'Cerradas'}
                                                                                </button>
                                                                            </div>
                                                                            <div className="col-6">
                                                                                <button 
                                                                                    className={`btn btn-sm w-100 ${!evento.inscripcionesAbiertas ? 'btn-success' : 'btn-secondary'}`}
                                                                                    onClick={handleButtonClick(() => reabrirInscripcionesManual(evento))}
                                                                                    disabled={evento.inscripcionesAbiertas || isButtonDisabled}
                                                                                    title={!evento.inscripcionesAbiertas ? 'Reabrir inscripciones' : 'Ya abiertas'}
                                                                                >
                                                                                    <i className="bi bi-unlock-fill"></i>
                                                                                    {!evento.inscripcionesAbiertas ? 'Reabrir' : 'Abiertas'}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* ✅ NUEVO: Controles Manuales de Asistencia */}
                                                                    <div className="alert alert-primary mb-2 py-2 px-3">
                                                                        <small className="fw-semibold d-block mb-1">
                                                                            <i className="bi bi-qr-code-scan me-1"></i>
                                                                            Asistencia
                                                                        </small>
                                                                        <div className="row g-2">
                                                                            <div className="col-6">
                                                                                <button 
                                                                                    className={`btn btn-sm w-100 ${evento.asistenciaAbierta !== false ? 'btn-danger' : 'btn-secondary'}`}
                                                                                    onClick={handleButtonClick(() => cerrarAsistenciaManual(evento))}
                                                                                    disabled={evento.asistenciaAbierta === false || isButtonDisabled}
                                                                                    title={evento.asistenciaAbierta !== false ? 'Cerrar asistencia' : 'Ya cerrada'}
                                                                                >
                                                                                    <i className="bi bi-lock-fill"></i>
                                                                                    {evento.asistenciaAbierta !== false ? 'Cerrar' : 'Cerrada'}
                                                                                </button>
                                                                            </div>
                                                                            <div className="col-6">
                                                                                <button 
                                                                                    className={`btn btn-sm w-100 ${evento.asistenciaAbierta === false ? 'btn-success' : 'btn-secondary'}`}
                                                                                    onClick={handleButtonClick(() => reabrirAsistenciaManual(evento))}
                                                                                    disabled={evento.asistenciaAbierta !== false || isButtonDisabled}
                                                                                    title={evento.asistenciaAbierta === false ? 'Reabrir asistencia' : 'Ya abierta'}
                                                                                >
                                                                                    <i className="bi bi-unlock-fill"></i>
                                                                                    {evento.asistenciaAbierta === false ? 'Reabrir' : 'Abierta'}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    </>
                                                                    )}
                                                                    
                                                                    {/* Botones de acciones */}
                                                                    <div className="row g-2 mb-2">
                                                                        <div className="col-6">
                                                                            <button 
                                                                                className="btn btn-outline-primary btn-sm w-100"
                                                                                onClick={() => verGestionAsistencia(evento)}
                                                                                title={
                                                                                    evento.estado === 'finalizado' ? 'Evento finalizado' :
                                                                                    evento.asistenciaAbierta === false ? 'Asistencia cerrada' :
                                                                                    'Escanear QR y registrar asistencia'
                                                                                }
                                                                                disabled={evento.estado === 'finalizado' || evento.asistenciaAbierta === false}
                                                                            >
                                                                                <i className="bi bi-qr-code-scan me-1"></i>
                                                                                {evento.asistenciaAbierta === false ? '🔒 Cerrada' : 'QR Asistencia'}
                                                                            </button>
                                                                        </div>
                                                                        <div className="col-6">
                                                                            <button 
                                                                                className="btn btn-outline-primary btn-sm w-100"
                                                                                onClick={() => verParticipantes(evento)}
                                                                            >
                                                                                <i className="bi bi-people me-1"></i>
                                                                                Participantes
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* ✅ NUEVO: Botón Finalizar Evento */}
                                                                    {evento.estado === 'publicado' && 
                                                                     evento.inscripcionesAbiertas === false && 
                                                                     evento.asistenciaAbierta === false && (
                                                                        <div className="alert alert-success mb-2 py-2 px-3">
                                                                            <small className="fw-semibold d-block mb-2 text-center">
                                                                                <i className="bi bi-flag-fill me-1"></i>
                                                                                Listo para finalizar
                                                                            </small>
                                                                            <button 
                                                                                className="btn btn-success btn-sm w-100"
                                                                                onClick={handleButtonClick(() => finalizarEvento(evento))}
                                                                                disabled={isButtonDisabled}
                                                                                title="Finalizar evento y generar reportes"
                                                                            >
                                                                                <i className="bi bi-check-circle-fill me-1"></i>
                                                                                Finalizar Evento
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    <div className="row g-2">
                                                                        <div className="col-12">
                                                                            <button 
                                                                                className="btn btn-outline-danger btn-sm w-100"
                                                                                onClick={handleButtonClick(() => eliminarEvento(evento.id, evento.titulo))}
                                                                                disabled={isButtonDisabled}
                                                                            >
                                                                                <i className="bi bi-trash me-1"></i>
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
                        )}  {/* ✅ Cierre del condicional !mostrandoFormulario */}
                    </div>
                )}
        </>
    );
};

export default HomeOrganizador;
