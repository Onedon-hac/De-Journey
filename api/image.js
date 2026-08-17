function sendJson(response, status, body) {
  response.status(status).json(body);
}

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }
  if (!process.env.OPENAI_API_KEY) return sendJson(response, 503, { error: 'AI tools are not configured yet.' });
  const prompt = typeof request.body?.prompt === 'string' ? request.body.prompt.trim().slice(0, 1500) : '';
  if (!prompt) return sendJson(response, 400, { error: 'Describe the image you want to create.' });

  try {
    const apiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1', prompt, size: '1024x1024', quality: 'medium', output_format: 'png' })
    });
    const data = await apiResponse.json();
    if (!apiResponse.ok) throw new Error(data.error?.message || 'The image service could not respond.');
    const image = data.data?.[0]?.b64_json;
    if (!image) throw new Error('No image was returned.');
    return sendJson(response, 200, { image: `data:image/png;base64,${image}` });
  } catch (error) {
    console.error('Image request failed:', error);
    return sendJson(response, 502, { error: error.message || 'The image service is unavailable.' });
  }
};
