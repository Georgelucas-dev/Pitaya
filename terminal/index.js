#!/usr/bin/env node
import readline from "readline";
import { loadTheme, buildColors } from "./theme.js";


const theme = loadTheme();
const colors = buildColors(theme);

const API_BASE = "http://localhost:3000/api/chat";
let conversationId = null;



const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});



function now() {
    return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function printUser(text) {
    console.log();
    console.log(`${colors.blue("you")}   ${colors.muted(now())}`);
    console.log(colors.white(`  ${text}`));
    console.log();
}

function printPitaya(text) {
    console.log();
    console.log(`${colors.purple("pitaya")} ${colors.muted(now())}`);
    text.split("\n").forEach((line) => console.log(colors.white(`  ${line}`)));
    console.log();
}

function printSystem(text) {
    console.log(colors.green(`  ${text}`));
    console.log();
}

async function api(path, method = "GET", body = null) {
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : null,
    });
    return res.json();
}

async function initConversation() {
    const data = await api("/start", "POST", { persona: "pitaya" });
    conversationId = data.conversationId;
}

async function handleCommand(input) {
    const text = input.trim();

    if (text === "/help") {
        printPitaya(
            "comandos disponíveis:\n" +
            "  /help           · lista de comandos\n" +
            "  /convos         · lista conversas anteriores\n" +
            "  /title <nome>   · nomeia a conversa atual\n" +
            "  /rm             · deleta a conversa atual\n" +
            "  /rm <id>        · deleta uma conversa específica\n" +
            "  /exit           · encerra o terminal"
        );
        return;
    }

    if (text === "/exit") {
        printSystem("até mais.");
        rl.close();
        process.exit(0);
    }

    if (text === "/convos") {
        const data = await api("/convos");
        let output = "conversas anteriores:\n";
        data.conversations.forEach((c) => {
            const date = new Date(c.created_at).toLocaleString("pt-BR", {
                day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
            });
            const title = c.title || "(sem título)";
            output += `  [${c.id}] ${title} · ${date}\n`;
        });
        printPitaya(output.trim());
        return;
    }

    if (text.startsWith("/title ")) {
        const title = text.slice(7).trim();
        await api(`/${conversationId}/title`, "PATCH", { title });
        printSystem(`conversa nomeada: "${title}"`);
        return;
    }

    if (text === "/theme") {
        const freshTheme = loadTheme();
        Object.assign(colors, buildColors(freshTheme));
        printSystem("tema recarregado.");
        return;
    }

    if (text.startsWith("/rm")) {
        const arg = text.slice(3).trim();
        const targetId = arg || conversationId;
        await api(`/${targetId}`, "DELETE");

        if (targetId == conversationId) {
            printSystem("conversa atual deletada. iniciando nova sessão...");
            await initConversation();
        } else {
            printSystem(`conversa [${targetId}] deletada.`);
        }
        return;
    }

    // mensagem normal
    const data = await api(`/${conversationId}`, "POST", { message: text });
    printPitaya(data.reply);
}

function prompt() {
    process.stdout.write(colors.muted("> "));

    rl.once("line", async (input) => {
        process.stdout.write("\x1b[1A\x1b[2K");

        if (!input.trim()) {
            prompt();
            return;
        }

        const isCommand = input.trim().startsWith("/");
        if (!isCommand) printUser(input);

        await handleCommand(input);
        prompt();
    });
}
async function main() {
    const logo = colors.logo(`
██████╗ ██╗████████╗ █████╗ ██╗   ██╗ █████╗ 
██╔══██╗██║╚══██╔══╝██╔══██╗╚██╗ ██╔╝██╔══██╗
██████╔╝██║   ██║   ███████║ ╚████╔╝ ███████║
██╔═══╝ ██║   ██║   ██╔══██║  ╚██╔╝  ██╔══██║
██║     ██║   ██║   ██║  ██║   ██║   ██║  ██║
╚═╝     ╚═╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝`);

    const info = [
        `${colors.muted("  version  ")}${colors.white("4.0.0")}`,
        `${colors.muted("  model    ")}${colors.white("llama-3.3-70b-versatile")}`,
        `${colors.muted("  persona  ")}${colors.purple("pitaya")}`,
        `${colors.muted("  server   ")}${colors.green("● running on port 3000")}`,
        `${colors.muted("  Made by  ")}${colors.white("George Lucas")}`,
        `\n${colors.muted("  ────────────────────────────────────────")}`,
        `\n${colors.muted("  type ")}${colors.white("/help")}${colors.muted(" for commands")}`,
    ].join("\n");

    console.log(logo);
    console.log(info);
    console.log();

    await initConversation();
    prompt();
}

main().catch(console.error);