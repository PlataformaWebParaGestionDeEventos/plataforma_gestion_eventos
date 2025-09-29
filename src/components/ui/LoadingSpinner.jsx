// Componente de spinner de carga reutilizable
import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary', 
  centered = false,
  text = '',
  className = '' 
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'spinner-border-sm';
      case 'lg': return '';
      case 'md': return '';
      default: return '';
    }
  };

  const getVariantClass = () => {
    return `text-${variant}`;
  };

  const spinnerClasses = [
    'spinner-border',
    getSizeClass(),
    getVariantClass(),
    className
  ].filter(Boolean).join(' ');

  const content = (
    <>
      <div className={spinnerClasses} role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
      {text && <p className="mt-2 mb-0 text-muted">{text}</p>}
    </>
  );

  if (centered) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;