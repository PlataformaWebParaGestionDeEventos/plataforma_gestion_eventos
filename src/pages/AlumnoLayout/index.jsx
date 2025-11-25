import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import appFirebase from '../../config/credenciales';
import { useAuth } from '../../core/hooks/useAuth';
import { useEventosAlumno } from '../../core/hooks/useEventosAlumno';

const auth = getAuth(appFirebase);

const AlumnoLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { eventosInscritos } = useEventosAlumno();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Navbar Compartido */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand fs-5 fw-bold">
            UPAO Eventos - Estudiante
          </span>
          
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
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link border-0 ${isActive('/alumno') ? 'text-white fw-bold' : 'text-white-50'}`}
                  onClick={() => navigate('/alumno')}
                >
                  Eventos Académicos
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link border-0 ${isActive('/alumno/mis-eventos') ? 'text-white fw-bold' : 'text-white-50'}`}
                  onClick={() => navigate('/alumno/mis-eventos')}
                >
                  Mis Inscripciones ({eventosInscritos.length})
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link border-0 ${isActive('/alumno/perfil') ? 'text-white fw-bold' : 'text-white-50'}`}
                  onClick={() => navigate('/alumno/perfil')}
                >
                  <i className="bi bi-person-circle me-1"></i>
                  Mi Perfil
                </button>
              </li>
            </ul>
            
            <div className="d-flex align-items-center">
              <span className="navbar-text text-light me-3 small">
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

      {/* Contenido principal - renderiza las páginas hijas */}
      <main className="flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AlumnoLayout;
