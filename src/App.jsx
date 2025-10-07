// Componente principal de la aplicación
import React from 'react';
import AppRouter from './routes/AppRouter';
import './styles/App.css';
import Footer from './components/layout/Footer';
import { useEventosMantenimiento } from './core/hooks';

function App() {
  // ✅ Activar mantenimiento automático de eventos
  // (auto-cierre de inscripciones y auto-eliminación de eventos pasados)
  useEventosMantenimiento();

  return (
    <>
      <main>
        <AppRouter />
      </main>
      <Footer />
    </>
  )
}

export default App;
