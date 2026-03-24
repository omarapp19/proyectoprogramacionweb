import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ArrowRightLeft, FileText, PieChart, Settings, LogOut, DollarSign, Bot, Calendar, Users } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { db } from '../firebase'; // Importamos la base de datos de Firebase
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { logout, currentUser } = useAuth();
    const [settings, setSettings] = useState({
        storeName: 'Galpon',
        adminName: ''
    });
    const [userRole, setUserRole] = useState('');

    const displayName = currentUser?.displayName || settings.adminName || 'Admin';

    useEffect(() => {
        // Suscribirse a cambios en tiempo real
        const unsub = onSnapshot(doc(db, 'settings', 'global_settings'), (docSnap) => {
            if (docSnap.exists()) {
                setSettings(docSnap.data());
            }
        });

        return () => unsub();
    }, []);

    useEffect(() => {
        if (!currentUser?.uid) return;
        const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                setUserRole(docSnap.data().role || 'Usuario');
            }
        });
        return () => unsub();
    }, [currentUser?.uid]);

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden glass"
                    onClick={onClose}
                ></div>
            )}

            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Brand */}
                <div className="p-8 flex items-center justify-between border-b border-gray-100/50 pb-8">
                    <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
                        <span className="text-primary">{settings.storeName.split(' ')[0]}</span> {settings.storeName.split(' ').slice(1).join(' ')}
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto">
                    <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={onClose} />
                    <NavItem to="/analytics" icon={<PieChart size={20} />} label="Estadísticas" onClick={onClose} />
                    <NavItem to="/daily-sales" icon={<DollarSign size={20} />} label="Ventas Diarias" onClick={onClose} />
                    <NavItem to="/invoices" icon={<FileText size={20} />} label="Facturas" onClick={onClose} />
                    <NavItem to="/calendar" icon={<Calendar size={20} />} label="Calendario" onClick={onClose} />
                    
                    {currentUser?.email === 'omarapp1921@gmail.com' && (
                        <NavItem to="/admin" icon={<Users size={20} />} label="Panel de Control" onClick={onClose} />
                    )}

                    {/* Divider or Spacer */}
                    <div className="flex-1"></div>

                    <NavItem to="/settings" icon={<Settings size={20} />} label="Configuración" onClick={onClose} />
                </nav>

                {/* User Profile */}
                <div className="p-4 mx-4 mb-4 rounded-2xl bg-gradient-to-br from-[#868CFF] to-[#4318FF] text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-bold">
                                {displayName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-bold truncate max-w-[100px]">{displayName}</p>
                                <p className="text-xs opacity-80">{userRole || 'Usuario'}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            title="Cerrar Sesión"
                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-white"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

const NavItem = ({ to, icon, label, onClick }) => {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 my-1 rounded-lg transition-all text-sm font-medium relative ${isActive
                    ? 'text-secondary font-bold'
                    : 'text-secondary opacity-60 hover:opacity-100 hover:bg-gray-50'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <span className={`${isActive ? 'text-primary' : ''}`}>
                        {icon}
                    </span>
                    <span className={`${isActive ? 'text-secondary' : ''}`}>
                        {label}
                    </span>
                    {isActive && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-lg"></div>
                    )}
                </>
            )}
        </NavLink>
    );
};

export default Sidebar;
