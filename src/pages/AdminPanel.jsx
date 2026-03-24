import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, Mail, Hash, Edit2, Save, X, Database, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminPanel = () => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [injecting, setInjecting] = useState(false);

    // Edición de usuario
    const [editingUserId, setEditingUserId] = useState(null);
    const [tempUserName, setTempUserName] = useState('');
    const [tempStoreName, setTempStoreName] = useState('');

    const fetchUsers = async () => {
        try {
            const data = await api.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error cargando usuarios:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.email === 'omarapp1921@gmail.com') {
            fetchUsers();
        }
    }, [currentUser]);

    const handleSaveUser = async (user) => {
        if (!tempUserName.trim() || !tempStoreName.trim()) {
            alert("Ambos campos son obligatorios.");
            return;
        }
        try {
            await api.updateUserProfileAdmin(user.id, { 
                name: tempUserName,
                storeName: tempStoreName 
            });
            setUsers(users.map(u => u.id === user.id ? { ...u, name: tempUserName, storeName: tempStoreName } : u));
            setEditingUserId(null);
        } catch (error) {
            console.error("Error actualizando usuario", error);
            alert("Ocurrió un error al actualizar al usuario.");
        }
    };

    const handleInjectData = async (userEmail) => {
        if (!window.confirm(`¿Estás seguro de inyectar datos de prueba en la base de datos de ${userEmail}?`)) return;
        
        setInjecting(userEmail);
        try {
            await api.injectMockDataForUser(userEmail);
            alert(`Base de datos inyectada con éxito para ${userEmail}.`);
        } catch (error) {
            console.error("Error inyectando datos:", error);
            alert("Error al inyectar datos.");
        } finally {
            setInjecting(null);
        }
    };

    if (currentUser?.email !== 'omarapp1921@gmail.com') {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex flex-col gap-8 h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-navy flex items-center gap-3">
                        <ShieldAlert className="text-primary" size={32} />
                        Panel de Control Administrador
                    </h1>
                    <p className="text-secondary opacity-60">Gestión de identidad y negocios independientes por cliente</p>
                </div>
            </div>

            {/* SECCIÓN: Lista de Usuarios */}
            <div className="card bg-white shadow-card rounded-3xl overflow-hidden border border-gray-100 flex-1 flex flex-col">
                <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-navy">Directorio de Entidades</h2>
                    <div className="bg-blue-50 text-primary font-bold px-4 py-2 rounded-xl text-sm border border-primary/20 flex items-center gap-2 shadow-sm">
                        <Users size={16} />
                        {users.length} Negocios Registrados
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-secondary uppercase tracking-wider">
                                <th className="p-4 pl-6">Nombre del Cliente</th>
                                <th className="p-4">Nombre del Local / Negocio</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Rol / Sistema</th>
                                <th className="p-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-secondary opacity-60">
                                        Escaneando infraestructura de usuarios...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-secondary opacity-60">
                                        No hay usuarios registrados.
                                    </td>
                                </tr>
                            ) : (
                                users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                                        
                                        {/* NOMBRE CLIENTE */}
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm shrink-0
                                                    ${u.email === 'omarapp1921@gmail.com' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-primary to-teal-500'}
                                                `}>
                                                    {(u.name ? u.name.substring(0, 2) : 'U').toUpperCase()}
                                                </div>
                                                
                                                {editingUserId === u.id ? (
                                                    <input 
                                                        type="text" 
                                                        value={tempUserName}
                                                        onChange={(e) => setTempUserName(e.target.value)}
                                                        className="w-full max-w-[150px] bg-white border border-primary px-2 py-1 rounded outline-none text-sm font-bold text-navy"
                                                        placeholder="Nombre cliente"
                                                    />
                                                ) : (
                                                    <span className="font-bold text-navy whitespace-nowrap">{u.name || 'Sin Nombre'}</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* NOMBRE NEGOCIO */}
                                        <td className="p-4">
                                            {editingUserId === u.id ? (
                                                <input 
                                                    type="text" 
                                                    value={tempStoreName}
                                                    onChange={(e) => setTempStoreName(e.target.value)}
                                                    className="w-full max-w-[200px] bg-white border border-primary px-2 py-1 rounded outline-none text-sm font-bold text-primary"
                                                    placeholder="Nombre negocio"
                                                />
                                            ) : (
                                                <span className="font-bold text-primary whitespace-nowrap">{u.storeName || 'Mi Negocio'}</span>
                                            )}
                                        </td>

                                        {/* EMAIL */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-secondary text-sm">
                                                <Mail size={14} className="opacity-50" />
                                                {u.email}
                                            </div>
                                        </td>

                                        {/* ROL */}
                                        <td className="p-4">
                                            {u.email === 'omarapp1921@gmail.com' ? (
                                                <span className="bg-purple-100 text-purple-700 border border-purple-200 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1 w-max shadow-sm">
                                                    <ShieldAlert size={12} /> Super Admin
                                                </span>
                                            ) : (
                                                <span className="bg-gray-100 text-secondary font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider w-max block border border-gray-200 shadow-sm">
                                                    {u.role || 'Usuario Normal'}
                                                </span>
                                            )}
                                        </td>

                                        {/* ACCIONES */}
                                        <td className="p-4 pr-6">
                                            {u.email !== 'omarapp1921@gmail.com' && (
                                                <div className="flex items-center gap-2">
                                                    {editingUserId === u.id ? (
                                                        <>
                                                            <button onClick={() => handleSaveUser(u)} className="p-2 bg-success/10 text-success hover:bg-success hover:text-white rounded-lg transition-colors" title="Guardar">
                                                                <Save size={16} />
                                                            </button>
                                                            <button onClick={() => setEditingUserId(null)} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Cancelar">
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                onClick={() => { 
                                                                    setEditingUserId(u.id); 
                                                                    setTempUserName(u.name || ''); 
                                                                    setTempStoreName(u.storeName || 'Mi Negocio');
                                                                }} 
                                                                className="p-2 text-primary hover:bg-blue-50 bg-transparent border border-transparent hover:border-blue-100 rounded-lg transition-colors flex items-center gap-1 text-sm font-bold opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Edit2 size={16} /> Ajustar Perfil
                                                            </button>
                                                            <button 
                                                                onClick={() => handleInjectData(u.email)}
                                                                disabled={injecting === u.email}
                                                                title="Inyectar Datos Falsos"
                                                                className="p-2 text-orange-500 hover:bg-orange-50 bg-transparent border border-transparent hover:border-orange-200 rounded-lg transition-colors flex items-center gap-1 text-sm font-bold opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                            >
                                                                {injecting === u.email ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />} 
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
