// Componente principal de la aplicación
import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRouter from './routes/AppRouter';
import './styles/App.css';
import Footer from './components/layout/Footer';
import { useEventosMantenimiento } from './core/hooks';

function App() {
  // ✅ Activar mantenimiento automático de eventos
  // (auto-cierre de inscripciones cuando llega el día del evento)
  useEventosMantenimiento();

  return (
    <>
      <main>
        <AppRouter />
      </main>
      <Footer />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  )
}

export default App;
