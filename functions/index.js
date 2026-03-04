const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Definimos el secreto (debe configurarse con firebase functions:secrets:set GEMINI_API_KEY)
const geminiApiKey = defineSecret("GEMINI_API_KEY");

exports.analyzeWithGemini = onRequest({ secrets: [geminiApiKey], cors: true }, async (req, res) => {
    try {
        // 1. Validar que la petición sea POST
        if (req.method !== "POST") {
            return res.status(405).send("Method Not Allowed");
        }

        const { type, data, mimeType } = req.body;

        // 2. Validar input
        if (!data || !mimeType) {
            return res.status(400).send("Missing data or mimeType");
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey.value());
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let prompt = "";
        if (type === "image") {
            prompt = "Identifica los alimentos de este plato. Estima peso, calorías y macros (P/C/G) para cada ingrediente. MUY IMPORTANTE: Responde con los nombres de los alimentos en ESPAÑOL. Responde SOLO en JSON plano: [{\"name\": \"...\", \"weight\": 100, \"calories\": 200, \"protein\": 10, \"carbs\": 20, \"fat\": 5}]";
        } else if (type === "audio") {
            prompt = "Analiza este audio donde el usuario describe lo que ha comido. Responde con un JSON que tenga dos campos: 'transcript' (una transcripción limpia en español de lo que dijo el usuario) y 'items' (una lista de alimentos con estimación de gramos, calorías, proteínas, carbohidratos y grasas). MUY IMPORTANTE: Responde SOLO en formato JSON. Formato: {\"transcript\": \"...\", \"items\": [{\"name\": \"...\", \"weight\": 100, \"calories\": 200, \"protein\": 10, \"carbs\": 20, \"fat\": 5}]}";
        } else {
            return res.status(400).send("Invalid type (must be 'image' or 'audio')");
        }

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: data,
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        const usage = response.usageMetadata;

        console.log("Gemini Raw Response:", text);

        // Intentar limpiar el formato markdown si Gemini lo incluye
        const cleanedJson = text.replace(/```json|```/g, "").trim();

        try {
            const parsedResult = JSON.parse(cleanedJson);
            res.json({
                result: parsedResult,
                usage: {
                    promptTokens: usage?.promptTokenCount || 0,
                    responseTokens: usage?.candidatesTokenCount || 0
                }
            });
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError.message);
            res.status(500).json({
                error: "Error de formato IA",
                details: "La IA no devolvió un JSON válido. Revisa los logs.",
                rawResponse: text
            });
        }

    } catch (error) {
        console.error("Gemini Proxy Error:", error);
        res.status(500).json({
            error: "Error del Servidor de IA",
            details: error.message
        });
    }
});
