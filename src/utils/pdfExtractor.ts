// backend/utils/pdfExtractor.js

import { PDFDocument } from "pdf-lib";
import * as fs from "fs/promises";
import pdfParse from "pdf-parse";

/**
 * Extrai dados estruturados de faturas de energia elétrica em PDF
 * @param {string} pdfPath - Caminho do arquivo PDF
 * @returns {Promise<Object>} Dados extraídos da fatura
 */
async function extractDataFromPDF(pdfPath: string): Promise<any> {
  try {
    // Load the PDF
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfData = await pdfParse(pdfBytes);

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
  } catch (error) {
    console.error(`Erro ao processar ${pdfPath}:`, error);
    throw error;
  }
}
// Funções auxiliares específicas para cada campo
function extractClientNumber(text: string): string | null {
  const match = text.match(/Nº DO CLIENTE[\s:]*(\d+)/i);
  return match ? match[1] : null;
}

function extractInstallationNumber(text: string): string | null {
  const match = text.match(/Nº DA INSTALAÇÃO[\s:]*(\d+)/i);
  return match ? match[1] : null;
}

function extractReferenceMonth(text: string): string | null {
  const match = text.match(
    /(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)[\/ ]?\d{2,4}/i
  );
  return match ? match[0].replace(" ", "/") : null;
}

function extractEnergyData(text: string): {
  energyElectric: any;
  energyScee: any;
  energyCompensated: any;
  municipalContribution: number | null;
} {
  return {
    energyElectric: extractFromTable(text, "Energia Elétrica"),
    energyScee: extractFromTable(text, "Energia SCEE s/ ICMS"),
    energyCompensated: extractFromTable(text, "Energia compensada GD I"),
    municipalContribution: extractMunicipalContribution(text),
  };
}

function extractFromTable(
  text: string,
  itemName: string
): {
  unit: string;
  kWh: number | null;
  value: number;
} | null {
  const regex = new RegExp(
    `${itemName}[\\s\\|]*([\\w\\/]+)[\\s\\|]*([\\d.,]+)[\\s\\|]*([\\d.,]+)[\\s\\|]*([\\d.,]*)`,
    "i"
  );
  const match = text.match(regex);

  if (!match) return null;

  return {
    unit: match[1],
    kWh: match[2] ? parseBrazilianNumber(match[2]) : null,
    value: match[4]
      ? parseBrazilianNumber(match[4])
      : parseBrazilianNumber(match[3]),
  };
}

function extractMunicipalContribution(text: string): number | null {
  const match = text.match(
    /Contrib (?:Ilum|Ilum Publica) Municipal[^\d]*([\d.,]+)/i
  );
  return match ? parseBrazilianNumber(match[1]) : null;
}

function extractTotalValue(text: string): number | null {
  const match =
    text.match(/Total a pagar[^\d]*R\$[^\d]*([\d.,]+)/i) ||
    text.match(/Valor a pagar \(R\$\)[^\d]*([\d.,]+)/i);
  return match ? parseBrazilianNumber(match[1]) : null;
}

function parseBrazilianNumber(numberStr: string): number {
  return parseFloat(numberStr.replace(/\./g, "").replace(",", "."));
}

export { extractDataFromPDF, parseBrazilianNumber };
