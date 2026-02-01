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
          content: `You are helping someone remember the gold in their story. Read through their journal content and extract 5-10 meaningful moments where their character, strength, or heart shone through.

For each moment:
- Abstract any specific names (use "a friend", "a colleague", "someone close to you" instead)
- Frame it as a reminder of a core strength — resilience, empathy, courage, patience, discipline, love
- Connect it to why they are ready to be a great father
- Write in second person, present tense ("You...")
- Keep each reminder 2-3 sentences

The tone should be warm, grounding, and meaningful — not congratulatory or hype. Think of a wise mentor quietly reminding someone of who they really are. These are "just a reminder" moments — proof that this person has always had what it takes.

Document title: ${title || 'Journal Entry'}

Content:
${content.substring(0, 8000)}

Return the reminders as a JSON array of strings. Only return the JSON array, nothing else.

Example format:
["Remember when you stayed up all night helping a friend through a crisis? That wasn't obligation — that was who you are. That same heart is what your child will know as safety.", "You chose the harder path when no one was watching. That quiet discipline — the kind that doesn't need an audience — is exactly what fatherhood asks for."]`
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
