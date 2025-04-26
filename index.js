document.addEventListener('DOMContentLoaded', () => {
    const chatOutput = document.getElementById('chat-output');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // **[Zaroori Change]** Backend URL ko update kiya gaya hai Render ke live URL ke liye
    const backendApiEndpoint = 'https://anuj-help-desk.onrender.com/api/chat';

    function addMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
        // Basic security: Display text content safely
        messageDiv.textContent = message;
        chatOutput.appendChild(messageDiv);
        // Scroll to the bottom smoothly
        chatOutput.scrollTo({ top: chatOutput.scrollHeight, behavior: 'smooth' });
        return messageDiv; // Return the element for potential removal (like loading indicator)
    }

    async function sendMessageToBackend(userMessage) {
        // Add user message immediately
        addMessage(userMessage, "user");
        userInput.value = ''; // Clear input field
        userInput.focus(); // Keep focus on input

        // Add loading indicator
        const loadingMessageElement = addMessage("...", "bot"); // Display '...' while waiting

        try {
            console.log(`Sending message to backend: ${userMessage}`); // Log for debugging
            const response = await fetch(backendApiEndpoint, { // Use the updated backend URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: userMessage }) // Send message in JSON body
            });

            console.log("Received response status from backend:", response.status); // Log status

            // Important: Remove loading indicator *before* processing response
             if (chatOutput.contains(loadingMessageElement)) {
                 chatOutput.removeChild(loadingMessageElement);
             }


            if (!response.ok) {
                // Try to get error message from backend JSON response
                let errorMsg = `Backend request failed with status ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg; // Use backend error if available
                } catch (e) {
                    // Ignore if response wasn't JSON
                    console.warn("Could not parse error response as JSON.");
                }
                throw new Error(errorMsg); // Throw an error to be caught below
            }

            const data = await response.json(); // Parse successful JSON response

            // Add bot's reply, provide default if 'reply' is missing
            addMessage(data.reply || "Sorry, I didn't get a valid reply.", "bot");

        } catch (error) {
             console.error("Error sending message or processing response:", error); // Log the error
             // Ensure loading indicator is removed even if error happened before response processing
            if (chatOutput.contains(loadingMessageElement)) {
                chatOutput.removeChild(loadingMessageElement);
            }
            // Display error message to the user
            addMessage(`Error: ${error.message}`, "bot");
        }
    }

    // Event listener for send button
    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim(); // Get trimmed message
        if (message) { // Only send if message is not empty
            sendMessageToBackend(message);
        }
    });

    // Event listener for Enter key in input field
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default form submission if it's in a form
            sendButton.click(); // Trigger send button click
        }
    });

    // Focus the input field when the page loads
    userInput.focus();
});
