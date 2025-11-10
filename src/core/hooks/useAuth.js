/**
 * @fileoverview Hook personalizado para gestión de autenticación
 * @module core/hooks/useAuth
 * @description Hook React para manejar autenticación, roles y estado del usuario
 */

import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';

/**
 * Hook personalizado para autenticación de usuarios
 * Provee acceso al estado de autenticación, datos del usuario y funciones de auth
 * @function useAuth
 * @returns {Object} Objeto con estado y funciones de autenticación
 * @returns {Object|null} return.user - Usuario de Firebase Auth (null si no autenticado)
 * @returns {Object|null} return.userData - Datos adicionales del usuario desde Firestore
 * @returns {string|null} return.role - Rol del usuario ('alumno'|'organizador'|null)
 * @returns {boolean} return.loading - Estado de carga durante verificación de auth
 * @returns {Function} return.login - Función para iniciar sesión
 * @returns {Function} return.register - Función para registrar nuevo usuario
 * @returns {Function} return.logout - Función para cerrar sesión
 * @returns {Function} return.resendVerification - Función para reenviar email de verificación
 * @returns {boolean} return.isAuthenticated - True si el usuario está autenticado
 * @returns {boolean} return.isOrganizador - True si el rol es 'organizador'
 * @returns {boolean} return.isAlumno - True si el rol es 'alumno'
 * @example
 * function MyComponent() {
 *   const { user, role, loading, login, logout } = useAuth();
 *   
 *   if (loading) return <LoadingSpinner />;
 *   
 *   return (
 *     <div>
 *       {user ? (
 *         <>
 *           <p>Bienvenido {user.email} - Rol: {role}</p>
 *           <button onClick={logout}>Cerrar Sesión</button>
 *         </>
 *       ) : (
 *         <button onClick={() => login('email@upao.edu.pe', 'password')}>Iniciar Sesión</button>
 *       )}
 *     </div>
 *   );
 * }
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
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
            setUserData(result.userData);
            setRole(result.userData.role);
          } else {
            // Si no existen datos en Firestore, crear perfil básico
            setUser(firebaseUser);
            setUserData(null);
            setRole('alumno'); // rol por defecto
          }
        } else {
          setUser(null);
          setUserData(null);
          setRole(null);
        }
      } catch (error) {
        console.error('Error en useAuth:', error);
        setUser(null);
        setUserData(null);
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
    userData,
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