// ===================================================================
// NEXUS CONSOLE v13.1 - ARQUITECTURA FINAL (NETLIFY + GOOGLE CLOUD RUN)
// ===================================================================

const UNIFIED_BACKEND_URL = 'https://eo6vuwaihbwk11h.m.pipedream.net';
const PROCESS_DIRECTIVE_URL = `${UNIFIED_BACKEND_URL}/processDirective`;
const LOAD_STATE_URL = `${UNIFIED_BACKEND_URL}/loadState`;

const NexusAPI = {
    sendDirective: async function(userDirective) {
        const thinkingMessage = NexusUI.displayMessage("NEXUS está pensando...", 'nexus-thinking');
        try {
            const response = await fetch(PROCESS_DIRECTIVE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userDirective: userDirective })
            });
            if (!response.ok) throw new Error(`Error de API: ${response.status}`);
            const data = await response.json();
            return data.response;
        } catch (error) {
            return `Error de comunicación con el backend: ${error.message}`;
        } finally {
            thinkingMessage.remove();
        }
    }
};

const NexusUI = {
    displayMessage: function(text, sender, isHtml = false) {
        const chatContainer = document.getElementById('chat-history');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        if (isHtml) {
            messageDiv.innerHTML = text;
        } else {
            messageDiv.innerHTML = this.formatResponse(text);
        }
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return messageDiv;
    },
    formatResponse: function(text) {
        let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        html = html.replace(/\n/g, '<br>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return html;
    }
};

const NexusStateManager = {
    fetchAndDisplayState: async function() {
        try {
            const response = await fetch(LOAD_STATE_URL);
            if (!response.ok) {
                if (response.status === 404 || (await response.clone().json()).length === 0) {
                     document.getElementById('dashboard-content').innerHTML = `
                        <p><strong>Proyecto Activo:</strong> No definido</p>
                        <hr>
                        <h4>Último Logro:</h4>
                        <ul><li>N/A</li></ul>
                        <h4>Tarea Crítica Agendada:</h4>
                        <ul><li>N/A</li></ul>
                     `;
                     return;
                } else {
                    throw new Error(`El NMP devolvió un error inesperado: ${response.status}`);
                }
            }
            
            const state = await response.json();
            
            document.getElementById('dashboard-content').innerHTML = `
                <p><strong>Proyecto Activo:</strong> ${state.proyectoActivo || "No definido"}</p>
                <hr>
                <h4>Último Logro:</h4>
                <ul><li>${state.ultimoLogro ? state.ultimoLogro.descripcion : 'N/A'}</li></ul>
                <h4>Tarea Crítica Agendada:</h4>
                <ul><li>${state.tareaAgendada ? state.tareaAgendada.nombre : 'N/A'}</li></ul>
            `;
        } catch (error) {
            console.error('Error fetching state:', error);
        }
    }
};

const messageInput = document.getElementById('message-input');
const submitButton = document.getElementById('submit-button');
const chatHistory = document.getElementById('chat-history');

async function initializeConsole() {
    chatHistory.innerHTML = '';
    NexusUI.displayMessage("NEXUS 3.2 en línea.", 'system-info');
    NexusUI.displayMessage("CONEXIÓN ESTABLECIDA CON EL NMP.", 'system-success');
    NexusUI.displayMessage("Estado de proyecto vacío. Listo para recibir directivas.", 'system-info');
    // await NexusStateManager.fetchAndDisplayState(); se quitó parece que trae error
}

async function handleSendMessage() {
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;
    
    NexusUI.displayMessage(userMessage, 'user');
    messageInput.value = '';

    try {
        const nexusResponse = await NexusAPI.sendDirective(userMessage);
        NexusUI.displayMessage(nexusResponse, 'nexus');
    } catch (error) {
        NexusUI.displayMessage(`Error: ${error.message}. Por favor, revisa el backend.`, 'system-error');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await NexusStateManager.fetchAndDisplayState();
}

window.addEventListener('load', initializeConsole);
submitButton.addEventListener('click', handleSendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault();
        handleSendMessage();
    }
});