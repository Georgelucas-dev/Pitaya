import { spawn } from "child_process";

export const appTools = [
  {
    type: "function",
    function: {
      name: "open_app",
      description: "Open an application by name",
      parameters: {
        type: "object",
        properties: {
          app: { type: "string", description: "Application name or command (e.g. firefox, spotify, kitty)" },
        },
        required: ["app"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "close_app",
      description: "Close an application by name",
      parameters: {
        type: "object",
        properties: {
          app: { type: "string", description: "Application name to close" },
        },
        required: ["app"],
      },
    },
  },
];

export async function executeAppTool(name, args, confirmFn) {
  switch (name) {
    case "open_app": {
      const confirmed = await confirmFn(`Abrir "${args.app}"? (s/n) `);
      if (!confirmed) return "Cancelado.";

      spawn(args.app, [], {
        detached: true,
        stdio: "ignore",
        env: { ...process.env, DISPLAY: ":0" },
      }).unref();

      return `${args.app} aberto.`;
    }

    case "close_app": {
      const confirmed = await confirmFn(`Fechar "${args.app}"? (s/n) `);
      if (!confirmed) return "Cancelado.";

      spawn("pkill", ["-f", args.app], { stdio: "ignore" });
      return `${args.app} fechado.`;
    }

    default:
      return `Ferramenta desconhecida: ${name}`;
  }
}