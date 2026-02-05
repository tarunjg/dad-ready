import { Resend } from 'resend';
import { buildDigestEmail } from '../../lib/emailTemplate';

export default async function handler(req, res) {
  const resendKey = process.env.RESEND_API_KEY;
  const digestEmail = process.env.DIGEST_EMAIL;
  const fromEmail = process.env.DIGEST_FROM_EMAIL || 'Dad Ready <onboarding@resend.dev>';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dad-ready.vercel.app';

  if (!resendKey || !digestEmail) {
    return res.status(500).json({ error: 'Missing RESEND_API_KEY or DIGEST_EMAIL' });
  }

  // Get user settings from query params or use defaults
  // Settings are passed as a JSON string in the body for POST, or use defaults
  let settings = {
    habits: ['running', 'strength', 'noSugar', 'meditation', 'gratitude'],
    trackPregnancy: false,
    lmpDate: null,
    cycleLength: 28,
  };

  if (req.method === 'POST' && req.body?.settings) {
    settings = { ...settings, ...req.body.settings };
  }

  // Also check for settings stored server-side via env
  if (process.env.DIGEST_SETTINGS) {
    try {
      settings = { ...settings, ...JSON.parse(process.env.DIGEST_SETTINGS) };
    } catch (e) {
      // ignore parse errors
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const { html, subject } = buildDigestEmail({
    date: today,
    email: digestEmail,
    baseUrl: appUrl,
    settings,
  });

  const resend = new Resend(resendKey);

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: digestEmail,
      subject,
      html,
    });
    return res.status(200).json({ success: true, id: result.data?.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
