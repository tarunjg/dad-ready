import crypto from 'crypto';

const SECRET = process.env.EMAIL_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || 'dad-ready-default-secret';

// Generate a daily token for a given date + email
// This token is valid for all habit completions on that date
export function generateDailyToken(date, email) {
  const payload = `${date}:${email}`;
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 32);
}

// Verify a daily token
export function verifyDailyToken(date, email, token) {
  const expected = generateDailyToken(date, email);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

// Generate a completion URL for a specific habit
export function getCompletionUrl(baseUrl, habit, date, email) {
  const token = generateDailyToken(date, email);
  return `${baseUrl}/api/email-complete?h=${habit}&d=${date}&e=${encodeURIComponent(email)}&t=${token}`;
}

// Generate URL for the full completion page
export function getCompletionPageUrl(baseUrl, date, email) {
  const token = generateDailyToken(date, email);
  return `${baseUrl}/complete?d=${date}&e=${encodeURIComponent(email)}&t=${token}`;
}
