import React from "react"
import ImageUpao from '../assets/logo_upao.jpeg'

import appFirebase, { db } from "../credenciales"
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, reload } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
const auth = getAuth(appFirebase)

const Login = () => {

        const [registrando, setRegistrando] = React.useState(false)
        const [esperandoVerificacion, setEsperandoVerificacion] = React.useState(false)
        const [usuarioCreado, setUsuarioCreado] = React.useState(null)
        const [cargandoReenvio, setCargandoReenvio] = React.useState(false)
        const [mostrarPassword, setMostrarPassword] = React.useState(false)
        const [mostrarConfirmPassword, setMostrarConfirmPassword] = React.useState(false)

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
                alert('Email de verificación reenviado. Revisa tu bandeja de entrada y spam.');
            } catch {
                alert('Error al reenviar el email. Intenta de nuevo más tarde.');
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
                    alert('¡Email verificado exitosamente! Ya puedes iniciar sesión.');
                    setEsperandoVerificacion(false);
                    setUsuarioCreado(null);
                    setRegistrando(false);
                } else {
                    alert('El email aún no ha sido verificado. Revisa tu bandeja de entrada.');
                }
            } catch {
                alert('Error al verificar el estado del email.');
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

            // Validación del formato de Gmail
            if (!gmail.endsWith('@gmail.com')) {
                alert('Por favor, ingresa un email válido con formato @gmail.com');
                return;
            }

            // Validación adicional para asegurar que no solo sea "@gmail.com"
            if (gmail.length <= 10 || gmail === '@gmail.com') {
                alert('Por favor, ingresa un email válido. Ejemplo: usuario@gmail.com');
                return;
            }

            if (registrando) {
                // Obtener campos adicionales si está registrando
                const nombre = e.target.nombre?.value || '';
                const apellido = e.target.apellido?.value || '';
                const confirmPassword = e.target.confirmPassword?.value || '';

                // Validar campos adicionales para registro
                if (!nombre.trim() || !apellido.trim()) {
                    alert('Por favor, completa todos los campos para el registro.');
                    return;
                }

                // Validar contraseña segura
                const errorPassword = validarPasswordSegura(password);
                if (errorPassword) {
                    alert(errorPassword);
                    return;
                }

                // Validar que las contraseñas coincidan
                if (password !== confirmPassword) {
                    alert('Las contraseñas no coinciden. Por favor, verifica e intenta de nuevo.');
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
                    alert('¡Cuenta creada exitosamente! Se ha enviado un email de verificación a tu correo. Debes verificar tu email antes de iniciar sesión.');
                    setUsuarioCreado(user);
                    setEsperandoVerificacion(true);
                    
                } catch (error) {
                    if (error.code === 'auth/email-already-in-use') {
                        alert('Este email ya está registrado. Intenta iniciar sesión.');
                    } else if (error.code === 'auth/weak-password') {
                        alert('La contraseña debe tener al menos 6 caracteres.');
                    } else if (error.code === 'auth/invalid-email') {
                        alert('El formato del email no es válido.');
                    } else if (error.code === 'auth/operation-not-allowed') {
                        alert('El registro con email/contraseña no está habilitado. Contacta al administrador.');
                    } else {
                        alert(`Error al crear la cuenta: ${error.message}. Por favor, inténtalo de nuevo.`);
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
                        alert('Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
                        
                        // Ofrecer reenviar email
                        const reenviar = confirm('¿Quieres que reenviemos el email de verificación?');
                        if (reenviar) {
                            try {
                                await sendEmailVerification(user);
                                alert('Email de verificación reenviado. Revisa tu bandeja de entrada y spam.');
                            } catch {
                                alert('Error al reenviar el email.');
                            }
                        }
                        return;
                    }
                    

                } catch (error) {
                    if (error.code === 'auth/user-not-found') {
                        alert('No existe una cuenta con este email. ¿Deseas registrarte?');
                    } else if (error.code === 'auth/wrong-password') {
                        alert('Contraseña incorrecta. Por favor, inténtalo de nuevo.');
                    } else {
                        alert('Error al iniciar sesión. Verifica tus credenciales.');
                    }
                }
            }
        }
    return (
        <div className="login-container">
            <div className="login-content">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-6 col-lg-4">
                            <div className="padre">
                                <div className="card card-body login-card shadow">
                                    {esperandoVerificacion ? (
                                        // Vista de verificación de email
                                        <div className="text-center">
                                            <img src={ImageUpao} className="rounded-circle mb-4" width="120" height="120" alt="Profile" />
                                            <h4 className="text-primary mb-3">Verifica tu Email</h4>
                                            <div className="alert alert-info">
                                                <i className="fas fa-envelope mb-2"></i>
                                                <p className="mb-2">
                                                    Se ha enviado un email de verificación a:
                                                    <br />
                                                    <strong>{usuarioCreado?.email}</strong>
                                                </p>
                                                <small>Revisa tu bandeja de entrada y spam</small>
                                            </div>
                                            
                                            <div className="d-grid gap-2 mb-3">
                                                <button 
                                                    className="btn btn-success" 
                                                    onClick={verificarEmailConfirmado}
                                                >
                                                    ✓ Ya verifiqué mi email
                                                </button>
                                                
                                                <button 
                                                    className="btn btn-outline-primary"
                                                    onClick={reenviarEmailVerificacion}
                                                    disabled={cargandoReenvio}
                                                >
                                                    {cargandoReenvio ? '📧 Enviando...' : '📧 Reenviar email'}
                                                </button>
                                            </div>
                                            
                                            <button 
                                                className="btn btn-link text-muted"
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
                                            <form action="" onSubmit={functAutentication}>
                                                <div className="text-center mb-4">
                                                    <img src={ImageUpao} className="rounded-circle" width="150" height="200" alt="Profile" />
                                                </div>
                                                
                                                {registrando && (
                                                    <>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Ingresa tu nombre" 
                                                            className="form-control mb-3" 
                                                            id="nombre" 
                                                            required={registrando}
                                                        />
                                                        <input 
                                                            type="text" 
                                                            placeholder="Ingresa tu apellido" 
                                                            className="form-control mb-3" 
                                                            id="apellido" 
                                                            required={registrando}
                                                        />
                                                    </>
                                                )}
                                                
                                                <input type="text" placeholder="Ingresar gmail" className="form-control mb-3" id="gmail" required />
                                                
                                                {/* Campo de contraseña con icono de ojo */}
                                                <div className="input-group mb-3">
                                                    <input 
                                                        type={mostrarPassword ? "text" : "password"} 
                                                        placeholder="Ingresar contraseña" 
                                                        className="form-control" 
                                                        id="password" 
                                                        required 
                                                    />
                                                    <button 
                                                        type="button" 
                                                        className="btn password-toggle-btn"
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
                                                                className="btn password-toggle-btn"
                                                                onClick={() => setMostrarConfirmPassword(!mostrarConfirmPassword)}
                                                                title={mostrarConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                                            >
                                                                {mostrarConfirmPassword ? <IconoOjoCerrado /> : <IconoOjoAbierto />}
                                                            </button>
                                                        </div>
                                                        
                                                        <div className="alert alert-info mb-3">
                                                            <small>
                                                                <strong>Contraseña segura:</strong><br/>
                                                                • Mínimo 8 caracteres<br/>
                                                                • Al menos una mayúscula (A-Z)<br/>
                                                                • Al menos una minúscula (a-z)<br/>
                                                                • Al menos un número (0-9)<br/>
                                                                • Al menos un símbolo (!@#$%^&*...)
                                                            </small>
                                                        </div>
                                                    </>
                                                )}
                                                
                                                <button type="submit" className="btn btn-primary w-100">{registrando ? "Registrate" : "Inicia Sesion"}</button>
                                            </form>
                                            <div className="text-center toggle-section">
                                                <h4 className="toggle-text">{registrando ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}
                                                    <button className="toggle-button" onClick={() => setRegistrando(!registrando)}>
                                                        {registrando ? "Inicia Sesion" : "Registrate"}
                                                    </button>
                                                </h4>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


export default Login