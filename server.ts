import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Magic Copywriter endpoint
app.post('/api/magic/copy', async (req, res) => {
  try {
    const { prompt, type = 'headline', tone = 'professional' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback response if no key yet
      return res.json({
        content: `Design with Passion: ${prompt.trim()}`,
        variants: [
          `Elevate your brand with ${prompt.trim()}`,
          `Experience the finest ${prompt.trim()} today`,
          `Crafted for greatness · ${prompt.trim()}`,
        ],
      });
    }

    const systemPrompt = `You are an elite advertising copywriter for Canva designs.
Generate creative, punchy, concise copy for a graphic design project.
Format requested: ${type} (headline, subhead, quote, call-to-action, or announcement).
Tone: ${tone}.
Output strictly a JSON object with:
- "content": the single best primary copy string (maximum 12 words, captivating)
- "variants": array of 3 alternative high-impact copy strings`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Prompt: ${prompt}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      content: parsed.content || prompt,
      variants: parsed.variants || [],
    });
  } catch (error: any) {
    console.error('Magic copy error:', error);
    return res.status(500).json({
      error: 'Failed to generate copy',
      details: error?.message || 'Unknown error',
    });
  }
});

// Magic Palettes & Theme Suggestions
app.post('/api/magic/palette', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        name: 'Vibrant Sunset',
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#2C3E50', '#F7FFF7'],
        fonts: { title: 'Outfit', body: 'Plus Jakarta Sans' },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Topic: ${topic}`,
      config: {
        systemInstruction: `You are an expert graphic designer and colorist.
For the given topic, produce an aesthetically pleasing 5-color palette (hex codes), suggested title font, and recommended aesthetic vibe.
Output strictly JSON:
{
  "name": "Palette Theme Name",
  "vibe": "Brief aesthetic description",
  "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "fonts": { "title": "Outfit", "body": "Plus Jakarta Sans" }
}`,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Magic palette error:', error);
    return res.status(500).json({
      error: 'Failed to generate palette',
      details: error?.message || 'Unknown error',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, host: '0.0.0.0', port },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CanvasCraft server running on http://0.0.0.0:${port}`);
  });
}

startServer();
