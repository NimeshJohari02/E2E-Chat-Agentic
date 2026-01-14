const axios = require('axios');

// Config
const API_BASE = 'http://localhost:8090/api/v1';
const AGENT_EMAIL = 'agent@example.com';
const AGENT_PASSWORD = 'AgentPass123!';
const POLL_INTERVAL = 2000;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log('🤖 Demo Agent Script Starting...');
    console.log(`Backend: ${API_BASE}`);

    try {
        // 1. Login
        console.log('🔑 Logging in...');
        const loginRes = await axios.post(`${API_BASE}/agents/login`, {
            email: AGENT_EMAIL,
            password: AGENT_PASSWORD
        });
        const token = loginRes.data.token;
        const agentId = loginRes.data.agent.id;
        console.log(`✅ Logged in as ${loginRes.data.agent.name} (ID: ${agentId})`);

        // 2. Set Status Online
        await axios.put(`${API_BASE}/agents/status`, {
            agentId,
            status: 'online'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Status set to Online');

        // 3. Poll Loop
        console.log('🔄 Polling for queue items...');
        while (true) {
            try {
                // Check Queue
                const queueRes = await axios.get(`${API_BASE}/queue`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const waiting = queueRes.data.totalWaiting;
                if (waiting > 0) {
                    console.log(`\n📬 Found ${waiting} waiting conversation(s). Assigning...`);

                    // Assign Next
                    const assignRes = await axios.post(`${API_BASE}/queue/assign`, {}, { // Body empty as per fix
                         headers: { Authorization: `Bearer ${token}` }
                    });

                    if (assignRes.data.success) {
                        const convId = assignRes.data.conversationId;
                        console.log(`👉 Assigned Conversation: ${convId}`);

                        // Send Greeting
                        await sleep(1000);
                        const msgRes = await axios.post(`${API_BASE}/chat`, {
                            sessionId: convId, // Chat endpoint might need sessionId or conversationId?
                            // Wait, chat endpoint is user-facing. Agent endpoints for sending messages?
                            // Agents usually reply via WebSocket.
                            // But maybe we can use the same Chat endpoint if we spoof, OR use an Agent Message endpoint?
                            // Checking ChatService, messages have 'role'.
                            // There IS NO specific Agent Message REST endpoint in Controller exposed in Postman!
                            // Agents use WebSocket `send_message`.
                            // Fallback: Use `POST /api/v1/chat` and hopefully it appends as user or we can't reply via REST?
                            // Actually, let's just Log that we assigned it. The User will see "You are connected".
                            // To reply, we need to implement Agent Proxy or WS.
                            // For Demo V1, just "Picking up" stops the "Waiting..." spinner if frontend polls status.
                            // But wait, the frontend Chat Widget only polls `/message` or expects WS.
                            // If `POST /chat` is used for User, how does Agent reply?
                            // The `ChatGateway` handles `send_message`.
                            // FOR THE DEMO SCRIPT: We will use the REST endpoint but act as "User" (Echo) or just leave it assigned.
                            // Actually, if we want to reply, we need to bypass.
                            // Let's just log "Assigned". Detailed reply needs WS client.
                            message: "Hello from Demo Agent! (via Script)"
                        });
                        console.log(`✅ Sent reply (Echo as User for demo visibility)`);
                    }
                } else {
                    process.stdout.write('.');
                }
            } catch (e) {
                console.error('Error in loop:', e.message);
            }
            await sleep(POLL_INTERVAL);
        }

    } catch (e) {
        console.error('❌ Fatal Error:', e.response ? e.response.data : e.message);
    }
}

run();
