// Componente Footer reutilizable
import React from 'react';

const Footer = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-dark text-white py-4 mt-auto ${className}`}>
      <div className="container-fluid">
        <div className="row align-items-center">
          {/* Columna izquierda - Información del proyecto */}
          <div className="col-12 col-md-6 text-center text-md-start mb-3 mb-md-0">
            <div className="mb-2">
              <h6 className="fw-bold mb-1 text-primary">
                🎓 Gestión de Eventos UPAO
              </h6>
              <small className="text-light opacity-75">
                Plataforma académica universitaria
              </small>
            </div>
            <div className="d-flex flex-wrap justify-content-center justify-content-md-start gap-3 small">
              <span className="d-flex align-items-center">
                <i className="bi bi-geo-alt-fill me-1 text-primary"></i>
                📍 Trujillo, Perú
              </span>
              <span className="d-flex align-items-center">
                <i className="bi bi-calendar3 me-1 text-primary"></i>
                📅 {currentYear}
              </span>
            </div>
          </div>

          {/* Columna derecha - Información del desarrollador */}
          <div className="col-12 col-md-6 text-center text-md-end">
            <div className="mb-2">
              <small className="text-light opacity-75 d-block">
                Desarrollado por
              </small>
              <strong className="text-white">
                Brayan Castillo - Anderson Lopez
              </strong>
            </div>
            <div className="d-flex flex-wrap justify-content-center justify-content-md-end gap-3 small text-light opacity-75">
              <span className="d-flex align-items-center">
                Tesis de Pregrado
              </span>
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <hr className="my-3 opacity-25" />

        {/* Fila inferior - Copyright y enlaces */}
        <div className="row align-items-center">
          <div className="col-12 col-md-6 text-center text-md-start">
            <small className="text-light opacity-50">
              © {currentYear} BC156. 
              <span className="d-none d-sm-inline"> Todos los derechos reservados.</span>
            </small>
          </div>
          <div className="col-12 col-md-6 text-center text-md-end mt-2 mt-md-0">
            <div className="d-flex justify-content-center justify-content-md-end gap-3">
              <button 
                className="btn btn-link btn-sm text-light opacity-75 p-0"
                style={{ textDecoration: 'none' }}
                onClick={() => window.open('https://upao.edu.pe', '_blank')}
              >
                🌐 UPAO
              </button>
              <button 
                className="btn btn-link btn-sm text-light opacity-75 p-0"
                style={{ textDecoration: 'none' }}
                onClick={() => alert('Información sobre privacidad y términos de uso.')}
              >
                📋 Términos
              </button>
              <button 
                className="btn btn-link btn-sm text-light opacity-75 p-0"
                style={{ textDecoration: 'none' }}
                onClick={() => alert('Para soporte contactar a: soporte@upao.edu.pe')}
              >
                🛠️ Soporte
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
