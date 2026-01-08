
const pdfLib = require('pdf-parse'); // El objeto que vimos

console.log('Tipo de PDFParse:', typeof pdfLib.PDFParse);

try {
    // Intento de uso simple asumiendo que es una clase o funcion estatica
    // No puedo probar con un buffer real facil, pero veo si es constructor
    console.log('Es constructor?', !!pdfLib.PDFParse.prototype && !!pdfLib.PDFParse.prototype.constructor.name);
} catch (e) {
    console.log('Error check:', e);
}
