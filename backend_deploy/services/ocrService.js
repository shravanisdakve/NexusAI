const Tesseract = require('tesseract.js');

/**
 * OCR Service - Local extraction using Tesseract.js
 * No API keys required.
 */

/**
 * Extract text from an image (base64)
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} lang - Tesseract language code (default: 'eng')
 * @returns {Promise<string>} - The extracted text
 */
const extractFromImage = async (base64Data, lang = 'eng') => {
    try {
        console.log(`[OCR] Local extraction starting for lang: ${lang}...`);
        
        // Data URI format check
        const imageSource = base64Data.startsWith('data:') 
            ? base64Data 
            : `data:image/png;base64,${base64Data}`;

        const { data: { text } } = await Tesseract.recognize(imageSource, lang, {
            logger: m => console.log(`[OCR Progress] ${m.status}: ${Math.round(m.progress * 100)}%`)
        });

        console.log(`[OCR] Success. Extracted ${text.length} characters.`);
        return text.trim();
    } catch (error) {
        console.error('[OCR Error]:', error.message);
        throw new Error(`Local OCR Failed: ${error.message}`);
    }
};

/**
 * Handle "Difficult" PDFs by suggesting alternative local processing.
 * Note: PDF-to-Image conversion at scale requires OS binaries (poppler) 
 * or heavy node-canvas builds which are unreliable across all environments.
 */
const extractFromScannedPDF = async () => {
    // This is a placeholder for future complex PDF-to-Image logic.
    // In many student environments, they should convert PDF-to-Images locally
    // or use a Vision model if they have a GPU.
    throw new Error('Direct scanned PDF OCR requires conversion to Images first.');
};

module.exports = {
    extractFromImage,
    extractFromScannedPDF
};
