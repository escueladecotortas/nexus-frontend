// ===================================================================
// NEXUS CONSOLE v10.1 - ARQUITECTURA FINAL CORREGIDA
// ===================================================================

const PROCESS_DIRECTIVE_URL = 'https://us-central1-nexus-os-prod.cloudfunctions.net/processDirective';
const LOAD_STATE_URL = 'https://us-central1-nexus-os-prod.cloudfunctions.net/loadState';
const MANAGE_STATE_URL = 'https://us-central1-nexus-os-prod.cloudfunctions.net/manageState';
const UPLOAD_STATE_URL = 'https://us-central1-nexus-os-prod.cloudfunctions.net/uploadState';


const NexusAPI = {
    sendDirective: async function(userDirective, endpoint = PROCESS_DIRECTIVE_URL) {
        NexusUI.displayMessage(userDirective, 'user');
        const thinkingMessage = NexusUI.displayMessage("NEXUS está pensando...", 'nexus-thinking');
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userDirective: userDirective })
            });
            if (!response.ok) throw new Error(`Error de API: ${response.status}`);
            const data = await response.json();
            return data.response || data.message;
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
    fetchInitialState: async function() {
        try {
            const response = await fetch(LOAD_STATE_URL);
            if (response.status === 404) {
                NexusUI.displayMessage("No se encontró un estado de proyecto. El NMP está listo para una carga inicial.", 'system-info');
                return;
            }
            if (!response.ok) {
                throw new Error(`Respuesta inesperada del NMP: ${response.status}`);
            }

            const state = await response.json();
            NexusUI.displayMessage("CONEXIÓN ESTABLECIDA CON EL NMP.", 'system-success');
            
            let dashboardHtml = '';
            
            if (state.project_name || state.proyectoActivo) {
                 dashboardHtml += `<h3>Proyecto Activo:</h3><ul><li><strong>Nombre:</strong> ${state.project_name || state.proyectoActivo}</li></ul>`;
            }
            // ... (se pueden añadir más renderizadores de dashboard aquí) ...
            
            if (dashboardHtml) {
                dashboardHtml += '<hr>';
                const dashboardContainer = NexusUI.displayMessage(dashboardHtml, 'system-info', true);
                dashboardContainer.style.textAlign = 'left';
            } else {
                 NexusUI.displayMessage("Estado de proyecto vacío. Listo para recibir directivas.", 'system-info');
            }

        } catch (error) {
            NexusUI.displayMessage(`ERROR AL CARGAR ESTADO: ${error.message}`, 'system-error');
        }
    }
};

const messageInput = document.getElementById('message-input');
const submitButton = document.getElementById('submit-button');

async function handleSendMessage(userMessage) {
    if (!userMessage) return;
    
    let endpoint = PROCESS_DIRECTIVE_URL;
    let directive = userMessage;

    if (userMessage.startsWith('!actualizar-estado')) {
        endpoint = MANAGE_STATE_URL;
        directive = userMessage.substring('!actualizar-estado '.length).trim();
    }
    
    const nexusResponse = await NexusAPI.sendDirective(directive, endpoint);
    NexusUI.displayMessage(nexusResponse, 'nexus');

    // Refrescar el dashboard después de cada acción para ver los cambios
    await NexusStateManager.fetchInitialState();
    
    messageInput.value = '';
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

// ... (Aquí puede ir la función uploadState si la necesitás como herramienta de debug) ...