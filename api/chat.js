const MAX_MESSAGE_LENGTH = 4000;

function sendJson(response, status, body) {
  response.status(status).json(body);
}

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }
  if (!process.env.OPENAI_API_KEY) return sendJson(response, 503, { error: 'AI tools are not configured yet.' });

  const messages = Array.isArray(request.body?.messages) ? request.body.messages.slice(-12) : [];
  const safeMessages = messages
    .filter(message => ['user', 'assistant'].includes(message?.role) && typeof message.content === 'string')
    .map(message => ({ role: message.role, content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH) }))
    .filter(message => message.content);
  if (!safeMessages.length) return sendJson(response, 400, { error: 'Enter a message to start chatting.' });

  try {
    const apiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.OPENAI_CHAT_MODEL || 'gpt-5-mini', store: false, instructions: 'You are a helpful, capable general-purpose AI assistant. Be accurate, clear, and conversational.', input: safeMessages })
    });
    const data = await apiResponse.json();
    if (!apiResponse.ok) throw new Error(data.error?.message || 'The AI service could not respond.');
    return sendJson(response, 200, { message: data.output_text || 'I could not generate a response.' });
  } catch (error) {
    console.error('Chat request failed:', error);
    return sendJson(response, 502, { error: error.message || 'The AI service is unavailable.' });
  }
};
