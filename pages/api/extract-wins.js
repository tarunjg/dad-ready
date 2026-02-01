import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content, title } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'No content provided' });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are helping someone build a "wins feed" - a collection of their personal victories, beautiful moments, and times they've been great.

Read through this journal/reflection content and extract 5-10 meaningful "wins" - these could be:
- Accomplishments they're proud of
- Moments of gratitude or joy
- Times they overcame challenges
- Insights or breakthroughs
- Acts of kindness or connection
- Personal growth moments

For each win, write it as a short, encouraging reminder (1-2 sentences) that would feel good to read on a tough day. Write in second person ("You...") to speak directly to them.

Document title: ${title || 'Journal Entry'}

Content:
${content.substring(0, 8000)}

Return the wins as a JSON array of strings. Only return the JSON array, nothing else.

Example format:
["You crushed that presentation and got a standing ovation from the team.", "You showed up for your friend when they needed you most.", "You ran your first 5K even when you didn't feel like it."]`
        }
      ]
    });

    // Parse the response
    const responseText = message.content[0].text;
    
    // Try to extract JSON from the response
    let wins;
    try {
      // Handle potential markdown code blocks
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        wins = JSON.parse(jsonMatch[0]);
      } else {
        wins = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse wins:', parseError);
      // Return a default win if parsing fails
      wins = ["You took the time to reflect on your journey. That's a win in itself."];
    }

    return res.status(200).json({ wins });

  } catch (error) {
    console.error('Error extracting wins:', error);
    return res.status(500).json({ error: 'Failed to extract wins' });
  }
}
