export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: missing OpenAI API key' });
  }

  const { audio } = req.body;

  if (!audio) {
    return res.status(400).json({ error: 'Audio data required' });
  }

  try {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64');

    // Build multipart form data manually for OpenAI Whisper API
    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);

    const parts = [];

    // Add audio file part
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="recording.webm"\r\n` +
      `Content-Type: audio/webm\r\n\r\n`
    );
    parts.push(audioBuffer);
    parts.push('\r\n');

    // Add model part
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="model"\r\n\r\n` +
      `whisper-1\r\n`
    );

    // Closing boundary
    parts.push(`--${boundary}--\r\n`);

    // Combine all parts into a single buffer
    const bodyParts = parts.map(part =>
      typeof part === 'string' ? Buffer.from(part) : part
    );
    const body = Buffer.concat(bodyParts);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI Whisper error:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || 'Transcription failed'
      });
    }

    const data = await response.json();
    return res.status(200).json({ text: data.text });

  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({ error: 'Failed to transcribe audio' });
  }
}
