const express = require('express');
const fetch = require('node-fetch'); // Using v2 for require()
const cors = require('cors');       // Import CORS
const app = express();
const port = 3000; // Replit maps this automatically

// --- Middleware ---
app.use(cors()); // Allow requests (for Replit testing)
app.use(express.json()); // Body Parser for JSON
app.use(express.static('.')); // Serve static files (HTML/CSS/Frontend JS)

// --- Environment Variables ---
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("FATAL ERROR: GEMINI_API_KEY secret not found!");
}

// --- API Endpoint Configuration ---
const geminiApiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

// --- Routes ---
app.post('/api/chat', async (req, res) => {
    console.log("Received request at /api/chat");
    if (!apiKey) { return res.status(500).json({ error: "Server configuration error: API Key missing." }); }
    const userMessage = req.body.message;
    if (!userMessage) { return res.status(400).json({ error: "No message provided." }); }
    console.log("User message:", userMessage);

    try {
        console.log(`Calling Gemini API...`);
        const geminiResponse = await fetch(geminiApiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "contents": [{ "parts": [{ "text": userMessage }] }]
                // Optional: Add safetySettings or generationConfig here
            })
        });
        console.log("Gemini API response status:", geminiResponse.status);
        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            console.error("Gemini API Error:", errorData);
            throw new Error(errorData.error?.message || `API request failed`);
        }
        const data = await geminiResponse.json();
        console.log("Received response from Gemini.");
        let botReply = "Sorry, could not process response.";
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            botReply = data.candidates[0].content.parts[0].text;
        } else { console.error("Unexpected Gemini format:", data); }
        res.json({ reply: botReply });
    } catch (error) {
        console.error("Error during API call:", error);
        res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Backend server listening on http://localhost:${port}`);
    console.log("API Key Loaded:", !!apiKey);
});