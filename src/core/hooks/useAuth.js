// Hook personalizado para autenticación
import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);
      
      try {
        if (firebaseUser && firebaseUser.emailVerified) {
          // Obtener datos adicionales del usuario
          const result = await authService.obtenerDatosUsuario(firebaseUser.uid);
          
          if (result.success) {
            setUser(firebaseUser);
            setRole(result.userData.role);
          } else {
            // Si no existen datos en Firestore, crear perfil básico
            setUser(firebaseUser);
            setRole('alumno'); // rol por defecto
          }
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error('Error en useAuth:', error);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    return await authService.iniciarSesion(email, password);
  };

  const register = async (email, password, nombre, apellido, role) => {
    return await authService.registrarUsuario(email, password, nombre, apellido, role);
  };

  const logout = async () => {
    return await authService.cerrarSesion();
  };

  const resendVerification = async () => {
    return await authService.reenviarVerificacion();
  };

  return {
    user,
    role,
    loading,
    login,
    register,
    logout,
    resendVerification,
    isAuthenticated: !!user,
    isOrganizador: role === 'organizador',
    isAlumno: role === 'alumno'
  };
};

export default useAuth;