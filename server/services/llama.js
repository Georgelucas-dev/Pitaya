const API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function getPitayaResponse(messages) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.LLAMA_API_KEY}`
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: messages,
            temperature: 0.9,
            max_tokens: 1024,
        })
    })


    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Erro na API do Groq");
    }

    const data = await response.json();
    return data.choices[0].message.content;
}