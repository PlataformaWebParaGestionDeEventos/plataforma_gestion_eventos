// Componente principal de la aplicación
import React from 'react';
import AppRouter from './routes/AppRouter';
import './styles/App.css';
import Footer from './components/layout/Footer'

function App() {
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
