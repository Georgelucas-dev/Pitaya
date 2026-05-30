import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const BLOCKED_COMMANDS = [
    "rm -rf /",
    "rm -rf ~",
    "mkfs",
    "dd if=",
    ":(){:|:&};:",
    "chmod -R 777 /",
    "curl | sh",
    "wget | sh",
];

function isBlocked(command) {
    return BLOCKED_COMMANDS.some((blocked) =>
        command.toLowerCase().includes(blocked.toLowerCase())
    );
}

export const shellTools = [
    {
        type: "function",
        function: {
            name: "run_command",
            description: "Run a shell command and return the output",
            parameters: {
                type: "object",
                properties: {
                    command: { type: "string", description: "The shell command to run" },
                },
                required: ["command"],
            },
        },
    },
];

export async function executeShellTool(name, args, confirmFn) {
    if (name !== "run_command") return `Ferramenta desconhecida: ${name}`;

    const { command } = args;

    if (isBlocked(command)) {
        return `Comando bloqueado por segurança: ${command}`;
    }

    const confirmed = await confirmFn(
        `⚠️  Executar comando: "${command}" (s/n) `
    );
    if (!confirmed) return "Comando cancelado pelo usuário.";

    try {
        const { stdout, stderr } = await execAsync(command, {
            timeout: 10000,
            cwd: process.env.HOME,
        });
        return stdout || stderr || "Comando executado sem output.";
    } catch (err) {
        return `Erro: ${err.message}`;
    }
}