import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/credenciales';
import { authService } from '../../services/authService';
import toastHelper from '../../core/utils/toastHelper';
import logger from '../../core/utils/logger';

const Perfil = () => {
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();
    
    const [userData, setUserData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        role: ''
    });
    
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: ''
    });
    
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Cargar datos del usuario
    useEffect(() => {
        const loadUserData = async () => {
            if (!currentUser) {
                navigate('/login');
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData(data);
                    setFormData({
                        nombre: data.nombre || '',
                        apellido: data.apellido || ''
                    });
                }
            } catch (error) {
                logger.error('Error al cargar datos del usuario:', error);
                toastHelper.error('Error al cargar los datos del perfil');
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [currentUser, navigate]);

    // Actualizar nombre y apellido
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        
        if (!formData.nombre.trim() || !formData.apellido.trim()) {
            toastHelper.error('El nombre y apellido son obligatorios');
            return;
        }

        if (formData.nombre.length < 2 || formData.apellido.length < 2) {
            toastHelper.error('Nombre y apellido deben tener al menos 2 caracteres');
            return;
        }

        setUpdating(true);
        try {
            // Actualizar en Firestore
            await updateDoc(doc(db, "users", currentUser.uid), {
                nombre: formData.nombre.trim(),
                apellido: formData.apellido.trim()
            });

            // Actualizar displayName en Firebase Auth
            await updateProfile(currentUser, {
                displayName: `${formData.nombre.trim()} ${formData.apellido.trim()}`
            });

            setUserData({
                ...userData,
                nombre: formData.nombre.trim(),
                apellido: formData.apellido.trim()
            });

            toastHelper.success('✅ Perfil actualizado correctamente');
            logger.log('Perfil actualizado exitosamente');
        } catch (error) {
            logger.error('Error al actualizar perfil:', error);
            toastHelper.error('Error al actualizar el perfil');
        } finally {
            setUpdating(false);
        }
    };

    // Cambiar contraseña
    const handleChangePassword = async (e) => {
        e.preventDefault();

        // Validaciones
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toastHelper.error('Todos los campos son obligatorios');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toastHelper.error('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toastHelper.error('Las contraseñas no coinciden');
            return;
        }

        if (passwordData.currentPassword === passwordData.newPassword) {
            toastHelper.error('La nueva contraseña debe ser diferente a la actual');
            return;
        }

        setChangingPassword(true);
        try {
            // Primero verificar la contraseña actual re-autenticando
            const { signInWithEmailAndPassword, getAuth } = await import('firebase/auth');
            const appFirebase = (await import('../../config/credenciales')).default;
            const auth = getAuth(appFirebase);
            
            await signInWithEmailAndPassword(auth, currentUser.email, passwordData.currentPassword);

            // Si la re-autenticación fue exitosa, actualizar la contraseña
            await updatePassword(currentUser, passwordData.newPassword);

            toastHelper.success('✅ Contraseña actualizada correctamente');
            logger.log('Contraseña actualizada exitosamente');
            
            // Limpiar formulario
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            logger.error('Error al cambiar contraseña:', error);
            
            if (error.code === 'auth/wrong-password') {
                toastHelper.error('La contraseña actual es incorrecta');
            } else if (error.code === 'auth/too-many-requests') {
                toastHelper.error('Demasiados intentos. Intenta más tarde');
            } else {
                toastHelper.error('Error al cambiar la contraseña');
            }
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid py-5">
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="text-muted">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <div className="row mb-4">
                <div className="col-12">
                    <h2 className="fw-bold text-primary mb-1">Mi Perfil</h2>
                    <p className="text-muted mb-0">Administra tu información personal y seguridad</p>
                </div>
            </div>

            <div className="row g-4">
                {/* Información del usuario */}
                <div className="col-12 col-lg-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0">
                            <h5 className="mb-0 fw-bold text-dark">
                                <i className="bi bi-person-circle me-2"></i>
                                Información Personal
                            </h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleButtonClick(handleUpdateProfile)}>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={userData.email}
                                        disabled
                                    />
                                    <small className="text-muted">El correo no puede ser modificado</small>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Rol</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={userData.role === 'alumno' ? 'Estudiante' : 'Organizador'}
                                        disabled
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Nombre <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                        placeholder="Ingresa tu nombre"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-semibold">
                                        Apellido <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.apellido}
                                        onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                                        placeholder="Ingresa tu apellido"
                                        required
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={updating || isButtonDisabled}
                                >
                                    {updating ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Actualizando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-circle me-2"></i>
                                            Actualizar Información
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Cambiar contraseña */}
                <div className="col-12 col-lg-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0">
                            <h5 className="mb-0 fw-bold text-dark">
                                <i className="bi bi-shield-lock me-2"></i>
                                Cambiar Contraseña
                            </h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleButtonClick(handleChangePassword)}>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Contraseña Actual <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                        placeholder="Ingresa tu contraseña actual"
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Nueva Contraseña <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                        placeholder="Ingresa tu nueva contraseña"
                                        required
                                        minLength={6}
                                    />
                                    <small className="text-muted">Mínimo 6 caracteres</small>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-semibold">
                                        Confirmar Nueva Contraseña <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                        placeholder="Confirma tu nueva contraseña"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-primary-custom w-100"
                                    disabled={changingPassword || isButtonDisabled}
                                >
                                    {changingPassword ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Cambiando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-key me-2"></i>
                                            Cambiar Contraseña
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Información adicional */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="alert alert-info border-0">
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>Nota:</strong> Los cambios en tu nombre se reflejarán en toda la plataforma. 
                        Para cambios en el correo electrónico o rol, contacta al administrador.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Perfil;
