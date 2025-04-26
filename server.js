const express = require('express');
const fetch = require('node-fetch'); // Using v2 for require()
const cors = require('cors');       // Import CORS
const app = express();
const port = 3000; // Replit maps this automatically

// --- Middleware ---
app.use(cors()); // Allow requests (Essential for Netlify frontend)
app.use(express.json()); // Body Parser for JSON

// **[Optional Change]** Removed static file serving:
// app.use(express.static('.')); // Serve static files (HTML/CSS/Frontend JS) - REMOVED/COMMENTED OUT

// --- Environment Variables ---
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("FATAL ERROR: GEMINI_API_KEY secret not found!");
    // Consider exiting if API key is crucial for startup, though Render might restart it
    // process.exit(1);
}

// --- API Endpoint Configuration ---
// Check if apiKey exists before creating the URL
const geminiApiEndpoint = apiKey
    ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`
    : null; // Set to null if no API key

// --- Routes ---
// **[Path Change]** Using /api/chat as the endpoint
app.post('/api/chat', async (req, res) => {
    console.log("Received request at /api/chat"); // Keep log for debugging

    // Check if API key is available *during* the request
    if (!apiKey || !geminiApiEndpoint) {
        console.error("API Key missing or endpoint not configured.");
        return res.status(500).json({ error: "Server configuration error: API Key missing." });
    }

    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ error: "No message provided." });
    }
    console.log("User message:", userMessage); // Keep log for debugging

    try {
        console.log(`Calling Gemini API...`); // Keep log for debugging
        const geminiResponse = await fetch(geminiApiEndpoint, { // Use the pre-constructed URL
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "contents": [{ "parts": [{ "text": userMessage }] }]
                // Optional: Add safetySettings or generationConfig here
            })
        });

        console.log("Gemini API response status:", geminiResponse.status); // Keep log for debugging

        // Improved error handling for API response
        if (!geminiResponse.ok) {
            let errorData;
            try {
                errorData = await geminiResponse.json(); // Try to parse JSON error
                console.error("Gemini API Error (JSON):", errorData);
            } catch (e) {
                errorData = await geminiResponse.text(); // Fallback to text error
                console.error("Gemini API Error (Text):", errorData);
            }
            // Use a more generic error message or specific details if available
            const errorMessage = errorData?.error?.message || `API request failed with status ${geminiResponse.status}`;
            throw new Error(errorMessage);
        }

        const data = await geminiResponse.json();
        console.log("Received response from Gemini."); // Keep log for debugging

        let botReply = "Sorry, could not process response."; // Default reply
        // Safer way to access nested properties
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            botReply = data.candidates[0].content.parts[0].text;
        } else {
            console.error("Unexpected Gemini response format:", JSON.stringify(data, null, 2)); // Log the actual structure
        }
        res.json({ reply: botReply });

    } catch (error) {
        console.error("Error during API call or processing:", error); // Log the caught error
        res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Backend server listening on http://localhost:${port}`); // This port is internal to Render
    console.log("API Key Loaded:", !!apiKey); // Log if key was loaded at startup
    if (!apiKey) {
        console.warn("Warning: Server started without API Key. /api/chat endpoint will fail.");
    }
});
