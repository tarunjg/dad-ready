import { verifyDailyToken } from '../../lib/emailToken';

export default async function handler(req, res) {
  const { h: habit, d: date, e: email, t: token } = req.query;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dad-ready.vercel.app';

  if (!habit || !date || !email || !token) {
    return res.status(400).send(errorPage('Missing parameters'));
  }

  // Validate token
  try {
    if (!verifyDailyToken(date, email, token)) {
      return res.status(403).send(errorPage('Invalid or expired link'));
    }
  } catch (e) {
    return res.status(403).send(errorPage('Invalid link'));
  }

  // Redirect to the completion page with the habit to mark as done
  const redirectUrl = `${appUrl}/complete?d=${date}&e=${encodeURIComponent(email)}&t=${token}&mark=${habit}`;
  return res.redirect(302, redirectUrl);
}

function errorPage(message) {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dad Ready</title>
</head><body style="margin:0;padding:40px 20px;background:#1a1a2e;color:#fff;font-family:-apple-system,sans-serif;text-align:center;">
<h1 style="font-family:Georgia,serif;font-weight:400;font-size:24px;">${message}</h1>
<p style="color:rgba(255,255,255,0.5);font-size:14px;">This link may have expired. Please use today's email digest.</p>
</body></html>`;
}
