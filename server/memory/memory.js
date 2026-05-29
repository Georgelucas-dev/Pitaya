import pool from "../database/db.js";

export async function createConversation(personaId) {
  const result = await pool.query(
    "INSERT INTO conversations (persona_id) VALUES ($1) RETURNING id",
    [personaId]
  );
  return result.rows[0].id;
}

export async function saveMessage(conversationId, role, content) {
  await pool.query(
    "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)",
    [conversationId, role, content]
  );
}

export async function getMessages(conversationId) {
  const result = await pool.query(
    `SELECT m.role, m.content, p.system_prompt
     FROM conversations c
     JOIN personas p ON p.id = c.persona_id
     LEFT JOIN messages m ON m.conversation_id = c.id
     WHERE c.id = $1
     ORDER BY m.created_at ASC`,
    [conversationId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Conversa ${conversationId} não encontrada`);
  }

  const systemPrompt = result.rows[0].system_prompt;
  const history = result.rows
    .filter((r) => r.role !== null)
    .map(({ role, content }) => ({ role, content }));

  return { history, systemPrompt };
}