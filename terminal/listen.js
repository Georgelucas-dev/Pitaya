import { execSync, spawn } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { tmpdir, homedir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import path from "path";

const PIPER_MODEL = join(homedir(), ".local/share/piper/voices/en_US-amy-medium.onnx");

export async function transcribeAudio(audioPath) {
    const formData = new FormData();
    const audioBlob = new Blob([await import("fs").then(fs => fs.promises.readFile(audioPath))], { type: "audio/wav" });
    formData.append("file", audioBlob, "audio.wav");
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("language", "en");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.LLAMA_API_KEY}`,
        },
        body: formData,
    });

    const data = await response.json();
    return data.text?.trim();
}

export async function recordAudio() {
    const outputPath = join(tmpdir(), `pitaya-${randomUUID()}.wav`);

    return new Promise((resolve, reject) => {
        const rec = spawn("sox", [
            "-d",
            outputPath,
            "silence",
            "1", "0.1", "5%",    // começa quando detecta 5% de volume
            "1", "2.0", "5%",    // para após 2s abaixo de 5% de volume
        ], { stdio: "ignore" });

        rec.on("close", (code) => {
            if (code === 0) resolve(outputPath);
            else reject(new Error(`sox saiu com código ${code}`));
        });

        rec.on("error", reject);
    });
}

export async function speakText(text) {
    const outputPath = join(tmpdir(), `pitaya-${randomUUID()}.wav`);

    await new Promise((resolve, reject) => {
        const piper = spawn("piper-tts", [
            "--model", PIPER_MODEL,
            "--output_file", outputPath,
        ]);
        piper.stdin.write(text);
        piper.stdin.end();
        piper.on("close", (code) => code === 0 ? resolve() : reject(new Error(`Piper erro ${code}`)));
    });

    execSync(`aplay ${outputPath}`, { stdio: "ignore" });

    try { unlinkSync(outputPath); } catch { }
}