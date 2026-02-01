import twilio from 'twilio';
import { getTodayQuote } from '../../lib/quotes';

export default async function handler(req, res) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  const myPhone = process.env.MY_PHONE_NUMBER;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dad-ready.vercel.app';

  if (!accountSid || !authToken || !twilioPhone || !myPhone) {
    return res.status(500).json({ error: 'Missing configuration' });
  }

  const client = twilio(accountSid, authToken);
  const quote = getTodayQuote();

  const message = `🏀 Dad Ready

"${quote.text}"
— ${quote.author}

Time to check in: ${appUrl}

💪 You got this.`;

  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhone,
      to: myPhone
    });
    return res.status(200).json({ success: true, messageSid: result.sid });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
