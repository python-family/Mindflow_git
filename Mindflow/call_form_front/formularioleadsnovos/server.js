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

// 3. Rota POST /api/demo-call
app.post('/api/demo-call', submitLimiter, async (req, res) => {
  const {
    nome,
    telefone,
    email
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
    // Configurações do Agente Kaique
    const agentId = process.env.DEMO_AGENT_ID || "agent_2117bcaaf68e8b7cc8e0d160f7";
    const promptId = process.env.DEMO_PROMPT_ID || "12";

    // Mapeamento do Payload para a API Python
    const pythonPayload = {
      nome: nome.toUpperCase(),
      email: email || "",
      numero: telefone,
      contexto: "Contato via página de demonstração Kaique.",
      agent_id: agentId,
      Prompt_id: promptId,
      execution_id: uuidv4(),
      quando_ligar: "",
      workflow_name: "pre_call_processing"
    };

    console.log(`[BFF] Enviando lead da demo para ${apiUrl}: ${pythonPayload.nome} (${pythonPayload.execution_id})`);

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
  console.log(`🚀 BFF Mindflow Demo Kaique rodando em http://0.0.0.0:${PORT}`);
});
