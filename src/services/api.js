import { db, auth } from '../firebase';
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    query,
    orderBy,
    where,
    limit,
    Timestamp
} from 'firebase/firestore';

export const api = {
    // Transactions
    getTransactions: async () => {
        try {
            const q = query(collection(db, 'users', auth.currentUser.email, 'transactions'), orderBy('date', 'desc'), limit(500));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();

                let dateStr = data.date;
                // Handle legacy Timestamp or Date objects
                if (data.date?.toDate) {
                    dateStr = data.date.toDate().toISOString().split('T')[0];
                } else if (typeof data.date === 'object' || (typeof data.date === 'string' && data.date.includes('T'))) {
                    dateStr = new Date(data.date).toISOString().split('T')[0];
                }

                return {
                    id: doc.id,
                    ...data,
                    // Handle Timestamp to Date conversion safely
                    date: dateStr,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
                };
            });
        } catch (error) {
            console.error("Error fetching transactions:", error);
            return [];
        }
    },

    createTransaction: async (data) => {
        try {
            const newTransaction = {
                ...data,
                amount: parseFloat(data.amount),
                // Save as string "YYYY-MM-DD" directly if provided, else current date string
                date: data.date ? data.date : new Date().toISOString().split('T')[0],
                createdAt: new Date()
            };
            const docRef = await addDoc(collection(db, 'users', auth.currentUser.email, 'transactions'), newTransaction);
            return { id: docRef.id, ...newTransaction };
        } catch (error) {
            console.error("Error creating transaction:", error);
            throw error;
        }
    },

    getBalance: async () => {
        // Client-side aggregation (simpler for now without backend)
        try {
            const snapshot = await getDocs(collection(db, 'users', auth.currentUser.email, 'transactions'));
            let totalIncome = 0;
            let totalExpense = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.type === 'INGRESO') totalIncome += (data.amount || 0);
                if (data.type === 'GASTO') totalExpense += (data.amount || 0);
            });

            return {
                balance: totalIncome - totalExpense,
                totalIncome,
                totalExpense
            };
        } catch (error) {
            console.error("Error calculating balance:", error);
            return { balance: 0, totalIncome: 0, totalExpense: 0 };
        }
    },

    // Bills
    getBills: async () => {
        try {
            const q = query(collection(db, 'users', auth.currentUser.email, 'bills'), orderBy('dueDate', 'asc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                let dueDate = data.dueDate;

                // Handle legacy Timestamp or Date objects
                if (data.dueDate?.toDate) {
                    dueDate = data.dueDate.toDate().toISOString().split('T')[0];
                } else if (typeof data.dueDate === 'object' || (typeof data.dueDate === 'string' && data.dueDate.includes('T'))) {
                    // If it's an ISO string or Date object string result
                    dueDate = new Date(data.dueDate).toISOString().split('T')[0];
                }

                return {
                    id: doc.id,
                    ...data,
                    dueDate // Should be "YYYY-MM-DD"
                };
            });
        } catch (error) {
            console.error("Error fetching bills:", error);
            return [];
        }
    },

    createBill: async (data) => {
        try {
            const newBill = {
                ...data,
                amount: parseFloat(data.amount),
                dueDate: data.dueDate, // Save as string "YYYY-MM-DD" directly
                status: 'PENDIENTE',
                createdAt: new Date()
            };
            const docRef = await addDoc(collection(db, 'users', auth.currentUser.email, 'bills'), newBill);
            return { id: docRef.id, ...newBill };
        } catch (error) {
            console.error("Error creating bill:", error);
            throw error;
        }
    },

    getUpcomingBill: async () => {
        try {
            const today = new Date().toISOString().split('T')[0];

            const q = query(
                collection(db, 'users', auth.currentUser.email, 'bills'),
                where('status', '==', 'PENDIENTE'),
                where('dueDate', '>=', today),
                orderBy('dueDate', 'asc'),
                limit(1)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const doc = snapshot.docs[0];
            const data = doc.data();

            let dueDate = data.dueDate;
            if (data.dueDate?.toDate) {
                dueDate = data.dueDate.toDate().toISOString().split('T')[0];
            } else if (typeof data.dueDate === 'object' || (typeof data.dueDate === 'string' && data.dueDate.includes('T'))) {
                dueDate = new Date(data.dueDate).toISOString().split('T')[0];
            }

            return {
                id: doc.id,
                ...data,
                dueDate
            };
        } catch (error) {
            console.error("Error fetching upcoming bill:", error);
            return null;
        }
    },

    deleteTransaction: async (id) => {
        await deleteDoc(doc(db, 'users', auth.currentUser.email, 'transactions', id));
        return { message: 'Deleted' };
    },

    deleteBill: async (id) => {
        await deleteDoc(doc(db, 'users', auth.currentUser.email, 'bills', id));
        return { message: 'Deleted' };
    },

    updateBill: async (id, data) => {
        const updateData = { ...data };
        // Do NOT convert dueDate to Date object

        await updateDoc(doc(db, 'users', auth.currentUser.email, 'bills', id), updateData);
        return { id, ...updateData };
    },

    getAllUsers: async () => {
        try {
            const snapshot = await getDocs(collection(db, 'users'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching all users:", error);
            return [];
        }
    },

    updateGlobalSettings: async (data) => {
        // Usa updateDoc si existe, o setDoc si no, mejor updateDoc asumido
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'users', auth.currentUser.email, 'settings', 'global_settings'), data, { merge: true });
        return data;
    },

    updateUserProfileAdmin: async (userId, data) => {
        await updateDoc(doc(db, 'users', userId), data);
        return data;
    },

    injectMockDataForUser: async (targetEmail) => {
        try {
            const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            const today = new Date();
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

            const transactions = [
                { description: "Venta Cliente - Juan Perez", amount: 150.00, type: "INGRESO", category: "Servicios" },
                { description: "Mantenimiento Servidores", amount: 80.00, type: "GASTO", category: "Software" },
                { description: "Venta Producto - Kit Básico", amount: 45.00, type: "INGRESO", category: "Productos" },
                { description: "Pago de Internet", amount: 60.00, type: "GASTO", category: "Servicios Básicos" },
                { description: "Asesoría Técnica", amount: 200.00, type: "INGRESO", category: "Servicios" },
                { description: "Compra Materiales Oficina", amount: 35.50, type: "GASTO", category: "Oficina" },
                { description: "Venta Cliente - Empresa S.A.", amount: 850.00, type: "INGRESO", category: "Proyectos" },
                { description: "Suscripción Software IA", amount: 20.00, type: "GASTO", category: "Software" },
                { description: "Publicidad Facebook Ads", amount: 100.00, type: "GASTO", category: "Marketing" },
                { description: "Venta Producto - Kit Avanzado", amount: 120.00, type: "INGRESO", category: "Productos" },
                { description: "Reparación de Equipo", amount: 75.00, type: "GASTO", category: "Mantenimiento" },
                { description: "Mantenimiento de Red", amount: 50.00, type: "INGRESO", category: "Servicios" },
                { description: "Caja Chica - Café y Snacks", amount: 15.00, type: "GASTO", category: "Oficina" },
                { description: "Adelanto de Proyecto Web", amount: 400.00, type: "INGRESO", category: "Proyectos" },
                { description: "Pago Freelancer Diseño", amount: 150.00, type: "GASTO", category: "Nómina" },
            ];

            // Insert past transactions
            for (let t of transactions) {
                const date = randomDate(lastMonth, today).toISOString().split('T')[0];
                await addDoc(collection(db, 'users', targetEmail, 'transactions'), {
                    ...t,
                    date,
                    createdAt: new Date()
                });
            }

            const bills = [
                { description: "Pago Alquiler Local", amount: 400.00, type: "Fijo", dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5).toISOString().split('T')[0] },
                { description: "Impuesto Municipal Mensual", amount: 85.00, type: "Fijo", dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15).toISOString().split('T')[0] },
                { description: "Hosting y Dominio Web", amount: 120.00, type: "Variable", dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2).toISOString().split('T')[0] },
                { description: "Cuota de Préstamo Equipos", amount: 250.00, type: "Fijo", dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 20).toISOString().split('T')[0] },
            ];

            // Insert upcoming bills
            for (let b of bills) {
                await addDoc(collection(db, 'users', targetEmail, 'bills'), {
                    ...b,
                    status: 'PENDIENTE',
                    createdAt: new Date()
                });
            }
            return true;
        } catch (error) {
            console.error("Error during injection for user", error);
            throw error;
        }
    }
};

