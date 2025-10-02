// Router principal de la aplicación
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/credenciales';
import appFirebase from '../config/credenciales';

// Importar páginas
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import HomeAlumno from '../pages/HomeAlumno';
import HomeOrganizador from '../pages/HomeOrganizador';

const auth = getAuth(appFirebase);

const AppRouter = () => {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRole] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [mostrarLanding, setMostrarLanding] = useState(true);
  const [modoLogin, setModoLogin] = useState('login'); // 'login' o 'register'

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usuarioFirebase) => {
      try {
        if (usuarioFirebase && usuarioFirebase.emailVerified) {
          const ref = doc(db, "users", usuarioFirebase.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            const data = snap.data();
            // Solo permitir acceso si el email está verificado
            setUsuario(usuarioFirebase);
            setRole(data.role); // Establecer el rol del usuario
          }
          else {
            // Si no existe el documento, lo creamos como alumno
            await setDoc(ref, {
              uid: usuarioFirebase.uid,
              email: usuarioFirebase.email,
              role: "alumno", // Por defecto, asignar rol de alumno
              fechaRegistro: new Date(),
              emailVerificado: true
            });
            setUsuario(usuarioFirebase);
            setRole("alumno");
          }
        } else if (usuarioFirebase && !usuarioFirebase.emailVerified) {
          // Si el usuario existe pero no tiene email verificado, cerrar sesión
          await signOut(auth);
          setUsuario(null);
          setRole(null);
          console.log("Usuario no verificado, sesión cerrada");
        } else {
          // No hay usuario autenticado
          setUsuario(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Error en autenticación:", error);
        setUsuario(null);
        setRole(null);
      } finally {
        setCargandoAuth(false);
      }
    });
    return () => unsub();
  }, []);

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

  if (cargandoAuth) {
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
  if (usuario) {
    return rol === "organizador" ? 
      <HomeOrganizador correoUsuario={usuario.email} /> : 
      <HomeAlumno correoUsuario={usuario.email} />;
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