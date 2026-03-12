import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Función matemática de Regresión Lineal (Mínimos Cuadrados)
function calcularRegresionLineal(datos) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = datos.length;
    if (n === 0) return { m: 0, b: 0, predecir: () => 0 };

    datos.forEach(([x, y]) => {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    });

    const denominador = (n * sumX2 - sumX * sumX);
    // Si no hay variación en X, devolvemos un promedio plano
    if (denominador === 0) return { m: 0, b: sumY / n, predecir: () => sumY / n };

    const m = (n * sumXY - sumX * sumY) / denominador; // Pendiente (Tendencia)
    const b = (sumY - m * sumX) / n; // Intersección

    return { m, b, predecir: (x) => m * x + b };
}

const ProjectionChart = ({ transactions = [], balance = 0, bills = [] }) => {
    
    const data = useMemo(() => {
        // 1. Preparar datos históricos para la regresión (últimos 30 días)
        const ingresosPorDia = {};
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        
        const hace30Dias = new Date(hoy);
        hace30Dias.setDate(hace30Dias.getDate() - 30);

        // Agrupar ingresos por día transcurrido
        transactions.forEach(tx => {
            if (tx.type === 'INGRESO' && tx.date) {
                const txDate = new Date(tx.date);
                if (txDate >= hace30Dias && txDate <= hoy) {
                    const diffTime = Math.abs(txDate - hace30Dias);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    ingresosPorDia[diffDays] = (ingresosPorDia[diffDays] || 0) + parseFloat(tx.amount || 0);
                }
            }
        });

        // Convertir a matriz [X, Y] para la fórmula
        const datosRegresion = [];
        for (let i = 0; i <= 30; i++) {
            datosRegresion.push([i, ingresosPorDia[i] || 0]);
        }

        // Obtener nuestro modelo matemático predictivo
        const modelo = calcularRegresionLineal(datosRegresion);

        // 2. Proyectar los próximos 30 días
        const result = [];
        let currentBalanceRegresion = balance;

        for (let i = 1; i <= 30; i++) {
            const date = new Date();
            date.setDate(hoy.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            // Predicción de ingreso para el día (30 + i) usando la regresión
            // (Usamos Math.max para evitar predecir ingresos negativos si la tendencia es muy a la baja)
            const ingresoPredicho = Math.max(0, modelo.predecir(30 + i));

            // Restar facturas programadas de este día
            const billsDue = bills.filter(b => b.status === 'PENDIENTE' && b.dueDate && b.dueDate.startsWith(dateStr));
            const billsTotal = billsDue.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);

            // Calcular escenario de regresión
            currentBalanceRegresion += ingresoPredicho - billsTotal;

            result.push({
                date: date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                saldoRegresion: Math.round(currentBalanceRegresion)
            });
        }
        return result;
    }, [transactions, balance, bills]);

    return (
        <div className="card h-full w-full p-6 bg-white shadow-card rounded-3xl">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-navy">Proyección Predictiva (Regresión Lineal)</h3>
                <p className="text-sm text-secondary opacity-60">
                    Visualiza el crecimiento de tu saldo usando un modelo de tendencia basado en tus últimos 30 días.
                </p>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRegresion" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
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
                            formatter={(value, name) => {
                                if (name === 'saldoRegresion') return [`$${value.toLocaleString()}`, 'Predicción Tendencia (Regresión)'];
                                return [value, name];
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="saldoRegresion"
                            stroke="#10B981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRegresion)"
                            name="saldoRegresion"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ProjectionChart;     