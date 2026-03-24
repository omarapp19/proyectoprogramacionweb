import React, { useState, useRef, useEffect } from 'react';
import { Upload, Send, Bot, FileSpreadsheet, Loader2, CheckCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
// IMPORTAMOS EL NUEVO SERVICIO INTELIGENTE
import { enviarMensajeChatbot } from '../services/chatbotService';

const ImportAssistant = () => {
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: '¡Hola! Soy tu Asistente Financiero con IA. Puedes preguntarme sobre tus balances, proyecciones de ventas o arrastrar un archivo Excel para importar tus conciliaciones.' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [processedData, setProcessedData] = useState(null);
    const [importing, setImporting] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    // --- NUEVA LÓGICA DE CHAT INTELIGENTE ---
    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userText = inputValue;
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userText }]);
        setInputValue("");
        setIsTyping(true);

        try {
            // Llamada al servicio que tiene la Regresión Lineal y la conexión a la IA
            const botResponse = await enviarMensajeChatbot(userText);
            
            setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: botResponse }]);
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: `Error de UI Crítico: ${error.message} \n\n Stack: ${error.stack}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    // --- LÓGICA DE IMPORTACIÓN DE EXCEL (Se mantiene igual) ---
    const processFile = (file) => {
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: `Archivo subido: ${file.name}`, isFile: true }]);
        setIsTyping(true);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const workbook = XLSX.read(bstr, { type: 'binary' });

            let existingDates = new Set();
            try {
                const existingTxs = await api.getTransactions();
                existingTxs.forEach(tx => {
                    if (tx.date) existingDates.add(tx.date.split('T')[0]);
                });
            } catch (err) {
                console.error("Error", err);
            }

            setTimeout(() => {
                try {
                    const rawResult = processWorkbook(workbook);
                    const newDays = rawResult.filter(day => !existingDates.has(day.date));
                    const duplicateCount = rawResult.length - newDays.length;

                    if (newDays.length === 0) {
                        setIsTyping(false);
                        setMessages(prev => [...prev, {
                            id: Date.now(),
                            type: 'bot',
                            text: `🎉 **¡Todo tus datos están actualizados!**\n\nNo encontré días nuevos en este archivo. Todos los registros ya existen en tu base de datos.`
                        }]);
                        return;
                    }

                    setProcessedData(newDays);
                    setIsTyping(false);

                    const totalAmount = newDays.reduce((acc, day) => acc + day.sales.reduce((s, tx) => s + tx.amount, 0), 0);

                    let breakdownText = `He analizado el archivo. Detecté ${newDays.length} días **NUEVOS** para importar.\n`;
                    if (duplicateCount > 0) breakdownText += `ℹ️ Ignoré ${duplicateCount} días que ya existen en la base de datos.\n\n`;
                    breakdownText += `📊 **Total a Importar:** $${totalAmount.toFixed(2)}\n\n¿Deseas proceder con la importación?`;

                    setMessages(prev => [...prev, {
                        id: Date.now(),
                        type: 'bot',
                        text: breakdownText,
                        action: 'confirm_import'
                    }]);
                } catch (error) {
                    setIsTyping(false);
                    setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: `Hubo un error al leer el archivo. Asegúrate de que siga el formato esperado.` }]);
                }
            }, 1000);
        };
        reader.readAsBinaryString(file);
    };

    const processWorkbook = (workbook) => {
        const extractedData = [];
        workbook.SheetNames.forEach(sheetName => {
            if (!/^\d{2}$/.test(sheetName) && !/^\d{1}$/.test(sheetName)) return;

            const day = sheetName.padStart(2, '0');
            const dateStr = `2026-01-${day}`;
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const sales = [];
            let divisasSum = 0;

            const getValueAtOffset = (r, label, offset = 2) => {
                const index = r.findIndex(cell => typeof cell === 'string' && cell.toUpperCase().includes(label));
                if (index !== -1 && index + offset < r.length) {
                    let val = r[index + offset];
                    if (typeof val === 'string') val = parseFloat(val.replace(/[^\d.,-]/g, '').replace(',', '.'));
                    return isNaN(val) ? 0 : val;
                }
                return 0;
            };

            jsonData.forEach(row => {
                if (!row || row.length < 2) return;
                const rowStr = row.join(' ').toUpperCase();

                const mappings = {
                    "TOTAL EFECTIVO BS": "Efectivo",
                    "TOTAL TARJETA": "Tarjeta",
                    "TOTAL PM": "Pago Móvil",
                    "TOTAL TRANSFERENCIA": "Transferencia"
                };

                for (const [label, method] of Object.entries(mappings)) {
                    if (rowStr.includes(label)) {
                        const amount = getValueAtOffset(row, label, 2);
                        if (amount > 0) sales.push({ method, amount });
                    }
                }

                if (rowStr.includes("TOTAL EFECTIVO USD")) divisasSum += getValueAtOffset(row, "TOTAL EFECTIVO USD", 2);
                if (rowStr.includes("ZELLE")) divisasSum += getValueAtOffset(row, "ZELLE", 2);
            });

            if (divisasSum > 0) sales.push({ method: "divisas", amount: parseFloat(divisasSum.toFixed(2)) });
            if (sales.length > 0) extractedData.push({ date: dateStr, sales });
        });
        return extractedData;
    };

    const confirmImport = async () => {
        if (!processedData) return;
        setIsTyping(true);
        setImporting(true);

        try {
            let count = 0;
            for (const day of processedData) {
                for (const sale of day.sales) {
                    await api.createTransaction({
                        amount: sale.amount,
                        method: sale.method === 'divisas' ? 'Divisas' : sale.method,
                        date: day.date,
                        note: 'Importado por Asistente IA',
                        type: 'INGRESO',
                        category: 'Venta',
                        status: 'COMPLETADO'
                    });
                    count++;
                }
            }
            setImporting(false);
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now(), type: 'bot', text: `¡Listo! He importado correctamente ${count} ventas a tu base de datos.`, isSuccess: true
            }]);
            setProcessedData(null);
        } catch (error) {
            setImporting(false);
            setIsTyping(false);
            setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: 'Ocurrió un error al guardar los datos.' }]);
        }
    };

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center text-white hover:scale-105 transition-all duration-300 z-50 border-2 border-white/50 hover:shadow-primary/40 
                ${isOpen ? 'bg-[#1e293b] rotate-90' : 'bg-gradient-to-br from-primary to-teal-500 hover:rotate-12'}`}
                title="Hablar con Asistente Financiero"
            >
                {isOpen ? <X size={24} className="-rotate-90 transition-transform" /> : <Bot size={28} className="drop-shadow-sm" />}
            </button>

            {/* Chatbot Window */}
            {isOpen && (
                <div className="fixed bottom-28 right-8 w-[90vw] max-w-[400px] h-[650px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-[#868CFF] p-5 text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-inner shrink-0">
                                <Bot size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Asistente IA Financiero</h1>
                                <p className="text-sm opacity-90 text-white">Análisis predictivo e importación</p>
                            </div>
                        </div>
                    </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-6">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                            max-w-[80%] rounded-2xl p-4 shadow-sm relative text-sm md:text-base
                            ${msg.type === 'user'
                                ? 'bg-primary text-white rounded-tr-none'
                                : 'bg-white border border-gray-100 text-secondary rounded-tl-none'
                            }
                        `}>
                            {msg.isFile && <FileSpreadsheet className="mb-2 opacity-80" size={20} />}
                            <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                            {/* Action Buttons */}
                            {msg.action === 'confirm_import' && !msg.actionTaken && (
                                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                                    <button
                                        onClick={confirmImport}
                                        disabled={importing}
                                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
                                    >
                                        {importing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                        Sí, Importar Excel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex gap-1 items-center">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
                className={`p-4 bg-white border-t border-gray-100 transition-colors duration-300 ${isDragging ? 'bg-blue-50 border-primary' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="relative flex items-center gap-3">
                    <label className="cursor-pointer p-3 text-secondary hover:bg-gray-100 rounded-xl transition-colors shrink-0">
                        <Upload size={20} />
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </label>
                    
                    <input
                        type="text"
                        placeholder={isDragging ? "¡Suelta el Excel aquí!" : "Pregúntame sobre tus finanzas o proyecciones..."}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={`flex-1 py-3 px-4 rounded-xl border outline-none transition-all text-sm
                            ${isDragging ? 'border-primary bg-blue-50' : 'bg-gray-50 border-gray-200 focus:border-primary focus:bg-white'}
                        `}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isTyping}
                        className="bg-primary text-white p-3 rounded-xl hover:bg-opacity-90 transition-colors disabled:opacity-50 shrink-0 shadow-md"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    )}
</>
    );
};

export default ImportAssistant;