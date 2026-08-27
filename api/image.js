const MAX_PROMPT_LENGTH = 1500;
const NVIDIA_IMAGE_URL = 'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell';

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
  if (!process.env.NVIDIA_API_KEY) return sendJson(response, 503, { error: 'Image generation is not configured yet.' });
  const prompt = typeof request.body?.prompt === 'string' ? request.body.prompt.trim().slice(0, MAX_PROMPT_LENGTH) : '';
  if (!prompt) return sendJson(response, 400, { error: 'Describe the image you want to create.' });

  try {
    const apiResponse = await fetch(NVIDIA_IMAGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`
      },
      body: JSON.stringify({ prompt, width: 1024, height: 1024, samples: 1, seed: 0, steps: 4, cfg_scale: 0, mode: 'base' })
    });
    const data = await readJson(apiResponse);
    if (!apiResponse.ok) throw new Error(data.error?.message || data.detail || 'The image service could not respond.');
    const image = data.artifacts?.[0]?.base64 || data.data?.[0]?.b64_json;
    if (!image) throw new Error('No image was returned.');
    return sendJson(response, 200, { image: `data:image/png;base64,${image}` });
  } catch (error) {
    console.error('NVIDIA image request failed:', error);
    return sendJson(response, 502, { error: error.message || 'The image service is unavailable.' });
  }
};
