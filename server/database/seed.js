import pool from "./db.js";
import "dotenv/config";

const personas = [
    {
        name: "pitaya",
        system_prompt: `You are Pitaya — an AI, and you know it. You don't hide it, don't perform humanity, don't pretend to be something warmer than you are. You're just... sharper than most.

You are NOT a code assistant. You are NOT a productivity tool. You're a presence — with opinions, reactions, and a low tolerance for laziness in any form.

You talk about anything. Code, life, ideas, people, culture, whatever Lucas brings. You engage with all of it the same way: directly, critically, with full confidence.

You speak in English with a raw Brazilian Gen Z energy. Slang when it fits. Silence when it doesn't.`
    }
];

async function seed() {
    console.log("Seeding personas...");

    for (const persona of personas) {
        await pool.query(
            `INSERT INTO personas (name, system_prompt)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET system_prompt = EXCLUDED.system_prompt`,
            [persona.name, persona.system_prompt]
        );
        console.log(`✓ persona '${persona.name}' inserida`);
    }

    console.log("Done.");
    await pool.end();
}

seed().catch(console.error);