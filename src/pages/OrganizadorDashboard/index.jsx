import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/hooks/useAuth';

const OrganizadorDashboard = ({ eventos }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="text-center text-md-start">
            <h1 className="h3 fw-bold text-primary mb-1">Inicio - Gestión de Eventos</h1>
            <p className="text-muted mb-0">Bienvenido, {user?.email}</p>
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
              <h3 className="text-info mb-0">
                {eventos.reduce((total, evento) => total + (evento.participantes?.length || 0), 0)}
              </h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Acciones Rápidas */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0 fw-bold">Acciones Rápidas</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-12 col-sm-6 col-lg-4">
                  <button 
                    className="btn btn-primary w-100 py-3" 
                    onClick={() => navigate('/organizador/eventos')}
                  >
                    <div className="fs-4 mb-1">➕</div>
                    <div className="fw-semibold">Crear Nuevo Evento</div>
                  </button>
                </div>
                <div className="col-12 col-sm-6 col-lg-4">
                  <button 
                    className="btn btn-outline-primary w-100 py-3" 
                    onClick={() => navigate('/organizador/eventos')}
                  >
                    <div className="fs-4 mb-1">📋</div>
                    <div className="fw-semibold">Ver Mis Eventos</div>
                  </button>
                </div>
                <div className="col-12 col-sm-6 col-lg-4">
                  <button 
                    className="btn btn-outline-primary w-100 py-3" 
                    onClick={() => navigate('/organizador/reportes')}
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
  );
};

export default OrganizadorDashboard;
