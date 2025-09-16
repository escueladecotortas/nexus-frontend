// ===================================================================
// NEXUS CONSOLE v8.2 - ARQUITECTURA "BACKEND COMO FUENTE DE VERDAD" (RENDERIZADO FINAL)
// ===================================================================

const PROCESS_DIRECTIVE_URL = 'https://southamerica-east1-nexus-os-prod.cloudfunctions.net/processDirective';
const LOAD_STATE_URL = 'https://loadstate-zfendnnsma-rj.a.run.app';

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
        
        // Lógica corregida: Si es HTML, lo inyecta directo. Si no, lo escapa.
        if (isHtml) {
            messageDiv.innerHTML = text;
        } else {
            messageDiv.innerHTML = this.formatResponse(text);
        }
        
        // Lógica corregida: Siempre añade los mensajes al final.
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
    fetchInitialState: async function() {
        try {
            const response = await fetch(LOAD_STATE_URL);
            if (!response.ok) throw new Error(`El NMP devolvió un error ${response.status}`);
            const state = await response.json();
            NexusUI.displayMessage("CONEXIÓN ESTABLECIDA CON EL NMP.", 'system-success');
            
            // Renderizamos el dashboard como HTML
            const dashboardHtml = `
                <h3>Último Logro:</h3>
                <ul>
                    <li><strong>Estado:</strong> ${state.ultimoLogro.estado}</li>
                    <li><strong>Descripción:</strong> ${state.ultimoLogro.descripcion}</li>
                    <li><strong>Herramienta:</strong> ${state.ultimoLogro.herramienta}</li>
                </ul>
                <h3>Tareas Pendientes:</h3>
                <ul>
                    <li><strong>Nombre:</strong> ${state.nuevaTareaParaIngestar.nombre}</li>
                    <li><strong>Prioridad:</strong> ${state.nuevaTareaParaIngestar.prioridad}</li>
                    <li><strong>Estado:</strong> ${state.nuevaTareaParaIngestar.estado}</li>
                </ul>
                <hr>
            `;
            // Usamos el flag isHtml=true para que se renderice correctamente
            const dashboardContainer = NexusUI.displayMessage(dashboardHtml, 'system-info', true);
            dashboardContainer.style.textAlign = 'left';

            // Solicitamos el resumen en prosa a NEXUS
            NexusUI.displayMessage("NMP conectado. Solicitando resumen a NEXUS...", 'system-info');
            const summaryPrompt = `Basado en el siguiente estado JSON, generá un resumen ejecutivo en prosa de no más de 100 palabras: ${JSON.stringify(state)}`;
            await handleSendMessage(summaryPrompt, true); // true para que sea una llamada de sistema oculta

        } catch (error) {
            NexusUI.displayMessage(`ERROR AL CARGAR ESTADO: ${error.message}`, 'system-error');
        }
    }
};

const messageInput = document.getElementById('message-input');
const submitButton = document.getElementById('submit-button');

async function handleSendMessage(userMessage, isSystem = false) {
    if (!userMessage) return;
    
    // Si no es un mensaje de sistema, lo limpiamos del input
    if(!isSystem) {
        messageInput.value = '';
    }
    
    const nexusResponse = await NexusAPI.sendDirective(userMessage);
    NexusUI.displayMessage(nexusResponse, 'nexus');
}

window.addEventListener('load', async () => {
    NexusUI.displayMessage("Inicializando conexión con el NMP...", 'system-info');
    await NexusStateManager.fetchInitialState();
});

submitButton.addEventListener('click', () => handleSendMessage(messageInput.value.trim()));

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault();
        handleSendMessage(messageInput.value.trim());
    }
});

const saveButton = document.getElementById('save-button');
if (saveButton) {
    saveButton.style.display = 'none';
}