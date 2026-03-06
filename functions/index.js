const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

admin.initializeApp();

// OWASP Best Practice: Secrets should never be hardcoded or stored in code.
// Gemini API Key is stored securely via Firebase Secret Manager.
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// --- Rate Limiting Config (In-memory token bucket per instance) ---
// Note: In a distributed system, Redis/Firestore could be used, but in-memory 
// provides a sensible fast default per container instance, preventing localized abuse.
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_IP = 10;
const MAX_REQUESTS_PER_USER = 5;

const ipHits = new Map();
const userHits = new Map();

const isRateLimited = (identifier, map, limit) => {
    const now = Date.now();
    let record = map.get(identifier);
    if (!record) {
        record = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
        map.set(identifier, record);
        return false;
    }

    // Reset window if expired
    if (now > record.resetAt) {
        record.count = 1;
        record.resetAt = now + RATE_LIMIT_WINDOW_MS;
        return false;
    }

    record.count++;
    return record.count > limit;
};

// Periodic cleanup of rate limiting maps to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipHits.entries()) {
        if (now > record.resetAt) Object.assign(ipHits, { [key]: undefined });
    }
    for (const [key, record] of userHits.entries()) {
        if (now > record.resetAt) Object.assign(userHits, { [key]: undefined });
    }
}, 5 * 60 * 1000); // Clean every 5 mins


exports.analyzeWithGemini = onRequest({ secrets: [geminiApiKey], cors: true }, async (req, res) => {
    try {
        // --- 1. Basic Protocol Validation ---
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method Not Allowed" });
        }

        // --- 2. Rate Limiting (IP-based) ---
        const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        if (clientIp && isRateLimited(clientIp, ipHits, MAX_REQUESTS_PER_IP)) {
            return res.status(429).json({ error: "Too Many Requests", details: "Haz superado el límite de peticiones." });
        }

        // --- 3. Authentication & User Rate Limiting ---
        const authHeader = req.headers.authorization || "";
        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "No autorizado", details: "Falta el token de autenticación." });
        }
        const idToken = authHeader.split("Bearer ")[1];
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (authErr) {
            return res.status(401).json({ error: "No autorizado", details: "Token inválido o expirado." });
        }

        const uid = decodedToken.uid;
        if (isRateLimited(uid, userHits, MAX_REQUESTS_PER_USER)) {
            return res.status(429).json({ error: "Too Many Requests", details: "Haz superado el límite de análisis por minuto." });
        }

        // --- 4. Strict Input Validation & Sanitization ---
        const { type, data, mimeType } = req.body;

        // Check types
        if (typeof type !== 'string' || typeof data !== 'string' || typeof mimeType !== 'string') {
            return res.status(400).json({ error: "Invalid Request", details: "Se esperaban valores en formato texto." });
        }

        // Allowed values validation
        const allowedTypes = ['image', 'audio'];
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({ error: "Invalid Type", details: "Tipo de análisis no soportado." });
        }

        // MimeType constraints
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/webm'];
        if (!allowedMimeTypes.includes(mimeType)) {
            return res.status(400).json({ error: "Invalid Content-Type", details: "Formato de archivo no soportado." });
        }

        // Payloads sizes (length limits) Base64 strings:
        // Reject if data is too large (e.g. greater than ~5MB Base64 string -> approx 7 million chars)
        if (data.length > 7 * 1024 * 1024) {
            return res.status(413).json({ error: "Payload Too Large", details: "El archivo excede el límite máximo permitido." });
        }

        // Additional sanity checks reject unexpected fields
        const incomingFields = Object.keys(req.body);
        if (incomingFields.length > 3) {
            return res.status(400).json({ error: "Bad Request", details: "Se enviaron campos inesperados." });
        }

        // --- 5. Execution ---
        const genAI = new GoogleGenerativeAI(geminiApiKey.value());
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let prompt = "";
        if (type === "image") {
            prompt = "Identifica los alimentos de este plato. Estima peso, calorías y macros (P/C/G) para cada ingrediente. MUY IMPORTANTE: Responde con los nombres de los alimentos en ESPAÑOL. Responde SOLO en JSON plano: [{\"name\": \"...\", \"weight\": 100, \"calories\": 200, \"protein\": 10, \"carbs\": 20, \"fat\": 5}]";
        } else if (type === "audio") {
            prompt = "Analiza este audio donde el usuario describe lo que ha comido. Responde con un JSON que tenga dos campos: 'transcript' (una transcripción limpia en español de lo que dijo el usuario) y 'items' (una lista de alimentos con estimación de gramos, calorías, proteínas, carbohidratos y grasas). MUY IMPORTANTE: Responde SOLO en formato JSON. Formato: {\"transcript\": \"...\", \"items\": [{\"name\": \"...\", \"weight\": 100, \"calories\": 200, \"protein\": 10, \"carbs\": 20, \"fat\": 5}]}";
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
            });
        }

    } catch (error) {
        console.error("Gemini Proxy Error:", error);
        res.status(500).json({
            error: "Error Interno",
            details: "El servidor encontró un error inesperado al procesar la solicitud."
        });
    }
});
