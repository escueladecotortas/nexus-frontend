// ===================================================================
// NEXUS CONSOLE v7.5 - ARQUITECTURA DE SINCRONIZACIÓN ACTIVA
// ===================================================================

const API_KEY = "AIzaSyAlwPsvVI9THePvwOot2nCyeiVlTRoNrIM";
const SAVE_STATE_URL = 'https://savestate-zfendnnsma-rj.a.run.app';
const LOAD_STATE_URL = 'https://loadstate-zfendnnsma-rj.a.run.app';

// El system prompt principal ahora vive en la configuración de la Gem.
// Se deja un prompt mínimo como fallback.
const NEXUS_SYSTEM_PROMPT = `Eres NEXUS 3.2.`;

const NexusAPI = {
    sendMessage: async function(prompt, isSystemMessage = false) {
        if (!isSystemMessage) {
            NexusUI.displayMessage(prompt.split('<mensaje_del_usuario>\n')[1].replace('\n</mensaje_del_usuario>', ''), 'user');
        }
        const thinkingMessage = NexusUI.displayMessage("NEXUS está pensando...", 'nexus-thinking');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
        
        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            // No enviamos systemInstruction, ya que está configurado en la Gem
        };

        try {
            const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
            if (!response.ok) throw new Error(`Error de API: ${response.status} ${await response.text()}`);
            
            const data = await response.json();
            if (data.candidates && data.candidates.length > 0) {
                return data.candidates[0].content.parts[0].text;
            } else {
                if (data.promptFeedback?.blockReason) throw new Error(`Respuesta bloqueada: ${data.promptFeedback.blockReason}`);
                throw new Error("Respuesta recibida sin contenido.");
            }
        } catch (error) {
            NexusUI.displayMessage(error.message, 'system-error');
            return null;
        } finally {
            thinkingMessage.remove();
        }
    },
};

const NexusUI = {
    displayMessage: function(text, sender) {
        const chatContainer = document.getElementById('chat-history');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = this.formatResponse(text);
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return messageDiv;
    },
    formatResponse: function(text) {
        let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        html = html.replace(/\n/g, '<br>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/```json\s*([\s\S]*?)\s*```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        return html;
    }
};

const NexusStateManager = {
    currentState: {},
    fetchInitialState: async function() {
        try {
            const response = await fetch(LOAD_STATE_URL);
            if (!response.ok) throw new Error(`El NMP devolvió un error ${response.status}`);
            this.currentState = await response.json();
            NexusUI.displayMessage("CONEXIÓN ESTABLECIDA CON EL NMP.", 'system-success');
        } catch (error) {
            NexusUI.displayMessage(`ERROR AL CARGAR ESTADO: ${error.message}`, 'system-error');
            this.currentState = {};
        }
    },
    saveState: async function() {
        if (!this.currentState || Object.keys(this.currentState).length === 0) {
            NexusUI.displayMessage("ERROR: No hay estado en memoria para guardar. Sincronizá el estado primero.", "system-error");
            return;
        }
        NexusUI.displayMessage("Iniciando guardado en NMP...", 'system-info');
        try {
            const stateToSave = { ...this.currentState, timestamp: new Date().toISOString() };
            const response = await fetch(SAVE_STATE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stateToSave)
            });
            if (!response.ok) throw new Error(`El NMP rechazó el estado: ${await response.text()}`);
            const result = await response.json();
            NexusUI.displayMessage(`ÉXITO: ${result.message}`, 'system-success');
        } catch (error) {
            NexusUI.displayMessage(`ERROR AL GUARDAR: ${error.message}.`, 'system-error');
        }
    },
    processNexusResponse: function(response, context = {}) {
        const jsonRegex = /^```json\s*([\s\S]*?)\s*```$/;
        const match = response.trim().match(jsonRegex);

        if (match && match[1]) {
            try {
                this.currentState = JSON.parse(match[1]);
                console.log("Estado local actualizado por comando:", this.currentState);
                
                if (context.isSaveOperation) {
                    NexusUI.displayMessage("Memoria sincronizada. Procediendo a guardar en NMP...", 'system-success');
                    this.saveState();
                } else {
                    NexusUI.displayMessage("Estado de la memoria local actualizado. Listo para copiar.", 'system-success');
                    NexusUI.displayMessage(response, 'nexus');
                }
            } catch (e) {
                NexusUI.displayMessage("ADVERTENCIA: Recibí un estado, pero el formato JSON era inválido.", "system-error");
            }
        } else {
            NexusUI.displayMessage(response, 'nexus');
        }
    }
};

const messageInput = document.getElementById('message-input');
const submitButton = document.getElementById('submit-button');
const saveButton = document.getElementById('save-button');

async function handleSendMessage(userMessage, isSystem = false) {
    if (!userMessage) return;

    const statePreamble = `<estado_actual_en_cache>\n${JSON.stringify(NexusStateManager.currentState, null, 2)}\n</estado_actual_en_cache>`;
    const fullPrompt = `${statePreamble}\n\n<mensaje_del_usuario>\n${userMessage}\n</mensaje_del_usuario>`;
    
    const nexusResponse = await NexusAPI.sendMessage(fullPrompt, isSystem);

    if (nexusResponse) {
        const context = { isSaveOperation: userMessage.trim() === '!getState' };
        NexusStateManager.processNexusResponse(nexusResponse, context);
    }
}

window.addEventListener('load', async () => {
    NexusUI.displayMessage("Inicializando conexión con el NMP...", 'system-info');
    await NexusStateManager.fetchInitialState();

    if (NexusStateManager.currentState && Object.keys(NexusStateManager.currentState).length > 0) {
        NexusUI.displayMessage("NMP conectado. Solicitando SITREP a NEXUS...", 'system-info');
        await handleSendMessage('SISTEMA INICIADO. Por favor, proveé el Informe de Situación (SITREP) basado en el estado actual en caché.', true);
    }
});

submitButton.addEventListener('click', () => {
    const userMessage = messageInput.value.trim();
    if (userMessage) {
        handleSendMessage(userMessage);
        messageInput.value = '';
    }
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault();
        const userMessage = messageInput.value.trim();
        if (userMessage) {
            handleSendMessage(userMessage);
            messageInput.value = '';
        }
    }
});

saveButton.addEventListener('click', () => {
    NexusUI.displayMessage("Solicitando estado final a NEXUS para sincronizar...", "system-info");
    handleSendMessage('!getState', true);
});