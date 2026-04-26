require("dotenv").config();

const express = require("express");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

// Polyfill Web APIs for Node < 18
if (!globalThis.fetch) {
  const { fetch, Headers, Request, Response, FormData } = require("undici");
  Object.assign(globalThis, { fetch, Headers, Request, Response, FormData });
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post("/analyze", async (req, res) => {
  const { food, goal, language } = req.body;

  if (!food || !goal || !language) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are a friendly, judgment-free nutrition assistant named Nouri. Reply in ${language}.

User ate today: ${food}
User goal: ${goal}

Respond in under 100 words with:
- Approximate total calories
- Approximate protein in grams
- One simple, positive tip for tomorrow

Be warm, encouraging, and conversational. No guilt-tripping.`,
        },
      ],
    });

    res.json({ result: message.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Local dev
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Nouri is running at http://localhost:${PORT}`));
}

module.exports = app;
