const API_KEY = ""; // Replace with your Gemini API key
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");

function scrollToBottom() {
  chatsContainer.scrollTop = chatsContainer.scrollHeight;
}

function createMessageElement(content, className) {
  const div = document.createElement("div");
  div.classList.add("message", className);
  div.innerHTML = `<p class="message-text">${content}</p>`;
  return div;
}

async function generateResponse(userMessage) {
  const userMsgDiv = createMessageElement(userMessage, "user-message");
  chatsContainer.appendChild(userMsgDiv);

  const botMsgDiv = createMessageElement("Just a sec...", "bot-message");
  chatsContainer.appendChild(botMsgDiv);
  scrollToBottom();

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }],
      }),
    });

    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();
    const botResponse = data.candidates[0].content.parts[0].text;
    botMsgDiv.querySelector(".message-text").textContent = botResponse;
  } catch (error) {
    botMsgDiv.querySelector(".message-text").textContent = "Error: Could not fetch response.";
    console.error(error);
  }
  scrollToBottom();
}

promptForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();
  if (!userMessage) return;
  promptInput.value = "";
  generateResponse(userMessage);
});
