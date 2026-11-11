const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Helmet para headers de segurança
app.use(helmet({
  contentSecurityPolicy: false, // Desativado para facilitar carregamento de recursos externos se necessário
}));

// 2. Rate Limiter (Máximo de 5 requisições por IP a cada 15 minutos)
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: { error: "Muitas solicitações vindas deste IP. Tente novamente após 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware básico
app.use(cors());
app.use(express.static(__dirname)); // Serve arquivos estáticos (index.html)
app.use(express.json({ limit: '50kb' })); // Previne payloads gigantes

// 3. Rota POST /api/submit-lead
app.post('/api/submit-lead', submitLimiter, async (req, res) => {
  const {
    nome,
    telefone,
    email,
    contexto,
    agent_id,
    prompt_id,
    is_scheduled,
    scheduled_date,
    scheduled_time
  } = req.body;

  // Validação básica
  if (!nome || typeof nome !== 'string' || !telefone || typeof telefone !== 'string') {
    return res.status(400).json({ error: "Nome e telefone são obrigatórios e devem ser strings." });
  }

  // RESOLUÇÃO DA URL E CHAVE DE API (Robustez para diferentes ambientes)
  const apiUrl = process.env.WEBHOOK_URL || process.env.PYTHON_API_URL || process.env.MINDFLOW_WEBHOOK_URL || "https://call-github.bkpxmb.easypanel.host/webhook";
  const apiKey = process.env.WEBHOOK_API_KEY || process.env.PYTHON_API_KEY;

  if (!apiUrl) {
    console.error("[BFF CONFIG ERROR] Nenhuma URL de API configurada (WEBHOOK_URL, PYTHON_API_URL ou MINDFLOW_WEBHOOK_URL)");
    return res.status(500).json({ error: "Configuração do servidor incompleta: URL da API ausente." });
  }

  try {
    // Lógica de Agendamento (quando_ligar)
    let quando_ligar = "";
    if (is_scheduled && scheduled_date && scheduled_time) {
      // Formato esperado: ISO 8601 (-03:00) -> YYYY-MM-DDTHH:MM:SS-03:00
      quando_ligar = `${scheduled_date}T${scheduled_time}:00-03:00`;
    }

    // Mapeamento do Payload para a API Python
    const pythonPayload = {
      nome: nome.toUpperCase(),
      email: email || "",
      numero: telefone,
      contexto: contexto || "",
      agent_id: agent_id || "agent_1e4cfa23e3910c557d82167949",
      Prompt_id: prompt_id || "24",
      execution_id: uuidv4(),
      quando_ligar: quando_ligar,
      workflow_name: "pre_call_processing"
    };

    console.log(`[BFF] Enviando lead para ${apiUrl}: ${pythonPayload.nome} (${pythonPayload.execution_id})`);

    // 4. Disparo via Axios
    const response = await axios.post(apiUrl, pythonPayload, {
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json"
      },
      timeout: 10000 // 10 segundos de timeout
    });

    return res.status(202).json({
      message: "Lead processado com sucesso.",
      execution_id: pythonPayload.execution_id
    });

  } catch (error) {
    // Console log interno do erro real (Seguro)
    console.error("[BFF ERROR] Erro na integração com API Python:", error.response?.data || error.message);

    // Retorno para o frontend com detalhes do erro para facilitar o debug
    const errorMessage = error.response?.data?.message || error.response?.data || error.message || "Erro interno ao processar a solicitação";

    return res.status(500).json({
      error: `Erro na API: ${typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage}`
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BFF Mindflow rodando em http://0.0.0.0:${PORT}`);
});
