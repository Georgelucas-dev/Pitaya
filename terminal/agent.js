import { fileTools, executeFileTool } from "./tools/files.js";
import readline from "readline";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const ALL_TOOLS = [...fileTools];

const ACTION_KEYWORDS = [
  "cria", "crie", "criar", "create",
  "deleta", "delete", "apaga", "apague", "remove",
  "move", "renomeia", "rename",
  "lista", "list", "mostra", "show",
  "lê", "read", "abre", "open",
  "roda", "executa", "run",
  "diretório", "arquivo", "file", "folder", "pasta",
  "directory", "directories",
];

function detectIntent(userMessage) {
  const lower = userMessage.toLowerCase();
  return ACTION_KEYWORDS.some((kw) => lower.includes(kw));
}

async function groqCall(messages, tools = null) {
  const body = {
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.9,
    max_tokens: 1024,
  };

  if (tools) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LLAMA_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.error) {
    if (data.error.code === "rate_limit_exceeded") {
      const wait = data.error.message.match(/try again in (.+?)\./)?.[1] || "alguns minutos";
      throw new Error(`Foi mal, não posso falar agora. tenta de novo em ${wait}.`);
    }
    throw new Error(data.error.message);
  }

  return data;
}

async function confirmAction(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "s");
    });
  });
}

async function executeTool(name, args) {
  if (fileTools.some((t) => t.function.name === name)) {
    return executeFileTool(name, args, confirmAction);
  }
  return `Ferramenta não encontrada: ${name}`;
}

export async function runAgent(messages) {
  const userMessage = messages[messages.length - 1].content;
  const needsTools = detectIntent(userMessage);

  if (!needsTools) {
    const data = await groqCall(messages);
    return data.choices[0].message.content;
  }

  const loopMessages = [...messages];

  while (true) {
    const data = await groqCall(loopMessages, ALL_TOOLS);
    const choice = data.choices[0];
    const message = choice.message;

    loopMessages.push(message);

    if (choice.finish_reason === "tool_calls") {
      for (const toolCall of message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await executeTool(toolCall.function.name, args);
        loopMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }
      continue;
    }

    return message.content;
  }
}