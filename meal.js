require("dotenv").config();
const Anthropic = require("@anthropic-ai/sdk");
const { fetch, Headers, Request, Response, FormData } = require("undici");

Object.assign(globalThis, { fetch, Headers, Request, Response, FormData });

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function analyzeMeal({ food, goal, language }) {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are a friendly, judgment-free nutrition assistant. Reply in ${language}.

User ate today: ${food}
User goal: ${goal}

Respond in under 100 words with:
- Approximate total calories
- Approximate protein in grams
- One simple, positive tip for tomorrow

Be warm and encouraging, no guilt-tripping.`,
      },
    ],
  });

  return message.content[0].text;
}

analyzeMeal({
  food: "Vada pav, dal chawal, biryani",
  goal: "weight loss",
  language: "Hindi",
})
  .then((response) => console.log(response))
  .catch((err) => console.error("Error:", err.message));
