const MAX_MESSAGE_LENGTH = 4000;
const NVIDIA_CHAT_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

function sendJson(response, status, body) {
  response.status(status).json(body);
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }
  if (!process.env.NVIDIA_API_KEY) return sendJson(response, 503, { error: 'AI chat is not configured yet.' });

  const messages = Array.isArray(request.body?.messages) ? request.body.messages.slice(-12) : [];
  const safeMessages = messages
    .filter(message => ['user', 'assistant'].includes(message?.role) && typeof message.content === 'string')
    .map(message => ({ role: message.role, content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH) }))
    .filter(message => message.content);
  if (!safeMessages.length) return sendJson(response, 400, { error: 'Enter a message to start chatting.' });

  try {
    const apiResponse = await fetch(NVIDIA_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.NVIDIA_CHAT_MODEL || 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: 'You are a helpful, capable general-purpose AI assistant. Be accurate, clear, and conversational.' },
          ...safeMessages
        ],
        max_tokens: 700,
        temperature: 0.7,
        stream: false
      })
    });
    const data = await readJson(apiResponse);
    if (!apiResponse.ok) throw new Error(data.error?.message || data.detail || 'The AI service could not respond.');
    const message = data.choices?.[0]?.message?.content;
    if (typeof message !== 'string' || !message.trim()) throw new Error('The AI service returned an empty response.');
    return sendJson(response, 200, { message });
  } catch (error) {
    console.error('NVIDIA chat request failed:', error);
    return sendJson(response, 502, { error: error.message || 'The AI service is unavailable.' });
  }
};
