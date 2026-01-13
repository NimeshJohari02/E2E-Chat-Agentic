// Chat Widget - WebSocket Integration
const API_BASE = 'http://localhost:3000';
const WS_URL = 'http://localhost:3000/chat';

let socket = null;
let conversationId = null;

// Toggle chat visibility
function toggleChat() {
  const bubble = document.getElementById('chatBubble');
  const widget = document.getElementById('chatWidget');

  if (widget.classList.contains('hidden')) {
    widget.classList.remove('hidden');
    bubble.classList.add('hidden');
    initializeChat();
  } else {
    widget.classList.add('hidden');
    bubble.classList.remove('hidden');
  }
}

// Initialize chat session
async function initializeChat() {
  if (!conversationId) {
    try {
      // Start a new conversation via REST API
      const response = await fetch(`${API_BASE}/api/v1/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        conversationId = data.conversationId;
        console.log('Conversation started:', conversationId);
        connectWebSocket();
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      addBotMessage('Sorry, I couldn\'t connect. Please try again later.');
    }
  }
}

// Connect to WebSocket
function connectWebSocket() {
  if (socket) return;

  // For demo purposes, we'll use REST polling if WebSocket isn't available
  console.log('WebSocket connection would be established here');

  // Simulated welcome message for demo
  setTimeout(() => {
    addBotMessage('Great! I\'m connected to the support system. How can I help you today?');
  }, 500);
}

// Send message
async function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();

  if (!message) return;

  // Add user message to UI
  addUserMessage(message);
  input.value = '';

  // Show typing indicator
  showTypingIndicator();

  try {
    // Send to FAQ endpoint first (L0)
    const faqResponse = await fetch(`${API_BASE}/api/v1/faq/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: message })
    });

    if (faqResponse.ok) {
      const faqData = await faqResponse.json();
      hideTypingIndicator();

      if (faqData && faqData.answer) {
        addBotMessage(faqData.answer);
        return;
      }
    }

    // Fallback to L1 AI Chat
    const chatResponse = await fetch(`${API_BASE}/api/v1/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: conversationId || 'demo-session',
        content: message
      })
    });

    hideTypingIndicator();

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      addBotMessage(chatData.response || 'I received your message. Let me help you with that.');
    } else {
      addBotMessage('I\'m having trouble processing your request. Would you like to speak with an agent?');
    }
  } catch (error) {
    hideTypingIndicator();
    console.error('Error sending message:', error);
    addBotMessage('Connection issue. Please check if the backend is running on localhost:3000');
  }
}

// Quick message shortcut
function sendQuickMessage(text) {
  document.getElementById('messageInput').value = text;
  sendMessage();
}

// Handle enter key
function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

// Add user message to chat
function addUserMessage(text) {
  const container = document.getElementById('chatMessages');
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user';
  messageDiv.innerHTML = `
    <div class="message-content">
      <p>${escapeHtml(text)}</p>
      <span class="timestamp">${now}</span>
    </div>
  `;

  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

// Add bot message to chat
function addBotMessage(text) {
  const container = document.getElementById('chatMessages');
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message bot';
  messageDiv.innerHTML = `
    <div class="message-content">
      <p>${escapeHtml(text)}</p>
      <span class="timestamp">${now}</span>
    </div>
  `;

  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

// Typing indicator
function showTypingIndicator() {
  const container = document.getElementById('chatMessages');

  const indicator = document.createElement('div');
  indicator.id = 'typingIndicator';
  indicator.className = 'message bot';
  indicator.innerHTML = `
    <div class="message-content typing-indicator">
      <span></span><span></span><span></span>
    </div>
  `;

  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) {
    indicator.remove();
  }
}

// XSS protection
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Chat Widget loaded. Click the bubble to start chatting!');
});
