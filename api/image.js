function sendJson(response, status, body) {
  response.status(status).json(body);
}

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  // Uses your NVIDIA API key (or falls back to OPENAI_API_KEY)
  const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return sendJson(response, 503, { error: 'AI tools are not configured yet.' });

  const prompt = typeof request.body?.prompt === 'string' ? request.body.prompt.trim().slice(0, 1500) : '';
  if (!prompt) return sendJson(response, 400, { error: 'Describe the image you want to create.' });

  try {
    // Calls NVIDIA NIM's Stable Diffusion XL endpoint
    const apiResponse = await fetch('https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json'
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt, weight: 1 }],
        cfg_scale: 5,
        sampler: 'K_DPM_2_ANCESTRAL',
        steps: 25,
        seed: 0
      })
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) throw new Error(data.message || data.error?.message || 'The image service could not respond.');

    // NVIDIA NIM returns base64 image data inside data.artifacts[0].base64
    const imageBase64 = data.artifacts?.[0]?.base64;
    if (!imageBase64) throw new Error('No image was returned from NVIDIA NIM.');

    return sendJson(response, 200, { image: `data:image/jpeg;base64,${imageBase64}` });
  } catch (error) {
    console.error('Image request failed:', error);
    return sendJson(response, 502, { error: error.message || 'The image service is unavailable.' });
  }
};
