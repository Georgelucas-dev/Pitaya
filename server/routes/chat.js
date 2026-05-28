import express from "express";
import { getPitayaResponse } from "../services/llama.js";
import { createConversation, saveMessage, getMessages } from "../memory/memory.js";
import { getPersona } from "../services/persona.js";
import pool from "../database/db.js";

const router = express.Router();

// rotas específicas primeiro
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

// rotas dinâmicas depois
router.post("/:conversationId", async (req, res) => {
  const { conversationId } = req.params;
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "'message' é obrigatório" });
  try {
    await saveMessage(conversationId, "user", message);
    const { history, systemPrompt } = await getMessages(conversationId);
    const messages = [{ role: "system", content: systemPrompt }, ...history];
    const reply = await getPitayaResponse(messages);
    await saveMessage(conversationId, "assistant", reply);
    res.json({ reply });
  } catch (err) {
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
    res.status(500).json({ error: err.message });
  }
});

export default router;