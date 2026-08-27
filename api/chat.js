const MAX_MESSAGE_LENGTH = 4000;

function sendJson(response, status, body) {
  response.status(status).json(body);
}

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  // Uses your new Vercel variable (or falls back to OPENAI_API_KEY if you re-used it)
  const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return sendJson(response, 503, { error: 'AI tools are not configured yet.' });

  const messages = Array.isArray(request.body?.messages) ? request.body.messages.slice(-12) : [];
  const safeMessages = messages
    .filter(message => ['user', 'assistant'].includes(message?.role) && typeof message.content === 'string')
    .map(message => ({ role: message.role, content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH) }))
    .filter(message => message.content);

  if (!safeMessages.length) return sendJson(response, 400, { error: 'Enter a message to start chatting.' });

  try {
    // Points to NVIDIA NIM OpenAI-compatible chat completions endpoint
    const apiResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${apiKey}` 
      },
      body: JSON.stringify({ 
        model: process.env.NVIDIA_CHAT_MODEL || 'deepseek-ai/deepseek-r1', 
        messages: safeMessages 
      })
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) throw new Error(data.error?.message || 'The AI service could not respond.');

    // Extracts message content from NVIDIA's response structure
    const replyText = data.choices?.[0]?.message?.content || 'I could not generate a response.';
    return sendJson(response, 200, { message: replyText });
  } catch (error) {
    console.error('Chat request failed:', error);
    return sendJson(response, 502, { error: error.message || 'The AI service is unavailable.' });
  }
};
