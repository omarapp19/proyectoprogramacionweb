import React, { useEffect, useMemo, useState } from 'react';
import { Save, Building2, User, Calendar, Lock, Eye, EyeOff, X } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const Configuration = () => {
    const { currentUser, getCurrentUserData, updateUserProfile, changeUserPassword } = useAuth();

    const [generalSettings, setGeneralSettings] = useState({
        storeName: 'Galpon',
        adminName: 'Omar Pérez'
    });

    const [profile, setProfile] = useState({
        name: '',
        age: ''
    });

    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingGeneral, setSavingGeneral] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [message, setMessage] = useState(null);
    const [profileMessage, setProfileMessage] = useState(null);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState({
        current: false,
        next: false,
        confirm: false
    });
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState(null);

    const settingsRef = doc(db, 'settings', 'global_settings');
    const userAge = useMemo(() => {
        if (profile.age === '') {
            return '';
        }
        return String(profile.age);
    }, [profile.age]);

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchSettings(), fetchProfile()]);
            setLoading(false);
        };

        if (currentUser) {
            loadData();
        }
    }, [currentUser]);

    const fetchSettings = async () => {
        try {
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists()) {
                setGeneralSettings(docSnap.data());
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchProfile = async () => {
        try {
            const userData = await getCurrentUserData();
            console.log('User data from Firebase:', userData);

            if (userData) {
                setProfile({
                    name: userData.name || currentUser?.displayName || '',
                    age: userData.age ? String(userData.age) : ''
                });
                setUserRole(userData.role || 'Usuario');
            } else {
                // Si no existe userData, usar displayName de Firebase Auth
                setProfile({
                    name: currentUser?.displayName || '',
                    age: ''
                });
                setUserRole('Usuario');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleGeneralChange = (e) => {
        const { name, value } = e.target;
        setGeneralSettings((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({
            ...prev,
            [name]: name === 'age' ? value.replace(/[^0-9]/g, '') : value
        }));
    };

    const handleGeneralSubmit = async (e) => {
        e.preventDefault();
        setSavingGeneral(true);
        setMessage(null);

        try {
            await setDoc(settingsRef, {
                ...generalSettings,
                updatedAt: new Date()
            });

            setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Error al conectar con Firebase' });
        } finally {
            setSavingGeneral(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileMessage(null);

        const trimmedName = profile.name.trim();
        const parsedAge = Number.parseInt(profile.age, 10);

        if (!trimmedName) {
            setProfileMessage({ type: 'error', text: 'El nombre es obligatorio.' });
            setSavingProfile(false);
            return;
        }

        if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
            setProfileMessage({ type: 'error', text: 'Ingresa una edad válida (1 a 120).' });
            setSavingProfile(false);
            return;
        }

        try {
            await updateUserProfile({
                name: trimmedName,
                age: parsedAge
            });
            setProfile({
                name: trimmedName,
                age: String(parsedAge)
            });
            setProfileMessage({ type: 'success', text: 'Perfil actualizado exitosamente.' });
        } catch (error) {
            console.error(error);
            setProfileMessage({ type: 'error', text: 'No se pudo actualizar el perfil.' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setPasswordMessage(null);
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setShowPassword({
            current: false,
            next: false,
            confirm: false
        });
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setSavingPassword(true);
        setPasswordMessage(null);

        if (passwordForm.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
            setSavingPassword(false);
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'La confirmación de contraseña no coincide.' });
            setSavingPassword(false);
            return;
        }

        try {
            await changeUserPassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            setPasswordMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
            setTimeout(() => {
                closePasswordModal();
            }, 900);
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                setPasswordMessage({ type: 'error', text: 'La contraseña actual es incorrecta.' });
            } else if (error.code === 'auth/too-many-requests') {
                setPasswordMessage({ type: 'error', text: 'Demasiados intentos. Intenta nuevamente en unos minutos.' });
            } else {
                setPasswordMessage({ type: 'error', text: 'No se pudo cambiar la contraseña. Intenta más tarde.' });
            }
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Cargando configuración...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-navy">Configuración</h1>
                <p className="text-secondary opacity-60">Gestiona tu perfil y la seguridad de tu cuenta</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-navy">Perfil de usuario</h2>
                    <p className="text-sm text-secondary opacity-70">Actualiza tu nombre y edad para mantener tu cuenta al día.</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                    {profileMessage && (
                        <div className={`p-4 rounded-lg ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {profileMessage.text}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-navy mb-2">
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-primary" />
                                    Nombre completo
                                </div>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={profile.name}
                                onChange={handleProfileChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="Ej: Carlos Ruiz"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-navy mb-2">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-primary" />
                                    Edad
                                </div>
                            </label>
                            <input
                                type="number"
                                name="age"
                                value={userAge}
                                onChange={handleProfileChange}
                                min="1"
                                max="120"
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="Ej: 29"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-navy mb-2">Correo electrónico</label>
                            <input
                                type="email"
                                value={currentUser?.email || ''}
                                disabled
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-secondary opacity-80"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex flex-wrap justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => setShowPasswordModal(true)}
                            className="bg-white border border-gray-200 hover:bg-gray-50 text-navy px-5 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                        >
                            <Lock size={16} />
                            Cambiar contraseña
                        </button>

                        <button
                            type="submit"
                            disabled={savingProfile}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} />
                            {savingProfile ? 'Guardando...' : 'Guardar perfil'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-navy">Configuración general</h2>
                    <p className="text-sm text-secondary opacity-70">Datos del negocio visibles en la navegación principal.</p>
                </div>

                {userRole !== 'Admin' && (
                    <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                        <p className="text-sm font-medium">⚠️ Solo los administradores pueden cambiar la configuración general.</p>
                    </div>
                )}

                <form onSubmit={handleGeneralSubmit} className="space-y-6">
                    {message && (
                        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-navy mb-2">
                                <div className="flex items-center gap-2">
                                    <Building2 size={16} className="text-primary" />
                                    Nombre del local
                                </div>
                            </label>
                            <input
                                type="text"
                                name="storeName"
                                value={generalSettings.storeName}
                                onChange={handleGeneralChange}
                                disabled={userRole !== 'Admin'}
                                className={`w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${userRole !== 'Admin' ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}`}
                                placeholder="Ej: Mi Negocio"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-navy mb-2">
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-primary" />
                                    Usuario administrador
                                </div>
                            </label>
                            <input
                                type="text"
                                name="adminName"
                                value={generalSettings.adminName}
                                onChange={handleGeneralChange}
                                disabled={userRole !== 'Admin'}
                                className={`w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${userRole !== 'Admin' ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}`}
                                placeholder="Ej: Carlos Ruiz"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex justify-end">
                        <button
                            type="submit"
                            disabled={savingGeneral || userRole !== 'Admin'}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            {savingGeneral ? 'Guardando...' : 'Guardar configuración'}
                        </button>
                    </div>
                </form>
            </div>

            {showPasswordModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={closePasswordModal}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={closePasswordModal}
                            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold text-navy mb-1">Cambiar contraseña</h3>
                        <p className="text-sm text-secondary opacity-70 mb-5">Por seguridad, confirma tu contraseña actual.</p>

                        {passwordMessage && (
                            <div className={`mb-4 p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {passwordMessage.text}
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" size={18} />
                                <input
                                    type={showPassword.current ? 'text' : 'password'}
                                    name="currentPassword"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Contraseña actual"
                                    className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary focus:bg-white transition-all text-navy font-medium"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
                                    className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <div className="relative">
                                <Lock className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" size={18} />
                                <input
                                    type={showPassword.next ? 'text' : 'password'}
                                    name="newPassword"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Nueva contraseña"
                                    className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary focus:bg-white transition-all text-navy font-medium"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => ({ ...prev, next: !prev.next }))}
                                    className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword.next ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <div className="relative">
                                <Lock className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" size={18} />
                                <input
                                    type={showPassword.confirm ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Confirmar nueva contraseña"
                                    className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary focus:bg-white transition-all text-navy font-medium"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                                    className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closePasswordModal}
                                    className="px-4 py-2 rounded-xl border border-gray-200 text-secondary hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPassword}
                                    className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {savingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Configuration;