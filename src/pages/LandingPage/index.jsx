import React from 'react';
import { useNavigate } from 'react-router-dom';
import loginVectorImage from '../../assets/fondo2Sistemas.jpg';
import FondoImage from '../../assets/fondo.jpg';
import toastHelper from '../../core/utils/toastHelper';


const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-vh-100 position-relative">
      {/* Fondo con overlay */}
      <div 
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          backgroundImage: `url(${FondoImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          zIndex: -2
        }}
      ></div>
      <div 
        className="position-absolute top-0 start-0 w-100 h-100 bg-primary"
        style={{
          opacity: 0.1,
          zIndex: -1
        }}
      ></div>

      <div className="container-fluid h-100">
        <div className="row min-vh-100">
          {/* Columna izquierda - Imagen */}
          <div className="col-lg-6 d-none d-lg-block p-0">
            <div
              className="h-100 position-relative d-flex align-items-center justify-content-center"
              style={{
                backgroundImage: `url(${loginVectorImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Overlay oscuro para mejor contraste */}
              <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark" style={{ opacity: 0.3 }}></div>
              
              {/* Contenido sobre la imagen */}
              <div className="position-relative text-white text-center p-5">
                <h2 className="display-4 fw-bold mb-4">
                  <span className="text-white d-block"
                  style={{ textShadow: '2px 2px 4px black' }}>Construye el</span>
                  <span className="text-white d-block"
                  style={{ textShadow: '2px 2px 4px black' }}>Futuro con la Tecnología</span>
                </h2>
                <p className="lead mb-0">
                  Potencia tu perfil profesional en Ingeniería de Sistemas e Inteligencia Artificial
                </p>
              </div>
            </div>
          </div>

          {/* Columna derecha - Contenido */}
          <div className="col-lg-6 d-flex align-items-center justify-content-center p-4">
            <div className="w-100" style={{ maxWidth: '500px' }}>
              
              {/* Header*/}
              <div className="text-center mb-5">
                <h1 className="display-5 fw-bold text-white mb-2" >Gestion de Eventos Académicos</h1>
              </div>

              {/* Contenido principal */}
              <div className="card border-0 shadow-lg rounded-4 mb-4">
                <div className="card-body p-5">
                  <h2 className="h3 fw-bold text-primary mb-4 text-center">
                    <i className="fas fa-rocket me-2"></i>
                    Impulsa tu Futuro Académico
                  </h2>
                  
                  <div className="row g-4 mb-4">
                    <div className="col-12">
                      <div className="d-flex align-items-start">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3 flex-shrink-0">
                          <i className="fas fa-calendar-check text-primary"></i>
                        </div>
                        <div>
                          <h5 className="fw-semibold mb-2">Eventos Académicos</h5>
                          <p className="text-muted mb-0 small">
                            Participa en charlas, congresos y talleres que fortalecen tu perfil académico y profesional.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-12">
                      <div className="d-flex align-items-start">
                        <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3 flex-shrink-0">
                          <i className="fas fa-certificate text-success"></i>
                        </div>
                        <div>
                          <h5 className="fw-semibold mb-2">Certificados Digitales</h5>
                          <p className="text-muted mb-0 small">
                            Obtén certificados verificables en blockchain que validen tu participación.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-12">
                      <div className="d-flex align-items-start">
                        <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3 flex-shrink-0">
                          <i className="fas fa-users text-info"></i>
                        </div>
                        <div>
                          <h5 className="fw-semibold mb-2">Networking</h5>
                          <p className="text-muted mb-0 small">
                            Conecta con profesionales, docentes y compañeros que comparten tus intereses.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones principales de acción */}
                  <div className="d-grid gap-3 mt-4">
                    <button 
                      className="btn btn-primary btn-lg rounded-pill fw-semibold py-3 position-relative"
                      onClick={() => navigate('/login')}
                      style={{ boxShadow: '0 4px 15px rgba(255, 255, 255, 0.856)' }}
                    >
                      <i className="fas fa-calendar-plus me-2"></i>
                      Participar
                    </button>
                    
                    <button 
                      className="btn btn-outline-info btn-lg rounded-pill fw-semibold py-3 position-relative"
                      onClick={() => toastHelper.info('Función en desarrollo - Próximamente podrás verificar certificados en blockchain')}
                      style={{ 
                        borderWidth: '2px',
                        background: 'linear-gradient(45deg, rgba(13, 202, 240, 0.1), rgba(13, 110, 253, 0.1))'
                      }}
                    >
                      <i className="fas fa-shield-alt me-2"></i>
                      Verificar Certificados
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;