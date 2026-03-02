import { Router, type Request, type Response } from 'express';
import OpenAI from 'openai';

const router = Router();

router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  const { messages, systemPrompt, nextNodes } = req.body;
  
  // Re-read environment variables on every request to ensure we have the latest loaded config
  // and to avoid issues with module import order (dotenv loading).
  const apiKey = process.env.OPENAI_API_KEY || process.env.DOUBAO_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || (process.env.DOUBAO_API_KEY ? 'https://ark.cn-beijing.volces.com/api/v3' : undefined);
  const model = process.env.OPENAI_MODEL_NAME || process.env.DOUBAO_MODEL_ID || 'gpt-3.5-turbo';

  // Construct enhanced system prompt if nextNodes are provided
  let enhancedSystemPrompt = systemPrompt || 'You are a helpful assistant.';
  
  if (nextNodes && nextNodes.length > 0) {
    const nextNodesInfo = nextNodes.map((n: any) => `- ID: ${n.id}, Topic: ${n.label} (${n.description || ''})`).join('\n');
    enhancedSystemPrompt += `\n\n[Conversation Flow Control]
You are also responsible for guiding the conversation flow.
Based on the user's latest input and the conversation context, determine if the conversation should naturally transition to one of the following next steps:
${nextNodesInfo}

CRITICAL RULES FOR TRANSITION:
1. ONLY transition if the user's intent CLEARLY matches the topic of the next step.
2. DO NOT transition just because the user said something. The conversation within the current step should continue until the topic naturally shifts.
3. For example, if the current step is "Opening", and the user says "Hello", DO NOT transition. Wait until the user starts talking about the product or asks to introduce it before transitioning to "Product Info".
4. If the user is still engaging in the current topic (e.g. still greeting or small talk in "Opening"), DO NOT append any transition tag.

If and ONLY IF the user's input strongly indicates a shift to the next topic, append the following tag to the VERY END of your response:
[TRANSITION:node_id]

Example: "Sure, let's talk about that. [TRANSITION:node-2]"
If no transition is needed, do not append any tag.`;
  }

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
        { role: 'system', content: enhancedSystemPrompt },
        ...messages
      ],
      temperature: 0.7,
    });

    let content = completion.choices[0].message.content || '';
    let nextNodeId = null;

    // Check for transition tag
    const transitionMatch = content.match(/\[TRANSITION:([^\]]+)\]/);
    if (transitionMatch) {
      nextNodeId = transitionMatch[1];
      content = content.replace(transitionMatch[0], '').trim();
    }

    res.json({ content, nextNodeId });
  } catch (error: any) {
    console.error('AI API Error Details:', error);
    res.status(500).json({ 
      error: error.message || '调用 AI 服务失败',
      details: error.response?.data || error.toString()
    });
  }
});

export default router;
