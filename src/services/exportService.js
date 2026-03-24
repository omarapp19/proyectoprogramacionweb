import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName = 'export.xlsx', sheetName = 'Datos') => {
    try {
        if (!data || data.length === 0) {
            alert("No hay datos para exportar.");
            return false;
        }

        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Convert JSON to Sheet
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Auto-width columns (heuristic)
        const keys = Object.keys(data[0] || {});
        const wscols = keys.map(key => ({ wch: Math.max(key.length, 15) }));
        worksheet['!cols'] = wscols;

        // Add Sheet to Workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Generate Excel file as array buffer
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        
        // Convert to Blob
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        
        // Create download link and trigger
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
    } catch (error) {
        console.error("Error exporting to Excel:", error);
        alert("No se pudo exportar el archivo: " + error.message);
        return false;
    }
};
