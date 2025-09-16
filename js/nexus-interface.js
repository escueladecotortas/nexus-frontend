// ===================================================================
// NEXUS CONSOLE v12.0 - ARQUITECTURA FINAL (NETLIFY + CLOUD RUN)
// ===================================================================

// --- CONFIGURACIÓN CRÍTICA ---
const UNIFIED_BACKEND_URL = 'https://nexus-unificado-1039286768008.us-central1.run.app';
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
    // ... [El código de NexusUI es el mismo de la v8.2, sin cambios] ...
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
    // El frontend ya no gestiona el estado, solo lo muestra.
    fetchAndDisplayState: async function() {
        NexusUI.displayMessage("Sincronizando con el NMP...", 'system-info');
        try {
            const response = await fetch(LOAD_STATE_URL);
            if (!response.ok) throw new Error(`El NMP devolvió un error ${response.status}`);
            const state = await response.json();
            
            // Limpia el historial de chat antes de mostrar el nuevo dashboard
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
            NexusUI.displayMessage(`ERROR AL CARGAR ESTADO: ${error.message}`, 'system-error');
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
    
    // Después de cada acción, refrescamos el dashboard para ver el estado actualizado
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
    saveButton.style.display = 'none'; // El guardado ahora es automático en el backend
}