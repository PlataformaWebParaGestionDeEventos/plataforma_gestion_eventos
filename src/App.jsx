//* eslint-disable no-unused-vars */
import { useState } from 'react'
//import modulos de firebase
import appFirebase from './credenciales'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const auth = getAuth(appFirebase)

//import componentes
import Login from './components/Login'
import Home from './components/Home'

import './App.css'

function App() {

  const [usuario, setUsuario] = useState(null)
  onAuthStateChanged(auth, (usuarioFirebase) => {
    if (usuarioFirebase) {
      //console.log('Existe usuario')
      setUsuario(usuarioFirebase)
    } else {
      //console.log('No existe usuario')
      setUsuario(null)
    }
  })

  return (
    <>
      <div>
        {usuario ? <Home correoUsuario={usuario.email} /> : <Login />}
      </div>
    </>
  )
}

export default App
