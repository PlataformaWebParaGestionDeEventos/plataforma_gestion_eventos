import React, { useState, useEffect } from 'react';
import { useParticipantes } from '../../core/hooks/useParticipantes';

const GestionParticipantes = ({ evento, onVolver }) => {
  const { 
    participantes, 
    estadisticas, 
    loading, 
    error, 
    cargarParticipantes, 
    marcarAsistencia, 
    exportarParticipantes 
  } = useParticipantes();
  
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (evento?.id) {
      cargarParticipantes(evento.id);
    }
  }, [evento?.id, cargarParticipantes]);

  const handleMarcarAsistencia = async (alumnoId) => {
    const result = await marcarAsistencia(evento.id, alumnoId);
    if (result.success) {
      setMensaje('Asistencia marcada exitosamente');
      setTimeout(() => setMensaje(''), 3000);
    } else {
      setMensaje(result.error || 'Error al marcar asistencia');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const handleExportarLista = () => {
    const result = exportarParticipantes(evento.titulo);
    if (result.success) {
      setMensaje('Lista exportada exitosamente');
    } else {
      setMensaje(result.error || 'Error al exportar la lista');
    }
    setTimeout(() => setMensaje(''), 3000);
  };

  // Filtrar participantes
  const participantesFiltrados = participantes.filter(participante => {
    const cumpleFiltro = filtro === 'todos' || 
      (filtro === 'asistio' && evento.asistentes?.includes(participante.id)) ||
      (filtro === 'no-asistio' && !evento.asistentes?.includes(participante.id));
    
    const cumpleBusqueda = participante.email.toLowerCase().includes(busqueda.toLowerCase());
    
    return cumpleFiltro && cumpleBusqueda;
  });

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <div className="spinner-border text-success mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Cargando participantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <button 
            className="btn btn-outline-success mb-3"
            onClick={onVolver}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver a mis eventos
          </button>
          
          <h2 className="fw-bold text-success mb-1">Gestión de Participantes</h2>
          <p className="text-muted mb-0">{evento.titulo}</p>
        </div>
      </div>

      {/* Mensaje de estado */}
      {mensaje && (
        <div className={`alert ${mensaje.includes('Error') ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`} role="alert">
          {mensaje}
          <button type="button" className="btn-close" onClick={() => setMensaje('')}></button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <h5 className="card-title text-success">{estadisticas.totalParticipantes}</h5>
              <p className="card-text text-muted mb-0">Total Inscritos</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <h5 className="card-title text-info">{estadisticas.espaciosDisponibles}</h5>
              <p className="card-text text-muted mb-0">Espacios Disponibles</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <h5 className="card-title text-primary">{estadisticas.capacidadMaxima}</h5>
              <p className="card-text text-muted mb-0">Capacidad Máxima</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <h5 className="card-title text-warning">{estadisticas.porcentajeOcupacion.toFixed(1)}%</h5>
              <p className="card-text text-muted mb-0">Ocupación</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="card-title">Ocupación del Evento</h6>
              <div className="progress mb-2" style={{ height: '10px' }}>
                <div 
                  className={`progress-bar ${estadisticas.porcentajeOcupacion > 80 ? 'bg-warning' : 'bg-success'}`}
                  role="progressbar" 
                  style={{ width: `${estadisticas.porcentajeOcupacion}%` }}
                ></div>
              </div>
              <small className="text-muted">
                {estadisticas.totalParticipantes} de {estadisticas.capacidadMaxima} participantes
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Filtrar por:</label>
                  <select 
                    className="form-select"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                  >
                    <option value="todos">Todos los participantes</option>
                    <option value="asistio">Solo asistieron</option>
                    <option value="no-asistio">No asistieron</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Buscar por email:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar participante..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button 
                    className="btn btn-outline-success w-100"
                    onClick={handleExportarLista}
                    disabled={participantes.length === 0}
                  >
                    <i className="bi bi-download me-2"></i>
                    Exportar Lista
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de participantes */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0 fw-bold text-dark">
                👥 Lista de Participantes ({participantesFiltrados.length})
              </h5>
            </div>
            <div className="card-body p-0">
              {participantesFiltrados.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-4">
                    <i className="bi bi-people display-1 text-muted"></i>
                  </div>
                  <h5 className="text-muted mb-3">
                    {participantes.length === 0 ? 'No hay participantes inscritos' : 'No hay participantes que coincidan con los filtros'}
                  </h5>
                  <p className="text-muted">
                    {participantes.length === 0 
                      ? 'Los participantes aparecerán aquí cuando se inscriban al evento.'
                      : 'Intenta cambiar los filtros de búsqueda.'
                    }
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Participante</th>
                        <th>Fecha de Inscripción</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participantesFiltrados.map(participante => {
                        const asistio = evento.asistentes?.includes(participante.id);
                        
                        return (
                          <tr key={participante.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="me-3">
                                  <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                    <i className="bi bi-person text-success"></i>
                                  </div>
                                </div>
                                <div>
                                  <div className="fw-semibold">{participante.email}</div>
                                  <small className="text-muted">ID: {participante.id}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                {new Date(participante.fechaInscripcion.toDate()).toLocaleDateString()}
                              </div>
                              <small className="text-muted">
                                {new Date(participante.fechaInscripcion.toDate()).toLocaleTimeString()}
                              </small>
                            </td>
                            <td>
                              <span className={`badge ${asistio ? 'bg-success' : 'bg-secondary'}`}>
                                {asistio ? '✅ Asistió' : '⏳ Inscrito'}
                              </span>
                            </td>
                            <td>
                              {!asistio && (
                                <button 
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => handleMarcarAsistencia(participante.id)}
                                >
                                  <i className="bi bi-check-circle me-1"></i>
                                  Marcar Asistencia
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionParticipantes;