const express = require("express");
const cors = require("cors");

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
