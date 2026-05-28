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
     FROM messages m
     JOIN conversations c ON c.id = m.conversation_id
     JOIN personas p ON p.id = c.persona_id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at ASC`,
    [conversationId]
  );

  const systemPrompt = result.rows[0]?.system_prompt;
  const history = result.rows.map(({ role, content }) => ({ role, content }));

  return { history, systemPrompt };
}