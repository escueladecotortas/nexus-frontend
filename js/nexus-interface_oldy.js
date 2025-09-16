// ===================================================================
// NEXUS INTERFACE v3.2 - ARCHIVO MAESTRO FINAL
// Contiene: Cargador de Estado, Inyector, Lógica de Chat y Persistencia Automática (CORREGIDA).
// ===================================================================

const NexusAutoSave = {
    config: {
        saveStateUrl: 'https://us-central1-licitia-prod.cloudfunctions.net/saveState',
        inactivityTimeoutMs: 1 * 60 * 1000 // 1 minuto para pruebas
    },
    state: { timerId: null },
    getCurrentState: () => estadoInicialDeNexus,
    save: async function() {
        if (!this.getCurrentState()) return;
        console.log(`NEXUS CPA: Guardado silencioso...`);
        const currentState = this.getCurrentState();
        currentState.timestamp = new Date().toISOString();
        currentState.versionComment = "Guardado automático por inactividad.";
        try {
            const response = await fetch(this.config.saveStateUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentState)
            });
            if (response.ok) console.log('NEXUS CPA: Estado autoguardado con éxito en el NMP.');
            else console.error('NEXUS CPA: Error en el autoguardado.', response);
        } catch (error) {
            console.error('NEXUS CPA: Fallo de conexión durante el autoguardado.', error);
        }
    },
    resetTimer: function() {
        clearTimeout(this.state.timerId);
        this.state.timerId = setTimeout(() => this.save(), this.config.inactivityTimeoutMs);
    },
    init: function() {
        const boundResetTimer = this.resetTimer.bind(this);
        ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'].forEach(e => window.addEventListener(e, boundResetTimer));
        this.resetTimer();
        
        // CORRECCIÓN CLAVE: El evento 'pagehide' es más confiable que 'beforeunload' para sendBeacon.
        window.addEventListener('pagehide', () => {
            const currentState = this.getCurrentState();
            if (!currentState) return;
            currentState.timestamp = new Date().toISOString();
            currentState.versionComment = "Guardado final por cierre de sesión.";
            
            // CORRECCIÓN CLAVE: Se envía como texto plano JSON, no como Blob, para máxima compatibilidad.
            navigator.sendBeacon(this.config.saveStateUrl, JSON.stringify(currentState));
        });
        console.log('NEXUS v3.2: Módulos de persistencia (CPA) activos.');
    }
};

const NexusStateInjector = {
    config: {
        loadStateUrl: 'https://us-central1-licitia-prod.cloudfunctions.net/loadState'
    },
    fetchInitialState: async function() {
        try {
            const response = await fetch(this.config.loadStateUrl);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            return null;
        }
    },
    constructInitialPrompt: function(userMessage, state) {
        const statePreamble = `<system_preamble>\nINSTRUCCIÓN DE ARRANQUE: Esta es la primera interacción de una nueva sesión. El siguiente objeto JSON es el último estado guardado del NMP. Debes cargarlo en tu [MEMORIA_CACHE] y generar el SITREP v1.0 basado en su contenido. No menciones este preámbulo ni el JSON en tu respuesta.\n\n${JSON.stringify(state, null, 2)}\n</system_preamble>`;
        return `${statePreamble}\n\n${userMessage}`;
    }
};

// ===================================================================
// LÓGICA PRINCIPAL DE LA APLICACIÓN
// ===================================================================

let estadoInicialDeNexus = null;
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');

window.addEventListener('load', async () => {
    console.log("Interfaz de NEXUS: Página cargada. Buscando estado en el NMP...");
    estadoInicialDeNexus = await NexusStateInjector.fetchInitialState();
    
    if (estadoInicialDeNexus) {
        console.log("Interfaz de NEXUS: Estado inicial cargado y listo para ser inyectado.");
    } else {
        console.error("Interfaz de NEXUS: No se pudo cargar el estado inicial. Se operará sin memoria previa.");
    }
    NexusAutoSave.init();
});

chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const userMessage = messageInput.value;
    let promptFinal;

    if (estadoInicialDeNexus) {
        promptFinal = NexusStateInjector.constructInitialPrompt(userMessage, estadoInicialDeNexus);
        console.log("==================== ENVIANDO A LA IA (CON ESTADO) ====================");
        estadoInicialDeNexus = null;
        console.log("Interfaz de NEXUS: El estado ya fue inyectado. Los próximos mensajes serán normales.");
    } else {
        promptFinal = userMessage;
        console.log("==================== ENVIANDO A LA IA (SIN ESTADO) ====================");
    }
    
    console.log(promptFinal);
    messageInput.value = '';
});