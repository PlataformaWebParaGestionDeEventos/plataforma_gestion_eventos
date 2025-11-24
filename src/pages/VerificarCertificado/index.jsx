import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import logger from '../../core/utils/logger';

// 🔧 CONFIGURACIÓN DEL CONTRATO
const CONTRACT_ADDRESS = '0xCeEAD2E9e9E642Fd36b02FD151636bbFb23b600d';
const POLYGON_RPC = 'https://polygon-rpc.com/';
const POLYGONSCAN_BASE = 'https://polygonscan.com';

// 🔧 ABI REAL DEL CONTRATO (verCertificado)
const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_hashDocumento", "type": "bytes32" }
    ],
    "name": "verCertificado",
    "outputs": [
      { "internalType": "string", "name": "nombre", "type": "string" },
      { "internalType": "string", "name": "evento", "type": "string" },
      { "internalType": "uint8", "name": "tipo", "type": "uint8" },
      { "internalType": "string", "name": "detalle", "type": "string" },
      { "internalType": "uint16", "name": "horas", "type": "uint16" },
      { "internalType": "bytes32", "name": "hashDocumento", "type": "bytes32" },
      { "internalType": "uint64", "name": "fechaEmision", "type": "uint64" },
      { "internalType": "address", "name": "emisor", "type": "address" },
      { "internalType": "bool", "name": "revocado", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const VerificarCertificado = () => {
  const navigate = useNavigate();
  const [hashInput, setHashInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [certificado, setCertificado] = useState(null);
  const [error, setError] = useState(null);


  const validarHash = (hash) => {
    if (!hash || hash.trim() === '') return { valid: false, error: 'Debes ingresar un hash de certificado' };

    const cleanHash = hash.trim();
    if (!cleanHash.startsWith('0x')) return { valid: false, error: 'El hash debe comenzar con "0x"' };
    if (cleanHash.length !== 66) return { valid: false, error: 'El hash debe tener 66 caracteres' };
    if (!/^0x[0-9a-fA-F]{64}$/.test(cleanHash)) return { valid: false, error: 'Formato inválido' };

    return { valid: true, hash: cleanHash };
  };

  const formatearFecha = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
  };

  const verificarCertificado = async () => {
    setCertificado(null);
    setError(null);

    const v = validarHash(hashInput);
    if (!v.valid) {
      setError(v.error);
      return;
    }

    setLoading(true);

    try {
      const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const result = await contract.verCertificado(v.hash);

      const [
        nombre,
        evento,
        tipo,
        detalle,
        horas,
        hashDocumento,
        fechaEmision,
        emisor,
        revocado
      ] = result;

      if (Number(fechaEmision) === 0) {
        setError('Certificado no encontrado');
        return;
      }

      setCertificado({
        existe: true,
        nombre,
        evento,
        tipo: Number(tipo),
        detalle,
        horas: Number(horas),
        fecha: Number(fechaEmision),
        emisor,
        revocado,
        hash: hashDocumento
      });

    } catch (err) {
      logger.error(err);
      setError('Error al consultar la blockchain');
    }

    setLoading(false);
  };

  // 🔥 ESTE YA NO ABRE /tx (porque un bytes32 NO es un txHash)
  const abrirEnPolygonscan = () => {
    window.open(`${POLYGONSCAN_BASE}/address/${CONTRACT_ADDRESS}`, "_blank");
  };

  const limpiarFormulario = () => {
    setHashInput('');
    setCertificado(null);
    setError(null);
  };

  return (
    <div className="min-vh-100" style={{ 
      background: certificado 
        ? 'linear-gradient(135deg, #97a6aa 0%, #97a6aa 100%)' 
        : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <div className="container py-5">

        {/* Header - Solo visible si NO hay certificado */}
        {!certificado && (
          <>
            <div className="row mb-5">
              <div className="col-12">
                <div className="text-center position-relative">
                  {/* Botón Volver al Inicio - Posicionado a la izquierda */}
                  <button 
                    className="btn btn-light shadow-sm position-absolute start-0"
                    onClick={() => navigate('/')}
                    style={{ 
                      borderRadius: '50px',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Volver
                  </button>

                  <div className="mb-4">
                    <i className="bi bi-shield-check" style={{ fontSize: '5rem', color: '#667eea' }}></i>
                  </div>
                  <h1 className="display-3 fw-bold mb-3" style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #4b91a2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Verificar Certificado
                  </h1>
                  <p className="lead text-secondary fs-4">
                    Verifica la autenticidad de certificados académicos registrados en blockchain
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Formulario de Verificación - Solo visible si NO hay certificado */}
        {!certificado && (
          <div className="row justify-content-center mb-4">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="card-body p-5">

                <h5 className="card-title mb-4 text-center" style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                  <i className="bi bi-search me-2" style={{ color: '#667eea' }}></i>
                  Ingresa el Hash del Certificado
                </h5>

                <div className="mb-4">
                  <input
                    type="text"
                    className={`form-control form-control-lg ${error ? 'is-invalid' : ''}`}
                    placeholder="0x1234567890abcdef..."
                    value={hashInput}
                    onChange={(e) => { setHashInput(e.target.value); setError(null); }}
                    disabled={loading}
                    style={{ 
                      fontFamily: 'monospace',
                      borderRadius: '15px',
                      padding: '1rem 1.5rem',
                      fontSize: '0.95rem',
                      border: '2px solid #e0e7ff',
                      transition: 'all 0.3s ease'
                    }}
                  />

                  {error && (
                    <div className="invalid-feedback">{error}</div>
                  )}

                  <div className="mt-3 px-2">
                    <small className="text-muted d-flex align-items-center">
                      <i className="bi bi-info-circle-fill me-2" style={{ color: '#667eea' }}></i>
                      El hash debe comenzar con "0x" y tener 66 caracteres hexadecimales
                    </small>
                  </div>
                </div>

                <button
                  className="btn btn-lg w-100"
                  onClick={verificarCertificado}
                  disabled={loading || !hashInput.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #4b91a2 100%)',
                    border: 'none',
                    borderRadius: '15px',
                    padding: '1rem',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: 'white',
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.3s ease',
                    cursor: loading || !hashInput.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Verificando en Blockchain...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-search me-2"></i>
                      Verificar Certificado
                    </>
                  )}
                </button>

              </div>
            </div>
          </div>
        </div>
        )}

        {/* Resultado - Certificado No Encontrado - Solo visible si NO hay certificado */}
        {!certificado && error && (
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center">
                <i className="bi bi-x-circle-fill fs-2 me-3"></i>
                <div>
                  <h5 className="alert-heading mb-1">Certificado No Encontrado</h5>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resultado - Certificado Revocado */}
        {certificado && certificado.revocado && (
          <div className="row justify-content-center mb-4">
            <div className="col-12 col-lg-8">
              <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill fs-2 me-3"></i>
                <div>
                  <h5 className="alert-heading mb-1">⚠️ Certificado Revocado</h5>
                  <p className="mb-0">
                    Este certificado ha sido revocado y ya no es válido.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resultado - Certificado Válido */}
        {certificado && certificado.existe && (
          <div className="row justify-content-center" style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <div className="col-12 col-lg-10">
              <div className="card border-0 shadow-lg" style={{ 
                borderRadius: '25px',
                overflow: 'hidden',
                background: 'white'
              }}>

                {/* Header */}
                <div 
                  className="text-white py-4 px-5"
                  style={{ 
                    background: certificado.revocado 
                      ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #4b91a2 100%)',
                    boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between flex-wrap">
                    <div>
                      <h2 className="mb-1" style={{ fontWeight: '700' }}>
                        <i className="bi bi-patch-check-fill me-3"></i>
                        Certificado {certificado.revocado ? 'Revocado' : 'Verificado'}
                      </h2>
                      <p className="mb-0 opacity-75">Blockchain Polygon</p>
                    </div>
                    <div className="mt-3 mt-md-0">
                    </div>
                  </div>
                </div>

                {/* Cuerpo */}
                <div className="card-body p-5">
                  <div className="row g-4">

                    {/* Nombre destacado con diseño especial */}
                    <div className="col-12 text-center mb-4">
                      <div className="p-4" style={{ 
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 50%, #f5f7fa 100%)',
                        borderRadius: '20px',
                        border: '3px solid #667eea'
                      }}>
                        <label className="text-muted small mb-2 d-block">NOMBRE DEL TITULAR</label>
                        <h2 className="fw-bold mb-0" style={{ 
                          color: '#667eea',
                          fontSize: '2.5rem',
                          letterSpacing: '-0.5px'
                        }}>{certificado.nombre}</h2>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="d-flex align-items-start p-3" style={{ 
                        background: '#f8f9fa',
                        borderRadius: '15px',
                        borderLeft: '4px solid #667eea'
                      }}>
                        <i className="bi bi-calendar-event me-3 fs-3" style={{ color: '#667eea' }}></i>
                        <div className="flex-grow-1">
                          <label className="text-muted small mb-1 d-block">EVENTO</label>
                          <h4 className="mb-0 fw-semibold">{certificado.evento}</h4>
                        </div>
                      </div>
                    </div>

                    {/* Tipo de Certificado */}
                    <div className="col-12">
                      <div className="text-center p-3" style={{ 
                        background: certificado.tipo === 0 ? 'linear-gradient(135deg, #667eea 0%, #4288c9 100%)' : 
                                   certificado.tipo === 1 ? 'linear-gradient(135deg, #667eea 0%, #4288c9 100%)' :
                                   'linear-gradient(135deg, #667eea 0%, #4288c9 100%)',
                        borderRadius: '15px',
                        color: 'white'
                      }}>
                        <i className={`bi ${certificado.tipo === 0 ? 'bi-person-fill' : certificado.tipo === 1 ? 'bi-mic-fill' : 'bi-briefcase-fill'} fs-1 mb-2 d-block`}></i>
                        <label className="small mb-1 d-block opacity-75">TIPO DE CERTIFICADO</label>
                        <h3 className="mb-0 fw-bold">
                          {certificado.tipo === 0 ? 'Participante' : 
                           certificado.tipo === 1 ? 'Ponente' : 
                           'Organizador'}
                        </h3>
                      </div>
                    </div>

                    {certificado.detalle && (
                      <div className="col-12">
                        <label className="text-muted small mb-1">
                          <i className="bi bi-file-text me-1"></i>
                          Detalle
                        </label>
                        <p className="mb-0">{certificado.detalle}</p>
                      </div>
                    )}

                    <div className="col-md-6">
                      <div className="text-center p-4" style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #4288c9 100%)',
                        borderRadius: '15px',
                        color: 'white'
                      }}>
                        <i className="bi bi-clock fs-1 mb-2 d-block"></i>
                        <label className="small mb-1 d-block opacity-75">HORAS ACADÉMICAS</label>
                        <h3 className="mb-0 fw-bold">{certificado.horas}</h3>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="text-center p-4" style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #4288c9 100%)',
                        borderRadius: '15px',
                        color: 'white'
                      }}>
                        <i className="bi bi-calendar-check fs-1 mb-2 d-block"></i>
                        <label className="small mb-1 d-block opacity-75">FECHA DE EMISIÓN</label>
                        <h3 className="mb-0 fw-bold">{formatearFecha(certificado.fecha)}</h3>
                      </div>
                    </div>

                    {/* Hash */}
                    <div className="col-12">
                      <label className="text-muted small mb-1">
                        <i className="bi bi-fingerprint me-1"></i>
                        Hash del Documento
                      </label>

                      <div className="d-flex align-items-center gap-2">
                        <code className="flex-grow-1 bg-light p-2 rounded text-break small">
                          {certificado.hash}
                        </code>

                      </div>

                      <small className="text-muted">
                        Este hash está almacenado dentro del contrato, no aparece como una transacción en Polygonscan.
                      </small>
                    </div>

                    {/* Emisor */}
                    <div className="col-12">
                      <label className="text-muted small mb-1">
                        <i className="bi bi-building me-1"></i>
                        Emisor (Dirección)
                      </label>

                      <div className="d-flex align-items-center gap-2">
                        <code className="flex-grow-1 bg-light p-2 rounded text-break small">
                          {certificado.emisor}
                        </code>

                      </div>
                    </div>

                  </div>
                </div>

                {/* FOOTER */}
                <div className="card-footer border-0 p-4" style={{ background: '#f8f9fa' }}>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <button
                        className="btn btn-outline-secondary btn-lg w-100"
                        onClick={() => navigate('/')}
                        style={{
                          borderRadius: '15px',
                          borderWidth: '2px',
                          fontWeight: '600',
                          padding: '1rem'
                        }}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Volver
                      </button>
                    </div>
                    <div className="col-md-4">
                      <button
                        className="btn btn-lg w-100"
                        onClick={() => abrirEnPolygonscan(certificado.hash)}
                        style={{
                          background: 'linear-gradient(135deg, #669fea 0%, #669fea 100%)',
                          border: 'none',
                          borderRadius: '15px',
                          color: 'white',
                          fontWeight: '600',
                          padding: '1rem'
                        }}
                      >
                        <i className="bi bi-box-arrow-up-right me-2"></i>
                        Ver en Polygonscan
                      </button>
                    </div>
                    <div className="col-md-4">
                      <button
                        className="btn btn-outline-dark btn-lg w-100"
                        onClick={limpiarFormulario}
                        style={{
                          borderRadius: '15px',
                          borderWidth: '2px',
                          fontWeight: '600',
                          padding: '1rem'
                        }}
                      >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Verificar Otro
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Información adicional - Solo visible si NO hay certificado */}
        {!certificado && (
        <div className="row justify-content-center mt-5">
          <div className="col-12 col-lg-8">
            <div className="card border-0 bg-Light bg-opacity-10">
              <div className="card-body p-4">
                <h5 className="text-primary mb-3">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  ¿Qué es la verificación en blockchain?
                </h5>

                <p className="mb-2">
                  Los certificados emitidos por nuestra plataforma están registrados en Polygon,
                  garantizando:
                </p>

                <ul className="mb-0">
                  <li><strong>Inmutabilidad:</strong> No pueden ser alterados</li>
                  <li><strong>Transparencia:</strong> Verificación pública</li>
                  <li><strong>Permanencia:</strong> Registro permanente</li>
                  <li><strong>Descentralización:</strong> No depende de una sola entidad</li>
                </ul>

              </div>
            </div>
          </div>
        </div>
        )}

      </div>

      {/* Agregar estilos de animación */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default VerificarCertificado;
