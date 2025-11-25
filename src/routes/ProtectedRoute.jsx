/**
 * @fileoverview Componentes de protección de rutas
 * @module routes/ProtectedRoute
 * @description Route Guards para proteger rutas por autenticación y role
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../core/hooks/useAuth';
import { USER_ROLES } from '../config/constants';

/**
 * Componente de loading mientras se verifica autenticación
 */
const LoadingScreen = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
    <div className="text-center">
      <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Cargando...</span>
      </div>
      <p className="text-muted">Verificando autenticación...</p>
    </div>
  </div>
);

/**
 * ProtectedRoute - Protege rutas que requieren autenticación
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componente hijo a renderizar si está autenticado
 * @returns {React.ReactElement} Componente protegido o redirect
 */
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    // No autenticado → redirigir a login
    return <Navigate to="/login" replace />;
  }

  // Autenticado → renderizar children
  return children;
};

/**
 * RoleBasedRoute - Protege rutas que requieren un role específico
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componente hijo a renderizar
 * @param {Array<string>} props.allowedRoles - Roles permitidos para acceder
 * @returns {React.ReactElement} Componente protegido o redirect
 */
export const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    // No autenticado → redirigir a login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Role no autorizado → redirigir al dashboard correspondiente
    return <Navigate 
      to={role === USER_ROLES.ORGANIZADOR ? '/organizador' : '/alumno'} 
      replace 
    />;
  }

  // Autenticado y autorizado → renderizar children
  return children;
};

/**
 * PublicRoute - Rutas públicas que redirigen si ya está autenticado
 * (ejemplo: login, si ya está autenticado → dashboard)
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componente hijo a renderizar
 * @returns {React.ReactElement} Componente público o redirect
 */
export const PublicRoute = ({ children }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    // Ya autenticado → redirigir a dashboard según role
    return <Navigate 
      to={role === USER_ROLES.ORGANIZADOR ? '/organizador' : '/alumno'} 
      replace 
    />;
  }

  // No autenticado → mostrar ruta pública
  return children;
};

export default {
  ProtectedRoute,
  RoleBasedRoute,
  PublicRoute
};
