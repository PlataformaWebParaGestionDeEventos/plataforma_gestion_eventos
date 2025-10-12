import React, { useState } from 'react';
import { useParticipantes } from '../../core/hooks/useParticipantes';
import firestoreService from '../../services/firestoreService';
import toastHelper from '../../core/utils/toastHelper';
import logger from '../../core/utils/logger';

const GestionParticipantes = ({ evento, onVolver, onIrAGestionAsistencia }) => {
  const { 
    participantes, 
    estadisticas, 
    loading, 
    error, 
    refetch
  } = useParticipantes(evento?.id); // Ahora pasamos el eventoId directamente
  
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [eliminandoParticipante, setEliminandoParticipante] = useState(null);

  /**
   * Eliminar participante del evento
   */
  const handleEliminarParticipante = async (participante) => {
    // Confirmar acción
    const confirmacion = await toastHelper.confirm(
      `¿Eliminar participante?\n\n` +
      `📧 ${participante.email}\n` +
      `👤 ${participante.nombre || 'Sin nombre'}\n\n` +
      `Esta acción:\n` +
      `❌ Eliminará al participante de la lista\n` +
      `❌ Eliminará su asistencia si fue marcada\n` +
      `❌ Liberará un espacio en el evento\n\n` +
      `⚠️ Esta acción NO se puede deshacer.\n\n` +
      `¿Continuar?`
    );

    if (!confirmacion) return;

    setEliminandoParticipante(participante.id);
    toastHelper.info('🔄 Eliminando participante...');
    
    try {
      logger.log(`🗑️ Eliminando participante: ${participante.email}`);
      
      const result = await firestoreService.eliminarParticipante(evento.id, participante.id);
      
      if (result.success) {
        toastHelper.success(`✅ Participante ${participante.email} eliminado correctamente`);
        logger.log('✅ Participante eliminado:', participante.id);
        
        // Recargar lista de participantes
        await refetch();
        
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
      
    } catch (error) {
      logger.error('❌ Error eliminando participante:', error);
      toastHelper.error(`Error al eliminar participante: ${error.message}`);
    } finally {
      setEliminandoParticipante(null);
    }
  };

  // Filtrar participantes
  const participantesFiltrados = participantes.filter(participante => {
    // Filtro por estado de asistencia (usar campo asistio del sistema nuevo)
    const cumpleFiltro = filtro === 'todos' || 
      (filtro === 'asistio' && participante.asistio) ||
      (filtro === 'no-asistio' && !participante.asistio);
    
    // Búsqueda por nombre o email
    const busquedaLower = busqueda.toLowerCase();
    const cumpleBusqueda = 
      participante.email.toLowerCase().includes(busquedaLower) ||
      (participante.nombre && participante.nombre.toLowerCase().includes(busquedaLower));
    
    return cumpleFiltro && cumpleBusqueda;
  });

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
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
            className="btn btn-outline-primary-custom mb-3"
            onClick={onVolver}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          
          <h2 className="fw-bold text-primary mb-1">Gestión de Participantes</h2>
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
              <h5 className="card-title text-primary">{estadisticas.totalParticipantes}</h5>
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
                  className={`progress-bar ${estadisticas.porcentajeOcupacion > 80 ? 'bg-warning' : 'bg-primary'}`}
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

      {/* Botón prominente para ir a Gestión de Asistencia */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="alert alert-info-custom d-flex align-items-center" role="alert">
            <i className="bi bi-info-circle-fill me-3 fs-3 text-primary"></i>
            <div className="flex-grow-1">
              <h6 className="alert-heading mb-1 fw-bold">📋 Registro de Asistencia</h6>
              <p className="mb-0">
                Para marcar asistencia de participantes, usa la página de <strong>Gestión de Asistencia.</strong> 
              </p>
            </div>
            <button 
              className="btn btn-primary-custom ms-3"
              onClick={onIrAGestionAsistencia}
            >
              <i className="bi bi-qr-code-scan me-2"></i>
              Gestión de Asistencia
            </button>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
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
                <div className="col-md-3">
                  <label className="form-label">Buscar:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por nombre o email..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button 
                    className="btn btn-outline-secondary w-100"
                    onClick={() => {
                      setFiltro('todos');
                      setBusqueda('');
                    }}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Limpiar Filtros
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
                        // Usar el campo asistio del sistema nuevo (GestionAsistencia)
                        const asistio = participante.asistio || false;
                        // Verificar si hay información de asistencia QR
                        
                        return (
                          <tr key={participante.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="me-3">
                                  <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                    <i className="bi bi-person text-primary"></i>
                                  </div>
                                </div>
                                <div>
                                  <div className="fw-semibold">
                                    {participante.nombre && participante.apellido 
                                      ? `${participante.nombre} ${participante.apellido}`
                                      : participante.nombre || 'Estudiante'}
                                  </div>
                                  <small className="text-muted">{participante.email}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                {(() => {
                                  try {
                                    const fecha = participante.fechaInscripcion?.toDate 
                                      ? participante.fechaInscripcion.toDate() 
                                      : new Date(participante.fechaInscripcion);
                                    return fecha.toLocaleDateString('es-PE');
                                  } catch {
                                    return 'Fecha no disponible';
                                  }
                                })()}
                              </div>
                              <small className="text-muted">
                                {(() => {
                                  try {
                                    const fecha = participante.fechaInscripcion?.toDate 
                                      ? participante.fechaInscripcion.toDate() 
                                      : new Date(participante.fechaInscripcion);
                                    return fecha.toLocaleTimeString('es-PE', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    });
                                  } catch {
                                    return '';
                                  }
                                })()}
                              </small>
                            </td>
                            <td>
                              <div className="d-flex flex-column gap-1">
                                <span className={`badge ${asistio ? 'badge-success-custom' : 'badge-primary-custom'} px-3 py-2`} style={{ minWidth: '100px', width: 'fit-content' }}>
                                  {asistio ? '✅ Asistió' : '📝 Inscrito'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleEliminarParticipante(participante)}
                                disabled={eliminandoParticipante === participante.id}
                                title="Eliminar participante del evento"
                              >
                                {eliminandoParticipante === participante.id ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Eliminando...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-trash me-1"></i>
                                    Eliminar
                                  </>
                                )}
                              </button>
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