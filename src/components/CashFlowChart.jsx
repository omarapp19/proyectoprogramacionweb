import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CashFlowChart = ({ transactions = [], initialBalance = 0 }) => {
    const data = useMemo(() => {
        if (!transactions.length) return [];

        // Ordenar transacciones por fecha de más antigua a más nueva
        const txsOrdenadas = [...transactions].filter(tx => tx.date).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Obtener la fecha más antigua y la de hoy para crear el rango
        const fechaInicio = txsOrdenadas.length > 0 ? new Date(txsOrdenadas[0].date) : new Date();
        const hoy = new Date();
        
        const flujoAcumulado = [];
        let balanceActual = initialBalance; // asumiendo que partió de un balance previo o calculando a partir del actual hacia atrás

        // Una mejor aproximación: si tenemos el balance de *hoy*, deberíamos iterar de hoy hacia atrás o calcular el flujo progresivo sólo del periodo.
        // Asumiremos un cálculo sobre el balance del histórico proporcionado.
        
        let saldoSimulado = 0; // Solo mostramos crecimiento/decrecimiento neto

        txsOrdenadas.forEach(tx => {
            const fecha = new Date(tx.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            
            if (tx.type === 'INGRESO') {
                saldoSimulado += parseFloat(tx.amount || 0);
            } else if (tx.type === 'GASTO') {
                saldoSimulado -= parseFloat(tx.amount || 0);
            }

            // Omitir repetidos en el mismo día y actualizar al último saldo
            const lastEntry = flujoAcumulado[flujoAcumulado.length - 1];
            if (lastEntry && lastEntry.date === fecha) {
                lastEntry.saldo = saldoSimulado;
            } else {
                flujoAcumulado.push({
                    date: fecha,
                    saldo: saldoSimulado,
                    sortDate: new Date(tx.date).getTime()
                });
            }
        });

        return flujoAcumulado;
    }, [transactions]);

    // Función matemática para color condicional (verde si es positivo/crece, rojo si está bajo 0)
    const gradientOffset = () => {
        const dataMax = Math.max(...data.map((i) => i.saldo));
        const dataMin = Math.min(...data.map((i) => i.saldo));

        if (dataMax <= 0) {
            return 0;
        }
        if (dataMin >= 0) {
            return 1;
        }

        return dataMax / (dataMax - dataMin);
    };

    const off = data.length > 0 ? gradientOffset() : 0;

    return (
        <div className="card h-full w-full p-6 bg-white shadow-card rounded-3xl">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-navy">Flujo Neto Acumulado</h3>
                <p className="text-sm text-secondary opacity-60">
                    Muestra el crecimiento de tu liquidez a lo largo del tiempo.
                </p>
            </div>

            <div className="h-[300px] w-full">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#A3AED0', fontSize: 12 }} 
                                interval="preserveStartEnd"
                                minTickGap={20}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#A3AED0', fontSize: 12 }} 
                                tickFormatter={(value) => `$${value / 1000}k`}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value) => [`$${value.toLocaleString()}`, 'Flujo Neto']}
                            />
                            <defs>
                                <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset={off} stopColor="#10B981" stopOpacity={0.5} />
                                    <stop offset={off} stopColor="#EF4444" stopOpacity={0.5} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="saldo"
                                stroke="#10B981"
                                strokeWidth={2}
                                fill="url(#splitColor)"
                            />
                        </AreaChart>
                   </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        No hay datos suficientes
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashFlowChart;
