const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-235b-a22b:free",
  "google/gemma-3-27b-it:free",
];

export async function getPitayaResponse(messages) {
  for (const model of MODELS) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.9,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.warn(`Modelo ${model} falhou, tentando próximo...`);
      continue;
    }

    console.log("Modelo usado:", data.model);
    return data.choices[0].message.content;
  }

  throw new Error("Todos os modelos falharam.");
}