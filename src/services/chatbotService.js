import { api } from './api';

// Función matemática de Regresión Lineal
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
    if (denominador === 0) return { m: 0, b: sumY / n, predecir: () => sumY / n };

    const m = (n * sumXY - sumX * sumY) / denominador; 
    const b = (sumY - m * sumX) / n;

    return { m, b, predecir: (x) => m * x + b };
}

// Recopila el contexto financiero
async function obtenerContextoFinanciero() {
    try {
        const [balance, transacciones, proximaFactura] = await Promise.all([
            api.getBalance(),
            api.getTransactions(),
            api.getUpcomingBill()
        ]);

        // Calcular regresión de ingresos de los últimos 30 días
        const ingresosPorDia = {};
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        const hace30Dias = new Date(hoy);
        hace30Dias.setDate(hace30Dias.getDate() - 30);

        transacciones.forEach(tx => {
            if (tx.type === 'INGRESO' && tx.date) {
                const txDate = new Date(tx.date);
                if (txDate >= hace30Dias && txDate <= hoy) {
                    const diffDays = Math.ceil(Math.abs(txDate - hace30Dias) / (1000 * 60 * 60 * 24)); 
                    ingresosPorDia[diffDays] = (ingresosPorDia[diffDays] || 0) + parseFloat(tx.amount || 0);
                }
            }
        });

        const datosRegresion = [];
        for (let i = 0; i <= 30; i++) {
            datosRegresion.push([i, ingresosPorDia[i] || 0]);
        }

        const modelo = calcularRegresionLineal(datosRegresion);
        const tendencia = modelo.m > 0 ? "al alza (creciendo)" : "a la baja (disminuyendo)";
        const prediccionMañana = Math.max(0, modelo.predecir(31));

        return `
        DATOS FINANCIEROS ACTUALES:
        - Balance Total Disponible: $${balance.balance}
        - Ingresos Históricos: $${balance.totalIncome}
        - Gastos Históricos: $${balance.totalExpense}
        - Próxima factura por pagar: ${proximaFactura ? `${proximaFactura.description} por $${proximaFactura.amount} (Vence: ${proximaFactura.dueDate})` : 'Ninguna'}
        
        ANÁLISIS PREDICTIVO (Regresión Lineal a 30 días):
        - Tendencia de ingresos: ${tendencia}
        - Predicción matemática de ingresos para mañana: $${prediccionMañana.toFixed(2)}
        `;
    } catch (error) {
        console.error("Error obteniendo contexto:", error);
        return "No se pudieron obtener los datos financieros actuales.";
    }
}

// Función principal para interactuar con la IA
export async function enviarMensajeChatbot(mensajeUsuario) {
    const contexto = await obtenerContextoFinanciero();
    
    // 1. Instrucciones para la IA (System Prompt)
    const systemPrompt = `
        Eres un asistente financiero experto integrado en un sistema de gestión de negocios. 
        Tu objetivo es ayudar al usuario a entender sus finanzas basándote ÚNICAMENTE en este contexto:
        ${contexto}
        
        Reglas importantes:
        1. Responde de manera concisa, profesional y amigable.
        2. Si te preguntan por predicciones o el futuro, utiliza los datos del análisis predictivo que te proporciono.
        3. Nunca inventes datos. Si no sabes algo o no está en el contexto, di que no tienes esa información.
        4. Usa formato Markdown (negritas, listas) para hacer la lectura más fácil.
    `;

    // 2. Obtener la API Key desde las variables de entorno de Vite
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("No se encontró la API Key de Gemini. Verifica tu archivo .env");
    }

    // 3. Llamada a la API REST de Gemini
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [{
                    role: "user",
                    parts: [{ text: mensajeUsuario }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }

        const data = await response.json();
        
        // Extraer el texto de la respuesta de Gemini
        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error("Error al contactar a Gemini:", error);
        return "Lo siento, estoy teniendo problemas de conexión con mis servidores de IA en este momento. Intenta de nuevo más tarde.";
    }
}