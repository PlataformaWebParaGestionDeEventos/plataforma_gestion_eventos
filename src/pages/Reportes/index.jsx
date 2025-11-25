import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../core/hooks/useAuth';
import { useReportes } from '../../core/hooks';
import './Reportes.css';

const Reportes = ({ modo = 'reportes-generales' }) => {
  const navigate = useNavigate();
  const { eventoId } = useParams();
  const { user } = useAuth();
  const {
    cargando,
    error,
    estadisticasGenerales,
    eventosPorTipo,
    eventosPorMes,
    topEventosPorAsistencia,
    topEventosPorInscripciones,
    tasaConversion,
    estadoInscripciones,
    // Datos para eventos individuales
    estadisticasEvento,
    estadisticasPorDia,
    estadisticasPorPonente,
    promedioFinalizados,
    evento
  } = useReportes(user?.email, eventoId);

  // ✅ Determinar modo: reportes generales o reporte individual
  const esReporteIndividual = modo === 'evento-individual' || eventoId;
  
  // ✅ ACTUALIZADO: Siempre empezar en "asistencia" (eliminada pestaña "general")
  const [vistaActiva, setVistaActiva] = useState('asistencia');

  if (cargando) {
    return (
      <div className="reportes-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando reportes...</span>
          </div>
          <p className="mt-3 text-muted">Generando reportes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reportes-container">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="reportes-container">
      {/* Header */}
      <div className="reportes-header mb-4">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h2 className="fw-bold text-primary mb-1">
              <i className="bi bi-bar-chart-fill me-2"></i>
              {esReporteIndividual ? 'Reporte del Evento' : 'Dashboard de Reportes'}
            </h2>
            <p className="text-muted mb-0">
              {esReporteIndividual 
                ? 'Análisis detallado, gráficas y estadísticas del evento finalizado' 
                : 'Análisis promedio y estadísticas generales de todos los eventos finalizados'
              }
            </p>
          </div>
          {esReporteIndividual && (
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Volver
            </button>
          )}
        </div>
      </div>

      {/* Navegación por pestañas */}
      {esReporteIndividual && (
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${vistaActiva === 'asistencia' ? 'active' : ''}`}
              onClick={() => setVistaActiva('asistencia')}
            >
              <i className="bi bi-people me-2"></i>
              Asistencia
            </button>
          </li>
        </ul>
      )}

      {/* Vista de Asistencia */}
      {vistaActiva === 'asistencia' && (
        <div className="vista-asistencia">
          {/* ===== MODO: REPORTES GENERALES ===== */}
          {!esReporteIndividual && (
            <>
              {/* Tarjetas de estadísticas principales */}
              <div className="row g-4 mb-4">
                <div className="col-md-3 col-sm-6">
                  <div className="stat-card card-total-eventos">
                    <div className="stat-icon">
                      <i className="bi bi-calendar-event"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{estadisticasGenerales.totalEventos}</h3>
                      <p>Total Eventos</p>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 col-sm-6">
                  <div className="stat-card card-inscritos">
                    <div className="stat-icon">
                      <i className="bi bi-person-plus"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{estadisticasGenerales.totalInscritos}</h3>
                      <p>Total Inscritos</p>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 col-sm-6">
                  <div className="stat-card card-asistentes">
                    <div className="stat-icon">
                      <i className="bi bi-person-check"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{estadisticasGenerales.totalAsistentes}</h3>
                      <p>Total Asistentes</p>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 col-sm-6">
                  <div className="stat-card card-tasa">
                    <div className="stat-icon">
                      <i className="bi bi-percent"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{estadisticasGenerales.promedioAsistencia}%</h3>
                      <p>Tasa de Asistencia</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Eventos por tipo */}
              <div className="row g-4 mb-4">
                <div className="col-12">
                  <div className="card shadow-sm">
                    <div className="card-header bg-white">
                      <h5 className="mb-0 fw-bold">
                        <i className="bi bi-tags me-2 text-primary"></i>
                        Eventos por Tipo
                      </h5>
                    </div>
                    <div className="card-body">
                      {eventosPorTipo.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Tipo</th>
                                <th className="text-center">Eventos</th>
                                <th className="text-center">Inscritos</th>
                                <th className="text-center">Asistentes</th>
                                <th className="text-center">Tasa Asistencia</th>
                              </tr>
                            </thead>
                            <tbody>
                              {eventosPorTipo.map((tipo, index) => (
                                <tr key={index}>
                                  <td>
                                    <span className="badge bg-light text-dark">
                                      {tipo.tipo.charAt(0).toUpperCase() + tipo.tipo.slice(1)}
                                    </span>
                                  </td>
                                  <td className="text-center fw-bold">{tipo.cantidad}</td>
                                  <td className="text-center">{tipo.inscritos}</td>
                                  <td className="text-center">{tipo.asistentes}</td>
                                  <td className="text-center">
                                    <span className="badge bg-success">
                                      {tipo.inscritos > 0 
                                        ? ((tipo.asistentes / tipo.inscritos) * 100).toFixed(1) 
                                        : 0}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted text-center">No hay datos disponibles</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ===== MODO: REPORTE INDIVIDUAL ===== */}
          {esReporteIndividual && estadisticasEvento && (
            <>
              {/* Estadísticas principales del evento */}
              <div className="row g-4 mb-4">
                <div className="col-md-3 col-sm-6">
                  <div className="stat-card card-total-eventos">
                    <div className="stat-icon">
                      <i className="bi bi-bullseye"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{estadisticasEvento.publicoObjetivo}</h3>
                      <p>Público Objetivo
                        <br /> 
                        Capacidad Máxima
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 col-sm-6">
                  <div className="stat-card card-inscritos">
                    <div className="stat-icon">
                      <i className="bi bi-person-plus"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{estadisticasEvento.totalInscritos}</h3>
                      <p>Inscritos</p>
                      <small className="text-muted">
                        {estadisticasEvento.porcentajeInscritosVsObjetivo}% del objetivo
                      </small>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 col-sm-6">
                  <div className="stat-card card-asistentes">
                    <div className="stat-icon">
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{estadisticasEvento.totalAsistentes}</h3>
                      <p>Asistentes</p>
                      <small className="text-muted">
                        {estadisticasEvento.porcentajeAsistentesVsInscritos}% de inscritos
                      </small>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 col-sm-6">
                  <div className="stat-card card-tasa">
                    <div className="stat-icon">
                      <i className="bi bi-qr-code"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{estadisticasEvento.asistentesPorQR}</h3>
                      <p>Por QR</p>
                      <small className="text-muted">
                        {estadisticasEvento.porcentajeQR}% del total
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráficas para evento individual */}
              <div className="row g-4 mb-4">
                {/* Gráfica: Inscripción vs Objetivo */}
                <div className="col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-white border-0 py-3">
                      <h6 className="mb-0 fw-bold">
                        <i className="bi bi-pie-chart me-2 text-primary"></i>
                        📊 Inscripción vs Público Objetivo
                      </h6>
                    </div>
                    <div className="card-body d-flex flex-column align-items-center justify-content-center">
                      {/* Gráfico de Tarta */}
                      <div style={{position: 'relative', width: '200px', height: '200px'}} className="mb-3">
                        <svg viewBox="0 0 200 200" style={{transform: 'rotate(-90deg)'}}>
                          {/* Círculo de fondo */}
                          <circle cx="100" cy="100" r="80" fill="#e9ecef" />
                          {/* Sector de inscritos */}
                          <circle 
                            cx="100" 
                            cy="100" 
                            r="80" 
                            fill="transparent"
                            stroke="#0d6efd"
                            strokeWidth="160"
                            strokeDasharray={`${(Math.min(estadisticasEvento.porcentajeInscritosVsObjetivo, 100) / 100) * 502.65} 502.65`}
                            style={{transition: 'stroke-dasharray 0.6s ease'}}
                          />
                          {/* Círculo blanco central */}
                          <circle cx="100" cy="100" r="60" fill="white" />
                        </svg>
                        {/* Porcentaje en el centro */}
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center'
                        }}>
                          <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#0d6efd'}}>
                            {estadisticasEvento.porcentajeInscritosVsObjetivo}%
                          </div>
                          <div style={{fontSize: '0.75rem', color: '#6c757d'}}>
                            Inscritos
                          </div>
                        </div>
                      </div>
                      
                      {/* Leyenda */}
                      <div className="w-100">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="fw-semibold">
                            <span style={{display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#0d6efd', borderRadius: '2px', marginRight: '8px'}}></span>
                            Inscritos
                          </span>
                          <strong>{estadisticasEvento.totalInscritos}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="fw-semibold">
                            <span style={{display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#e9ecef', borderRadius: '2px', marginRight: '8px'}}></span>
                            Faltantes
                          </span>
                          <strong>{Math.max(0, estadisticasEvento.publicoObjetivo - estadisticasEvento.totalInscritos)}</strong>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between">
                          <span className="fw-bold">Público Objetivo</span>
                          <strong>{estadisticasEvento.publicoObjetivo}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gráfica: Asistencia vs Inscritos */}
                <div className="col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-white border-0 py-3">
                      <h6 className="mb-0 fw-bold">
                        <i className="bi bi-pie-chart me-2 text-success"></i>
                        ✅ Asistencia vs Inscritos
                      </h6>
                    </div>
                    <div className="card-body d-flex flex-column align-items-center justify-content-center">
                      {/* Gráfico de Tarta */}
                      <div style={{position: 'relative', width: '200px', height: '200px'}} className="mb-3">
                        <svg viewBox="0 0 200 200" style={{transform: 'rotate(-90deg)'}}>
                          {/* Círculo de fondo */}
                          <circle cx="100" cy="100" r="80" fill="#e9ecef" />
                          {/* Sector de asistentes */}
                          <circle 
                            cx="100" 
                            cy="100" 
                            r="80" 
                            fill="transparent"
                            stroke="#198754"
                            strokeWidth="160"
                            strokeDasharray={`${(estadisticasEvento.porcentajeAsistentesVsInscritos / 100) * 502.65} 502.65`}
                            style={{transition: 'stroke-dasharray 0.6s ease'}}
                          />
                          {/* Círculo blanco central */}
                          <circle cx="100" cy="100" r="60" fill="white" />
                        </svg>
                        {/* Porcentaje en el centro */}
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center'
                        }}>
                          <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#198754'}}>
                            {estadisticasEvento.porcentajeAsistentesVsInscritos}%
                          </div>
                          <div style={{fontSize: '0.75rem', color: '#6c757d'}}>
                            Asistieron
                          </div>
                        </div>
                      </div>
                      
                      {/* Leyenda */}
                      <div className="w-100">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="fw-semibold">
                            <span style={{display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#198754', borderRadius: '2px', marginRight: '8px'}}></span>
                            Asistieron
                          </span>
                          <strong>{estadisticasEvento.totalAsistentes}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="fw-semibold">
                            <span style={{display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#e9ecef', borderRadius: '2px', marginRight: '8px'}}></span>
                            No Asistieron
                          </span>
                          <strong>{estadisticasEvento.noAsistieron}</strong>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between">
                          <span className="fw-bold">Total Inscritos</span>
                          <strong>{estadisticasEvento.totalInscritos}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Métodos de registro */}
              <div className="row g-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-0 py-3">
                      <h6 className="mb-0 fw-bold">
                        <i className="bi bi-clipboard-data me-2 text-info"></i>
                        📋 Métodos de Registro de Asistencia
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <i className="bi bi-qr-code fs-3 text-success me-3"></i>
                            <div className="flex-grow-1">
                              <h6 className="mb-0">Registro por QR</h6>
                              <small className="text-muted">{estadisticasEvento.asistentesPorQR} personas</small>
                            </div>
                            <span className="badge bg-success fs-6">{estadisticasEvento.porcentajeQR}%</span>
                          </div>
                          <div className="progress" style={{height: '10px'}}>
                            <div 
                              className="progress-bar bg-success" 
                              style={{width: `${estadisticasEvento.porcentajeQR}%`}}
                            ></div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <i className="bi bi-pencil-square fs-3 text-warning me-3"></i>
                            <div className="flex-grow-1">
                              <h6 className="mb-0">Registro Manual</h6>
                              <small className="text-muted">{estadisticasEvento.asistentesManual} personas</small>
                            </div>
                            <span className="badge bg-warning fs-6">{estadisticasEvento.porcentajeManual}%</span>
                          </div>
                          <div className="progress" style={{height: '10px'}}>
                            <div 
                              className="progress-bar bg-warning" 
                              style={{width: `${estadisticasEvento.porcentajeManual}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desglose por Día o Ponente */}
              {(estadisticasPorDia.length > 0 || estadisticasPorPonente.length > 0) && (
                <div className="row g-4">
                  <div className="col-12">
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white border-0 py-3">
                        <h6 className="mb-0 fw-bold">
                          <i className="bi bi-calendar-week me-2 text-primary"></i>
                          {estadisticasPorPonente.length > 0 ? '🎤 Desglose por Ponente' : '📅 Desglose por Día'}
                        </h6>
                      </div>
                      <div className="card-body">
                        {/* Tabla por Día */}
                        {estadisticasPorDia.length > 0 && (
                          <div className="table-responsive">
                            <table className="table table-hover">
                              <thead className="table-light">
                                <tr>
                                  <th>Fecha</th>
                                  <th className="text-center">Total Asistentes</th>
                                  <th className="text-center">Por QR</th>
                                  <th className="text-center">Manual</th>
                                  <th style={{width: '200px'}}>% QR</th>
                                </tr>
                              </thead>
                              <tbody>
                                {estadisticasPorDia.map((dia, index) => (
                                  <tr key={index}>
                                    <td className="fw-bold">{dia.fecha}</td>
                                    <td className="text-center">
                                      <span className="badge bg-primary">{dia.totalAsistentes}</span>
                                    </td>
                                    <td className="text-center text-success">{dia.asistentesPorQR}</td>
                                    <td className="text-center text-warning">{dia.asistentesManual}</td>
                                    <td>
                                      <div className="progress" style={{height: '25px'}}>
                                        <div 
                                          className="progress-bar bg-success" 
                                          role="progressbar" 
                                          style={{width: `${dia.porcentajeQR}%`}}
                                        >
                                          {dia.porcentajeQR}%
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Tabla por Ponente */}
                        {estadisticasPorPonente.length > 0 && (
                          <div className="table-responsive">
                            <table className="table table-hover">
                              <thead className="table-light">
                                <tr>
                                  <th>Ponente</th>
                                  <th>Tema</th>
                                  <th className="text-center">Fecha/Hora</th>
                                  <th className="text-center">Total Asistentes</th>
                                  <th className="text-center">Por QR</th>
                                  <th className="text-center">Manual</th>
                                  <th style={{width: '180px'}}>% QR</th>
                                </tr>
                              </thead>
                              <tbody>
                                {estadisticasPorPonente.map((ponente, index) => (
                                  <tr key={index}>
                                    <td className="fw-bold">{ponente.nombrePonente}</td>
                                    <td className="text-muted small">{ponente.temaPonente}</td>
                                    <td className="text-center small">
                                      {ponente.fechaDia}<br/>
                                      <span className="text-muted">{ponente.horaPonente}</span>
                                    </td>
                                    <td className="text-center">
                                      <span className="badge bg-primary">{ponente.totalAsistentes}</span>
                                    </td>
                                    <td className="text-center text-success">{ponente.asistentesPorQR}</td>
                                    <td className="text-center text-warning">{ponente.asistentesManual}</td>
                                    <td>
                                      <div className="progress" style={{height: '25px'}}>
                                        <div 
                                          className="progress-bar bg-success" 
                                          role="progressbar" 
                                          style={{width: `${ponente.porcentajeQR}%`}}
                                        >
                                          {ponente.porcentajeQR}%
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===== MODO: REPORTES GENERALES ===== */}
          {!esReporteIndividual && (
            <div className="row g-4">
              {/* Top Eventos por Asistencia */}
              <div className="col-lg-6">
                <div className="card shadow-sm">
                  <div className="card-header bg-white">
                    <h5 className="mb-0 fw-bold">
                      <i className="bi bi-trophy me-2 text-warning"></i>
                      Top 5 Eventos por Asistencia
                    </h5>
                  </div>
                  <div className="card-body">
                    {topEventosPorAsistencia.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {topEventosPorAsistencia.map((evento, index) => (
                          <div key={evento.id} className="list-group-item px-0">
                            <div className="d-flex align-items-center">
                              <div className="ranking-badge me-3">#{index + 1}</div>
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{evento.titulo}</h6>
                                <small className="text-muted">
                                  {evento.asistentes} asistentes de {evento.inscritos} inscritos
                                </small>
                              </div>
                              <div className="text-end">
                                <span className="badge bg-success fs-6">
                                  {evento.porcentaje}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted text-center">No hay eventos con asistencia registrada</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Eventos por Inscripciones */}
              <div className="col-lg-6">
                <div className="card shadow-sm">
                  <div className="card-header bg-white">
                    <h5 className="mb-0 fw-bold">
                      <i className="bi bi-people-fill me-2 text-primary"></i>
                      Top 5 Eventos por Inscripciones
                    </h5>
                  </div>
                  <div className="card-body">
                    {topEventosPorInscripciones.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {topEventosPorInscripciones.map((evento, index) => (
                          <div key={evento.id} className="list-group-item px-0">
                            <div className="d-flex align-items-center">
                              <div className="ranking-badge me-3">#{index + 1}</div>
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{evento.titulo}</h6>
                                <small className="text-muted">
                                  {evento.inscritos} de {evento.capacidad} cupos
                                </small>
                              </div>
                              <div className="text-end">
                                <span className="badge bg-primary fs-6">
                                  {evento.ocupacion}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted text-center">No hay eventos con inscripciones</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tasa de Conversión */}
              <div className="col-12">
                <div className="card shadow-sm">
                  <div className="card-header bg-white">
                    <h5 className="mb-0 fw-bold">
                      <i className="bi bi-arrow-left-right me-2 text-info"></i>
                      Tasa de Conversión (Inscripciones → Asistencia)
                    </h5>
                  </div>
                  <div className="card-body">
                    {tasaConversion.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Evento</th>
                              <th className="text-center">Inscritos</th>
                              <th className="text-center">Asistieron</th>
                              <th className="text-center">No Asistieron</th>
                              <th className="text-center">Tasa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tasaConversion.map((evento, index) => (
                              <tr key={index}>
                                <td>{evento.titulo}</td>
                                <td className="text-center">{evento.inscritos}</td>
                                <td className="text-center text-success fw-bold">{evento.asistieron}</td>
                                <td className="text-center text-danger">{evento.noAsistieron}</td>
                                <td className="text-center">
                                  <div className="progress" style={{height: '25px', minWidth: '80px'}}>
                                    <div 
                                      className="progress-bar bg-success" 
                                      style={{width: `${evento.tasa}%`}}
                                    >
                                      {evento.tasa}%
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted text-center">No hay datos de conversión disponibles</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Reportes;
