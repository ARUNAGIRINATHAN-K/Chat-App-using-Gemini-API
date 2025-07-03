const socket = io();

const chatBox = document.getElementById('chat-box');
const msgInput = document.getElementById('msgInput');

socket.on('message', function(msg) {
    const p = document.createElement('p');
    p.textContent = msg;
    chatBox.appendChild(p);
    chatBox.scrollTop = chatBox.scrollHeight;
});

function sendMessage() {
    const msg = msgInput.value;
    if (msg.trim() !== '') {
        socket.emit('message', msg);
        msgInput.value = '';
    }
}

msgInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});
