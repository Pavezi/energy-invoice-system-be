"use strict";
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const app = express();
app.use(cors());
app.use(express.json()); // Para receber JSON no body
// Rota de teste
app.get("/", (req, res) => {
    res.send("API do Energy Invoice System!");
});
// Inicia o servidor
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
app.post("/api/upload", upload.single("pdf"), async (req, res) => {
    const pdfPath = req.file.path;
    const extractedData = await extractDataFromPDF(pdfPath); // Implemente essa função
    // Salvar no banco usando Prisma
    const invoice = await prisma.invoice.create({ data: extractedData });
    res.json(invoice);
});
async function extractDataFromPDF(pdfPath) {
    const { PDFDocument } = require('pdf-lib');
    const pdfBytes = await fs.promises.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const text = (await pdfDoc.getPages())[0].getTextContent();
    // Lógica para extrair campos específicos (adaptar conforme seu PDF)
    const clientNumber = text.match(/Nº DO CLIENTE:\s*(\d+)/)[1];
    return { clientNumber, ... }; // Complete com outros campos
}
