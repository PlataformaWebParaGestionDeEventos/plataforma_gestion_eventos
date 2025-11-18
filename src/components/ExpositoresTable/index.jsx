import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { validateExpositor } from '../../core/validation/eventoValidation';
import { VALIDATION_RULES } from '../../config/constants';

const ExpositoresTable = ({ 
  expositores = [], 
  setExpositores, 
  fechaInicio, 
  fechaFin,
  horaInicio,
  horaFin,
  disabled = false 
}) => {
  const [diaSeleccionado, setDiaSeleccionado] = useState('');
  const [formData, setFormData] = useState({
    nombre: '', correo: '', tema: '', hora: '', duracion: 60
  });
  const [errors, setErrors] = useState({});
  const [mostrarFormBreak, setMostrarFormBreak] = useState(false);
  const [mensajeBreak, setMensajeBreak] = useState({
    mensaje: '',
    horaInicio: '',
    horaFin: ''
  });

  // Generar array de días del evento
  const diasDelEvento = useMemo(() => {
    if (!fechaInicio || !fechaFin) return [];
    const dias = [];
    const inicio = new Date(fechaInicio + 'T00:00:00');
    const fin = new Date(fechaFin + 'T00:00:00');
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      dias.push(new Date(d).toISOString().split('T')[0]);
    }
    return dias;
  }, [fechaInicio, fechaFin]);

  // Filtrar items del día seleccionado
  const itemsDelDia = useMemo(() => {
    if (!diaSeleccionado) return [];
    return expositores.filter(item => item.dia === diaSeleccionado).sort((a, b) => a.hora.localeCompare(b.hora));
  }, [expositores, diaSeleccionado]);
  
  // Generar array de horas del evento (cada 30 minutos)
  const horasDelEvento = useMemo(() => {
    if (!horaInicio || !horaFin) return [];
    const horas = [];
    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const [horaFinal, minFinal] = horaFin.split(':').map(Number);
    
    let minutoActual = horaIni * 60 + minIni;
    const minutoFinal = horaFinal * 60 + minFinal;
    
    while (minutoActual <= minutoFinal) {
      const h = Math.floor(minutoActual / 60);
      const m = minutoActual % 60;
      horas.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      minutoActual += 30; // Intervalos de 30 minutos
    }
    
    return horas;
  }, [horaInicio, horaFin]);

  useEffect(() => {
    if (diasDelEvento.length > 0 && !diaSeleccionado) {
      setDiaSeleccionado(diasDelEvento[0]);
    }
  }, [diasDelEvento, diaSeleccionado]);

  useEffect(() => {
    if (horaInicio && !formData.hora) {
      setFormData(prev => ({ ...prev, hora: horaInicio }));
    }
  }, [horaInicio, formData.hora]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });
    }
  };

  const verificarConflictoHorario = (nuevoItem) => {
    const itemsDelMismoDia = expositores.filter(item => item.dia === nuevoItem.dia);
    const [horaInicioNuevo, minInicioNuevo] = nuevoItem.hora.split(':').map(Number);
    const inicioNuevoMinutos = horaInicioNuevo * 60 + minInicioNuevo;
    const finNuevoMinutos = inicioNuevoMinutos + nuevoItem.duracion;
    
    for (const item of itemsDelMismoDia) {
      const [horaInicio, minInicio] = item.hora.split(':').map(Number);
      const inicioMinutos = horaInicio * 60 + minInicio;
      const finMinutos = inicioMinutos + item.duracion;
      
      // Hay conflicto si:
      // 1. El nuevo item empieza ANTES de que termine el existente Y termina DESPUÉS de que empiece el existente
      // NO hay conflicto si uno termina exactamente cuando el otro empieza
      const hayConflicto = (inicioNuevoMinutos < finMinutos) && (finNuevoMinutos > inicioMinutos);
      
      if (hayConflicto) {
        return true;
      }
    }
    return false;
  };

  const handleAgregarExpositor = async (e) => {
    e.preventDefault();
    if (!diaSeleccionado) {
      setErrors({ general: 'Selecciona un día primero' });
      return;
    }
    const validation = await validateExpositor({ ...formData, dia: diaSeleccionado, duracion: Number(formData.duracion), break: false });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    const nuevoExpositor = validation.data;
    if (verificarConflictoHorario(nuevoExpositor)) {
      setErrors({ hora: 'Ya existe un expositor o break en ese horario' });
      return;
    }
    setExpositores([...expositores, nuevoExpositor]);
    setFormData({ nombre: '', correo: '', tema: '', hora: horaInicio || '', duracion: 60 });
    setErrors({});
  };

  const handleMensajeBreakChange = (e) => {
    const { name, value } = e.target;
    setMensajeBreak(prev => ({ ...prev, [name]: value }));
  };

  const handleAgregarBreak = async (e) => {
    e.preventDefault();
    if (!diaSeleccionado) {
      alert('Selecciona un día primero');
      return;
    }
    
    // Validar que se hayan completado los campos
    if (!mensajeBreak.horaInicio || !mensajeBreak.horaFin) {
      alert('Debes completar la hora de inicio y fin del break');
      return;
    }
    
    // Calcular duración del break
    const [hIni, mIni] = mensajeBreak.horaInicio.split(':').map(Number);
    const [hFin, mFin] = mensajeBreak.horaFin.split(':').map(Number);
    const duracion = (hFin * 60 + mFin) - (hIni * 60 + mIni);
    
    if (duracion <= 0) {
      alert('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }
    
    if (duracion < 5 || duracion > 480) {
      alert('La duración del break debe estar entre 5 y 480 minutos');
      return;
    }
    
    const nuevoBreak = {
      nombre: 'Mensaje',
      correo: 'break@sistema.com',
      tema: mensajeBreak.mensaje || 'Receso / Coffee Break',
      dia: diaSeleccionado,
      hora: mensajeBreak.horaInicio,
      duracion: duracion,
      break: true
    };
    
    // No validamos con validateExpositor porque los breaks no son expositores reales
    // Solo verificamos conflictos horarios
    if (verificarConflictoHorario(nuevoBreak)) {
      alert('Ya existe un expositor o break en ese horario');
      return;
    }
    
    setExpositores([...expositores, nuevoBreak]);
    setMensajeBreak({ mensaje: '', horaInicio: '', horaFin: '' });
    setMostrarFormBreak(false);
  };

  const handleEliminarItem = (index) => {
    const item = itemsDelDia[index];
    const nuevosExpositores = expositores.filter(exp => !(exp.dia === item.dia && exp.hora === item.hora && exp.nombre === item.nombre));
    setExpositores(nuevosExpositores);
  };

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO + 'T00:00:00');
    return fecha.toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  const calcularHoraFin = (horaInicio, duracion) => {
    const [hora, min] = horaInicio.split(':').map(Number);
    const totalMin = hora * 60 + min + duracion;
    const horaFin = Math.floor(totalMin / 60);
    const minFin = totalMin % 60;
    return String(horaFin).padStart(2, '0') + ':' + String(minFin).padStart(2, '0');
  };

  if (!fechaInicio || !fechaFin) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        Por favor, completa las fechas de inicio y fin del evento primero.
      </div>
    );
  }

  return (
    <div className="expositores-section">
      <h5 className="mb-3" style={{ color: 'var(--primary-700)' }}>
        Agenda de Expositores y Horarios
      </h5>
      
      {/* Selector de Día */}
      <div className="card mb-3" style={{ borderColor: 'var(--primary-500)', borderWidth: '2px' }}>
        <div className="card-body" style={{ backgroundColor: 'var(--primary-50)' }}>
          <div className="row align-items-center">
            <div className="col-12">
              <label className="form-label fw-bold mb-2" style={{ color: 'var(--primary-800)' }}>
                📅 Selecciona el Día a Programar
              </label>
              <select
                className="form-select form-select-lg"
                value={diaSeleccionado}
                onChange={(e) => setDiaSeleccionado(e.target.value)}
                disabled={disabled}
                style={{
                  borderColor: 'var(--primary-400)',
                  color: 'var(--primary-800)'
                }}
              >
                {diasDelEvento.map(dia => (
                  <option key={dia} value={dia}>
                    {formatearFecha(dia)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* ✅ REORDENADO: Formulario Agregar Expositor ARRIBA */}
      <div className="card mb-3" style={{ borderColor: 'var(--primary-500)', borderWidth: '2px' }}>
        <div 
          className="card-header text-white" 
          style={{ backgroundColor: 'var(--primary-600)' }}
        >
          <h6 className="mb-0">Agregar Expositor</h6>
        </div>
        <div className="card-body" style={{ backgroundColor: 'var(--primary-50)' }}>
          <div className="row g-3">
              
              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Nombre Completo <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Dr. Juan Pérez"
                  disabled={disabled}
                  minLength={VALIDATION_RULES.EXPOSITOR.NAME_MIN_LENGTH}
                  maxLength={VALIDATION_RULES.EXPOSITOR.NAME_MAX_LENGTH}
                />
                {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
              </div>
              
              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Correo Electrónico <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className={`form-control ${errors.correo ? 'is-invalid' : ''}`}
                  name="correo"
                  value={formData.correo}
                  onChange={handleInputChange}
                  placeholder="expositor@ejemplo.com"
                  disabled={disabled}
                  minLength={VALIDATION_RULES.EXPOSITOR.EMAIL_MIN_LENGTH}
                  maxLength={VALIDATION_RULES.EXPOSITOR.EMAIL_MAX_LENGTH}
                />
                {errors.correo && <div className="invalid-feedback">{errors.correo}</div>}
              </div>
              
              <div className="col-md-2">
                <label className="form-label fw-semibold">
                  Hora <span className="text-danger">*</span>
                </label>
                <input
                  type="time"
                  className={`form-control ${errors.hora ? 'is-invalid' : ''}`}
                  name="hora"
                  value={formData.hora}
                  onChange={handleInputChange}
                  disabled={disabled}
                />
                {errors.hora && <div className="invalid-feedback">{errors.hora}</div>}
              </div>
              
              <div className="col-md-2">
                <label className="form-label fw-semibold">
                  Duración (min) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className={`form-control ${errors.duracion ? 'is-invalid' : ''}`}
                  name="duracion"
                  value={formData.duracion}
                  onChange={handleInputChange}
                  min={VALIDATION_RULES.EXPOSITOR.DURACION_MIN}
                  max={VALIDATION_RULES.EXPOSITOR.DURACION_MAX}
                  step="15"
                  disabled={disabled}
                />
                {errors.duracion && <div className="invalid-feedback">{errors.duracion}</div>}
              </div>
              
              <div className="col-12">
                <label className="form-label fw-semibold">
                  Tema de la Ponencia <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.tema ? 'is-invalid' : ''}`}
                  name="tema"
                  value={formData.tema}
                  onChange={handleInputChange}
                  placeholder="Ej: Inteligencia Artificial en la Educación"
                  disabled={disabled}
                  minLength={VALIDATION_RULES.EXPOSITOR.TEMA_MIN_LENGTH}
                  maxLength={VALIDATION_RULES.EXPOSITOR.TEMA_MAX_LENGTH}
                />
                {errors.tema && <div className="invalid-feedback">{errors.tema}</div>}
              </div>
              
              {errors.general && (
                <div className="col-12">
                  <div className="alert alert-danger mb-0">{errors.general}</div>
                </div>
              )}
              
              <div className="col-12">
                <button 
                  type="button"
                  className="btn"
                  style={{
                    backgroundColor: 'var(--primary-600)',
                    border: 'none',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '0.75rem 1.5rem'
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAgregarExpositor(e);
                  }}
                  disabled={disabled}
                >
                  ➕ Agregar Expositor al {formatearFecha(diaSeleccionado)}
                </button>
              </div>
              
            </div>
        </div>
      </div>
      
      {/* Botón y Formulario de Break */}
      <div className="card" style={{ borderColor: 'var(--primary-500)', borderWidth: '2px' }}>
        <div 
          className="card-header text-white" 
          style={{ backgroundColor: 'var(--primary-500)' }}
        >
          <h6 className="mb-0">Mensajes/Recesos</h6>
        </div>
        <div className="card-body" style={{ backgroundColor: '#e7f7ff' }}>
          
          {!mostrarFormBreak ? (
            <button
              className="btn w-100"
              style={{
                backgroundColor: 'var(--primary-500)',
                border: 'none',
                color: 'white',
                fontWeight: 'bold'
              }}
              onClick={() => setMostrarFormBreak(true)}
              disabled={disabled}
            >
            Agregar al {formatearFecha(diaSeleccionado)}
            </button>
          ) : (
            <div className="row g-3">
                
                <div className="col-12">
                  <label className="form-label fw-semibold" style={{ color: 'var(--primary-500)' }}>
                    Mensaje <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="mensaje"
                    value={mensajeBreak.mensaje}
                    onChange={handleMensajeBreakChange}
                    placeholder="Ej: Refrigerio - Descanso"
                    disabled={disabled}
                    maxLength="200"
                  />
                  <small style={{ color: 'var(--gray-600)' }}>
                    Este mensaje aparecerá en la agenda del evento
                  </small>
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold" style={{ color: 'var(--primary-500)' }}>
                    Hora de Inicio <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    name="horaInicio"
                    value={mensajeBreak.horaInicio}
                    onChange={handleMensajeBreakChange}
                    disabled={disabled}
                  />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold" style={{ color: 'var(--primary-500)' }}>
                    Hora de Fin <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    name="horaFin"
                    value={mensajeBreak.horaFin}
                    onChange={handleMensajeBreakChange}
                    disabled={disabled}
                  />
                </div>
                
                <div className="col-12">
                  <div className="d-flex gap-2">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAgregarBreak(e);
                      }}
                      className="btn"
                      style={{
                        backgroundColor: 'var(--primary-600)',
                        border: 'none',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                      disabled={disabled}
                    >
                      Agregar
                    </button>
                    <button 
                      type="button" 
                      className="btn"
                      style={{
                        backgroundColor: 'var(--gray-500)',
                        border: 'none',
                        color: 'white'
                      }}
                      onClick={() => {
                        setMostrarFormBreak(false);
                        setMensajeBreak({ mensaje: '', horaInicio: '', horaFin: '' });
                      }}
                      disabled={disabled}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
                
              </div>
          )}
          
        </div>
      </div>
      
      {/* ✅ REORDENADO: Tabla Estilo Horario (AHORA DEBAJO de los formularios) */}
      {itemsDelDia.length > 0 ? (
        <div className="table-responsive mb-3 mt-3">
          <table className="table table-bordered" style={{ fontSize: '0.9rem' }}>
            <thead style={{ backgroundColor: 'var(--primary-700)', color: 'white' }}>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>Hora</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Tema / Descripción</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Duración</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Quitar</th>
              </tr>
            </thead>
            <tbody>
              {itemsDelDia.map((item, index) => {
                const horaFin = calcularHoraFin(item.hora, item.duracion);
                const esBreak = item.break === true;
                const bgColor = esBreak ? '#888888' : 'white';
                
                return (
                  <tr key={index} style={{ backgroundColor: bgColor }}>
                    <td className="fw-bold text-center" style={{ color: 'var(--primary-800)' }}>
                      {item.hora}<br/>
                      <small style={{ color: 'var(--gray-600)' }}>↓</small><br/>
                      {horaFin}
                    </td>
                    <td>
                      {esBreak ? (
                        <span 
                          className="badge" 
                          style={{ 
                            backgroundColor: 'var(--primary-600)', 
                            color: 'white',
                            fontSize: '0.9rem',
                            padding: '0.5rem'
                          }}
                        >
                          {item.nombre}
                        </span>
                      ) : (
                        <strong style={{ color: 'var(--gray-900)' }}>{item.nombre}</strong>
                      )}
                    </td>
                    <td>
                      <small style={{ color: 'var(--gray-700)' }}>
                        {esBreak ? '—' : item.correo}
                      </small>
                    </td>
                    <td>
                      {esBreak ? (
                        <em style={{ color: 'var(--primary-500)' }}>{item.tema}</em>
                      ) : (
                        <span style={{ color: 'var(--gray-800)' }}>{item.tema}</span>
                      )}
                    </td>
                    <td className="text-center">
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: 'var(--primary-200)', 
                          color: 'var(--primary-900)',
                          fontSize: '0.85rem'
                        }}
                      >
                        {item.duracion} min
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm"
                        style={{
                          border: 'none',
                          color: 'white'
                        }}
                        onClick={() => handleEliminarItem(index)}
                        disabled={disabled}
                        title="Eliminar"
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div 
          className="alert text-center py-4 mb-3 mt-3" 
          style={{ 
            backgroundColor: 'var(--gray-100)', 
            border: `2px dashed var(--gray-400)`,
            color: 'var(--gray-700)'
          }}
        >
          <i className="bi bi-calendar-x fs-1 d-block mb-2" style={{ color: 'var(--gray-500)' }}></i>
          <p className="mb-0">
            No hay expositores programados para <strong>{formatearFecha(diaSeleccionado)}</strong>
          </p>
          <small style={{ color: 'var(--gray-600)' }}>Agrega un expositor para comenzar</small>
        </div>
      )}
      
      {/* Resumen General */}
      {expositores.length > 0 && (
        <div 
          className="alert mt-3" 
          style={{ 
            backgroundColor: 'var(--primary-100)', 
            borderLeft: `4px solid var(--primary-600)`,
            color: 'var(--primary-900)'
          }}
        >
          <div className="row">
            <div className="col-md-4">
              <strong>📊 Total Expositores:</strong>{' '}
              <span style={{ color: 'var(--primary-700)', fontSize: '1.1rem' }}>
                {expositores.filter(e => !e.break).length}
              </span>
            </div>
            <div className="col-md-4">
              <strong>📅 Días con programación:</strong>{' '}
              <span style={{ color: 'var(--success-dark)', fontSize: '1.1rem' }}>
                {new Set(expositores.map(e => e.dia)).size} / {diasDelEvento.length}
              </span>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

ExpositoresTable.propTypes = {
  expositores: PropTypes.array,
  setExpositores: PropTypes.func.isRequired,
  fechaInicio: PropTypes.string.isRequired,
  fechaFin: PropTypes.string.isRequired,
  horaInicio: PropTypes.string,
  disabled: PropTypes.bool
};

export default ExpositoresTable;
