document.addEventListener('DOMContentLoaded', function () {
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const fileInput = document.getElementById('file-input');
    const fileNameSpan = document.getElementById('file-name');

    const BASE_URL = "https://nexus-backend-arg.up.railway.app";
    const DAILY_TOKEN_LIMIT = 100000;
    
    let fileContent = "";
    let totalTokensSession = 0;

    // Dibuja o actualiza el medidor de tokens
    function drawTokenGauge(tokens) {
        const percentage = Math.min((tokens / DAILY_TOKEN_LIMIT) * 100, 100);
        const gaugeColor = percentage > 80 ? "#FF0000" : (percentage > 50 ? "#FFA500" : "#FF4F00");

        const data = [{
            type: "indicator",
            mode: "gauge+number",
            value: percentage,
            number: { suffix: "%", font: { size: 36, color: "white" } },
            domain: { x: [0, 1], y: [0, 1] },
            gauge: {
                shape: "angular",
                axis: { range: [0, 100], tickwidth: 1, tickcolor: "#444" },
                bar: { color: gaugeColor, thickness: 0.8 },
                bgcolor: "rgba(0,0,0,0.1)",
            }
        }];
        const layout = {
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: 'rgba(0,0,0,0)',
            height: 200,
            margin: { l: 20, r: 20, t: 20, b: 20 },
            font: { color: "#EAECEE", family: "'Exo 2', sans-serif" }
        };
        Plotly.newPlot('token-gauge-container', data, layout, {displayModeBar: false, responsive: true});
    }

    // Manejo de la subida de archivos
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            fileNameSpan.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => { fileContent = e.target.result; };
            reader.readAsText(file);
        }
    });

    // Añadir mensaje a la UI
    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
        messageDiv.textContent = text;
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Enviar directiva al backend
    async function sendDirective() {
        const userDirective = chatInput.value.trim();
        if (!userDirective) return;

        addMessage('user', userDirective);
        chatInput.value = "";
        sendButton.disabled = true;

        // Mensaje de "Pensando..."
        const thinkingMsg = document.createElement('div');
        thinkingMsg.classList.add('message', 'ai-message');
        thinkingMsg.textContent = '🧠 Procesando...';
        chatWindow.appendChild(thinkingMsg);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        try {
            const response = await fetch(`${BASE_URL}/processDirective`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userDirective, fileContent })
            });
            
            chatWindow.removeChild(thinkingMsg); // Elimina el mensaje "Pensando..."

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            addMessage('ai', data.response);
            
            // Actualiza el contador de tokens y el medidor
            if (data.token_usage) {
                totalTokensSession += data.token_usage.total_tokens;
                drawTokenGauge(totalTokensSession);
            }
            
        } catch (error) {
            chatWindow.removeChild(thinkingMsg);
            addMessage('ai', `Error de conexión: ${error.message}`);
        } finally {
            fileContent = "";
            fileNameSpan.textContent = "Ningún archivo seleccionado";
            fileInput.value = "";
            sendButton.disabled = false;
            chatInput.focus();
        }
    }

    sendButton.addEventListener('click', sendDirective);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendDirective();
        }
    });

    // Inicializar
    drawTokenGauge(totalTokensSession);
    addMessage('ai', 'NEXUS CORE en línea. Esperando directiva.');
});