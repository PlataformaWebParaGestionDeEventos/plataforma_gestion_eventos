import React from "react"
import { useNavigate } from "react-router-dom"
import ImageUpao from '../../assets/logo_upao.jpeg'
import FondoImage from '../../assets/fondo.jpg'

import appFirebase, { db } from "../../config/credenciales"
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, reload } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import toastHelper from "../../core/utils/toastHelper"
import logger from "../../core/utils/logger"
import RecuperarContrasenaModal from "../../components/auth/RecuperarContrasenaModal"

const auth = getAuth(appFirebase)

const Login = ({ modoInicial = 'login' }) => {
        const navigate = useNavigate();

        const [registrando, setRegistrando] = React.useState(modoInicial === 'register')
        const [esperandoVerificacion, setEsperandoVerificacion] = React.useState(false)
        const [usuarioCreado, setUsuarioCreado] = React.useState(null)
        const [cargandoReenvio, setCargandoReenvio] = React.useState(false)
        const [mostrarPassword, setMostrarPassword] = React.useState(false)
        const [mostrarConfirmPassword, setMostrarConfirmPassword] = React.useState(false)
        const [mostrarModalRecuperar, setMostrarModalRecuperar] = React.useState(false)

        // Función para validar contraseña segura
        const validarPasswordSegura = (password) => {
            if (password.length < 8) {
                return "La contraseña debe tener al menos 8 caracteres";
            }
            if (!/[a-z]/.test(password)) {
                return "La contraseña debe contener al menos una letra minúscula";
            }
            if (!/[A-Z]/.test(password)) {
                return "La contraseña debe contener al menos una letra mayúscula";
            }
            if (!/[0-9]/.test(password)) {
                return "La contraseña debe contener al menos un número";
            }
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                return "La contraseña debe contener al menos un símbolo (!@#$%^&*(),.?\":{}|<>)";
            }
            return null; // Contraseña válida
        }

        // Función para reenviar email de verificación
        const reenviarEmailVerificacion = async () => {
            if (!usuarioCreado) return;
            
            setCargandoReenvio(true);
            try {
                await sendEmailVerification(usuarioCreado);
                toastHelper.success('📧 Email de verificación reenviado. Revisa tu bandeja de entrada y spam.');
                logger.log('✅ Email de verificación reenviado');
            } catch (error) {
                toastHelper.error('❌ Error al reenviar el email. Intenta de nuevo más tarde.');
                logger.error('❌ Error al reenviar email:', error);
            } finally {
                setCargandoReenvio(false);
            }
        }

        // Función para verificar si el email está confirmado
        const verificarEmailConfirmado = async () => {
            if (!usuarioCreado) return;
            
            try {
                await reload(usuarioCreado);
                if (usuarioCreado.emailVerified) {
                    toastHelper.success('✅ ¡Email verificado exitosamente! Ya puedes iniciar sesión.');
                    logger.log('✅ Email verificado');
                    setEsperandoVerificacion(false);
                    setUsuarioCreado(null);
                    setRegistrando(false);
                } else {
                    toastHelper.warning('⚠️ El email aún no ha sido verificado. Revisa tu bandeja de entrada.');
                }
            } catch (error) {
                toastHelper.error('❌ Error al verificar el estado del email.');
                logger.error('❌ Error al verificar email:', error);
            }
        }

        // Componentes de iconos SVG
        const IconoOjoAbierto = () => (
            <svg className="password-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        );

        const IconoOjoCerrado = () => (
            <svg className="password-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1749 15.0074 10.8016 14.8565C10.4283 14.7056 10.0887 14.481 9.80385 14.1962C9.51900 13.9113 9.29440 13.5717 9.14351 13.1984C8.99261 12.8251 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4858 9.58525 10.1546 9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        );

        const functAutentication = async (e) => {
            e.preventDefault()
            const gmail = e.target.gmail.value;
            const password = e.target.password.value;

            // Validación del formato de email (acepta cualquier dominio)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(gmail)) {
                toastHelper.error('❌ Por favor, ingresa un email válido. Ejemplo: usuario@dominio.com');
                return;
            }

            if (registrando) {
                // Obtener campos adicionales si está registrando
                const nombre = e.target.nombre?.value || '';
                const apellido = e.target.apellido?.value || '';
                const confirmPassword = e.target.confirmPassword?.value || '';

                // Validar campos adicionales para registro
                if (!nombre.trim() || !apellido.trim()) {
                    toastHelper.warning('⚠️ Por favor, completa todos los campos para el registro.');
                    return;
                }

                // Validar contraseña segura
                const errorPassword = validarPasswordSegura(password);
                if (errorPassword) {
                    toastHelper.error(`❌ ${errorPassword}`);
                    return;
                }

                // Validar que las contraseñas coincidan
                if (password !== confirmPassword) {
                    toastHelper.error('❌ Las contraseñas no coinciden. Por favor, verifica e intenta de nuevo.');
                    return;
                }

                try {
                    // Crear usuario en Firebase Auth
                    const userCredential = await createUserWithEmailAndPassword(auth, gmail, password);
                    const user = userCredential.user;

                    // Enviar email de verificación
                    await sendEmailVerification(user);

                    // Intentar guardar información adicional en Firestore (no crítico)
                    try {
                        await setDoc(doc(db, "users", user.uid), {
                            uid: user.uid,
                            nombre: nombre.trim(),
                            apellido: apellido.trim(),
                            email: gmail,
                            role: "alumno",  // todos los nuevos son alumnos por defecto
                            fechaRegistro: new Date(),
                            tipo: 'usuario',
                            emailVerificado: false
                        });
                    } catch {
                        // El registro sigue siendo exitoso aunque Firestore falle
                    }

                    // Mostrar mensaje y cambiar estado
                    toastHelper.success('✅ ¡Cuenta creada exitosamente! Se ha enviado un email de verificación a tu correo.');
                    logger.log('✅ Cuenta creada:', user.email);
                    setUsuarioCreado(user);
                    setEsperandoVerificacion(true);
                    
                } catch (error) {
                    logger.error('❌ Error al crear cuenta:', error);
                    if (error.code === 'auth/email-already-in-use') {
                        toastHelper.error('❌ Este email ya está registrado. Intenta iniciar sesión.');
                    } else if (error.code === 'auth/weak-password') {
                        toastHelper.error('❌ La contraseña debe tener al menos 6 caracteres.');
                    } else if (error.code === 'auth/invalid-email') {
                        toastHelper.error('❌ El formato del email no es válido.');
                    } else if (error.code === 'auth/operation-not-allowed') {
                        toastHelper.error('❌ El registro con email/contraseña no está habilitado. Contacta al administrador.');
                    } else {
                        toastHelper.error(`❌ Error al crear la cuenta: ${error.message}`);
                    }
                }
            } else {
                try {
                    const userCredential = await signInWithEmailAndPassword(auth, gmail, password);
                    const user = userCredential.user;
                    
                    // Refrescar el estado del usuario para obtener el estado más actualizado del email
                    await reload(user);
                    
                    // Verificar si el email está confirmado
                    if (!user.emailVerified) {
                        // Cerrar sesión inmediatamente si no está verificado
                        await auth.signOut();
                        toastHelper.warning('⚠️ Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
                        
                        // Ofrecer reenviar email
                        const reenviar = await toastHelper.confirm('¿Quieres que reenviemos el email de verificación?');
                        if (reenviar) {
                            try {
                                await sendEmailVerification(user);
                                toastHelper.success('📧 Email de verificación reenviado. Revisa tu bandeja de entrada y spam.');
                                logger.log('✅ Email reenviado');
                            } catch (error) {
                                toastHelper.error('❌ Error al reenviar el email.');
                                logger.error('❌ Error al reenviar:', error);
                            }
                        }
                        return;
                    }
                    
                    // Login exitoso - Obtener rol y navegar
                    toastHelper.success('✅ Inicio de sesión exitoso');
                    logger.log('✅ Usuario autenticado:', user.email);
                    
                    // Obtener rol del usuario desde Firestore
                    try {
                        const userDoc = await getDoc(doc(db, 'users', user.uid));
                        if (userDoc.exists()) {
                            const rol = userDoc.data().rol;
                            logger.log('📋 Rol del usuario:', rol);
                            
                            // Navegar según rol
                            if (rol === 'organizador') {
                                navigate('/organizador');
                            } else {
                                navigate('/alumno');
                            }
                        } else {
                            logger.warn('⚠️ Documento de usuario no encontrado');
                            navigate('/alumno'); // Por defecto
                        }
                    } catch (error) {
                        logger.error('❌ Error al obtener rol:', error);
                        navigate('/alumno'); // Por defecto en caso de error
                    }

                } catch (error) {
                    logger.error('❌ Error al iniciar sesión:', error);
                    if (error.code === 'auth/user-not-found') {
                        toastHelper.error('❌ No existe una cuenta con este email. ¿Deseas registrarte?');
                    } else if (error.code === 'auth/wrong-password') {
                        toastHelper.error('❌ Contraseña incorrecta. Por favor, inténtalo de nuevo.');
                    } else {
                        toastHelper.error('❌ Error al iniciar sesión. Verifica tus credenciales.');
                    }
                }
            }
        }
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
            {/* Overlay semi-transparente para mejorar legibilidad */}
            <div 
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    zIndex: 1
                }}
            ></div>

            {/* Contenido del login */}
            <div className="container-fluid position-relative" style={{ zIndex: 2 }}>
                <div className="row justify-content-center">
                    <div className="col-11 col-sm-8 col-md-6 col-lg-5 col-xl-4 col-xxl-3">
                        <div className="card border-0 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
                            <div className="card-body p-4 p-sm-5">                                  
                                <button 
                                    className="btn position-absolute top-0 start-0 m-3 text-p fw-bold"
                                    onClick={() => navigate('/')}
                                    style={{ 
                                    zIndex: 10, 
                                    fontSize: '20px',
                                    textDecoration: 'none', // quita subrayado del link
                                    color: '#0d6efd', // color azul bootstrap
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer'
                                    }}
                                    title="Volver al inicio"
                                >
                                    {"<"}
                                </button>
            
                                {esperandoVerificacion ? (
                                    // Vista de verificación de email
                                    <div className="text-center">
                                        <img 
                                            src={ImageUpao} 
                                            className="mb-4 rounded-circle" 
                                            style={{width: '120px', height: 'auto'}}
                                            alt="UPAO Logo" 
                                        />
                                        <h4 className="text-primary mb-3 h5">Verifica tu Email</h4>
                                        <div className="alert alert-info">
                                            <div className="mb-2">
                                                <i className="fas fa-envelope mb-2"></i>
                                                <p className="mb-2 small">
                                                    Se ha enviado un email de verificación a:
                                                </p>
                                                <strong className="small">{usuarioCreado?.email}</strong>
                                            </div>
                                            <small className="text-muted">Revisa tu bandeja de entrada y spam</small>
                                        </div>
                                        
                                        <div className="d-grid gap-2 mb-3">
                                            <button 
                                                className="btn btn-success btn-sm" 
                                                onClick={verificarEmailConfirmado}
                                            >
                                                ✓ Ya verifiqué mi email
                                            </button>
                                            
                                            <button 
                                                className="btn btn-outline-primary btn-sm"
                                                onClick={reenviarEmailVerificacion}
                                                disabled={cargandoReenvio}
                                            >
                                                {cargandoReenvio ? 'Enviando...' : 'Reenviar email'}
                                            </button>
                                        </div>
                                        
                                        <button 
                                            className="btn btn-link text-muted btn-sm"
                                            onClick={() => {
                                                setEsperandoVerificacion(false);
                                                setUsuarioCreado(null);
                                                setRegistrando(false);
                                            }}
                                        >
                                            ← Volver al login
                                        </button>
                                    </div>
                                ) : (
                                    // Vista normal de login/registro
                                    <>
                                        <form onSubmit={functAutentication}>
                                            <div className="text-center mb-4">
                                                <img 
                                                    src={ImageUpao} 
                                                    className="rounded-circle mb-3" 
                                                    style={{width: '140px', height: 'auto'}}
                                                    alt="UPAO Logo" 
                                                />
                                                <h2 className="h4 fw-bold text-primary mb-2">Eventos de la UPAO</h2>
                                                <p className="text-muted small mb-0">
                                                    {registrando ? 'Crear nueva cuenta' : 'Iniciar sesión'}
                                                </p>
                                            </div>
                                            
                                            {registrando && (
                                                <div className="row g-2 mb-3">
                                                    <div className="col-6">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Nombre(s)" 
                                                            className="form-control" 
                                                            id="nombre" 
                                                            required={registrando}
                                                        />
                                                    </div>
                                                    <div className="col-6">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Apellidos" 
                                                            className="form-control" 
                                                            id="apellido" 
                                                            required={registrando}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="mb-3">
                                                <input 
                                                    type="email" 
                                                    placeholder="correo@gmail.com" 
                                                    className="form-control" 
                                                    id="gmail" 
                                                    required 
                                                />
                                            </div>
                                            
                                            {/* Campo de contraseña con icono de ojo */}
                                            <div className="input-group mb-3">
                                                <input 
                                                    type={mostrarPassword ? "text" : "password"} 
                                                    placeholder="Contraseña" 
                                                    className="form-control" 
                                                    id="password" 
                                                    required 
                                                />
                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => setMostrarPassword(!mostrarPassword)}
                                                    title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                                >
                                                    {mostrarPassword ? <IconoOjoCerrado /> : <IconoOjoAbierto />}
                                                </button>
                                            </div>

                                            {/* Campo de confirmación de contraseña solo para registro */}
                                            {registrando && (
                                                <>
                                                    <div className="input-group mb-3">
                                                        <input 
                                                            type={mostrarConfirmPassword ? "text" : "password"} 
                                                            placeholder="Confirmar contraseña" 
                                                            className="form-control" 
                                                            id="confirmPassword" 
                                                            required 
                                                        />
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => setMostrarConfirmPassword(!mostrarConfirmPassword)}
                                                            title={mostrarConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                                        >
                                                            {mostrarConfirmPassword ? <IconoOjoCerrado /> : <IconoOjoAbierto />}
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="alert alert-info mb-3">
                                                        <small className="fw-semibold">Contraseña segura:</small>
                                                        <ul className="mb-0 mt-1 small">
                                                            <li>Mínimo 8 caracteres</li>
                                                            <li>Mayúsculas y Minúsculas (A-Z) (a-z)</li>
                                                            <li>Números (0-9) y Símbolos (!@#$%...)</li>
                                                        </ul>
                                                    </div>
                                                </>
                                            )}
                                            
                                            <div className="d-grid mb-3">
                                                <button type="submit" className="btn btn-primary btn-lg fw-semibold">
                                                    {registrando ? "Crear Cuenta" : "Iniciar Sesión"}
                                                </button>
                                            </div>
                                            
                                            {!registrando && (
                                                <div className="text-center mb-3">
                                                    <button 
                                                        type="button"
                                                        className="btn btn-link p-0 text-decoration-none small" 
                                                        onClick={() => setMostrarModalRecuperar(true)}
                                                        style={{ color: 'var(--primary-600)' }}
                                                    >
                                                        <i className="bi bi-key me-1"></i>
                                                        ¿Olvidaste tu contraseña?
                                                    </button>
                                                </div>
                                            )}
                                        </form>
                                        
                                        <div className="text-center border-top pt-3">
                                            <p className="text-muted small mb-2">
                                                {registrando ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}
                                            </p>
                                            <button 
                                                className="btn btn-link p-0 text-decoration-none fw-semibold" 
                                                onClick={() => setRegistrando(!registrando)}
                                            >
                                                {registrando ? "Iniciar Sesión" : "Crear Cuenta"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Modal de Recuperar Contraseña */}
            <RecuperarContrasenaModal 
                show={mostrarModalRecuperar}
                onClose={() => setMostrarModalRecuperar(false)}
            />
        </div>
    )
}


export default Login