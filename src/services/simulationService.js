import { api } from './api';

// Utilidad para obtener una fecha en string YYYY-MM-DD
const getFormattedDate = (dateObj) => {
    return dateObj.toISOString().split('T')[0];
};

// Utilidad número Random
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Catalogos realistas de Ferretería
const INGRESOS_CONCEPTOS = [
    { title: "Venta Mostrador: Cemento y Varilla", category: "Materiales de Construcción", min: 3000, max: 15000 },
    { title: "Venta Lote de Pinturas", category: "Pintura", min: 2000, max: 8000 },
    { title: "Venta: Cableado y Focos", category: "Eléctrico", min: 1000, max: 5000 },
    { title: "Venta Herramientas Manuales", category: "Herramientas", min: 800, max: 4000 },
    { title: "Suministro Obra Civil (Facturado)", category: "Mayoreo", min: 15000, max: 45000 },
    { title: "Venta de Tubos y Conexiones", category: "Plomería", min: 900, max: 6000 },
    { title: "Venta: Impermeabilizantes", category: "Materiales de Construcción", min: 1500, max: 9000 },
];

const GASTOS_PROVEEDORES = [
    { provider: "Cemex", title: "Suministro 10 ton Cemento Tolteca", min: 18000, max: 35000, category: "Materia Prima" },
    { provider: "Truper", title: "Pedido Quincenal Herramientas", min: 12000, max: 28000, category: "Inventario" },
    { provider: "Comex", title: "Lote Cubetas Pintura Vinílica", min: 8000, max: 15000, category: "Inventario" },
    { provider: "Rotoplas", title: "Cisterna y Tinacos Múltiples", min: 10000, max: 22000, category: "Inventario" },
    { provider: "CFE", title: "Recibo de Luz Comercial", min: 2500, max: 5000, category: "Servicios Fijos" },
    { provider: "Nómina", title: "Pago Quincenal Empleados", min: 15000, max: 15000, category: "Nómina" },
    { provider: "Arrendador", title: "Renta de Local", min: 12000, max: 12000, category: "Servicios Fijos" },
];

export const loadSimulationData = async () => {
    try {
        console.log("Iniciando inyección de datos simulados...");
        
        const hoy = new Date();
        const hace30Dias = new Date(hoy);
        hace30Dias.setDate(hace30Dias.getDate() - 30);

        // --- 1. GENERAR VENTAS (INGRESOS) DE LOS ÚLTIMOS 30 DÍAS ---
        const ventasPromesas = [];
        
        // Iteramos por los últimos 30 días
        for (let i = 0; i <= 30; i++) {
            const currentDate = new Date(hace30Dias);
            currentDate.setDate(currentDate.getDate() + i);

            // Determinar si es domingo (0). Si es domingo, menos ventas o cerramos
            const isSunday = currentDate.getDay() === 0;
            const numeroVentas = isSunday ? randomInt(0, 1) : randomInt(2, 5);

            for(let j=0; j < numeroVentas; j++) {
                const tipoVenta = INGRESOS_CONCEPTOS[randomInt(0, INGRESOS_CONCEPTOS.length - 1)];
                const monto = randomInt(tipoVenta.min, tipoVenta.max);

                ventasPromesas.push(
                    api.createTransaction({
                        amount: monto,
                        type: 'INGRESO',
                        category: tipoVenta.category,
                        note: tipoVenta.title,
                        date: getFormattedDate(currentDate),
                        method: Math.random() > 0.5 ? 'Efectivo' : 'Tarjeta',
                        status: 'COMPLETED'
                    })
                );
            }
        }
        
        console.log(`Generando ${ventasPromesas.length} ventas locales...`);
        await Promise.all(ventasPromesas);

        // --- 2. GENERAR FACTURAS (GASTOS) ---
        // Generaremos 15 facturas repartidas entre los últimos 15 días y los próximos 15 días
        const facturasPromesas = [];

        for(let i=0; i < 15; i++) {
            const proveedorRandom = GASTOS_PROVEEDORES[randomInt(0, GASTOS_PROVEEDORES.length - 1)];
            const montoOriginal = randomInt(proveedorRandom.min, proveedorRandom.max);
            
            // Fecha de vencimiento entre hace 15 días y dentro de 15 días
            const offsetDias = randomInt(-15, 15);
            const fechaVencimiento = new Date(hoy);
            fechaVencimiento.setDate(fechaVencimiento.getDate() + offsetDias);

            // Si la factura venció hace más de 3 días, la marcaremos como PAGADA y generaremos su transacción de GASTO real
            // Si no, la dejaremos PENDIENTE
            const yaSePago = offsetDias < -3;

            facturasPromesas.push(
                api.createBill({
                    title: proveedorRandom.title,
                    provider: proveedorRandom.provider,
                    amount: montoOriginal,
                    dueDate: getFormattedDate(fechaVencimiento),
                    issueDate: getFormattedDate(new Date(fechaVencimiento.getTime() - (randomInt(5, 15) * 24 * 60 * 60 * 1000))), 
                    status: yaSePago ? 'PAGADO' : 'PENDIENTE',
                    category: proveedorRandom.category
                }).then(async (newBillId) => {
                    if (yaSePago) {
                        // Generar el Gasto que respalda la factura
                        await api.createTransaction({
                            amount: montoOriginal,
                            type: 'GASTO',
                            category: proveedorRandom.category,
                            note: `Pago Factura: ${proveedorRandom.provider} - ${proveedorRandom.title}`,
                            date: getFormattedDate(fechaVencimiento), // Asumimos que se pagó en fecha
                            method: 'Transferencia',
                            status: 'COMPLETED'
                        });
                    }
                })
            );
        }

        console.log(`Generando 15 recargas de facturas...`);
        await Promise.all(facturasPromesas);

        console.log("¡Simulación cargada exitosamente!");
        return { success: true, message: "Base de datos llenada con éxito." };

    } catch (error) {
        console.error("Error corriendo simulación:", error);
        return { success: false, message: "Error al inyectar los datos." };
    }
}
