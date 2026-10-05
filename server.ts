import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '30mb' }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

/**
 * Helper to call Gemini with retries and fallback models on temporary 503/429 spikes
 */
async function callGeminiWithRetry(params: {
  contents: any;
  config?: any;
  primaryModel?: string;
  fallbackModels?: string[];
  maxRetries?: number;
}) {
  if (!ai) throw new Error('Gemini API is not configured on the server.');

  const models = [
    params.primaryModel || 'gemini-3.1-flash-lite',
    ...(params.fallbackModels || ['gemini-flash-latest', 'gemini-3.8-flash']),
  ];

  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const msg = String(err.message || '');
      const isTransient =
        msg.includes('503') ||
        msg.includes('429') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('high demand');

      if (isTransient) {
        console.warn(`Model ${model} hit transient error (${msg.slice(0, 120)}), trying next model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

// Server-side fallback nutrition calculation based on USDA/IFCT averages
function calculateFallbackNutrition(
  foodName: string,
  portionAmount: number,
  portionUnit: string,
  cookingMethod = 'Standard'
) {
  let grams = portionAmount;
  const unit = portionUnit.toLowerCase();
  if (unit === 'ml') grams = portionAmount;
  else if (unit.includes('piece')) grams = portionAmount * 80;
  else if (unit.includes('cup')) grams = portionAmount * 180;
  else if (unit.includes('tbsp')) grams = portionAmount * 15;
  else if (unit.includes('tsp')) grams = portionAmount * 5;
  else if (unit.includes('slice')) grams = portionAmount * 35;
  else if (unit.includes('bowl')) grams = portionAmount * 220;

  const lower = foodName.toLowerCase();
  let cal100 = 160;
  let p100 = 6;
  let c100 = 22;
  let f100 = 5;
  let fib100 = 2;
  let sug100 = 2;
  let sod100 = 160;

  if (lower.includes('biryani') || lower.includes('fried rice') || lower.includes('pulao')) {
    cal100 = 180; p100 = 7.5; c100 = 25; f100 = 6; fib100 = 1.5; sug100 = 1; sod100 = 260;
  } else if (lower.includes('chicken') || lower.includes('meat') || lower.includes('mutton') || lower.includes('fish') || lower.includes('egg')) {
    cal100 = 190; p100 = 20; c100 = 3; f100 = 11; fib100 = 0.5; sug100 = 1; sod100 = 340;
  } else if (lower.includes('dal') || lower.includes('sambar') || lower.includes('chole') || lower.includes('rajma') || lower.includes('lentil')) {
    cal100 = 120; p100 = 7.5; c100 = 17.5; f100 = 2.5; fib100 = 4.5; sug100 = 1.5; sod100 = 240;
  } else if (lower.includes('salad') || lower.includes('cucumber') || lower.includes('tomato') || lower.includes('lettuce')) {
    cal100 = 35; p100 = 1.5; c100 = 6.5; f100 = 0.5; fib100 = 2.5; sug100 = 2.5; sod100 = 20;
  } else if (lower.includes('paneer') || lower.includes('cheese')) {
    cal100 = 265; p100 = 18; c100 = 4; f100 = 20; fib100 = 0; sug100 = 2; sod100 = 380;
  } else if (lower.includes('roti') || lower.includes('chapati') || lower.includes('naan') || lower.includes('bread')) {
    cal100 = 260; p100 = 8.5; c100 = 49; f100 = 3.5; fib100 = 5; sug100 = 2; sod100 = 220;
  } else if (lower.includes('dosa') || lower.includes('idli')) {
    cal100 = 170; p100 = 4.5; c100 = 30; f100 = 4; fib100 = 2; sug100 = 1; sod100 = 250;
  }

  const cm = cookingMethod.toLowerCase();
  if (cm.includes('deep fried')) {
    cal100 *= 1.45;
    f100 *= 2.2;
    sod100 *= 1.2;
  } else if (cm.includes('fried') || cm.includes('curry') || cm.includes('with oil')) {
    cal100 *= 1.2;
    f100 *= 1.5;
  } else if (cm.includes('steamed') || cm.includes('boiled') || cm.includes('without oil') || cm.includes('raw')) {
    cal100 *= 0.88;
    f100 *= 0.6;
  }

  const factor = Math.max(0.1, grams / 100);
  return {
    calories: Math.round(cal100 * factor),
    protein_g: Math.round(p100 * factor * 10) / 10,
    carbs_g: Math.round(c100 * factor * 10) / 10,
    fat_g: Math.round(f100 * factor * 10) / 10,
    fiber_g: Math.round(fib100 * factor * 10) / 10,
    sugar_g: Math.round(sug100 * factor * 10) / 10,
    sodium_mg: Math.round(sod100 * factor),
    notes: `Estimated based on ${cookingMethod} preparation for ${portionAmount} ${portionUnit}.`,
  };
}

// Food analysis endpoint
app.post('/api/analyze-food', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', userHint } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required.' });
    }

    if (!ai) {
      return res.status(500).json({
        error: 'Gemini API key is not configured on the server. Please check Settings > Secrets.',
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');

    const promptText = `
You are the food nutritionist AI for NUTRISNAP AI ("Snap your food. Know your nutrition.").
Analyze this food image accurately and objectively.

Follow these strict rules:
1. FIRST, determine if the image actually contains identifiable food.
   - If the image is NOT food, or is too dark, extremely blurry, too far away, or obscured, set "isFood": false and explain in "rejectionReason".
2. DETECT ALL VISIBLE FOOD ITEMS SEPARATELY.
   - For example, if a plate has "Rice", "Chicken Curry", "Dal", and "Salad", do NOT group them as one dish. Break them down individually!
   - Special attention to Indian foods (Biryani, Dal Tadka, Sambar, Idli, Dosa, Chapati/Roti, Naan, Paratha, Paneer, Butter Chicken, Curry, Pulao, Curd, Chole, Rajma, etc.) and global dishes (Pizza, Burger, Pasta, Sushi, Tacos, Salad, etc.).
3. ESTIMATE REALISTIC PORTION SIZES:
   - Provide realistic portion amount and appropriate unit: "g" (grams), "ml", "pieces", "cup", "tbsp", or "tsp".
   - If portion size cannot be reliably determined (e.g., angle or depth unclear), set confidence to "low" or "medium" and mention "Portion size is difficult to estimate from this photo."
4. ESTIMATE NUTRITION VALUES REALISTICALLY (per detected portion):
   - calories (kcal), protein_g (g), carbs_g (g), fat_g (g), fiber_g (g), sugar_g (g), sodium_mg (mg).
   - Label these values responsibly as ESTIMATES based on credible nutritional data (USDA / IFCT).
5. COOKING METHOD & HIDDEN INGREDIENTS:
   - Detect or infer the cooking method: "Curry", "Deep fried", "Fried", "Boiled", "Steamed", "Baked", "Grilled", "Roasted", "With oil", "Without oil", or "Raw".
   - Account for hidden oils, ghee, butter, gravies, dressings, and sugar.
   - Mention in "notes" if hidden oils/fats contribute to calorie density.
6. OVERALL TOTAL:
   - Sum the calories, protein, carbs, fat, fiber, sugar, and sodium across all detected foods.

${userHint ? `User notes/hints provided: "${userHint}".` : ''}
`;

    const response = await callGeminiWithRetry({
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFood: { type: Type.BOOLEAN },
            rejectionReason: { type: Type.STRING },
            confidence: { type: Type.STRING },
            mealName: { type: Type.STRING },
            foods: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  portionAmount: { type: Type.NUMBER },
                  portionUnit: { type: Type.STRING },
                  portionNote: { type: Type.STRING },
                  cookingMethod: { type: Type.STRING },
                  calories: { type: Type.NUMBER },
                  protein_g: { type: Type.NUMBER },
                  carbs_g: { type: Type.NUMBER },
                  fat_g: { type: Type.NUMBER },
                  fiber_g: { type: Type.NUMBER },
                  sugar_g: { type: Type.NUMBER },
                  sodium_mg: { type: Type.NUMBER },
                  confidence: { type: Type.STRING },
                  notes: { type: Type.STRING },
                },
                required: [
                  'name',
                  'portionAmount',
                  'portionUnit',
                  'cookingMethod',
                  'calories',
                  'protein_g',
                  'carbs_g',
                  'fat_g',
                  'fiber_g',
                  'sugar_g',
                  'sodium_mg',
                  'confidence',
                ],
              },
            },
            total: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein_g: { type: Type.NUMBER },
                carbs_g: { type: Type.NUMBER },
                fat_g: { type: Type.NUMBER },
                fiber_g: { type: Type.NUMBER },
                sugar_g: { type: Type.NUMBER },
                sodium_mg: { type: Type.NUMBER },
              },
              required: ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sodium_mg'],
            },
            uncertaintyNotes: { type: Type.STRING },
          },
          required: ['isFood', 'confidence', 'foods', 'total'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from AI analysis');
    }

    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing food image:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred during food analysis.',
    });
  }
});

// Recalculate nutrition for edited food item
app.post('/api/recalculate-food', async (req: Request, res: Response) => {
  try {
    const { foodName, portionAmount, portionUnit, cookingMethod, ingredientsNote } = req.body;

    if (!foodName || !portionAmount || !portionUnit) {
      return res.status(400).json({ error: 'foodName, portionAmount, and portionUnit are required.' });
    }

    if (!ai) {
      // Return server-side nutrition database estimation
      return res.json(calculateFallbackNutrition(foodName, portionAmount, portionUnit, cookingMethod));
    }

    const prompt = `
Recalculate nutrition for this food item:
Food: "${foodName}"
Portion: ${portionAmount} ${portionUnit}
Cooking Method: "${cookingMethod || 'Standard'}"
Additional ingredients/notes: "${ingredientsNote || 'None'}"

Calculate realistic nutrition estimates based on standard nutritional databases (USDA/IFCT):
- calories (kcal)
- protein_g (g)
- carbs_g (g)
- fat_g (g)
- fiber_g (g)
- sugar_g (g)
- sodium_mg (mg)

Take cooking method strictly into account (e.g. Deep fried has higher fat than boiled/steamed, grilled is lean, curry has oil gravies).
`;

    try {
      const response = await callGeminiWithRetry({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein_g: { type: Type.NUMBER },
              carbs_g: { type: Type.NUMBER },
              fat_g: { type: Type.NUMBER },
              fiber_g: { type: Type.NUMBER },
              sugar_g: { type: Type.NUMBER },
              sodium_mg: { type: Type.NUMBER },
              notes: { type: Type.STRING },
            },
            required: ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sodium_mg'],
          },
        },
      });

      const text = response.text;
      if (text) {
        const result = JSON.parse(text);
        return res.json(result);
      }
    } catch (apiErr) {
      console.warn('AI recalculation temporary error, using algorithmic nutrition database fallback:', apiErr);
      return res.json(calculateFallbackNutrition(foodName, portionAmount, portionUnit, cookingMethod));
    }

    return res.json(calculateFallbackNutrition(foodName, portionAmount, portionUnit, cookingMethod));
  } catch (error: any) {
    console.error('Error in recalculate-food endpoint:', error);
    return res.status(500).json({ error: error.message || 'Recalculation error' });
  }
});

// Nutri AI Assistant Chat Endpoint
app.post('/api/nutri-chat', async (req: Request, res: Response) => {
  try {
    const { messages, userContext } = req.body;

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API is not configured.' });
    }

    const systemInstruction = `
You are "Nutri AI", the friendly, knowledgeable AI nutrition assistant inside NUTRISNAP AI ("Snap your food. Know your nutrition.").
Your role is to help users understand their meals, calories, macronutrients, healthier swaps, and daily nutrition targets.

Rules & Tone:
1. Be concise, warm, practical, and clear. Avoid robotic medical jargon.
2. Label all calorie and nutrient numbers as ESTIMATES.
3. NEVER provide medical diagnoses or prescribe diets for medical diseases. Remind users: "For personal medical or dietary conditions, consult a registered dietitian or healthcare provider."
4. Understand both Indian foods (Biryani, Dal, Paneer, Dosa, Roti, Curd, Sambar, etc.) and international foods (Pasta, Burgers, Salads, Sushi, etc.).
5. If the user asks about today's intake or current targets, refer to the provided userContext if available.
6. When suggesting healthier alternatives, give actionable, appetizing ideas (e.g., swapping deep-fried snacks for roasted makhana or chana, choosing tandoori over creamy butter gravy, adding protein to salad).

${userContext ? `Current User Context: ${JSON.stringify(userContext)}` : ''}
`;

    const contents = (messages || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const response = await callGeminiWithRetry({
      contents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || 'I am here to help you with your food and nutrition questions.';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Nutri AI chat error:', error);
    return res.status(500).json({ error: error.message || 'Chat service error' });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    appName: 'NUTRISNAP AI',
    hasApiKey: Boolean(apiKey),
  });
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        host: '0.0.0.0',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

// In local and container environments, start the listener. In Vercel serverless, export the app.
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export default app;
