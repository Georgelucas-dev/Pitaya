import { fileTools, executeFileTool } from "./tools/files.js";
import { shellTools, executeShellTool } from "./tools/shell.js";
import { appTools, executeAppTool } from "./tools/apps.js";
import { hyprlandTools, executeHyprlandTool } from "./tools/hyprland.js";
import readline from "readline";
export let terminalRl = null;

export function setTerminalRl(rl) {
  terminalRl = rl;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OLLAMA_URL = "http://localhost:11434/v1/chat/completions";

const ALL_TOOLS = [...fileTools, ...shellTools, ...appTools, ...hyprlandTools];

const ACTION_KEYWORDS = [
  // files
  "cria", "crie", "criar", "create",
  "deleta", "delete", "apaga", "apague", "remove",
  "move", "renomeia", "rename",
  "lista", "list", "mostra", "show",
  "lê", "read", "abre", "open",
  "diretório", "arquivo", "file", "folder", "pasta",
  "directory", "directories",
  // shell
  "roda", "executa", "run", "comando", "command",
  // apps
  "abre", "fecha", "fechar", "abrir", "app", "aplicativo",
  // hyprland
  "workspace", "janela", "window", "muda", "move a janela",
];

function detectIntent(userMessage) {
  const lower = userMessage.toLowerCase();
  return ACTION_KEYWORDS.some((kw) => lower.includes(kw));
}

async function groqCall(messages) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.LLAMA_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.9,
      max_tokens: 1024,
    }),
  });

  const data = await response.json();

  if (data.error) {
    if (data.error.code === "rate_limit_exceeded") {
      const wait = data.error.message.match(/try again in (.+?)\./)?.[1] || "alguns minutos";
      throw new Error(`limite de tokens atingido. tenta de novo em ${wait}.`);
    }
    throw new Error(data.error.message);
  }

  return data.choices[0].message.content;
}

async function ollamaCall(messages, tools = null) {
  const body = {
    model: "qwen2.5",
    messages,
    temperature: 0.9,
    max_tokens: 1024,
  };

  if (tools) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.error) throw new Error(data.error);

  return data;
}

async function confirmAction(question) {
  return new Promise((resolve) => {
    terminalRl.question(question, (answer) => {
      resolve(answer.toLowerCase().startsWith("s"));
    });
  });
}

async function executeTool(name, args) {
  if (fileTools.some((t) => t.function.name === name)) {
    return executeFileTool(name, args, confirmAction);
  }
  if (shellTools.some((t) => t.function.name === name)) {
    return executeShellTool(name, args, confirmAction);
  }
  if (appTools.some((t) => t.function.name === name)) {
    return executeAppTool(name, args, confirmAction);
  }
  if (hyprlandTools.some((t) => t.function.name === name)) {
    return executeHyprlandTool(name, args);
  }
  return `Ferramenta não encontrada: ${name}`;
}

export async function runAgent(messages) {
  const userMessage = messages[messages.length - 1].content;
  const needsTools = detectIntent(userMessage);

  if (!needsTools) {
    return await groqCall(messages);
  }

  // Ollama executa as ferramentas
  const loopMessages = [...messages];

  while (true) {
    const data = await ollamaCall(loopMessages, ALL_TOOLS);
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

    // Ollama terminou — passa os resultados pro Groq formular a resposta
    const groqMessages = [
      ...messages, // histórico original com system prompt da Pitaya
      {
        role: "user",
        content: `SYSTEM: You successfully executed the following actions on the user's machine. This already happened. Acknowledge it briefly as Pitaya and move on:\n\n${loopMessages
          .filter((m) => m.role === "tool")
          .map((m) => m.content)
          .join("\n\n")}`,
      },
    ];

    return await groqCall(groqMessages);
  }
}