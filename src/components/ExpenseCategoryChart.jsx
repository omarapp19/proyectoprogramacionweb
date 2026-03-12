import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#4318FF', '#39B8FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];

const ExpenseCategoryChart = ({ transactions = [] }) => {
    const data = useMemo(() => {
        const gastosPorCategoria = {};
        
        // Obtener los últimos 30 días
        const hoy = new Date();
        const hace30dias = new Date();
        hace30dias.setDate(hace30dias.getDate() - 30);

        transactions.forEach(tx => {
            if (tx.type === 'GASTO' && tx.date) {
                const dateStrRaw = typeof tx.date === 'string' ? tx.date.split('T')[0] : '';
                if(!dateStrRaw) return;
                const [y, m, d] = dateStrRaw.split('-').map(Number);
                const txDate = new Date(y, m - 1, d, 12, 0, 0);

                if (txDate >= hace30dias && txDate <= hoy) {
                    const cat = tx.category || 'Sin Categoría';
                    gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + parseFloat(tx.amount || 0);
                }
            }
        });

        return Object.entries(gastosPorCategoria)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Ordenar de mayor a menor gasto
    }, [transactions]);

    return (
        <div className="card h-full w-full p-6 bg-white shadow-card rounded-3xl">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-navy">Gastos por Categoría (30 d)</h3>
                <p className="text-sm text-secondary opacity-60">
                    Distribución de tus egresos para identificar en qué gastas más.
                </p>
            </div>

            <div className="h-[300px] w-full">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value) => `$${value.toLocaleString()}`}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        No hay gastos registrados en este periodo
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpenseCategoryChart;
