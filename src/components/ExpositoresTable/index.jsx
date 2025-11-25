import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { validateExpositor } from '../../core/validation/eventoValidation';
import { VALIDATION_RULES } from '../../config/constants';
import toastHelper from '../../core/utils/toastHelper';
import { useButtonDebounce } from '../../core/hooks';

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
  // ✅ NUEVO: Estados para edición
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [editandoBreak, setEditandoBreak] = useState(false);
  
  // ✅ Hook para prevenir múltiples clics
  const { isDisabled, handleClick } = useButtonDebounce(5000);

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

  const verificarConflictoHorario = (nuevoItem, indexAIgnorar = null) => {
    const itemsDelMismoDia = expositores.filter((item, idx) => 
      item.dia === nuevoItem.dia && idx !== indexAIgnorar
    );
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

  // ✅ NUEVO: Validar que la hora esté dentro del rango del evento
  const validarHoraEnRango = (hora) => {
    if (!horaInicio || !horaFin || !hora) return true;
    
    const [h, m] = hora.split(':').map(Number);
    const [hInicio, mInicio] = horaInicio.split(':').map(Number);
    const [hFin, mFin] = horaFin.split(':').map(Number);
    
    const minutos = h * 60 + m;
    const minutosInicio = hInicio * 60 + mInicio;
    const minutosFin = hFin * 60 + mFin;
    
    return minutos >= minutosInicio && minutos <= minutosFin;
  };

  const handleAgregarExpositor = async (e = null) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!diaSeleccionado) {
      setErrors({ general: 'Selecciona un día primero' });
      return;
    }
    
    // ✅ NUEVO: Validar que la hora esté dentro del rango del evento
    if (!validarHoraEnRango(formData.hora)) {
      setErrors({ hora: `La hora debe estar entre ${horaInicio} y ${horaFin}` });
      return;
    }
    
    const validation = await validateExpositor({ ...formData, dia: diaSeleccionado, duracion: Number(formData.duracion), break: false });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    const nuevoExpositor = validation.data;
    
    // Si estamos editando, actualizar el expositor existente
    if (editandoIndex !== null) {
      const indexReal = expositores.findIndex((_, idx) => idx === editandoIndex);
      if (verificarConflictoHorario(nuevoExpositor, indexReal)) {
        setErrors({ hora: 'Ya existe un expositor o break en ese horario' });
        return;
      }
      const nuevosExpositores = [...expositores];
      nuevosExpositores[indexReal] = nuevoExpositor;
      setExpositores(nuevosExpositores);
      setEditandoIndex(null);
    } else {
      // Si no estamos editando, agregar nuevo
      if (verificarConflictoHorario(nuevoExpositor)) {
        setErrors({ hora: 'Ya existe un expositor o break en ese horario' });
        return;
      }
      setExpositores([...expositores, nuevoExpositor]);
    }
    
    setFormData({ nombre: '', correo: '', tema: '', hora: horaInicio || '', duracion: 60 });
    setErrors({});
  };

  const handleMensajeBreakChange = (e) => {
    const { name, value } = e.target;
    setMensajeBreak(prev => ({ ...prev, [name]: value }));
  };

  const handleAgregarBreak = async (e = null) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!diaSeleccionado) {
      toastHelper.error('❌ Selecciona un día primero');
      return;
    }
    
    // Validar que se hayan completado los campos
    if (!mensajeBreak.horaInicio || !mensajeBreak.horaFin) {
      toastHelper.error('❌ Debes completar la hora de inicio y fin del break');
      return;
    }
    
    // ✅ NUEVO: Validar que la hora de inicio esté dentro del rango del evento
    if (!validarHoraEnRango(mensajeBreak.horaInicio)) {
      toastHelper.error(`❌ La hora de inicio debe estar entre ${horaInicio} y ${horaFin}`);
      return;
    }
    
    // Calcular duración del break
    const [hIni, mIni] = mensajeBreak.horaInicio.split(':').map(Number);
    const [hFin, mFin] = mensajeBreak.horaFin.split(':').map(Number);
    const duracion = (hFin * 60 + mFin) - (hIni * 60 + mIni);
    
    if (duracion <= 0) {
      toastHelper.error('❌ La hora de fin debe ser posterior a la hora de inicio');
      return;
    }
    
    if (duracion < 5 || duracion > 480) {
      toastHelper.error('❌ La duración del break debe estar entre 5 y 480 minutos');
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
    
    // Si estamos editando, actualizar el break existente
    if (editandoIndex !== null) {
      const indexReal = expositores.findIndex((_, idx) => idx === editandoIndex);
      if (verificarConflictoHorario(nuevoBreak, indexReal)) {
        toastHelper.error('❌ Ya existe un expositor o break en ese horario');
        return;
      }
      const nuevosExpositores = [...expositores];
      nuevosExpositores[indexReal] = nuevoBreak;
      setExpositores(nuevosExpositores);
      setEditandoIndex(null);
    } else {
      // Si no estamos editando, agregar nuevo
      if (verificarConflictoHorario(nuevoBreak)) {
        toastHelper.error('❌ Ya existe un expositor o break en ese horario');
        return;
      }
      setExpositores([...expositores, nuevoBreak]);
    }
    
    setMensajeBreak({ mensaje: '', horaInicio: '', horaFin: '' });
    setMostrarFormBreak(false);
    setEditandoBreak(false);
  };

  const handleEliminarItem = (index) => {
    const item = itemsDelDia[index];
    const nuevosExpositores = expositores.filter(exp => !(exp.dia === item.dia && exp.hora === item.hora && exp.nombre === item.nombre));
    setExpositores(nuevosExpositores);
  };

  // ✅ NUEVO: Función para editar un expositor o break
  const handleEditarItem = (index) => {
    const item = itemsDelDia[index];
    const indexReal = expositores.findIndex(exp => 
      exp.dia === item.dia && exp.hora === item.hora && exp.nombre === item.nombre
    );
    
    if (item.break) {
      // Es un break/mensaje
      const [hFin, mFin] = item.hora.split(':').map(Number);
      const finMinutos = hFin * 60 + mFin + item.duracion;
      const horaFinCalculada = `${String(Math.floor(finMinutos / 60)).padStart(2, '0')}:${String(finMinutos % 60).padStart(2, '0')}`;
      
      setMensajeBreak({
        mensaje: item.tema,
        horaInicio: item.hora,
        horaFin: horaFinCalculada
      });
      setMostrarFormBreak(true);
      setEditandoBreak(true);
      setEditandoIndex(indexReal);
    } else {
      // Es un expositor
      setFormData({
        nombre: item.nombre,
        correo: item.correo,
        tema: item.tema,
        hora: item.hora,
        duracion: item.duracion
      });
      setEditandoIndex(indexReal);
      setEditandoBreak(false);
    }
    
    // Hacer scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ NUEVO: Función para cancelar edición
  const handleCancelarEdicion = () => {
    setEditandoIndex(null);
    setEditandoBreak(false);
    setFormData({ nombre: '', correo: '', tema: '', hora: horaInicio || '', duracion: 60 });
    setMensajeBreak({ mensaje: '', horaInicio: '', horaFin: '' });
    setMostrarFormBreak(false);
    setErrors({});
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
          <h6 className="mb-0">
            {editandoIndex !== null && !editandoBreak ? '✏️ Editar Expositor' : 'Agregar Expositor'}
          </h6>
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
                <div className="d-flex gap-2">
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
                    onClick={handleClick(async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await handleAgregarExpositor();
                    })}
                    disabled={disabled || isDisabled}
                  >
                    {editandoIndex !== null && !editandoBreak ? '💾 Guardar Cambios' : `➕ Agregar Expositor al ${formatearFecha(diaSeleccionado)}`}
                  </button>
                  {editandoIndex !== null && !editandoBreak && (
                    <button 
                      type="button"
                      className="btn"
                      style={{
                        backgroundColor: 'var(--gray-500)',
                        border: 'none',
                        color: 'white',
                        padding: '0.75rem 1.5rem'
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCancelarEdicion();
                      }}
                      disabled={disabled}
                    >
                      ❌ Cancelar
                    </button>
                  )}
                </div>
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
          <h6 className="mb-0">
            {editandoBreak ? '✏️ Editar Mensaje/Receso' : 'Mensajes/Recesos'}
          </h6>
        </div>
        <div className="card-body" style={{ backgroundColor: '#e7f7ff' }}>
          
          {!mostrarFormBreak ? (
            <button
              type="button"
              className="btn w-100"
              style={{
                backgroundColor: 'var(--primary-500)',
                border: 'none',
                color: 'white',
                fontWeight: 'bold'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMostrarFormBreak(true);
              }}
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
                      className="btn"
                      style={{
                        backgroundColor: 'var(--primary-600)',
                        border: 'none',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                      onClick={handleClick(async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await handleAgregarBreak();
                      })}
                      disabled={disabled || isDisabled}
                    >
                      {editandoBreak ? '💾 Guardar Cambios' : 'Agregar'}
                    </button>
                    <button 
                      type="button" 
                      className="btn"
                      style={{
                        backgroundColor: 'var(--gray-500)',
                        border: 'none',
                        color: 'white'
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (editandoBreak) {
                          handleCancelarEdicion();
                        } else {
                          setMostrarFormBreak(false);
                          setMensajeBreak({ mensaje: '', horaInicio: '', horaFin: '' });
                        }
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
                <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
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
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            backgroundColor: 'var(--primary-600)',
                            border: 'none',
                            color: 'white',
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem'
                          }}
                          onClick={handleClick(async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await handleEditarItem(index);
                          })}
                          disabled={disabled || isDisabled}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            backgroundColor: '#dc3545',
                            border: 'none',
                            color: 'white',
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem'
                          }}
                          onClick={handleClick(async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await handleEliminarItem(index);
                          })}
                          disabled={disabled || isDisabled}
                          title="Eliminar"
                        >
                          ❌
                        </button>
                      </div>
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
      {expositores.length > 0 && (() => {
        // Calcular días con expositores reales (no breaks)
        const expositoresReales = expositores.filter(e => !e.break);
        const diasConExpositores = new Set(expositoresReales.map(e => e.dia));
        const diasSinExpositores = diasDelEvento.filter(dia => !diasConExpositores.has(dia));
        const hayDiasSinExpositores = diasSinExpositores.length > 0 && diasDelEvento.length > 1;
        
        return (
          <>
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
                    {expositoresReales.length}
                  </span>
                </div>
                <div className="col-md-4">
                  <strong>📅 Días con programación:</strong>{' '}
                  <span style={{ color: diasConExpositores.size === diasDelEvento.length ? 'var(--success-dark)' : '#dc3545', fontSize: '1.1rem' }}>
                    {diasConExpositores.size} / {diasDelEvento.length}
                  </span>
                </div>
                <div className="col-md-4">
                  <strong>☕ Breaks/Mensajes:</strong>{' '}
                  <span style={{ color: 'var(--gray-700)', fontSize: '1.1rem' }}>
                    {expositores.filter(e => e.break).length}
                  </span>
                </div>
              </div>
            </div>
            
            {/* ✅ NUEVO: Advertencia si faltan expositores en algunos días */}
            {hayDiasSinExpositores && (
              <div 
                className="alert alert-warning mt-3" 
                style={{ 
                  borderLeft: `4px solid #ffc107`,
                  backgroundColor: '#fff3cd'
                }}
              >
                <div className="d-flex align-items-start">
                  <div style={{ fontSize: '1.5rem', marginRight: '1rem' }}>⚠️</div>
                  <div>
                    <strong>Atención: Faltan expositores en algunos días</strong>
                    <p className="mb-2 mt-1">Los siguientes días no tienen expositores programados:</p>
                    <ul className="mb-0">
                      {diasSinExpositores.map(dia => (
                        <li key={dia}>
                          <strong>{formatearFecha(dia)}</strong>
                        </li>
                      ))}
                    </ul>
                    <p className="mb-0 mt-2" style={{ fontSize: '0.9rem', color: '#856404' }}>
                      💡 <em>Para eventos de varios días, se recomienda agregar al menos un expositor por día.</em>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}
      
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
