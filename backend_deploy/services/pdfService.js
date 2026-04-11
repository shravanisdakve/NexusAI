const { PDFDocument } = require('pdf-lib');

/**
 * Split a PDF into chunks of a specific size.
 * @param {Buffer} pdfBuffer - The original PDF as a Buffer.
 * @param {number} pageSize - Number of pages per chunk (default: 5).
 * @returns {Promise<Buffer[]>} - Array of Buffer chunks.
 */
const splitPdfIntoChunks = async (pdfBuffer, pageSize = 5) => {
    try {
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const totalPages = pdfDoc.getPageCount();
        const chunks = [];

        for (let i = 0; i < totalPages; i += pageSize) {
            const newDoc = await PDFDocument.create();
            const end = Math.min(i + pageSize, totalPages);
            const pageIndices = Array.from({ length: end - i }, (_, k) => i + k);
            
            const copiedPages = await newDoc.copyPages(pdfDoc, pageIndices);
            copiedPages.forEach(page => newDoc.addPage(page));
            
            const chunkBuffer = await newDoc.save();
            chunks.push(Buffer.from(chunkBuffer));
        }

        return chunks;
    } catch (error) {
        console.error('[pdfService] Error splitting PDF:', error);
        throw error;
    }
};

/**
 * Get the page count of a PDF.
 * @param {Buffer} pdfBuffer - The PDF as a Buffer.
 * @returns {Promise<number>} - Page count.
 */
const getPageCount = async (pdfBuffer) => {
    try {
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        return pdfDoc.getPageCount();
    } catch (error) {
        console.error('[pdfService] Error getting page count:', error);
        return 0;
    }
};

module.exports = {
    splitPdfIntoChunks,
    getPageCount
};
