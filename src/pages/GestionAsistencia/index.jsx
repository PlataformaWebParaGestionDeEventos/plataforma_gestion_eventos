/**
 * Página de Gestión de Asistencia
 * Vista para organizadores: Escáner QR + Registro manual
 * ✅ ACTUALIZADO: Soporta eventos multi-día con selector de fecha
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import appFirebase from '../../config/credenciales';
import QRScanner from '../../components/qr/QRScanner';
import firestoreService from '../../services/firestoreService';
import qrService from '../../services/qrService';
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
  const [estadisticas, setEstadisticas] = useState(null);
  const [buscador, setBuscador] = useState('');
  
  // ✅ NUEVO: Estados para eventos multi-día
  const [diasEvento, setDiasEvento] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [esMultiDia, setEsMultiDia] = useState(false);
  const [asistenciasDelDia, setAsistenciasDelDia] = useState([]);

  /**
   * Cargar datos del evento
   */
  useEffect(() => {
    cargarEvento();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  /**
   * ✅ NUEVO: Cargar asistencias cuando cambia el día seleccionado
   */
  useEffect(() => {
    if (evento && diaSeleccionado) {
      cargarAsistenciasDelDia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaSeleccionado]);

  /**
   * Cargar evento y participantes
   */
  const cargarEvento = async () => {
    try {
      setLoading(true);
      
      // Obtener evento
      const eventoResult = await firestoreService.obtenerEventoPorId(eventoId);
      if (!eventoResult.success) {
        setError('Evento no encontrado');
        return;
      }
      
      const eventoData = eventoResult.evento;
      setEvento(eventoData);
      
      // ✅ NUEVO: Calcular días del evento
      const fechaInicio = eventoData.fechaInicio || eventoData.fecha;
      const fechaFin = eventoData.fechaFin || eventoData.fecha || fechaInicio;
      const dias = formatters.calcularDiasEvento(fechaInicio, fechaFin);
      const multidia = formatters.esEventoMultiDia(fechaInicio, fechaFin);
      
      setDiasEvento(dias);
      setEsMultiDia(multidia);
      
      // Seleccionar día actual por defecto
      const hoy = formatters.obtenerFechaActual();
      const diaInicial = dias.includes(hoy) ? hoy : dias[dias.length - 1]; // Si hoy está en el rango, usar hoy; sino usar último día
      setDiaSeleccionado(diaInicial);
      
      // Obtener participantes
      const participantesResult = await firestoreService.obtenerParticipantesEvento(eventoId);
      if (participantesResult.success) {
        setParticipantes(participantesResult.participantes);
      }
      
      // Obtener estadísticas QR (global)
      const statsResult = await qrService.obtenerEstadisticasQR(eventoId);
      if (statsResult.success) {
        setEstadisticas(statsResult.estadisticas);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error cargando evento:', err);
      setError('Error al cargar datos del evento');
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ NUEVO: Cargar asistencias del día seleccionado
   */
  const cargarAsistenciasDelDia = async () => {
    try {
      const result = await firestoreService.obtenerAsistenciaDelDia(eventoId, diaSeleccionado);
      if (result.success) {
        setAsistenciasDelDia(result.asistencias.asistentes || []);
      }
    } catch (err) {
      console.error('Error cargando asistencias del día:', err);
    }
  };

  /**
   * Callback cuando se registra asistencia por QR
   */
  const handleAsistenciaRegistrada = (participante) => {
    // Recargar datos
    cargarEvento();
    cargarAsistenciasDelDia();
    
    // Notificación
    console.log('✅ Asistencia registrada:', participante);
  };

  /**
   * ✅ ACTUALIZADO: Marcar asistencia manual para el día seleccionado
   */
  const marcarAsistenciaManual = async (participanteId) => {
    const nombreDia = formatters.formatearNombreDia(diaSeleccionado);
    const confirmed = await toastHelper.confirm(
      `¿Confirmar asistencia de este participante para ${nombreDia}?`
    );
    if (!confirmed) {
      return;
    }

    try {
      const currentUser = auth.currentUser;
      const organizadorUid = currentUser?.uid || null;
      
      // ✅ NUEVO: Pasar el día seleccionado como parámetro
      const result = await firestoreService.marcarAsistencia(
        eventoId, 
        participanteId, 
        'manual', 
        organizadorUid,
        null, // qrId
        diaSeleccionado // ✅ NUEVO PARÁMETRO
      );
      
      if (result.success) {
        toastHelper.success(`Asistencia registrada para ${nombreDia}`);
        cargarEvento();
        cargarAsistenciasDelDia();
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
   */
  const participantesFiltrados = participantes.filter(p => {
    const searchTerm = buscador.toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(searchTerm) ||
      p.email?.toLowerCase().includes(searchTerm)
    );
  });

  /**
   * ✅ ACTUALIZADO: Separar participantes por asistencia DEL DÍA SELECCIONADO
   */
  const participantesConAsistenciaDelDia = participantesFiltrados.filter(p => 
    asistenciasDelDia.includes(p.uid || p.id)
  );
  
  const participantesSinAsistenciaDelDia = participantesFiltrados.filter(p => 
    !asistenciasDelDia.includes(p.uid || p.id)
  );


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
            
            {/* Estadísticas */}
            {estadisticas && (
              <div className="d-flex gap-3">
                <div className="text-center">
                  <div className="fw-bold text-primary fs-4">{estadisticas.totalAsistentes}</div>
                  <small className="text-muted">Asistentes</small>
                </div>
                <div className="text-center">
                  <div className="fw-bold text-primary fs-4">{estadisticas.totalInscritos}</div>
                  <small className="text-muted">Inscritos</small>
                </div>
                <div className="text-center">
                  <div className="fw-bold text-info fs-4">{estadisticas.porcentajeAsistencia}%</div>
                  <small className="text-muted">Asistencia</small>
                </div>
              </div>
            )}
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
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <h6 className="mb-1">
                    <i className="bi bi-calendar-range me-2"></i>
                    Evento de {diasEvento.length} días
                  </h6>
                  <small className="text-muted">
                    Selecciona el día para registrar asistencias
                  </small>
                </div>
                <div className="btn-group" role="group">
                  {diasEvento.map((dia, index) => (
                    <button
                      key={dia}
                      className={`btn ${diaSeleccionado === dia ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                      onClick={() => setDiaSeleccionado(dia)}
                    >
                      <div className="d-flex flex-column align-items-center px-2">
                        <small className="fw-bold">Día {index + 1}</small>
                        <small>{formatters.formatearNombreDia(dia)}</small>
                      </div>
                    </button>
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
