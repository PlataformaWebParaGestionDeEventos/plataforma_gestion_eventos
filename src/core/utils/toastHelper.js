/**
 * toastHelper.js
 * 
 * Helper para notificaciones visuales usando react-toastify
 * Proporciona métodos consistentes para mostrar mensajes al usuario
 */

import React from 'react';
import { toast } from 'react-toastify';

const toastHelper = {
  /**
   * Muestra notificación de éxito
   */
  success: (mensaje, opciones = {}) => {
    toast.success(mensaje, {
      icon: '✅',
      ...opciones
    });
  },

  /**
   * Muestra notificación de error
   */
  error: (mensaje, opciones = {}) => {
    toast.error(mensaje, {
      icon: '❌',
      ...opciones
    });
  },

  /**
   * Muestra notificación informativa
   */
  info: (mensaje, opciones = {}) => {
    toast.info(mensaje, {
      icon: 'ℹ️',
      ...opciones
    });
  },

  /**
   * Muestra notificación de advertencia
   */
  warning: (mensaje, opciones = {}) => {
    toast.warning(mensaje, {
      icon: '⚠️',
      ...opciones
    });
  },

  /**
   * Muestra toast de promesa (loading → success/error)
   */
  promise: (promesa, mensajes, opciones = {}) => {
    return toast.promise(
      promesa,
      {
        pending: mensajes.pending || 'Procesando...',
        success: mensajes.success || 'Operación exitosa',
        error: mensajes.error || 'Error en la operación'
      },
      opciones
    );
  },

  /**
   * Muestra confirmación con toast personalizado
   * Retorna una promesa que se resuelve con true/false
   */
  confirm: (mensaje, opciones = {}) => {
    return new Promise((resolve) => {
      const toastId = toast(
        ({ closeToast }) => {
          return React.createElement(
            'div',
            null,
            React.createElement('p', { className: 'mb-3' }, mensaje),
            React.createElement(
              'div',
              { className: 'd-flex gap-2 justify-content-end' },
              React.createElement(
                'button',
                {
                  className: 'btn btn-sm btn-secondary',
                  onClick: () => {
                    closeToast();
                    resolve(false);
                  }
                },
                'Cancelar'
              ),
              React.createElement(
                'button',
                {
                  className: 'btn btn-sm btn-primary',
                  onClick: () => {
                    closeToast();
                    resolve(true);
                  }
                },
                'Confirmar'
              )
            )
          );
        },
        {
          position: 'top-center',
          autoClose: false,
          closeButton: false,
          draggable: false,
          closeOnClick: false,
          ...opciones
        }
      );

      // Si se cierra el toast sin confirmar/cancelar, resolver como false
      setTimeout(() => {
        if (toast.isActive(toastId)) {
          toast.dismiss(toastId);
          resolve(false);
        }
      }, 30000); // 30 segundos timeout
    });
  }
};

export default toastHelper;
