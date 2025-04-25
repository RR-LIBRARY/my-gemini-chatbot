document.addEventListener('DOMContentLoaded', () => {
    const chatOutput = document.getElementById('chat-output');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const backendApiEndpoint = '/api/chat'; // Path for local backend

    function addMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
        messageDiv.textContent = message;
        chatOutput.appendChild(messageDiv);
        chatOutput.scrollTo({ top: chatOutput.scrollHeight, behavior: 'smooth' });
        return messageDiv;
    }

    async function sendMessageToBackend(userMessage) {
        addMessage(userMessage, "user");
        userInput.value = '';
        userInput.focus();
        const loadingMessageElement = addMessage("...", "bot");

        try {
            console.log(`Sending to ${backendApiEndpoint}: ${userMessage}`);
            const response = await fetch(backendApiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            });
            console.log("Backend status:", response.status);
            chatOutput.removeChild(loadingMessageElement); // Remove loading message

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Backend error ${response.status}`);
            }
            const data = await response.json();
            addMessage(data.reply || "No reply.", "bot");
        } catch (error) {
            console.error("Fetch Error:", error);
            if (chatOutput.contains(loadingMessageElement)) { // Check if still exists
               chatOutput.removeChild(loadingMessageElement);
            }
            addMessage(`Error: ${error.message}`, "bot");
        }
    }

    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message) { sendMessageToBackend(message); }
    });

    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') { sendButton.click(); }
    });
    userInput.focus();
});