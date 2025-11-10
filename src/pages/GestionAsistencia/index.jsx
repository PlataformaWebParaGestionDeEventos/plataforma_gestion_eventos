/**
 * Página de Gestión de Asistencia
 * Vista para organizadores: Escáner QR + Registro manual
 * ✅ ACTUALIZADO: Soporta eventos multi-día con selector de fecha
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import appFirebase, { db } from '../../config/credenciales';
import QRScanner from '../../components/qr/QRScanner';
import firestoreService from '../../services/firestoreService';
import toastHelper from '../../core/utils/toastHelper';
import formatters from '../../core/utils/formatters';
import './GestionAsistencia.css';

const auth = getAuth(appFirebase);

const GestionAsistencia = () => {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  
  const [evento, setEvento] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vistaActual, setVistaActual] = useState('scanner'); // 'scanner' o 'manual'
  const [estadisticas, setEstadisticas] = useState({
    asistentesPorQR: 0,
    asistentesManual: 0,
    totalAsistentes: 0,
    porcentajeQR: 0
  });
  const [buscador, setBuscador] = useState('');
  
  // ✅ NUEVO: Estados para eventos multi-día
  const [diasEvento, setDiasEvento] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [esMultiDia, setEsMultiDia] = useState(false);
  const [asistenciasDelDia, setAsistenciasDelDia] = useState([]);
  
  // ✅ NUEVO: Estados para modo "por ponente"
  const [modoAsistencia, setModoAsistencia] = useState('por_dia');
  const [ponentesDelDia, setPonentesDelDia] = useState([]);
  const [ponenteSeleccionado, setPonententeSeleccionado] = useState(null);

  /**
   * ✅ TIEMPO REAL: Listener del evento con Firebase onSnapshot
   * 🔄 Actualiza automáticamente cuando hay cambios en el evento
   * 🔧 FIX: Usa useRef para evitar stale closures
   */
  const diaSeleccionadoRef = useRef(diaSeleccionado);
  const participantesRef = useRef(participantes);

  // Mantener refs actualizados
  useEffect(() => {
    diaSeleccionadoRef.current = diaSeleccionado;
  }, [diaSeleccionado]);

  useEffect(() => {
    participantesRef.current = participantes;
  }, [participantes]);

  useEffect(() => {
    if (!eventoId) return;

    console.log('🔴 Iniciando listener en tiempo real para evento:', eventoId);
    setLoading(true);

    // Crear referencia y listener de Firestore
    const eventoRef = doc(db, 'eventos', eventoId);
    const unsubscribe = onSnapshot(
      eventoRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          console.log('🔄 Evento actualizado en tiempo real');
          const eventoData = { id: docSnapshot.id, ...docSnapshot.data() };
          
          // Actualizar evento
          setEvento(eventoData);
          
          // Calcular días del evento
          const fechaInicio = eventoData.fechaInicio || eventoData.fecha;
          const fechaFin = eventoData.fechaFin || eventoData.fecha || fechaInicio;
          const dias = formatters.calcularDiasEvento(fechaInicio, fechaFin);
          const multidia = formatters.esEventoMultiDia(fechaInicio, fechaFin);
          
          setDiasEvento(dias);
          setEsMultiDia(multidia);
          
          // Seleccionar día actual por defecto (solo primera vez)
          if (!diaSeleccionadoRef.current) {
            const hoy = formatters.obtenerFechaActual();
            const diaInicial = dias.includes(hoy) ? hoy : dias[dias.length - 1];
            setDiaSeleccionado(diaInicial);
          }
          
          // Cargar participantes (solo si no están cargados)
          if (participantesRef.current.length === 0) {
            firestoreService.obtenerParticipantesEvento(eventoId).then(result => {
              if (result.success) {
                setParticipantes(result.participantes);
              }
            });
          }
          
          setError(null);
          setLoading(false);
        } else {
          setError('Evento no encontrado');
          setLoading(false);
        }
      },
      (error) => {
        console.error('❌ Error en listener del evento:', error);
        setError('Error al escuchar cambios del evento');
        setLoading(false);
      }
    );

    // Cleanup: desuscribirse al desmontar
    return () => {
      console.log('🔴 Deteniendo listener del evento');
      unsubscribe();
    };
  }, [eventoId]);

  /**
   * ✅ CORREGIDO: Cargar asistencias cuando cambia el día seleccionado O el evento se actualiza
   * 🔧 FIX: NO incluir cargarAsistenciasDelDia para evitar loops infinitos
   */
  useEffect(() => {
    if (evento && diaSeleccionado) {
      console.log('🔄 Recargando asistencias por cambio en evento o día');
      cargarAsistenciasDelDia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evento, diaSeleccionado]);

  /**
   * ✅ NUEVO: Detectar modo y cargar ponentes cuando cambia el día
   * 🔧 FIX: NO incluir cargarPonentesDelDia para evitar loops infinitos
   */
  useEffect(() => {
    if (evento) {
      const modo = evento.modoAsistencia || 'por_dia';
      setModoAsistencia(modo);
      
      if (modo === 'por_ponente' && diaSeleccionado) {
        console.log('🔄 Recargando ponentes del día');
        cargarPonentesDelDia();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evento, diaSeleccionado]);

  /**
   * ✅ NUEVO: Recargar asistencias cuando cambia el ponente seleccionado
   * 🔧 FIX: NO incluir cargarAsistenciasDelDia para evitar loops infinitos
   */
  useEffect(() => {
    if (modoAsistencia === 'por_ponente' && ponenteSeleccionado) {
      console.log('🔄 Recargando asistencias por cambio de ponente');
      cargarAsistenciasDelDia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoAsistencia, ponenteSeleccionado]);

  /**
   * ✅ DEPRECADO: Función reemplazada por listener en tiempo real (onSnapshot)
   * Ya no se usa porque el evento se actualiza automáticamente
   */
  // const cargarEvento = async () => { ... }

  /**
   * 🔧 FIX: Calcular estadísticas específicas del día o ponente seleccionado
   * ⚠️ DEBE IR ANTES de cargarAsistenciasDelDia para evitar dependencias circulares
   */
  const calcularEstadisticasDelContexto = (asistenciasData) => {
    try {
      const participantesInfo = asistenciasData.participantesInfo || [];
      
      // Contar por método de registro
      const porQR = participantesInfo.filter(p => p.metodo === 'qr').length;
      const porManual = participantesInfo.filter(p => p.metodo === 'manual').length;
      const total = participantesInfo.length;
      const porcentaje = total > 0 ? ((porQR / total) * 100).toFixed(1) : 0;
      
      setEstadisticas({
        asistentesPorQR: porQR,
        asistentesManual: porManual,
        totalAsistentes: total,
        porcentajeQR: porcentaje
      });
    } catch (error) {
      console.error('Error calculando estadísticas:', error);
    }
  };

  /**
   * ✅ NUEVO: Cargar asistencias del día seleccionado
   */
  const cargarAsistenciasDelDia = async () => {
    try {
      const modo = evento?.modoAsistencia || 'por_dia';
      
      console.log('🔄 Cargando asistencias - Modo:', modo, 'Día:', diaSeleccionado, 'Ponente:', ponenteSeleccionado);
      
      if (modo === 'por_ponente' && ponenteSeleccionado) {
        // Modo por ponente: obtener asistencias del ponente seleccionado
        const result = await firestoreService.obtenerAsistenciasDelPonente(eventoId, ponenteSeleccionado);
        console.log('📊 Resultado asistencias por ponente:', result);
        if (result.success) {
          const asistentesArray = result.asistencias.asistentes || [];
          console.log('✅ Asistentes del ponente:', asistentesArray, 'Total:', asistentesArray.length);
          setAsistenciasDelDia(asistentesArray);
          // 🔧 FIX: Calcular estadísticas específicas del ponente
          calcularEstadisticasDelContexto(result.asistencias);
        }
      } else {
        // Modo por día: obtener asistencias del día
        const result = await firestoreService.obtenerAsistenciaDelDia(eventoId, diaSeleccionado);
        console.log('📊 Resultado asistencias por día:', result);
        if (result.success) {
          const asistentesArray = result.asistencias.asistentes || [];
          console.log('✅ Asistentes del día:', asistentesArray, 'Total:', asistentesArray.length);
          console.log('🔍 Primeros 3 UIDs:', asistentesArray.slice(0, 3));
          setAsistenciasDelDia(asistentesArray);
          // 🔧 FIX: Calcular estadísticas específicas del día
          calcularEstadisticasDelContexto(result.asistencias);
        }
      }
    } catch (err) {
      console.error('❌ Error cargando asistencias:', err);
    }
  };

  /**
   * ✅ NUEVO: Cargar ponentes del día seleccionado
   */
  const cargarPonentesDelDia = async () => {
    try {
      const result = await firestoreService.obtenerPonentesDelDia(eventoId, diaSeleccionado);
      if (result.success) {
        setPonentesDelDia(result.ponentes);
        // Seleccionar primer ponente por defecto
        if (result.ponentes.length > 0) {
          setPonententeSeleccionado(result.ponentes[0].ponenteKey);
        }
      }
    } catch (err) {
      console.error('Error cargando ponentes:', err);
    }
  };

  /**
   * ✅ OPTIMIZADO: Callback cuando se registra asistencia por QR
   * � Con listener en tiempo real, solo necesitamos recargar asistencias
   */
  const handleAsistenciaRegistrada = async (participante) => {
    console.log('✅ Asistencia registrada vía QR:', participante);
    
    try {
      // El listener onSnapshot ya actualiza el evento automáticamente
      // Solo recargar asistencias del día/ponente actual
      await new Promise(resolve => setTimeout(resolve, 200));
      await cargarAsistenciasDelDia();
      
      console.log('🔄 Asistencias recargadas (evento se actualiza automáticamente con listener)');
    } catch (error) {
      console.error('❌ Error recargando datos:', error);
    }
  };

  /**
   * ✅ ACTUALIZADO: Marcar asistencia manual para el día seleccionado (y ponente si aplica)
   */
  const marcarAsistenciaManual = async (participanteId) => {
    const nombreDia = formatters.formatearNombreDia(diaSeleccionado);
    
    // Mensaje de confirmación diferente según el modo
    let mensajeConfirmacion = `¿Confirmar asistencia de este participante para ${nombreDia}?`;
    if (modoAsistencia === 'por_ponente' && ponenteSeleccionado) {
      const ponente = ponentesDelDia.find(p => p.ponenteKey === ponenteSeleccionado);
      if (ponente) {
        mensajeConfirmacion = `¿Confirmar asistencia de este participante?\n\n📅 Día: ${nombreDia}\n🎤 Ponente: ${ponente.nombre}\n⏰ Hora: ${ponente.hora}\n📝 Tema: ${ponente.tema}`;
      }
    }
    
    const confirmed = await toastHelper.confirm(mensajeConfirmacion);
    if (!confirmed) {
      return;
    }

    try {
      const currentUser = auth.currentUser;
      const organizadorUid = currentUser?.uid || null;
      
      // ✅ ACTUALIZADO: Pasar ponenteKey si es modo por_ponente
      const ponenteKey = modoAsistencia === 'por_ponente' ? ponenteSeleccionado : null;
      
      const result = await firestoreService.marcarAsistencia(
        eventoId, 
        participanteId, 
        'manual', 
        organizadorUid,
        null, // qrId
        diaSeleccionado,
        ponenteKey // ✅ NUEVO PARÁMETRO
      );
      
      if (result.success) {
        if (modoAsistencia === 'por_ponente') {
          const ponente = ponentesDelDia.find(p => p.ponenteKey === ponenteSeleccionado);
          toastHelper.success(`Asistencia registrada para ${ponente?.nombre || 'el ponente'}`);
        } else {
          toastHelper.success(`Asistencia registrada para ${nombreDia}`);
        }
        
        // � Con listener en tiempo real, solo recargar asistencias
        await new Promise(resolve => setTimeout(resolve, 200));
        await cargarAsistenciasDelDia();
        
        console.log('🔄 Asistencias recargadas (evento se actualiza automáticamente con listener)');
      } else {
        toastHelper.error(result.error || 'Error al registrar asistencia');
      }
    } catch (error) {
      console.error('Error:', error);
      toastHelper.error('Error al registrar asistencia');
    }
  };

  /**
   * Filtrar participantes por búsqueda
   * 🔧 FIX: Validar que participantes sea un array antes de usar .filter()
   */
  const participantesFiltrados = Array.isArray(participantes)
    ? participantes.filter(p => {
        const searchTerm = buscador.toLowerCase();
        return (
          p.nombre?.toLowerCase().includes(searchTerm) ||
          p.email?.toLowerCase().includes(searchTerm)
        );
      })
    : [];

  /**
   * ✅ CORREGIDO: Separar participantes por asistencia DEL DÍA SELECCIONADO
   * 🔧 FIX: Comparar tanto p.uid como p.id con todos los valores en asistenciasDelDia
   */
  const participantesConAsistenciaDelDia = participantesFiltrados.filter(p => {
    const participanteUid = p.uid || p.id;
    const participanteId = p.id || p.uid;
    
    // Verificar si alguno de los identificadores está en la lista de asistencias
    const tieneAsistencia = asistenciasDelDia.some(asistenciaId => 
      asistenciaId === participanteUid || asistenciaId === participanteId
    );
    
    if (tieneAsistencia) {
      console.log(`✅ [${p.email}] tiene asistencia - UID: ${participanteUid}, ID: ${participanteId}`);
    }
    return tieneAsistencia;
  });
  
  const participantesSinAsistenciaDelDia = participantesFiltrados.filter(p => {
    const participanteUid = p.uid || p.id;
    const participanteId = p.id || p.uid;
    
    // Verificar que NINGUNO de los identificadores esté en la lista
    const noTieneAsistencia = !asistenciasDelDia.some(asistenciaId => 
      asistenciaId === participanteUid || asistenciaId === participanteId
    );
    
    if (!noTieneAsistencia) {
      console.log(`⏭️ [${p.email}] sin asistencia - UID: ${participanteUid}, ID: ${participanteId}`);
    }
    return noTieneAsistencia;
  });
  
  // 🔧 DEBUG: Log de estado detallado con primeros 3 UIDs de cada lista
  console.log('📋 Estado actual:', {
    totalParticipantes: participantes.length,
    participantesFiltrados: participantesFiltrados.length,
    asistenciasDelDia: asistenciasDelDia.slice(0, 3), // Primeros 3 para debug
    totalAsistencias: asistenciasDelDia.length,
    conAsistencia: participantesConAsistenciaDelDia.length,
    sinAsistencia: participantesSinAsistenciaDelDia.length,
    diaSeleccionado,
    ponenteSeleccionado,
    modoAsistencia,
    ejemploParticipantes: participantes.slice(0, 2).map(p => ({
      email: p.email,
      uid: p.uid,
      id: p.id
    }))
  });


  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Cargando información del evento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button 
            className="btn btn-sm btn-outline-primary-custom ms-3"
            onClick={() => navigate(-1)}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 gestion-asistencia-container">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <button 
            className="btn btn-outline-primary-custom btn-sm mb-3"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="fw-bold text-primary mb-1">
                <i className="bi bi-clipboard-check me-2"></i>
                Gestión de Asistencia
              </h2>
              <p className="text-muted mb-0">{evento?.titulo}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="btn-group w-100" role="group">
                <button
                  className={`btn ${vistaActual === 'scanner' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setVistaActual('scanner')}
                >
                  <i className="bi bi-qr-code-scan me-2"></i>
                  Escáner QR
                </button>
                <button
                  className={`btn ${vistaActual === 'manual' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setVistaActual('manual')}
                >
                  <i className="bi bi-list-check me-2"></i>
                  Registro Manual ({participantes.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NUEVO: Selector de día (solo para eventos multi-día) */}
      {esMultiDia && diasEvento.length > 1 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-info border-0 shadow-sm">
              <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-md-between gap-3">
                <div className="w-100 w-md-auto">
                  <h6 className="mb-1">
                    <i className="bi bi-calendar-range me-2"></i>
                    Evento de {diasEvento.length} días
                  </h6>
                  <small className="text-muted">
                    Selecciona el día para registrar asistencias
                  </small>
                </div>
                <div className="btn-group w-100 w-md-auto" role="group">
                  {diasEvento.map((dia, index) => (
                    <button
                      key={dia}
                      className={`btn ${diaSeleccionado === dia ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                      onClick={() => setDiaSeleccionado(dia)}
                    >
                      <div className="d-flex flex-column align-items-center px-2">
                        <small className="fw-bold">Día {index + 1}</small>
                        <small className="d-none d-sm-inline">{formatters.formatearNombreDia(dia)}</small>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NUEVO: Selector de Ponente (solo modo por_ponente) */}
      {modoAsistencia === 'por_ponente' && ponentesDelDia.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-1 fs-6 fs-md-5">
                  <i className="bi bi-person-video3 me-2"></i>
                  Selecciona el Ponente
                </h5>
                <small className="text-muted">
                  Marca asistencia para un ponente específico
                </small>
              </div>
              <div className="card-body">
                <div className="row g-2 g-md-3">
                  {ponentesDelDia.map((ponente) => (
                    <div key={ponente.ponenteKey} className="col-12 col-sm-6 col-lg-4">
                      <button
                        className={`btn w-100 text-start ${ponenteSeleccionado === ponente.ponenteKey ? 'btn-info' : 'btn-outline-dark'}`}
                        onClick={() => setPonententeSeleccionado(ponente.ponenteKey)}
                      >
                        <div className="d-flex flex-column">
                          <div className="d-flex align-items-center mb-2">
                            <i className="bi bi-clock me-2"></i>
                            <span className="fw-bold">{ponente.hora}</span>
                            {ponente.duracion && (
                              <span className="badge bg-secondary ms-2 small">{ponente.duracion} min</span>
                            )}
                          </div>
                          <div className="mb-1 small">
                            <i className="bi bi-person me-2"></i>
                            <strong>{ponente.nombre}</strong>
                          </div>
                          <div className="text-muted small text-truncate">
                            <i className="bi bi-bookmark me-2"></i>
                            <span className="d-inline d-sm-none">{ponente.tema.substring(0, 25)}{ponente.tema.length > 25 ? '...' : ''}</span>
                            <span className="d-none d-sm-inline">{ponente.tema}</span>
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido según vista */}
      <div className="row">
        {vistaActual === 'scanner' ? (
          // VISTA ESCÁNER QR
          <div className="col-12 col-lg-8 mx-auto">
            <QRScanner
              eventoId={eventoId}
              eventoNombre={evento?.titulo}
              onAsistenciaRegistrada={handleAsistenciaRegistrada}
              fechaDiaSeleccionado={diaSeleccionado}  // ✅ NUEVO: Pasar día seleccionado
            />

            {/* ✅ ACTUALIZADO: Últimas asistencias del día seleccionado */}
            {participantesConAsistenciaDelDia.length > 0 && (
              <div className="card border-0 shadow-sm mt-4">
                <div className="card-header bg-white border-0">
                  <h5 className="mb-0">
                    <i className="bi bi-clock-history me-2"></i>
                    Asistencias registradas - {formatters.formatearNombreDia(diaSeleccionado)}
                  </h5>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {participantesConAsistenciaDelDia.slice(0, 5).map(participante => (
                      <div key={participante.id || participante.uid} className="list-group-item border-0 px-0">
                        <div className="d-flex align-items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="avatar-circle bg-success text-white">
                              <i className="bi bi-check-lg"></i>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-0">{participante.nombre || 'Sin nombre'}</h6>
                            <small className="text-muted">{participante.email}</small>
                          </div>
                          <span className="badge bg-success">
                            <i className="bi bi-check-circle me-1"></i>
                            Presente
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // VISTA REGISTRO MANUAL
          <div className="col-12">
            {/* Buscador */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Buscar por nombre o email..."
                    value={buscador}
                    onChange={(e) => setBuscador(e.target.value)}
                  />
                  {buscador && (
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => setBuscador('')}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="row g-4">
              {/* ✅ ACTUALIZADO: Lista de participantes SIN asistencia DEL DÍA */}
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-warning bg-opacity-10 border-warning">
                    <h5 className="mb-0 text-warning">
                      <i className="bi bi-hourglass-split me-2"></i>
                      Pendientes ({participantesSinAsistenciaDelDia.length})
                    </h5>
                    {esMultiDia && (
                      <small className="text-muted">
                        {formatters.formatearNombreDia(diaSeleccionado)}
                      </small>
                    )}
                  </div>
                  <div className="card-body p-0">
                    <div className="list-group list-group-flush" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      {participantesSinAsistenciaDelDia.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                          <i className="bi bi-check-circle display-4 mb-3"></i>
                          <p>¡Todos han registrado asistencia para este día!</p>
                        </div>
                      ) : (
                        participantesSinAsistenciaDelDia.map(participante => (
                          <div key={participante.id || participante.uid} className="list-group-item">
                            <div className="d-flex align-items-center justify-content-between gap-3 pe-4">
                              <div className="d-flex align-items-center gap-3 flex-grow-1">
                                  <div className="avatar-circle bg-secondary text-white">
                                    <i className="bi bi-person"></i>
                                  </div>
                                <div className="flex-grow-1">
                                  <h6 className="mb-0">{participante.nombre || 'Sin nombre'}</h6>
                                  <small className="text-muted">{participante.email}</small>
                                </div>
                              </div>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => marcarAsistenciaManual(participante.uid || participante.id)}
                              >
                                <i className="bi bi-check-lg me-1"></i>
                                Marcar asistencia
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ ACTUALIZADO: Lista de participantes CON asistencia DEL DÍA */}
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-success bg-opacity-10 border-success">
                    <h5 className="mb-0 text-success">
                      <i className="bi bi-check-circle me-2"></i>
                      Presentes ({participantesConAsistenciaDelDia.length})
                    </h5>
                    {esMultiDia && (
                      <small className="text-muted">
                        {formatters.formatearNombreDia(diaSeleccionado)}
                      </small>
                    )}
                  </div>
                  <div className="card-body p-0">
                    <div className="list-group list-group-flush" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      {participantesConAsistenciaDelDia.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                          <i className="bi bi-hourglass-split display-4 mb-3"></i>
                          <p>Aún no hay asistencias registradas para este día</p>
                        </div>
                      ) : (
                        participantesConAsistenciaDelDia.map(participante => (
                          <div key={participante.id || participante.uid} className="list-group-item">
                            <div className="d-flex align-items-center gap-3">
                              <div className="flex-shrink-0">
                                <div className="avatar-circle bg-success text-white">
                                  <i className="bi bi-check-lg"></i>
                                </div>
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-0">{participante.nombre || 'Sin nombre'}</h6>
                                <small className="text-muted">{participante.email}</small>
                              </div>
                              <span className="badge bg-success">
                                <i className="bi bi-check-circle"></i>
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas QR */}
      {estadisticas && vistaActual === 'scanner' && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">
                  <i className="bi bi-bar-chart me-2"></i>
                  Estadísticas de Asistencia
                  {modoAsistencia === 'por_ponente' && ponenteSeleccionado && ponentesDelDia.length > 0 && (
                    <span className="badge bg-primary ms-2">
                      {ponentesDelDia.find(p => p.ponenteKey === ponenteSeleccionado)?.nombre || 'Ponente'}
                    </span>
                  )}
                  {modoAsistencia === 'por_dia' && diaSeleccionado && (
                    <span className="badge bg-info ms-2">
                      {formatters.formatearNombreDia(diaSeleccionado)}
                    </span>
                  )}
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3 text-center">
                  <div className="col-6 col-md-3">
                    <div className="p-3 border rounded">
                      <div className="fs-2 fw-bold text-primary">{estadisticas.asistentesPorQR}</div>
                      <small className="text-muted">Por QR</small>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 border rounded">
                      <div className="fs-2 fw-bold text-warning">{estadisticas.asistentesManual}</div>
                      <small className="text-muted">Manual</small>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 border rounded">
                      <div className="fs-2 fw-bold text-primary">{estadisticas.totalAsistentes}</div>
                      <small className="text-muted">Total</small>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 border rounded">
                      <div className="fs-2 fw-bold text-info">{estadisticas.porcentajeQR}%</div>
                      <small className="text-muted">Uso QR</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionAsistencia;
