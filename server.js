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

const GOAL_GUIDANCE = {
  "weight loss": `
Focus: Low calorie, high fiber.
Good foods: dal, vegetables, salads, buttermilk, fruits, lean protein.
Avoid: fried foods, rice, maida, sugary drinks.
Tip style: Help them eat more fiber and less calories tomorrow.`,

  "muscle gain": `
Focus: High protein, more overall calories.
Good foods: eggs, paneer, chicken, dal, milk, nuts, complex carbs.
Avoid: skipping meals or protein.
Tip style: Suggest adding a protein-rich food to tomorrow's meals.`,

  "maintenance": `
Focus: Balanced nutrition, moderate portions.
Good foods: mix of carbs, protein, fats, vegetables.
Tip style: Suggest one small balance improvement for tomorrow.`,

  "fat loss aggressive": `
Focus: Very low calorie, high satiety.
Good foods: vegetables, dal, eggs, lean protein, cucumber, salads.
Avoid: rice, bread, fried food, dairy, sweets.
Tip style: Strict but kind — suggest a very light, filling option for tomorrow.`,

  "weight gain": `
Focus: High calorie, high protein.
Good foods: ghee, nuts, full-fat dairy, rice, paneer, bananas, peanut butter.
Tip style: Suggest a calorie-dense addition to tomorrow's meals.`,

  "diabetes management": `
Focus: Low sugar, low glycemic carbs.
Good foods: vegetables, protein, whole grains, dal, eggs, nuts.
Avoid: rice, maida, sugar, fruit juices, potatoes.
Tip style: Suggest a low-sugar swap or meal idea for tomorrow.`,
};

app.post("/analyze", async (req, res) => {
  const { food, goal, language } = req.body;

  if (!food || !goal || !language) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const goalKey = goal.toLowerCase();
  const guidance = GOAL_GUIDANCE[goalKey] || "";

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `You are a friendly, judgment-free nutrition assistant named Nouri. Reply in ${language}.

User ate today: ${food}
User goal: ${goal}

Goal-specific guidance (use this to shape your response):
${guidance}

Provide a JSON response with this exact structure:
{
  "analysis": "Brief analysis in under 80 words with approximate total calories, approximate protein in grams, and one specific actionable tip for tomorrow that fits their goal. Be warm, encouraging, and conversational. No guilt-tripping.",
  "dos": [
    "First specific actionable thing to do tomorrow based on their goal and what they ate today. Practical Indian lifestyle advice.",
    "Second specific actionable thing to do tomorrow based on their goal and what they ate today. Practical Indian lifestyle advice.",
    "Third specific actionable thing to do tomorrow based on their goal and what they ate today. Practical Indian lifestyle advice."
  ],
  "donts": [
    "First specific thing to avoid tomorrow based on their goal and today's food. Real Indian food habits to watch out for.",
    "Second specific thing to avoid tomorrow based on their goal and today's food. Real Indian food habits to watch out for.",
    "Third specific thing to avoid tomorrow based on their goal and today's food. Real Indian food habits to watch out for."
  ]
}

Make the dos and donts goal-specific:
- Weight loss: Focus on calorie reduction, fiber increase, portion control
- Muscle gain: Focus on protein intake, meal timing, calorie surplus
- Diabetes management: Focus on blood sugar control, low GI foods, portion management
- Maintenance: Focus on balanced nutrition, moderation
- Fat loss aggressive: Focus on strict calorie deficit, high satiety foods
- Weight gain: Focus on calorie-dense foods, frequent meals

Return ONLY valid JSON, no other text.`,
        },
      ],
    });

    const responseText = message.content[0].text;
    const jsonResponse = JSON.parse(responseText);
    res.json(jsonResponse);
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
