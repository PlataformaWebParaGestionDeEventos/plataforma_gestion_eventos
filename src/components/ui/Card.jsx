// Componente de Card reutilizable
import React from 'react';

const Card = ({ 
  children,
  title,
  subtitle,
  header,
  footer,
  className = '',
  bodyClassName = '',
  ...props 
}) => {
  const cardClasses = ['card', className].filter(Boolean).join(' ');
  const bodyClasses = ['card-body', bodyClassName].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {header && <div className="card-header">{header}</div>}
      
      <div className={bodyClasses}>
        {title && <h5 className="card-title">{title}</h5>}
        {subtitle && <h6 className="card-subtitle mb-2 text-muted">{subtitle}</h6>}
        {children}
      </div>
      
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export default Card;