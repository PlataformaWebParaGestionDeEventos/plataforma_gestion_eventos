/**
 * useButtonDebounce.js
 * 
 * Hook personalizado para evitar múltiples clics en botones
 * Previene que se ejecuten acciones duplicadas al hacer clic rápido
 */

import { useState, useCallback, useRef } from 'react';

/**
 * Hook para manejar debounce en botones
 * @param {number} delay - Tiempo de espera en milisegundos (default: 5000ms)
 * @returns {Object} { isDisabled, handleClick }
 */
const useButtonDebounce = (delay = 2000) => {
  const [isDisabled, setIsDisabled] = useState(false);
  const timeoutRef = useRef(null);

  /**
   * Wrapper para funciones onClick
   * @param {Function} callback - Función a ejecutar
   * @returns {Function} Función wrapeada con debounce
   */
  const handleClick = useCallback((callback) => {
    return async (...args) => {
      if (isDisabled) return;

      setIsDisabled(true);

      try {
        // Ejecutar la función callback
        await callback(...args);
      } catch (error) {
        console.error('Error en handleClick:', error);
      } finally {
        // Reactivar el botón después del delay
        timeoutRef.current = setTimeout(() => {
          setIsDisabled(false);
        }, delay);
      }
    };
  }, [isDisabled, delay]);

  /**
   * Limpiar timeout al desmontar
   */
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { isDisabled, handleClick, cleanup };
};

export default useButtonDebounce;
