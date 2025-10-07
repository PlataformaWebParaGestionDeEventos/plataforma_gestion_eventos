import React, { useState } from 'react';
import { useReportes } from '../../core/hooks';
import './Reportes.css';

const Reportes = ({ correoOrganizador }) => {
  const {
    cargando,
    error,
    estadisticasGenerales,
    eventosPorTipo,
    eventosPorMes,
    topEventosPorAsistencia,
    topEventosPorInscripciones,
    tasaConversion,
    estadoInscripciones
  } = useReportes(correoOrganizador);

  const [vistaActiva, setVistaActiva] = useState('general');

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
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold text-primary mb-1">
              <i className="bi bi-bar-chart-fill me-2"></i>
              Dashboard de Reportes
            </h2>
            <p className="text-muted mb-0">Análisis y estadísticas de tus eventos</p>
          </div>
          <button className="btn btn-outline-primary">
            <i className="bi bi-download me-2"></i>
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${vistaActiva === 'general' ? 'active' : ''}`}
            onClick={() => setVistaActiva('general')}
          >
            <i className="bi bi-pie-chart me-2"></i>
            General
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${vistaActiva === 'asistencia' ? 'active' : ''}`}
            onClick={() => setVistaActiva('asistencia')}
          >
            <i className="bi bi-people me-2"></i>
            Asistencia
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${vistaActiva === 'tendencias' ? 'active' : ''}`}
            onClick={() => setVistaActiva('tendencias')}
          >
            <i className="bi bi-graph-up me-2"></i>
            Tendencias
          </button>
        </li>
      </ul>

      {/* Vista General */}
      {vistaActiva === 'general' && (
        <div className="vista-general">
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

          {/* Eventos por estado */}
          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <div className="card shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0 fw-bold">
                    <i className="bi bi-clipboard-check me-2 text-primary"></i>
                    Eventos por Estado
                  </h5>
                </div>
                <div className="card-body">
                  <div className="estado-item">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-success">Publicados</span>
                      <span className="fw-bold">{estadisticasGenerales.eventosPublicados}</span>
                    </div>
                    <div className="progress" style={{height: '10px'}}>
                      <div 
                        className="progress-bar bg-success" 
                        style={{
                          width: `${(estadisticasGenerales.eventosPublicados / estadisticasGenerales.totalEventos * 100) || 0}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="estado-item mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-warning">Borradores</span>
                      <span className="fw-bold">{estadisticasGenerales.eventosBorrador}</span>
                    </div>
                    <div className="progress" style={{height: '10px'}}>
                      <div 
                        className="progress-bar bg-warning" 
                        style={{
                          width: `${(estadisticasGenerales.eventosBorrador / estadisticasGenerales.totalEventos * 100) || 0}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="estado-item mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-danger">Cancelados</span>
                      <span className="fw-bold">{estadisticasGenerales.eventosCancelados}</span>
                    </div>
                    <div className="progress" style={{height: '10px'}}>
                      <div 
                        className="progress-bar bg-danger" 
                        style={{
                          width: `${(estadisticasGenerales.eventosCancelados / estadisticasGenerales.totalEventos * 100) || 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0 fw-bold">
                    <i className="bi bi-door-open me-2 text-primary"></i>
                    Estado de Inscripciones
                  </h5>
                </div>
                <div className="card-body">
                  <div className="estado-item">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-primary">Abiertas</span>
                      <span className="fw-bold">{estadoInscripciones.abiertas}</span>
                    </div>
                    <div className="progress" style={{height: '10px'}}>
                      <div 
                        className="progress-bar bg-primary" 
                        style={{
                          width: `${(estadoInscripciones.abiertas / estadoInscripciones.total * 100) || 0}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="estado-item mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-info">Cerradas</span>
                      <span className="fw-bold">{estadoInscripciones.cerradas}</span>
                    </div>
                    <div className="progress" style={{height: '10px'}}>
                      <div 
                        className="progress-bar bg-info" 
                        style={{
                          width: `${(estadoInscripciones.cerradas / estadoInscripciones.total * 100) || 0}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="estado-item mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-secondary">Completas</span>
                      <span className="fw-bold">{estadoInscripciones.completas}</span>
                    </div>
                    <div className="progress" style={{height: '10px'}}>
                      <div 
                        className="progress-bar bg-secondary" 
                        style={{
                          width: `${(estadoInscripciones.completas / estadoInscripciones.total * 100) || 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Eventos por tipo */}
          <div className="row g-4">
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
        </div>
      )}

      {/* Vista de Asistencia */}
      {vistaActiva === 'asistencia' && (
        <div className="vista-asistencia">
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
        </div>
      )}

      {/* Vista de Tendencias */}
      {vistaActiva === 'tendencias' && (
        <div className="vista-tendencias">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-graph-up-arrow me-2 text-success"></i>
                Eventos por Mes
              </h5>
            </div>
            <div className="card-body">
              {eventosPorMes.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Mes</th>
                        <th className="text-center">Eventos</th>
                        <th className="text-center">Inscritos</th>
                        <th className="text-center">Asistentes</th>
                        <th>Visualización</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventosPorMes.map((mes, index) => (
                        <tr key={index}>
                          <td className="fw-bold">{mes.mes}</td>
                          <td className="text-center">{mes.eventos}</td>
                          <td className="text-center">{mes.inscritos}</td>
                          <td className="text-center">{mes.asistentes}</td>
                          <td>
                            <div className="progress" style={{height: '20px'}}>
                              <div 
                                className="progress-bar bg-primary" 
                                style={{width: `${(mes.eventos / Math.max(...eventosPorMes.map(m => m.eventos)) * 100)}%`}}
                                title={`${mes.eventos} eventos`}
                              >
                                {mes.eventos > 0 && mes.eventos}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center">No hay datos de tendencias disponibles</p>
              )}
            </div>
          </div>

          {/* Métricas adicionales */}
          <div className="row g-4 mt-4">
            <div className="col-md-4">
              <div className="card shadow-sm text-center">
                <div className="card-body">
                  <i className="bi bi-trophy-fill text-warning fs-1"></i>
                  <h3 className="mt-3">{estadisticasGenerales.promedioOcupacion}%</h3>
                  <p className="text-muted">Promedio de Ocupación</p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm text-center">
                <div className="card-body">
                  <i className="bi bi-calendar-check text-success fs-1"></i>
                  <h3 className="mt-3">{estadisticasGenerales.eventosPublicados}</h3>
                  <p className="text-muted">Eventos Publicados</p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm text-center">
                <div className="card-body">
                  <i className="bi bi-people text-primary fs-1"></i>
                  <h3 className="mt-3">
                    {estadisticasGenerales.totalEventos > 0 
                      ? Math.round(estadisticasGenerales.totalInscritos / estadisticasGenerales.totalEventos)
                      : 0}
                  </h3>
                  <p className="text-muted">Promedio Inscritos/Evento</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes;
