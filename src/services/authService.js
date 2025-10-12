// Servicio de autenticación con Firebase Auth
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
  updatePassword,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../config/credenciales";
import appFirebase from "../config/credenciales";

const auth = getAuth(appFirebase);

export const authService = {
  // Registrar nuevo usuario
  async registrarUsuario(email, password, nombre, apellido, role = 'alumno') {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Enviar email de verificación
      await sendEmailVerification(user);

      // Guardar datos del usuario en Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email,
        role: role,
        fechaRegistro: new Date(),
        emailVerificado: false
      });

      return { 
        success: true, 
        user: user,
        message: "Usuario registrado. Revisa tu email para verificar tu cuenta." 
      };
    } catch (error) {
      let mensaje = "Error al registrar usuario";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          mensaje = "Este email ya está registrado";
          break;
        case 'auth/weak-password':
          mensaje = "La contraseña debe tener al menos 6 caracteres";
          break;
        case 'auth/invalid-email':
          mensaje = "Email inválido";
          break;
      }

      return { success: false, error: mensaje };
    }
  },

  // Iniciar sesión
  async iniciarSesion(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        return { 
          success: false, 
          error: "Debes verificar tu email antes de iniciar sesión" 
        };
      }

      return { success: true, user: user };
    } catch (error) {
      let mensaje = "Error al iniciar sesión";
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          mensaje = "Email o contraseña incorrectos";
          break;
        case 'auth/invalid-email':
          mensaje = "Email inválido";
          break;
        case 'auth/too-many-requests':
          mensaje = "Demasiados intentos. Intenta más tarde";
          break;
      }

      return { success: false, error: mensaje };
    }
  },

  // Cerrar sesión
  async cerrarSesion() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: "Error al cerrar sesión" };
    }
  },

  // Reenviar email de verificación
  async reenviarVerificacion() {
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        return { success: true, message: "Email de verificación enviado" };
      }
      return { success: false, error: "No hay usuario autenticado" };
    } catch (error) {
      return { success: false, error: "Error al enviar email de verificación" };
    }
  },

  // Obtener datos del usuario desde Firestore
  async obtenerDatosUsuario(uid) {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return { success: true, userData: userDoc.data() };
      }
      return { success: false, error: "Usuario no encontrado" };
    } catch (error) {
      return { success: false, error: "Error al obtener datos del usuario" };
    }
  },

  // Listener para cambios de autenticación
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    return auth.currentUser;
  }
};

export default authService;