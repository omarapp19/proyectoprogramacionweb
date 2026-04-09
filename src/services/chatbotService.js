import { api } from './api';

// Recopila el contexto financiero
async function obtenerContextoFinanciero() {
    try {
        const [balance, transacciones, facturas] = await Promise.all([
            api.getBalance(),
            api.getTransactions(),
            api.getBills()
        ]);

        // Separar facturas pendientes
        const facturasPendientes = facturas.filter(f => f.status === 'PENDIENTE');
        const listaFacturas = facturasPendientes.length > 0 
            ? facturasPendientes.map(f => `- ${f.title || f.description || 'Factura'}: $${f.amount} (Vence: ${f.dueDate})`).join('\n        ')
            : '- Ninguna factura pendiente registrada.';

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
        
        FACTURAS PENDIENTES POR PAGAR:
        ${listaFacturas}
        
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
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
        return "⚠️ Error: No pude encontrar la API Key de OpenRouter. Si acabas de modificar tu archivo .env, es OBLIGATORIO que detengas el servidor local (Ctrl + C en la terminal) y vuelvas a ejecutar 'npm run dev' para que el sistema reconozca tu nueva contraseña oculta.";
    }

    // 3. Llamada a la API de OpenRouter
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'ArmaTuAntojo'
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.3-7b-instruct:free",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: mensajeUsuario }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || `Error ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // Extraer el texto de la respuesta de OpenRouter
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        } else {
            throw new Error("Formato de respuesta inesperado de OpenRouter");
        }

    } catch (error) {
        console.error("Error al contactar a OpenRouter:", error);
        return `Error del servidor de IA: ${error.message}`;
    }
}