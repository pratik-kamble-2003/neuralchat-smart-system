const Groq = require('groq-sdk');

let client = null;

const getOpenAIClient = () => {
  if (!client) {
    client = new Groq({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
};

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'llama-3.3-70b-versatile';
const MAX_CONTEXT_MESSAGES = 20;

module.exports = { getOpenAIClient, OPENAI_MODEL, MAX_CONTEXT_MESSAGES };