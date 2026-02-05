import { verifyDailyToken } from '../../lib/emailToken';

export default function handler(req, res) {
  const { d: date, e: email, t: token } = req.query;

  if (!date || !email || !token) {
    return res.status(200).json({ valid: false });
  }

  try {
    const valid = verifyDailyToken(date, email, token);
    return res.status(200).json({ valid });
  } catch (e) {
    return res.status(200).json({ valid: false });
  }
}
