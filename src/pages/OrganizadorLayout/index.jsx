import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import appFirebase from '../../config/credenciales';
import { useAuth } from '../../core/hooks/useAuth';

const auth = getAuth(appFirebase);

const OrganizadorLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      {/* Navbar Responsive */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand fs-5 fw-bold">
            UPAO Eventos - Organizador
          </span>
          
          {/* Botón hamburguesa para móvil */}
          <button 
            className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav"
            aria-controls="navbarNav" 
            aria-expanded="false" 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          {/* Menú colapsable */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-white border-0 ${isActive('/organizador') && location.pathname === '/organizador' ? 'active fw-bold' : ''}`}
                  onClick={() => navigate('/organizador')}
                >
                  Inicio
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-white border-0 ${isActive('/organizador/eventos') ? 'active fw-bold' : ''}`}
                  onClick={() => navigate('/organizador/eventos')}
                >
                  Eventos
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-white border-0 ${isActive('/organizador/reportes') && !location.pathname.match(/\/reportes\/[^/]+$/) ? 'active fw-bold' : ''}`}
                  onClick={() => navigate('/organizador/reportes')}
                >
                  Reportes
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link text-white border-0 ${isActive('/organizador/perfil') ? 'active fw-bold' : ''}`}
                  onClick={() => navigate('/organizador/perfil')}
                >
                  <i className="bi bi-person-circle me-1"></i>
                  Mi Perfil
                </button>
              </li>
            </ul>
            
            {/* Usuario y logout */}
            <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center">
              <span className="navbar-text text-light me-lg-3 mb-2 mb-lg-0 small">
                {user?.email}
              </span>
              <button 
                className="btn btn-outline-light btn-sm" 
                onClick={() => signOut(auth)}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
};

export default OrganizadorLayout;
