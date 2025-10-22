// Router principal con React Router DOM
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../core/hooks/useAuth';

// Importar páginas
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import HomeAlumno from '../pages/HomeAlumno';
import HomeOrganizador from '../pages/HomeOrganizador';
import DetalleEvento from '../pages/DetalleEvento';
import MisEventos from '../pages/MisEventos';
import GestionAsistencia from '../pages/GestionAsistencia';
import GestionParticipantesPage from '../pages/GestionParticipantes';
import Reportes from '../pages/Reportes';
import NotFound from '../pages/NotFound';
import OrganizadorLayout from '../pages/OrganizadorLayout';
import OrganizadorDashboard from '../pages/OrganizadorDashboard';
import AlumnoLayout from '../pages/AlumnoLayout';
import Perfil from '../pages/Perfil';

// Componente de carga
const LoadingScreen = () => (
  <div className="d-flex justify-content-center align-items-center" style={{minHeight: '100vh'}}>
    <div className="text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
      <p className="mt-3">Verificando autenticación...</p>
    </div>
  </div>
);

// Componente de ruta protegida
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Componente de ruta pública (solo para no autenticados)
const PublicRoute = ({ children }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    // Redirigir a home según rol
    return <Navigate to={role === 'organizador' ? '/organizador' : '/alumno'} replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== RUTAS PÚBLICAS ===== */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login modoInicial="login" />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/registro" 
          element={
            <PublicRoute>
              <Login modoInicial="register" />
            </PublicRoute>
          } 
        />

        {/* ===== RUTAS PROTEGIDAS - ALUMNO ===== */}
        <Route 
          path="/alumno" 
          element={
            <ProtectedRoute allowedRoles={['alumno']}>
              <AlumnoLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard de Eventos */}
          <Route index element={<HomeAlumno />} />
          
          {/* Mis Inscripciones */}
          <Route path="mis-eventos" element={<MisEventos />} />
          
          {/* Perfil */}
          <Route path="perfil" element={<Perfil />} />
          
          {/* Detalle de Evento */}
          <Route path="evento/:eventoId" element={<DetalleEvento />} />
        </Route>

        {/* ===== RUTAS PROTEGIDAS - ORGANIZADOR ===== */}
        <Route 
          path="/organizador" 
          element={
            <ProtectedRoute allowedRoles={['organizador']}>
              <OrganizadorLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard (Inicio) */}
          <Route index element={<HomeOrganizador />} />
          
          {/* Eventos (Lista y gestión) */}
          <Route path="eventos" element={<HomeOrganizador />} />
          
          {/* Reportes Generales */}
          <Route path="reportes" element={<Reportes />} />
          
          {/* Reporte Individual de un Evento */}
          <Route path="reportes/:eventoId" element={<Reportes />} />
          
          {/* Detalle de Evento */}
          <Route path="evento/:eventoId" element={<DetalleEvento />} />
          
          {/* Gestión de Asistencia */}
          <Route path="asistencia/:eventoId" element={<GestionAsistencia />} />
          
          {/* Gestión de Participantes */}
          <Route path="participantes/:eventoId" element={<GestionParticipantesPage />} />
          
          {/* Perfil de Usuario */}
          <Route path="perfil" element={<Perfil />} />
        </Route>

        {/* ===== RUTA 404 ===== */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;