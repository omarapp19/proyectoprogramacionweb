import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProjectionChart = ({ transactions = [], balance = 0, bills = [] }) => {
    
    const data = useMemo(() => {
        // 1. Calculate Daily Average Income over the last 30 days
        let totalIncomeLast30Days = 0;
        const hoy = new Date();
        hoy.setHours(23,59,59,999);
        
        const hace30Dias = new Date(hoy);
        hace30Dias.setDate(hace30Dias.getDate() - 30);
        hace30Dias.setHours(0,0,0,0);

        transactions.forEach(tx => {
            if (tx.type === 'INGRESO' && tx.date) {
                const txDate = new Date(tx.date);
                if (txDate >= hace30Dias && txDate <= hoy) {
                    totalIncomeLast30Days += parseFloat(tx.amount || 0);
                }
            }
        });

        // Promedio diario basado en esos 30 días
        const dailyAverageIncome = totalIncomeLast30Days / 30;

        // 2. Proyectar los próximos 30 días usando este promedio diario
        const result = [];
        let currentProjectedBalance = balance;

        for (let i = 1; i <= 30; i++) {
            // Fecha para predecir
            const futureDate = new Date();
            futureDate.setDate(new Date().getDate() + i);
            
            // Format to match bills format safely (YYYY-MM-DD)
            const y = futureDate.getFullYear();
            const m = String(futureDate.getMonth() + 1).padStart(2, '0');
            const d = String(futureDate.getDate()).padStart(2, '0');
            const targetDateStr = `${y}-${m}-${d}`;

            // Restar facturas programadas de este día
            const billsDue = bills.filter(b => {
                if (b.status !== 'PENDIENTE' || !b.dueDate) return false;
                const billDateStr = typeof b.dueDate === 'string' ? b.dueDate.split('T')[0] : '';
                return billDateStr === targetDateStr;
            });
            const billsTotal = billsDue.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);

            // Calcular saldo del día
            currentProjectedBalance += dailyAverageIncome - billsTotal;

            result.push({
                date: futureDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                saldoProyectado: Math.round(currentProjectedBalance)
            });
        }
        return result;
    }, [transactions, balance, bills]);

    return (
        <div className="card h-full w-full p-6 bg-white shadow-card rounded-3xl border border-gray-100">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-navy">Proyección Predictiva a 30 Días</h3>
                <p className="text-sm text-secondary opacity-60">
                    Calculado en base al promedio diario de tus ingresos recientes ($ {Math.round(data.length > 0 ? (transactions.filter(t => t.type==='INGRESO').reduce((a,b)=>a+b.amount,0)/30) : 0).toLocaleString()}/día) y restando facturas programadas.
                </p>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorProyeccion" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#A3AED0', fontSize: 12, fontWeight: 500 }}
                            interval={4}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#A3AED0', fontSize: 12, fontWeight: 500 }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }}
                            formatter={(value, name) => {
                                if (name === 'saldoProyectado') return [`$${value.toLocaleString()}`, 'Saldo Estimado'];
                                return [value, name];
                            }}
                            labelStyle={{ color: '#1B254B', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="saldoProyectado"
                            stroke="#8B5CF6"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorProyeccion)"
                            name="saldoProyectado"
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#8B5CF6' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ProjectionChart;     