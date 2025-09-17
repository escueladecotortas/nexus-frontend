// ===================================================================
// NEXUS CONSOLE v13.2 - ARQUITECTURA SIMPLIFICADA Y FUNCIONAL
// ===================================================================

// URL ÚNICA Y DEFINITIVA DEL BACKEND EN PIPEDREAM
const BACKEND_URL = 'https://eo6vuwaihbwk11h.m.pipedream.net';

const NexusAPI = {
    sendDirective: async function(userDirective) {
        // Muestra el mensaje de "pensando"
        const thinkingMessage = NexusUI.displayMessage("NEXUS está pensando...", 'nexus-thinking');
        try {
            // Llama al backend
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userDirective: userDirective })
            });

            if (!response.ok) throw new Error(`Error de API: ${response.status}`);
            
            const data = await response.json();
            return data.response;
        } catch (error) {
            // Muestra un mensaje de error claro en la UI
            return `Error de comunicación con el backend: ${error.message}`;
        } finally {
            // Elimina el mensaje de "pensando" sin importar el resultado
            thinkingMessage.remove();
        }
    }
};

const NexusUI = {
    displayMessage: function(text, sender) {
        const chatContainer = document.getElementById('chat-history');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        // Formatea el texto para mostrar saltos de línea y negritas
        let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        html = html.replace(/\n/g, '<br>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        messageDiv.innerHTML = html;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return messageDiv;
    }
};

// Se eliminó NexusStateManager porque ya no es necesario, simplificando el código.

const messageInput = document.getElementById('message-input');
const submitButton = document.getElementById('submit-button');
const chatHistory = document.getElementById('chat-history');

// Inicializa la consola con mensajes de bienvenida
async function initializeConsole() {
    chatHistory.innerHTML = '';
    NexusUI.displayMessage("NEXUS 3.2 en línea.", 'system-info');
    NexusUI.displayMessage("CONEXIÓN ESTABLECIDA CON EL NMP.", 'system-success');
    NexusUI.displayMessage("Listo para recibir directivas.", 'system-info');
}

// Maneja el envío de mensajes
async function handleSendMessage() {
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;
    
    NexusUI.displayMessage(userMessage, 'user');
    messageInput.value = '';

    try {
        const nexusResponse = await NexusAPI.sendDirective(userMessage);
        NexusUI.displayMessage(nexusResponse, 'nexus');
    } catch (error) {
        NexusUI.displayMessage(`Error crítico: ${error.message}.`, 'system-error');
    }
    
    // Se eliminó la llamada final a fetchAndDisplayState que causaba el error.
}

// --- Event Listeners ---
window.addEventListener('load', initializeConsole);
submitButton.addEventListener('click', handleSendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault();
        handleSendMessage();
    }
});