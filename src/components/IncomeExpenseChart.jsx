import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const IncomeExpenseChart = ({ transactions = [] }) => {
    const data = useMemo(() => {
        const agrupaPorDia = {};
        
        // Obtener los últimos 30 días
        const hoy = new Date();
        hoy.setHours(23, 59, 59, 999);
        const hace30dias = new Date(hoy);
        hace30dias.setDate(hace30dias.getDate() - 30);
        hace30dias.setHours(0, 0, 0, 0);

        // Inicializar los 30 días con 0
        for (let i = 0; i <= 30; i++) {
            const d = new Date(hace30dias);
            d.setDate(d.getDate() + i);
            const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            agrupaPorDia[dateStr] = { date: dateStr, Ingresos: 0, Gastos: 0, sortDate: d.getTime() };
        }

        transactions.forEach(tx => {
            if (!tx.date) return;
            // Corregir offset de zona horaria usando split para que agarre el día local
            const dateStrRaw = typeof tx.date === 'string' ? tx.date.split('T')[0] : '';
            if(!dateStrRaw) return;
            const [y, m, d] = dateStrRaw.split('-').map(Number);
            const txDate = new Date(y, m - 1, d, 12, 0, 0);
            
            if (txDate >= hace30dias && txDate <= hoy) {
                const dateStrKey = txDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                if (agrupaPorDia[dateStrKey]) {
                    if (tx.type === 'INGRESO') {
                        agrupaPorDia[dateStrKey].Ingresos += parseFloat(tx.amount || 0);
                    } else if (tx.type === 'GASTO') {
                        agrupaPorDia[dateStrKey].Gastos += parseFloat(tx.amount || 0);
                    }
                }
            }
        });

        // Convertir a array y ordenar
        return Object.values(agrupaPorDia).sort((a, b) => a.sortDate - b.sortDate);
    }, [transactions]);

    return (
        <div className="card h-full w-full p-6 bg-white shadow-card rounded-3xl">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-navy">Ingresos vs Gastos (Últimos 30 días)</h3>
                <p className="text-sm text-secondary opacity-60">
                    Compara visualmente tus ingresos y gastos diarios.
                </p>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#A3AED0', fontSize: 12 }} 
                            interval={4}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#A3AED0', fontSize: 12 }} 
                            tickFormatter={(value) => `$${value / 1000}k`}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value) => [`$${value.toLocaleString()}`, '']}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                        <Bar dataKey="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
                        <Bar dataKey="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default IncomeExpenseChart;
