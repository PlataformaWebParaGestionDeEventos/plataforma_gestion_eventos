/**
 * @fileoverview Router principal de la aplicación
 * @module routes/AppRouter
 * @description Configuración de rutas con Route Guards y layouts por role
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ✅ Importar Route Guards
import { ProtectedRoute, RoleBasedRoute, PublicRoute } from './ProtectedRoute';
import { USER_ROLES } from '../config/constants';

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
import AlumnoLayout from '../pages/AlumnoLayout';
import Perfil from '../pages/Perfil';
import VerificarCertificado from '../pages/VerificarCertificado';

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
        
        <Route 
          path="/verificar-certificado" 
          element={
            <PublicRoute>
              <VerificarCertificado />
            </PublicRoute>
          } 
        />

        {/* ===== RUTAS PROTEGIDAS - ALUMNO ===== */}
        <Route 
          path="/alumno" 
          element={
            <RoleBasedRoute allowedRoles={[USER_ROLES.ALUMNO]}>
              <AlumnoLayout />
            </RoleBasedRoute>
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
            <RoleBasedRoute allowedRoles={[USER_ROLES.ORGANIZADOR]}>
              <OrganizadorLayout />
            </RoleBasedRoute>
          }
        >
          {/* Dashboard (Inicio) */}
          <Route index element={<HomeOrganizador />} />
          
          {/* Eventos (Lista y gestión) */}
          <Route path="eventos" element={<HomeOrganizador />} />
          
          {/* Reportes Generales */}
          <Route path="reportes" element={<Reportes />} />
          
          {/* Reporte Individual de un Evento - Vista dedicada */}
          <Route path="reporte-evento/:eventoId" element={<Reportes modo="evento-individual" />} />
          
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