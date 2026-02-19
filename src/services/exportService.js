import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName = 'export.xlsx', sheetName = 'Datos') => {
    try {
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

        // Download
        XLSX.writeFile(workbook, fileName);
        return true;
    } catch (error) {
        console.error("Error exporting to Excel:", error);
        return false;
    }
};
