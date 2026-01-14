// Chat Widget - Frontend Logic
const API_BASE = 'http://127.0.0.1:8090';
// WS support planned for V2
// const WS_URL = 'http://localhost:8090';

let conversationId = localStorage.getItem('chat_session_id');

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
  if (conversationId) {
     console.log('Restoring session:', conversationId);
     loadHistory();
  } else {
    // No session yet. Will be created on first message.
    addBotMessage('Hello! How can I help you today?');
  }
}

// Load conversation history
async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE}/api/v1/chat/session/${conversationId}`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.messages) {
                // Clear existing messages? Or just avoid duplicates?
                // For simplicity, we clear and re-render.
                const container = document.getElementById('chatMessages');
                container.innerHTML = '';

                data.data.messages.forEach(msg => {
                    if (msg.role === 'user') addUserMessage(msg.content, msg.timestamp);
                    else addBotMessage(msg.content, msg.timestamp);
                });
            }
        } else {
            // Session expired or invalid
            localStorage.removeItem('chat_session_id');
            conversationId = null;
            addBotMessage('Hello! How can I help you today?');
        }
    } catch (e) {
        console.error('Failed to load history', e);
    }
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
    // 1. Try FAQ (L0) - Only if no active highly contextual session?
    // Actually, backend chat flow checks FAQ internally usually, or we can check explicitly.
    // The requirement says "L0 -> L1".
    // Let's try FAQ endpoint first as it's faster and cheaper.
    const faqResponse = await fetch(`${API_BASE}/api/v1/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: message })
    });

    if (faqResponse.ok) {
        const faqData = await faqResponse.json();
        if (faqData.success && faqData.data && faqData.data.answer) {
             hideTypingIndicator();
             addBotMessage(faqData.data.answer);
             return; // L0 Solved it
        }
    }

    // 2. Chat (L1) - If FAQ failed
    const chatPayload = { message };
    if (conversationId) chatPayload.sessionId = conversationId;

    const chatResponse = await fetch(`${API_BASE}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatPayload)
    });

    hideTypingIndicator();

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();

      // Save session ID if new
      if (chatData.sessionId) {
          conversationId = chatData.sessionId;
          localStorage.setItem('chat_session_id', conversationId);
      }

      if (chatData.message) {
          addBotMessage(chatData.message.content);
      } else if (chatData.tier === 'L2') {
          // Escalation response
          addBotMessage(chatData.message || 'Connecting you to an agent...');
      }
    } else {
      addBotMessage('I\'m having trouble processing your request. Please try again.');
    }
  } catch (error) {
    hideTypingIndicator();
    console.error('Error sending message:', error);
    addBotMessage('Connection issue: ' + error.message + '. Please check console.');
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
function addUserMessage(text, timestamp = new Date()) {
  const container = document.getElementById('chatMessages');
  const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user';
  messageDiv.innerHTML = `
    <div class="message-content">
      <p>${escapeHtml(text)}</p>
      <span class="timestamp">${timeStr}</span>
    </div>
  `;

  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

// Add bot message to chat
function addBotMessage(text, timestamp = new Date()) {
  const container = document.getElementById('chatMessages');
  const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message bot';
  messageDiv.innerHTML = `
    <div class="message-content">
      <p>${escapeHtml(text)}</p>
      <span class="timestamp">${timeStr}</span>
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
  console.log('Chat Widget loaded. API: ' + API_BASE);
});
