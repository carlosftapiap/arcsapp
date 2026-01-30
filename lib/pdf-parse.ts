/**
 * Wrapper para pdf-parse que evita el bug del archivo de prueba
 * El paquete pdf-parse intenta cargar './test/data/05-versions-space.pdf' en producción
 * Este wrapper importa directamente el módulo de parsing sin el test file
 */

// @ts-ignore - Importamos directamente el archivo de parsing
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export default pdfParse;
