
const pdf = require('pdf-parse');

console.log('Tipo de exportación:', typeof pdf);
console.log('Claves:', Object.keys(pdf));

if (typeof pdf === 'function') {
    console.log('Es una función.');
} else {
    console.log('No es una función.');
    if (pdf.default) {
        console.log('Tiene default:', typeof pdf.default);
    }
}
