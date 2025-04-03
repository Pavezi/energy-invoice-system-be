import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import { PDFDocument } from "pdf-lib";
import { extractDataFromPDF } from "./utils/pdfExtractor";

const prisma = new PrismaClient();
const upload = multer({ dest: "uploads/" });

const app = express();
app.use(cors());
app.use(express.json());

// Rota de teste
app.get("/", (req: Request, res: Response) => {
  res.send("API do Energy Invoice System!");
});

// Rota de upload
app.post(
  "/api/upload",
  upload.single("pdf"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Nenhum arquivo enviado" });
        return;
      }

      const pdfPath = req.file.path;
      const extractedData = await extractDataFromPDF(pdfPath);

      const invoice = await prisma.invoice.create({ data: extractedData });
      res.json(invoice);

      await fs.unlink(pdfPath);
    } catch (error) {
      console.error("Erro no upload:", error);
      res.status(500).json({
        error: "Erro ao processar fatura",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }
);

// Inicia o servidor
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
