/**
 * Página de Gestión de Participantes
 * Vista para organizadores con react-router-dom
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import firestoreService from '../../services/firestoreService';
import GestionParticipantesComponent from '../../components/GestionParticipantes';
import toastHelper from '../../core/utils/toastHelper';
import logger from '../../core/utils/logger';

const GestionParticipantesPage = () => {
  const { eventoId } = useParams();
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Cargar datos del evento
   */
  useEffect(() => {
    cargarEvento();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  /**
   * Cargar evento
   */
  const cargarEvento = async () => {
    try {
      setLoading(true);
      
      // Obtener evento
      const eventoResult = await firestoreService.obtenerEventoPorId(eventoId);
      if (!eventoResult.success) {
        setError('Evento no encontrado');
        toastHelper.error('Evento no encontrado');
        return;
      }
      
      const eventoData = eventoResult.evento;
      setEvento(eventoData);
      setError(null);
    } catch (err) {
      logger.error('Error cargando evento:', err);
      setError('Error al cargar el evento');
      toastHelper.error('Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="container-fluid py-5">
        <div className="alert alert-danger" role="alert">
          <h5 className="alert-heading">Error</h5>
          <p>{error || 'No se pudo cargar el evento'}</p>
        </div>
      </div>
    );
  }

  return <GestionParticipantesComponent evento={evento} />;
};

export default GestionParticipantesPage;
