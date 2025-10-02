// Router principal de la aplicación
import React, { useState } from 'react';
import { useAuth } from '../core/hooks/useAuth';

// Importar páginas
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import HomeAlumno from '../pages/HomeAlumno';
import HomeOrganizador from '../pages/HomeOrganizador';

const AppRouter = () => {
  const [mostrarLanding, setMostrarLanding] = useState(true);
  const [modoLogin, setModoLogin] = useState('login'); // 'login' o 'register'
  const { user, role, loading } = useAuth();

  // Funciones para manejar la navegación entre landing y login
  const handleIniciarSesion = () => {
    setModoLogin('login');
    setMostrarLanding(false);
  };

  const handleCrearCuenta = () => {
    setModoLogin('register');
    setMostrarLanding(false);
  };

  const handleVolverLanding = () => {
    setMostrarLanding(true);
  };

  if (loading) {
    // Pantalla de carga mientras verifica autenticación
    return (
      <div className="d-flex justify-content-center align-items-center" style={{minHeight: '100vh'}}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Usuario autenticado - mostrar home según rol
  if (user) {
    return role === "organizador" ? 
      <HomeOrganizador correoUsuario={user.email} /> : 
      <HomeAlumno correoUsuario={user.email} />;
  }

  // Usuario no autenticado - mostrar landing o login
  return mostrarLanding ? (
    <LandingPage 
      onIniciarSesion={handleIniciarSesion}
      onCrearCuenta={handleCrearCuenta}
    />
  ) : (
    <Login 
      modoInicial={modoLogin}
      onVolverLanding={handleVolverLanding}
    />
  );
};

export default AppRouter;