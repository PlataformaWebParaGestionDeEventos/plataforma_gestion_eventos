import React, { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import toastHelper from '../../core/utils/toastHelper';
import logger from '../../core/utils/logger';

const RecuperarContrasenaModal = ({ show, onClose }) => {
    const [email, setEmail] = useState('');
    const [enviando, setEnviando] = useState(false);
    const auth = getAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validación del formato de email (acepta cualquier dominio)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toastHelper.error('❌ Por favor, ingresa un email válido. Ejemplo: usuario@dominio.com');
            return;
        }

        setEnviando(true);
        try {
            await sendPasswordResetEmail(auth, email);
            toastHelper.success('✅ Email de recuperación enviado. Revisa tu bandeja de entrada y spam.');
            logger.log('✅ Email de recuperación enviado a:', email);
            setEmail('');
            onClose();
        } catch (error) {
            logger.error('❌ Error al enviar email de recuperación:', error);
            
            if (error.code === 'auth/user-not-found') {
                toastHelper.error('❌ No existe una cuenta con este email.');
            } else if (error.code === 'auth/invalid-email') {
                toastHelper.error('❌ El formato del email no es válido.');
            } else if (error.code === 'auth/too-many-requests') {
                toastHelper.error('⚠️ Demasiados intentos. Intenta de nuevo más tarde.');
            } else {
                toastHelper.error('❌ Error al enviar el email. Intenta de nuevo.');
            }
        } finally {
            setEnviando(false);
        }
    };

    if (!show) return null;

    return (
        <div 
            className="modal fade show" 
            style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => {
                if (e.target.className.includes('modal')) {
                    onClose();
                }
            }}
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content" style={{
                    borderRadius: '15px',
                    border: 'none',
                    boxShadow: 'var(--shadow-primary-lg)'
                }}>
                    <div className="modal-header" style={{
                        background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
                        color: 'white',
                        borderTopLeftRadius: '15px',
                        borderTopRightRadius: '15px',
                        border: 'none'
                    }}>
                        <h5 className="modal-title">
                            <i className="bi bi-key-fill me-2"></i>
                            Recuperar Contraseña
                        </h5>
                        <button 
                            type="button" 
                            className="btn-close btn-close-white" 
                            onClick={onClose}
                            disabled={enviando}
                        ></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body" style={{ padding: '30px' }}>
                            <div className="alert alert-info-custom mb-4">
                                <i className="bi bi-info-circle-fill me-2"></i>
                                Te enviaremos un email con instrucciones para restablecer tu contraseña.
                            </div>
                            
                            <div className="mb-3">
                                <label htmlFor="emailRecuperacion" className="form-label fw-semibold">
                                    <i className="bi bi-envelope-fill me-2"></i>
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="emailRecuperacion"
                                    placeholder="usuario@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={enviando}
                                    style={{
                                        borderRadius: '10px',
                                        border: '2px solid var(--gray-300)',
                                        padding: '12px 16px',
                                        fontSize: '16px'
                                    }}
                                />
                                <small className="text-muted">
                                    Ingresa el email con el que te registraste
                                </small>
                            </div>
                        </div>
                        <div className="modal-footer" style={{
                            borderTop: '1px solid var(--gray-200)',
                            padding: '20px 30px'
                        }}>
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={onClose}
                                disabled={enviando}
                                style={{
                                    borderRadius: '10px',
                                    padding: '10px 24px',
                                    fontWeight: '600'
                                }}
                            >
                                <i className="bi bi-x-circle me-2"></i>
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary-custom"
                                disabled={enviando}
                                style={{
                                    borderRadius: '10px',
                                    padding: '10px 24px',
                                    fontWeight: '600'
                                }}
                            >
                                {enviando ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-send-fill me-2"></i>
                                        Enviar Email
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RecuperarContrasenaModal;
