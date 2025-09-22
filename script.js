document.addEventListener('DOMContentLoaded', function () {
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const fileInput = document.getElementById('file-input');
    const fileNameSpan = document.getElementById('file-name');

    const BASE_URL = "https://nexus-backend-arg.up.railway.app"; // URL de tu backend

    let fileContent = "";

    // Dibuja el medidor de tokens
    function drawTokenGauge(percentage) {
        const data = [{
            type: "indicator",
            mode: "gauge+number",
            value: percentage,
            number: { suffix: "%", font: { size: 36, color: "white" } },
            domain: { x: [0, 1], y: [0, 1] },
            gauge: {
                shape: "angular",
                axis: { range: [0, 100] },
                bar: { color: "#FF4F00", thickness: 0.8 },
                bgcolor: "#282C31",
            }
        }];
        const layout = {
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: 'rgba(0,0,0,0)',
            height: 250,
            margin: { l: 20, r: 20, t: 0, b: 10 }
        };
        Plotly.newPlot('token-gauge-container', data, layout, {displayModeBar: false});
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

        try {
            const response = await fetch(`${BASE_URL}/processDirective`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userDirective, fileContent })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            addMessage('ai', data.response);
            // Aquí actualizarías el medidor de tokens con data.token_usage si es necesario
            
        } catch (error) {
            addMessage('ai', `Error de conexión: ${error.message}`);
        } finally {
            fileContent = ""; // Resetea el contenido del archivo después de enviar
            fileNameSpan.textContent = "Ningún archivo seleccionado";
            fileInput.value = "";
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
    drawTokenGauge(0); // Dibuja el medidor en 0% al cargar
    addMessage('ai', 'NEXUS CORE en línea. Esperando directiva.');
});