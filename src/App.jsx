//* eslint-disable no-unused-vars */
import { useState, useEffect} from 'react'
//import modulos de firebase
import appFirebase, { db } from './credenciales'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { setDoc, doc, getDoc } from 'firebase/firestore'

const auth = getAuth(appFirebase)

//import componentes
import Login from './components/Login'
import HomeOrganizador from "./components/HomeOrganizador";
import Home from './components/HomeAlumno' // Este será el "HomeAlumno"

import './App.css'

function App() {

  const [usuario, setUsuario] = useState(null)
  const [rol, setRole] = useState(null)
  const [cargandoAuth, setCargandoAuth] = useState(true)

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
          await signOut(auth)
          setUsuario(null)
          setRole(null)
          console.log("Usuario no verificado, sesión cerrada")
        } else {
          // No hay usuario autenticado
          setUsuario(null)
          setRole(null)
        }
      } catch (error) {
        console.error("Error en autenticación:", error);
        setUsuario(null)
        setRole(null)
      } finally {
        setCargandoAuth(false)
      }
    });
    return () => unsub();
  }, [])

  return (
    <>
      <div>
        {cargandoAuth ? (
          // Pantalla de carga mientras verifica autenticación
          <div className="d-flex justify-content-center align-items-center" style={{minHeight: '100vh'}}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-3">Verificando autenticación...</p>
            </div>
          </div>
        ) : 
          // Contenido principal
          usuario ? (
            rol === "organizador" ? <HomeOrganizador /> : <Home correoUsuario={usuario.email} />
          ) : (
            <Login />
        )}
      </div>
    </>
  )
}

export default App
