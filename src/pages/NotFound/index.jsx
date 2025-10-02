import React from 'react';

const NotFound = () => {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <div className="mb-4">
          <h1 className="display-1 fw-bold text-primary">404</h1>
        </div>
        <h2 className="h4 mb-3 text-dark">Página no encontrada</h2>
        <p className="text-muted mb-4">
          La página que buscas no existe o ha sido movida.
        </p>
        <a href="/" className="btn btn-primary">
          Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default NotFound;