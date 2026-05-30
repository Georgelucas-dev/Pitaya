import { spawn } from "child_process";
import { join } from "path";
import { homedir } from "os";
import { readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const MODEL = join(homedir(), ".local/share/piper/voices/en_US-amy-medium.onnx");

export async function textToSpeech(text) {
    const outputPath = join(tmpdir(), `pitaya-${randomUUID()}.wav`);

    await new Promise((resolve, reject) => {
        const piper = spawn("piper-tts", [
            "--model", MODEL,
            "--output_file", outputPath,
        ]);

        let stderr = "";

        piper.stderr.on("data", (data) => {
            console.error("Piper stderr:", data.toString());
            stderr += data.toString();
        });

        piper.stdin.write(text);
        piper.stdin.end();

        piper.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(stderr || `Piper saiu com código ${code}`));
            }
        });

        piper.on("error", reject);
    });

    const audio = await readFile(outputPath);
    await unlink(outputPath);

    return audio.toString("base64");
}