const { neon } = require('@neondatabase/serverless');

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 5000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sendJson(response, status, body) {
  response.status(status).json(body);
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not configured.');
    return sendJson(response, 503, { error: 'The contact service is not configured yet.' });
  }

  const name = cleanText(request.body?.name);
  const email = cleanText(request.body?.email).toLowerCase();
  const message = cleanText(request.body?.message);

  if (!name || name.length > MAX_NAME_LENGTH) {
    return sendJson(response, 400, { error: 'Please enter a name of up to 100 characters.' });
  }
  if (!emailPattern.test(email) || email.length > MAX_EMAIL_LENGTH) {
    return sendJson(response, 400, { error: 'Please enter a valid email address.' });
  }
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return sendJson(response, 400, { error: 'Please enter a message of up to 5,000 characters.' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      INSERT INTO contact_messages (name, email, message)
      VALUES (${name}, ${email}, ${message})
    `;
    return sendJson(response, 201, { message: 'Thanks — your message has been sent.' });
  } catch (error) {
    console.error('Unable to store contact message:', error);
    return sendJson(response, 500, { error: 'Unable to send your message. Please try again later.' });
  }
};
