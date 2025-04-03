"use strict";
// backend/utils/pdfExtractor.js
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDataFromPDF = extractDataFromPDF;
exports.parseBrazilianNumber = parseBrazilianNumber;
const fs = __importStar(require("fs/promises"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
/**
 * Extrai dados estruturados de faturas de energia elétrica em PDF
 * @param {string} pdfPath - Caminho do arquivo PDF
 * @returns {Promise<Object>} Dados extraídos da fatura
 */
async function extractDataFromPDF(pdfPath) {
    try {
        // Load the PDF
        const pdfBytes = await fs.readFile(pdfPath);
        const pdfData = await (0, pdf_parse_1.default)(pdfBytes);
        // Extract text from all pages
        const fullText = pdfData.text;
        // Extract the main data
        const extractedData = {
            clientNumber: extractClientNumber(fullText),
            installationNumber: extractInstallationNumber(fullText),
            referenceMonth: extractReferenceMonth(fullText),
            ...extractEnergyData(fullText),
            totalValue: extractTotalValue(fullText),
        };
        // Basic validation
        if (!extractedData.clientNumber || !extractedData.referenceMonth) {
            throw new Error("PDF não contém dados essenciais");
        }
        return extractedData;
    }
    catch (error) {
        console.error(`Erro ao processar ${pdfPath}:`, error);
        throw error;
    }
}
// Funções auxiliares específicas para cada campo
function extractClientNumber(text) {
    const match = text.match(/Nº DO CLIENTE[\s:]*(\d+)/i);
    return match ? match[1] : null;
}
function extractInstallationNumber(text) {
    const match = text.match(/Nº DA INSTALAÇÃO[\s:]*(\d+)/i);
    return match ? match[1] : null;
}
function extractReferenceMonth(text) {
    const match = text.match(/(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)[\/ ]?\d{2,4}/i);
    return match ? match[0].replace(" ", "/") : null;
}
function extractEnergyData(text) {
    return {
        energyElectric: extractFromTable(text, "Energia Elétrica"),
        energyScee: extractFromTable(text, "Energia SCEE s/ ICMS"),
        energyCompensated: extractFromTable(text, "Energia compensada GD I"),
        municipalContribution: extractMunicipalContribution(text),
    };
}
function extractFromTable(text, itemName) {
    const regex = new RegExp(`${itemName}[\\s\\|]*([\\w\\/]+)[\\s\\|]*([\\d.,]+)[\\s\\|]*([\\d.,]+)[\\s\\|]*([\\d.,]*)`, "i");
    const match = text.match(regex);
    if (!match)
        return null;
    return {
        unit: match[1],
        kWh: match[2] ? parseBrazilianNumber(match[2]) : null,
        value: match[4]
            ? parseBrazilianNumber(match[4])
            : parseBrazilianNumber(match[3]),
    };
}
function extractMunicipalContribution(text) {
    const match = text.match(/Contrib (?:Ilum|Ilum Publica) Municipal[^\d]*([\d.,]+)/i);
    return match ? parseBrazilianNumber(match[1]) : null;
}
function extractTotalValue(text) {
    const match = text.match(/Total a pagar[^\d]*R\$[^\d]*([\d.,]+)/i) ||
        text.match(/Valor a pagar \(R\$\)[^\d]*([\d.,]+)/i);
    return match ? parseBrazilianNumber(match[1]) : null;
}
function parseBrazilianNumber(numberStr) {
    return parseFloat(numberStr.replace(/\./g, "").replace(",", "."));
}
