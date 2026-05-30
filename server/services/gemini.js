const API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

export async function getPitayaResponse(messages) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gemini-2.0-flash",
            messages,
            temperature: 0.9,
            max_tokens: 1024,
        }),
    });

    if (!response.ok) {
        const err = await response.json();
        console.error("Gemini erro:", JSON.stringify(err, null, 2));
        throw new Error(err.error?.message || "Erro na API do Gemini");
    }

    const data = await response.json();
    return data.choices[0].message.content;
}