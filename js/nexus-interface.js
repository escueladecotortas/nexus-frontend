// ===================================================================
// NEXUS CONSOLE v13.0 - ARQUITECTURA FINAL (NETLIFY + GOOGLE CLOUD RUN)
// ===================================================================

const UNIFIED_BACKEND_URL = 'https://nexus-backend-1039286768008.us-central1.run.app';
const PROCESS_DIRECTIVE_URL = `${UNIFIED_BACKEND_URL}/directive`;
const LOAD_STATE_URL = `${UNIFIED_BACKEND_URL}/loadState`; // Asumiendo que tu main.py tiene este endpoint

const NexusAPI = {
    sendDirective: async function(userDirective) {
        NexusUI.displayMessage(userDirective, 'user');
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
        NexusUI.displayMessage("Sincronizando con el NMP...", 'system-info');
        try {
            const response = await fetch(LOAD_STATE_URL);
            if (response.status === 404 || (await response.clone().json()).length === 0) {
                document.getElementById('chat-history').innerHTML = '';
                NexusUI.displayMessage("CONEXIÓN ESTABLECIDA CON EL NMP.", 'system-success');
                NexusUI.displayMessage("Estado de proyecto vacío. Listo para recibir directivas.", 'system-info');
                return;
            }
            if (!response.ok) throw new Error(`El NMP devolvió un error inesperado: ${response.status}`);
            
            const state = await response.json();
            document.getElementById('chat-history').innerHTML = '';
            NexusUI.displayMessage("CONEXIÓN ESTABLECIDA CON EL NMP.", 'system-success');

            const dashboardHtml = `
                <h3>Proyecto Activo: ${state.proyectoActivo || "No definido"}</h3>
                <hr>
                <h4>Último Logro:</h4>
                <ul><li>${state.ultimoLogro ? state.ultimoLogro.descripcion : 'N/A'}</li></ul>
                <h4>Tarea Crítica Agendada:</h4>
                <ul><li>${state.tareaAgendada ? state.tareaAgendada.nombre : 'N/A'}</li></ul>
            `;
            const dashboardContainer = NexusUI.displayMessage(dashboardHtml, 'system-info', true);
            dashboardContainer.style.textAlign = 'left';
        } catch (error) {
             document.getElementById('chat-history').innerHTML = '';
             NexusUI.displayMessage("CONEXIÓN ESTABLECIDA CON EL NMP.", 'system-success');
             NexusUI.displayMessage("Estado de proyecto vacío (el documento no existe). Listo para recibir directivas.", 'system-info');
        }
    }
};

const messageInput = document.getElementById('message-input');
const submitButton = document.getElementById('submit-button');

async function handleSendMessage() {
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;
    messageInput.value = '';
    
    const nexusResponse = await NexusAPI.sendDirective(userMessage);
    NexusUI.displayMessage(nexusResponse, 'nexus');
    
    await NexusStateManager.fetchAndDisplayState();
}

window.addEventListener('load', async () => {
    await NexusStateManager.fetchAndDisplayState();
});

submitButton.addEventListener('click', handleSendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault();
        handleSendMessage();
    }
});

const saveButton = document.getElementById('save-button');
if (saveButton) {
    saveButton.style.display = 'none';
}