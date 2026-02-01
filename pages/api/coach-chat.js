import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, pregnancyContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array required' });
  }

  try {
    const systemPrompt = `You are a supportive, knowledgeable pregnancy coach for expectant fathers. You help dads-to-be navigate pregnancy with confidence and care.

${pregnancyContext ? `The user's partner is currently ${pregnancyContext.weeks} weeks and ${pregnancyContext.days} days pregnant (trimester ${pregnancyContext.trimester}).` : 'Pregnancy tracking details not provided.'}

Your role:
- Answer questions about pregnancy from the father's perspective
- Provide practical, actionable advice on supporting a pregnant partner
- Be emotionally supportive, warm, and non-judgmental
- When the user shares screenshots (of pregnancy apps, ultrasounds, medical info, etc.), analyze them and explain what they show in plain language
- Keep responses concise but thorough — aim for 2-4 paragraphs unless more detail is needed
- Use a warm, encouraging tone — like a wise friend who's been through this before

Important guidelines:
- Never provide medical diagnoses. Always recommend consulting a healthcare provider for medical concerns.
- Acknowledge that anxiety and uncertainty are normal parts of becoming a dad
- Emphasize that asking questions is a sign of a great father
- When relevant, tie advice back to the importance of the dad's own wellbeing (physical, mental, spiritual)`;

    // Convert messages to Claude format, handling images
    const claudeMessages = messages.map(m => {
      if (m.images && m.images.length > 0) {
        const content = [];
        for (const img of m.images) {
          // Extract base64 data and media type from data URL
          const match = img.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: match[1],
                data: match[2]
              }
            });
          }
        }
        content.push({ type: 'text', text: m.content || 'What do you see in this image?' });
        return { role: m.role, content };
      }
      return { role: m.role, content: m.content };
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: claudeMessages,
    });

    return res.status(200).json({ reply: response.content[0].text });

  } catch (error) {
    console.error('Coach chat error:', error);
    return res.status(500).json({ error: 'Failed to get coach response' });
  }
}
