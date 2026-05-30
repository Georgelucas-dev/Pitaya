import express from "express";
import { getPitayaResponse } from "../services/llama.js";
import { createConversation, saveMessage, getMessages } from "../memory/memory.js";
import { getPersona } from "../services/persona.js";
import pool from "../database/db.js";
import { textToSpeech } from "../services/tts.js";


const router = express.Router();

// 1. Rotas específicas primeiro
router.post("/start", async (req, res) => {
  const { persona = "pitaya" } = req.body;
  try {
    const personaData = await getPersona(persona);
    const conversationId = await createConversation(personaData.id);
    res.json({ conversationId, persona: personaData.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/convos", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, created_at FROM conversations ORDER BY created_at DESC`
    );
    res.json({ conversations: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:conversationId", async (req, res) => {
  const { conversationId } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, title, created_at FROM conversations WHERE id = $1",
      [conversationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Conversa não encontrada" });
    }

    res.json({ conversation: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:conversationId/save", async (req, res) => {
  const { conversationId } = req.params;
  const { userMessage, assistantMessage } = req.body;
  try {
    await saveMessage(conversationId, "user", userMessage);
    await saveMessage(conversationId, "assistant", assistantMessage);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:conversationId/history", async (req, res) => {
  const { conversationId } = req.params;
  try {
    const { history, systemPrompt } = await getMessages(conversationId);
    res.json({ messages: history, systemPrompt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Rotas dinâmicas depois
router.post("/:conversationId", async (req, res) => {
  const { conversationId } = req.params;
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: "'message' é obrigatório" });

  try {
    // Salva a mensagem do usuário
    await saveMessage(conversationId, "user", message);

    // Recupera o histórico e monta o prompt
    const { history, systemPrompt } = await getMessages(conversationId);
    const messages = [{ role: "system", content: systemPrompt }, ...history];

    // Gera a resposta do Llama
    const reply = await getPitayaResponse(messages);

    // Salva a resposta do assistente no banco
    await saveMessage(conversationId, "assistant", reply);

    // [AQUI] Transforma o texto da resposta em áudio
    const audio = await textToSpeech(reply);

    // Retorna o texto E o áudio (geralmente uma URL ou string base64, dependendo do seu serviço tts)
    res.json({ reply, audio });

  } catch (err) {
    console.error("Erro detalhado:", err.stack);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:conversationId/title", async (req, res) => {
  const { conversationId } = req.params;
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "'title' é obrigatório" });
  try {
    await pool.query("UPDATE conversations SET title = $1 WHERE id = $2", [title, conversationId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:conversationId", async (req, res) => {
  const { conversationId } = req.params;
  try {
    await pool.query("DELETE FROM conversations WHERE id = $1", [conversationId]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro na rota:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;