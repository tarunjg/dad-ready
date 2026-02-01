import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { secret } = req.body;
  
  if (secret !== process.env.TEST_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  const myPhone = process.env.MY_PHONE_NUMBER;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dad-ready.vercel.app';

  const client = twilio(accountSid, authToken);

  const message = `🧪 Dad Ready - Test Message

This is a test! If you got this, your daily reminders are set up correctly.

App: ${appUrl}

💪 Let's go.`;

  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhone,
      to: myPhone
    });

    return res.status(200).json({ success: true, messageSid: result.sid });
  } catch (error) {
    console.error('Twilio error:', error);
    return res.status(500).json({ error: error.message });
  }
}
