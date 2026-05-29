import fs from "fs/promises";
import path from "path";
import { homedir } from "os";

const PROTECTED_PATHS = [
    path.join(homedir(), ".ssh"),
    path.join(homedir(), ".config/hypr"),
    path.join(homedir(), ".config/omarchy"),
    path.join(homedir(), ".gnupg"),
];

function expandPath(p) {
    if (p.startsWith("~/")) {
        return path.join(homedir(), p.slice(2));
    }
    return p;
}

function isProtected(targetPath) {
    const resolved = path.resolve(expandPath(targetPath));
    return PROTECTED_PATHS.some((p) => resolved.startsWith(p));
}

export const fileTools = [
    {
        type: "function",
        function: {
            name: "read_file",
            description: "Read the contents of a file",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Path to the file" },
                },
                required: ["path"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "write_file",
            description: "Create or overwrite a file with content",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Path to the file" },
                    content: { type: "string", description: "Content to write" },
                },
                required: ["path", "content"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "delete_file",
            description: "Delete a file",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Path to the file" },
                },
                required: ["path"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "move_file",
            description: "Move or rename a file or directory",
            parameters: {
                type: "object",
                properties: {
                    source: { type: "string", description: "Source path" },
                    destination: { type: "string", description: "Destination path" },
                },
                required: ["source", "destination"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "create_directory",
            description: "Create a directory (including nested)",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Directory path to create" },
                },
                required: ["path"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "list_directory",
            description: "List files and folders in a directory",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Directory path" },
                },
                required: ["path"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "delete_directory",
            description: "Delete a directory and all its contents",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Directory path to delete" },
                },
                required: ["path"],
            },
        },
    },
];



export async function executeFileTool(name, args, confirmFn) {

    const targetPath = args.path || args.source;

    if (targetPath && isProtected(targetPath)) {
        const confirmed = await confirmFn(
            `⚠️  "${targetPath}" é um caminho protegido. Confirma? (s/n) `
        );
        if (!confirmed) return "Ação cancelada pelo usuário.";
    }

    try {
        switch (name) {
            case "read_file":
                return await fs.readFile(path.resolve(expandPath(args.path)), "utf8");

            case "write_file":
                const resolved = path.resolve(expandPath(args.path));
                await fs.mkdir(path.dirname(resolved), { recursive: true });
                await fs.writeFile(resolved, args.content, "utf8");
                return `Arquivo criado: ${args.path}`;

            case "delete_file":
                await fs.unlink(path.resolve(expandPath(args.path)));
                return `Arquivo deletado: ${args.path}`;

            case "move_file":
                await fs.rename(
                    path.resolve(expandPath(args.source)),
                    path.resolve(expandPath(args.destination))
                );
                return `Movido: ${args.source} → ${args.destination}`;

            case "create_directory":
                await fs.mkdir(path.resolve(expandPath(args.path)), { recursive: true });
                return `Diretório criado: ${args.path}`;

            case "list_directory": {
                const entries = await fs.readdir(path.resolve(expandPath(args.path)), { withFileTypes: true });
                return entries.map((e) => `${e.isDirectory() ? "📁" : "📄"} ${e.name}`).join("\n");
            }

            case "delete_directory":
                await fs.rm(path.resolve(expandPath(args.path)), { recursive: true, force: true });
                return `Diretório deletado: ${args.path}`;

            default:
                return `Ferramenta desconhecida: ${name}`;
        }
    } catch (err) {
        return `Erro: ${err.message}`;
    }
}