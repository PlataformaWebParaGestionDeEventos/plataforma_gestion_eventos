// Componente de navegación reutilizable
import React from 'react';

const Navbar = ({ 
  brand,
  items = [],
  userEmail,
  onLogout,
  variant = 'primary',
  className = ''
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary': return 'navbar-dark bg-primary';
      case 'success': return 'navbar-dark bg-success';
      case 'dark': return 'navbar-dark bg-dark';
      case 'light': return 'navbar-light bg-light';
      default: return 'navbar-dark bg-primary';
    }
  };

  const navbarClasses = [
    'navbar',
    'navbar-expand-lg',
    'shadow-sm',
    getVariantClass(),
    className
  ].filter(Boolean).join(' ');

  return (
    <nav className={navbarClasses}>
      <div className="container-fluid">
        {brand && (
          <span className="navbar-brand fs-5 fw-bold">
            {brand}
          </span>
        )}
        
        {/* Botón hamburguesa para móvil */}
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        {/* Menú colapsable */}
        <div className="collapse navbar-collapse" id="navbarNav">
          {items.length > 0 && (
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              {items.map((item, index) => (
                <li key={index} className="nav-item">
                  <button 
                    className={`nav-link btn btn-link text-white border-0 ${item.active ? 'active fw-bold' : ''}`}
                    onClick={item.onClick}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          {/* Usuario y logout */}
          {(userEmail || onLogout) && (
            <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center">
              {userEmail && (
                <span className="navbar-text text-light me-lg-3 mb-2 mb-lg-0 small">
                  {userEmail}
                </span>
              )}
              {onLogout && (
                <button 
                  className="btn btn-outline-light btn-sm" 
                  onClick={onLogout}
                >
                  Cerrar Sesión
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;