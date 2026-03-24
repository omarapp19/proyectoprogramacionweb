import { api } from './api';

// Recopila el contexto financiero
async function obtenerContextoFinanciero() {
    try {
        const [balance, transacciones, proximaFactura] = await Promise.all([
            api.getBalance(),
            api.getTransactions(),
            api.getUpcomingBill()
        ]);

        // Calcular promedio diario de ingresos últimos 30 días
        let ingresosUltimos30Dias = 0;
        const hoy = new Date();
        hoy.setHours(23,59,59,999);
        const hace30Dias = new Date(hoy);
        hace30Dias.setDate(hace30Dias.getDate() - 30);
        hace30Dias.setHours(0,0,0,0);

        transacciones.forEach(tx => {
            if (tx.type === 'INGRESO' && tx.date) {
                const txDate = new Date(tx.date);
                if (txDate >= hace30Dias && txDate <= hoy) {
                    ingresosUltimos30Dias += parseFloat(tx.amount || 0);
                }
            }
        });

        const promedioDiario = ingresosUltimos30Dias / 30;

        return `
        DATOS FINANCIEROS ACTUALES:
        - Balance Total Disponible: $${balance.balance}
        - Ingresos Históricos Generales: $${balance.totalIncome}
        - Gastos Históricos Generales: $${balance.totalExpense}
        - Próxima factura por pagar: ${proximaFactura ? `${proximaFactura.title || proximaFactura.description || 'Factura'} por $${proximaFactura.amount} (Vence: ${proximaFactura.dueDate})` : 'Ninguna'}
        
        ANÁLISIS PREDICTIVO (Promedio Histórico):
        - Ventas promedio por día (últimos 30 días): $${promedioDiario.toFixed(2)}
        - Estimación matemática de ingresos para mañana: $${promedioDiario.toFixed(2)}
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
        4. Escribe en texto plano sin usar formato Markdown (ni asteriscos, ni negritas) ya que el sistema no lo renderiza. Usa guiones para listas.
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