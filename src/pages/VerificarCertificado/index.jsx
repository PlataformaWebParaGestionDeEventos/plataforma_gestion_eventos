import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import logger from '../../core/utils/logger';
import FondoImage from '../../assets/fondo.jpg';
import ImageUpao from '../../assets/logo_upao.jpeg';

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

  const abrirEnPolygonscan = () => {
    window.open(`${POLYGONSCAN_BASE}/address/${CONTRACT_ADDRESS}`, "_blank");
  };

  const limpiarFormulario = () => {
    setHashInput('');
    setCertificado(null);
    setError(null);
  };

  return (
    <div 
      className="min-vh-100 d-flex align-items-center position-relative" 
      style={{
        backgroundImage: `url(${FondoImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay semi-transparente */}
      <div 
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1
        }}
      ></div>

      {/* Contenido */}
      <div className="container-fluid position-relative" style={{ zIndex: 2 }}>
        <div className="row justify-content-center">

          {/* Formulario de Verificación - Solo visible si NO hay certificado */}
          {!certificado && (
            <div className="col-11 col-sm-10 col-md-8 col-lg-7 col-xl-6">
              <div className="card border-0 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
                <div className="card-body p-4 p-sm-5">
                  
                  {/* Botón Volver */}
                  <button 
                    className="btn position-absolute top-0 start-0 m-3 text-primary fw-bold"
                    onClick={() => navigate('/')}
                    style={{ 
                      zIndex: 10, 
                      fontSize: '20px',
                      textDecoration: 'none',
                      color: '#0d6efd',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    title="Volver al inicio"
                  >
                    {"<"}
                  </button>

                  {/* Header con logo */}
                  <div className="text-center mb-4">
                    <h2 className="h4 fw-bold text-primary mb-2" style={{ fontSize: '3rem' }}>Verificar Certificado</h2>
                    <p className="text-muted small mb-0" style={{ fontSize: '1rem' }}>
                      Verifica la autenticidad de certificados académicos registrados en blockchain
                    </p>
                  </div>

                  {/* Input del Hash */}
                  <small className="text-muted d-block mt-2 fw-bold">
                      <i className="bi bi-info-circle me-1"></i>
                      Ingresa el Hash del Certificado
                    </small>
                  <div className="mb-3">
                    <input
                      type="text"
                      className={`form-control ${error ? 'is-invalid' : ''}`}
                      placeholder="0x1234567890abcdef..."
                      value={hashInput}
                      onChange={(e) => { setHashInput(e.target.value); setError(null); }}
                      disabled={loading}
                      style={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.9rem'
                      }}
                    />
                    {error && (
                      <div className="invalid-feedback">{error}</div>
                    )}
                    <small className="text-muted d-block mt-2">
                      <i className="bi bi-info-circle me-1"></i>
                      El hash debe comenzar con "0x" y tener 66 caracteres hexadecimales
                    </small>
                  </div>

                  {/* Botón Verificar */}
                  <div className="d-grid mb-3">
                    <button
                      type="button"
                      className="btn btn-primary btn-lg fw-semibold"
                      onClick={verificarCertificado}
                      disabled={loading || !hashInput.trim()}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Verificando en Blockchain...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-shield-check me-2"></i>
                          Verificar
                        </>
                      )}
                    </button>
                  </div>

                  {/* Info adicional */}
                  <div className="border-top pt-5">
                    <p className="text-muted small mb-3">
                      <h5 className="text-primary mb-3">
                        <i className="bi bi-info-circle-fill me-2">
                        ¿Qué es la verificación en blockchain?</i>
                      </h5>
                    </p>
                    <p className='mb-2'>
                      Los certificados emitidos por nuestra plataforma están registrados en Polygon, garantizando: 
                    </p>
                    <ul className="mb-0"></ul>
                      <p><strong>- Inmutabilidad:</strong> No pueden ser alterados.</p>
                      <p><strong>- Transparencia:</strong> Verificación pública.</p>
                      <p><strong>- Permanencia:</strong> Registro permanente.</p>
                      <p><strong>- Descentralización:</strong> No depende de una sola entidad.</p>

                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Resultado - Certificado Válido */}
          {certificado && certificado.existe && (
            <div className="col-11 col-sm-10 col-md-9 col-lg-8 col-xl-7" style={{ animation: 'fadeIn 0.5s ease-in' }}>
              <div className="card border-0 shadow-lg" style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                overflow: 'hidden'
              }}>

                {/* Header */}
                <div 
                  className="text-white py-4 px-4"
                  style={{ 
                    background: certificado.revocado 
                      ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
                      : 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
                    boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between flex-wrap">
                    <div>
                      <h2 className="mb-1 h4" style={{ fontWeight: '700' }}>
                        <i className="bi bi-patch-check-fill me-2"></i>
                        Certificado {certificado.revocado ? 'Revocado' : 'Verificado'}
                      </h2>
                      <p className="mb-0 opacity-75 small">Blockchain Polygon</p>
                    </div>
                  </div>
                </div>

                {/* Alerta de Revocado */}
                {certificado.revocado && (
                  <div className="alert alert-danger m-4 mb-0">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>⚠️ Este certificado ha sido revocado y ya no es válido.</strong>
                  </div>
                )}

                {/* Cuerpo */}
                <div className="card-body p-4">
                  <div className="row g-3">

                    {/* Nombre destacado */}
                    <div className="col-12 text-center">
                      <div className="p-3" style={{ 
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%)',
                        borderRadius: '15px',
                        border: '2px solid #0d6efd'
                      }}>
                        <label className="text-muted small mb-1 d-block fw-bold">NOMBRE DEL TITULAR</label>
                        <h3 className="fw-bold mb-0 text-primary">{certificado.nombre}</h3>
                      </div>
                    </div>

                    {/* Evento */}
                      <div className="col-12">
                        <label className="text-muted small mb-1 fw-bold">
                          <i className="bi bi-file-text me-1"></i>
                          Evento
                        </label>
                        <p className="mb-0">{certificado.evento}</p>
                      </div>
                    {/* Tipo de Certificado */}
                      <div className="col-12">
                        <label className="text-muted small mb-1 fw-bold">
                          <i className="bi bi-file-text me-1"></i>
                          Tipo de Certificado
                        </label>
                        <p className="mb-0">{certificado.tipo === 0 ? 'Participante' : 
                          certificado.tipo === 1 ? 'Ponente' : 
                          'Organizador'}</p>
                      </div>
                    {/* Detalle (si existe) */}
                    {certificado.detalle && (
                      <div className="col-12">
                        <label className="text-muted small mb-1 fw-bold">
                          <i className="bi bi-file-text me-1"></i>
                          Detalle
                        </label>
                        <p className="mb-0">{certificado.detalle}</p>
                      </div>
                    )}
                    
                    {/* Horas Académicas */}
                    <div className="col-12">
                        <label className="text-muted small mb-1 fw-bold">
                          <i className="bi bi-file-text me-1"></i>
                          Horas Académicas
                        </label>
                        <p className="mb-0">{certificado.horas}</p>
                      </div>

                    {/* Fecha de Emisión */}
                    <div className="col-12">
                        <label className="text-muted small mb-1 fw-bold">
                          <i className="bi bi-file-text me-1"></i>
                          Fecha de Emisión
                        </label>
                        <p className="mb-0">{formatearFecha(certificado.fecha)}</p>
                      </div>

                    {/* Hash */}
                    <div className="col-12">
                      <label className="text-muted small mb-1 fw-bold">
                        <i className="bi bi-fingerprint me-1"></i>
                        Hash del Documento
                      </label>
                      <code className="d-block bg-light p-2 rounded text-break small">
                        {certificado.hash}
                      </code>
                      <small className="text-muted">
                        Este hash está almacenado en el contrato de Polygon.
                      </small>
                    </div>

                    {/* Emisor */}
                    <div className="col-12">
                      <label className="text-muted small mb-1 fw-bold">
                        <i className="bi bi-building me-1"></i>
                        Emisor (Dirección)
                      </label>
                      <code className="d-block bg-light p-2 rounded text-break small">
                        {certificado.emisor}
                      </code>
                    </div>

                  </div>
                </div>

                {/* Footer con botones */}
                <div className="card-footer border-0 p-4" style={{ background: '#f8f9fa' }}>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <button
                        className="btn btn-outline-secondary w-100"
                        onClick={() => navigate('/')}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Volver
                      </button>
                    </div>
                    <div className="col-md-4">
                      <button
                        className="btn btn-primary w-100"
                        onClick={abrirEnPolygonscan}
                      >
                        <i className="bi bi-box-arrow-up-right me-2"></i>
                        Polygonscan
                      </button>
                    </div>
                    <div className="col-md-4">
                      <button
                        className="btn btn-outline-dark w-100"
                        onClick={limpiarFormulario}
                      >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Verificar Otro
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* Estilos de animación */}
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
