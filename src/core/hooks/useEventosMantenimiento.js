import { useEffect, useCallback } from 'react';
import firestoreService from '../../services/firestoreService';

/**
 * ✅ Hook para mantenimiento automático de eventos:
 * - Auto-cerrar inscripciones el día del evento
 * - Auto-eliminar eventos pasados
 * 
 * Ejecuta verificaciones periódicas cada 5 minutos
 */
const useEventosMantenimiento = () => {
  
  /**
   * Verificar y cerrar inscripciones de eventos que llegaron a su día
   */
  const verificarCierreInscripciones = useCallback(async () => {
    try {
      console.log('🔍 Verificando eventos para cerrar inscripciones...');
      
      const resultado = await firestoreService.verificarEventosParaCerrar();
      
      if (resultado.success && resultado.eventos.length > 0) {
        console.log(`🔒 Encontrados ${resultado.eventos.length} eventos para cerrar`);
        
        // Cerrar inscripciones de cada evento
        const promesas = resultado.eventos.map(evento => 
          firestoreService.cerrarInscripcionesYEnviarLista(evento.id)
        );
        
        await Promise.all(promesas);
        console.log(`✅ Inscripciones cerradas en ${resultado.eventos.length} eventos`);
      } else {
        console.log('✓ No hay eventos que requieran cierre de inscripciones');
      }
      
    } catch (error) {
      console.error('Error verificando cierre de inscripciones:', error);
    }
  }, []);

  /**
   * Verificar y eliminar eventos que ya pasaron
   */
  const verificarEliminacionEventos = useCallback(async () => {
    try {
      console.log('🔍 Verificando eventos pasados para eliminar...');
      
      const resultado = await firestoreService.verificarYEliminarEventosPasados();
      
      if (resultado.success && resultado.totalEliminados > 0) {
        console.log(`🗑️ Eliminados ${resultado.totalEliminados} eventos pasados:`, resultado.eventosEliminados);
      } else {
        console.log('✓ No hay eventos pasados para eliminar');
      }
      
    } catch (error) {
      console.error('Error verificando eliminación de eventos:', error);
    }
  }, []);

  /**
   * Ejecutar ambas verificaciones
   */
  const ejecutarMantenimiento = useCallback(async () => {
    console.log('⚙️ Ejecutando mantenimiento automático de eventos...');
    await verificarCierreInscripciones();
    await verificarEliminacionEventos();
    console.log('✅ Mantenimiento completado');
  }, [verificarCierreInscripciones, verificarEliminacionEventos]);

  /**
   * Configurar intervalo de verificación (cada 5 minutos)
   */
  useEffect(() => {
    // Ejecutar inmediatamente al montar
    ejecutarMantenimiento();

    // Configurar intervalo: cada 5 minutos (300,000 ms)
    const INTERVALO_VERIFICACION = 5 * 60 * 1000; // 5 minutos
    const intervalo = setInterval(ejecutarMantenimiento, INTERVALO_VERIFICACION);

    console.log('⏰ Mantenimiento automático activado (cada 5 minutos)');

    // Limpiar intervalo al desmontar
    return () => {
      clearInterval(intervalo);
      console.log('⏰ Mantenimiento automático desactivado');
    };
  }, [ejecutarMantenimiento]);

  return {
    verificarCierreInscripciones,
    verificarEliminacionEventos,
    ejecutarMantenimiento
  };
};

export default useEventosMantenimiento;
