import { Router, type Request, type Response } from 'express';
import OpenAI from 'openai';

const router = Router();

router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  const { messages, systemPrompt } = req.body;
  
  // Re-read environment variables on every request to ensure we have the latest loaded config
  // and to avoid issues with module import order (dotenv loading).
  const apiKey = process.env.OPENAI_API_KEY || process.env.DOUBAO_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || (process.env.DOUBAO_API_KEY ? 'https://ark.cn-beijing.volces.com/api/v3' : undefined);
  const model = process.env.OPENAI_MODEL_NAME || process.env.DOUBAO_MODEL_ID || 'gpt-3.5-turbo';

  console.log('AI Request Config:', {
    baseURL,
    model,
    apiKeyPresent: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'N/A'
  });

  if (!apiKey) {
    console.error('Missing API Key');
    res.status(500).json({ 
      error: 'AI API Key 未配置。请在 .env 文件中设置 OPENAI_API_KEY。',
      missingKey: true 
    });
    return;
  }

  try {
    // Initialize client inside the handler
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    });

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
        ...messages
      ],
      temperature: 0.7,
    });

    res.json({ content: completion.choices[0].message.content });
  } catch (error: any) {
    console.error('AI API Error Details:', error);
    res.status(500).json({ 
      error: error.message || '调用 AI 服务失败',
      details: error.response?.data || error.toString()
    });
  }
});

export default router;
