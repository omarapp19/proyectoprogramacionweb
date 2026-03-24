import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, Mail, Calendar as CalendarIcon, Hash } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminPanel = () => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (currentUser?.email !== 'omarapp1921@gmail.com') {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex flex-col gap-8 h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy flex items-center gap-3">
                        <ShieldAlert className="text-primary" size={28} />
                        Panel de Control Administrador
                    </h1>
                    <p className="text-secondary opacity-60">Gestión exclusiva de usuarios y permisos del sistema</p>
                </div>
                <div className="bg-blue-50 text-primary font-bold px-4 py-2 rounded-xl text-sm border border-primary/20 flex items-center gap-2 shadow-sm">
                    <Users size={16} />
                    {users.length} Usuarios Registrados
                </div>
            </div>

            <div className="card bg-white shadow-card rounded-3xl overflow-hidden border border-gray-100 flex-1">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-secondary uppercase tracking-wider">
                                <th className="p-4 pl-6">Nombre de Usuario</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Rol en Sistema</th>
                                <th className="p-4">Edad</th>
                                <th className="p-4 pr-6">Fecha de Registro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-secondary opacity-60">
                                        Cargando base de datos de usuarios...
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
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white font-bold shadow-sm">
                                                    {(u.name ? u.name.substring(0, 2) : 'U').toUpperCase()}
                                                </div>
                                                <span className="font-bold text-navy">{u.name || 'Sin Nombre'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-secondary text-sm">
                                                <Mail size={14} className="opacity-50" />
                                                {u.email}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {u.email === 'omarapp1921@gmail.com' ? (
                                                <span className="bg-purple-50 text-purple-600 border border-purple-200 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1 w-max">
                                                    <ShieldAlert size={12} /> Super Admin
                                                </span>
                                            ) : (
                                                <span className="bg-gray-100 text-secondary font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider w-max block">
                                                    {u.role || 'Usuario'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-secondary text-sm">
                                                <Hash size={14} className="opacity-50" />
                                                {u.age || '-'}
                                            </div>
                                        </td>
                                        <td className="p-4 pr-6">
                                            <div className="flex items-center gap-2 text-secondary text-sm">
                                                <CalendarIcon size={14} className="opacity-50" />
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Desconocida'}
                                            </div>
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
