import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const hyprlandTools = [
    {
        type: "function",
        function: {
            name: "get_workspace",
            description: "Get the current active workspace",
            parameters: { type: "object", properties: {} },
        },
    },
    {
        type: "function",
        function: {
            name: "switch_workspace",
            description: "Switch to a specific workspace",
            parameters: {
                type: "object",
                properties: {
                    number: { type: "number", description: "Workspace number" },
                },
                required: ["number"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "list_windows",
            description: "List all open windows",
            parameters: { type: "object", properties: {} },
        },
    },
    {
        type: "function",
        function: {
            name: "move_window_to_workspace",
            description: "Move the active window to a workspace",
            parameters: {
                type: "object",
                properties: {
                    number: { type: "number", description: "Target workspace number" },
                },
                required: ["number"],
            },
        },
    },
];

export async function executeHyprlandTool(name, args) {
    try {
        switch (name) {
            case "get_workspace": {
                const { stdout } = await execAsync("hyprctl activeworkspace -j");
                const ws = JSON.parse(stdout);
                return `Workspace atual: ${ws.id} (${ws.windows} janelas abertas)`;
            }

            case "switch_workspace": {
                await execAsync(`hyprctl dispatch workspace ${args.number}`);
                return `Mudou pro workspace ${args.number}.`;
            }

            case "list_windows": {
                const { stdout } = await execAsync("hyprctl clients -j");
                const windows = JSON.parse(stdout);
                return windows
                    .map((w) => `[ws ${w.workspace.id}] ${w.title} (${w.class})`)
                    .join("\n");
            }

            case "move_window_to_workspace": {
                await execAsync(`hyprctl dispatch movetoworkspace ${args.number}`);
                return `Janela movida pro workspace ${args.number}.`;
            }

            default:
                return `Ferramenta desconhecida: ${name}`;
        }
    } catch (err) {
        return `Erro: ${err.message}`;
    }
}