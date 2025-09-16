// ===================================================================
// NEXUS CONSOLE v8.0 - ARQUITECTURA "BACKEND COMO FUENTE DE VERDAD"
// ===================================================================

const PROCESS_DIRECTIVE_URL = 'URL_DE_TU_NUEVA_FUNCION_PROCESSDIRECTIVE'; // <<-- ¡IMPORTANTE! Reemplazar esta URL
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
    // [ ... El código de NexusUI es exactamente el mismo, sin cambios ... ]
};

const NexusStateManager = {
    // La única función que queda es cargar el estado para la vista inicial
    fetchInitialState: async function() {
        try {
            const response = await fetch(LOAD_STATE_URL);
            if (!response.ok) throw new Error(`El NMP devolvió un error ${response.status}`);
            const state = await response.json();
            NexusUI.displayMessage("CONEXIÓN ESTABLECIDA CON EL NMP.", 'system-success');
            // Aquí iría tu lógica para renderizar el Dashboard con el estado
            // Por ejemplo: renderDashboard(state);
            NexusUI.displayMessage(JSON.stringify(state, null, 2), 'system-info'); // Muestra el estado inicial
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

    // Opcional: Recargar el estado para refrescar el dashboard después de cada acción
    // await NexusStateManager.fetchInitialState(); 
}

window.addEventListener('load', async () => {
    NexusUI.displayMessage("Inicializando conexión con el NMP...", 'system-info');
    await NexusStateManager.fetchInitialState();
});

submitButton.addEventListener('click', handleSendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault();
        handleSendMessage();
    }
});

// El botón de guardar ya no es necesario
const saveButton = document.getElementById('save-button');
if (saveButton) {
    saveButton.style.display = 'none'; // Ocultamos el botón
}