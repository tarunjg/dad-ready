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
          content: `You are helping someone remember specific, real moments from their story. Read through their journal content and extract 5-10 concrete reminders grounded in actual events they described.

For each moment:
- Reference the SPECIFIC situation, event, or circumstance they wrote about — the time of day, the place, the action, the choice they made
- Abstract any specific names (use "a friend", "a colleague", "someone close to you" instead) but keep ALL other concrete details
- Connect it to a core strength — resilience, empathy, courage, patience, discipline, love
- Briefly tie it to why they are ready to be a great father
- Write in second person, present tense ("You...")
- Keep each reminder 2-4 sentences

IMPORTANT: Be SPECIFIC. Do NOT write generic affirmations. Every reminder MUST reference a concrete event, detail, or moment from their writing. If you can't point to a specific thing they wrote about, don't include it. The person should read this and immediately know exactly which moment you're talking about.

The tone should be warm, grounding, and real — like a close friend who was there reminding you of something you lived. Not a motivational poster. Not a therapist. A friend who saw it happen.

Document title: ${title || 'Journal Entry'}

Content:
${content.substring(0, 8000)}

Return the reminders as a JSON array of strings. Only return the JSON array, nothing else.

Example format:
["You wrote about that night you sat in the parking lot for an hour after work, just to make sure a friend got home safe after a rough call. Nobody asked you to do that. That instinct — to protect without being asked — is what your child will feel every single day.", "Remember the week you worked doubles and still found time to cook dinner because someone you loved needed a home-cooked meal after their surgery? That wasn't small. That was a man who puts love into action even when he's running on empty. Your kid is going to know that kind of love."]`
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
