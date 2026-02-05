import { PILLARS, getAllHabits } from './pillars';
import { getQuoteByDay } from './quotes';
import { getSpiritualPassage } from './spiritualPassages';
import { getDailyTip, getWeeklyAction } from './pregnancy';
import { getCompletionUrl, getCompletionPageUrl } from './emailToken';

// Build the daily digest HTML email
export function buildDigestEmail({ date, email, baseUrl, settings }) {
  const d = new Date(date + 'T12:00:00');
  const dayOfMonth = d.getDate();
  const monthName = d.toLocaleDateString('en-US', { month: 'long' });
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });

  const quote = getQuoteByDay(dayOfMonth);
  const passage = getSpiritualPassage(dayOfMonth);
  const activeHabits = settings?.habits || ['running', 'strength', 'noSugar', 'meditation', 'gratitude'];
  const allHabits = getAllHabits();
  const habits = allHabits.filter(h => activeHabits.includes(h.id));

  // Pregnancy info
  let pregnancyHtml = '';
  if (settings?.trackPregnancy && settings?.lmpDate) {
    const info = getDailyTip(settings.lmpDate, settings.cycleLength || 28);
    const weeklyAction = getWeeklyAction(settings.lmpDate, settings.cycleLength || 28);
    if (info) {
      pregnancyHtml = `
        <tr><td style="padding: 0 24px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #2d1b4e 0%, #1e1145 100%); border-radius: 16px; border: 1px solid rgba(168, 85, 247, 0.3);">
            <tr><td style="padding: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family: Georgia, 'Times New Roman', serif; font-size: 14px; color: #e879f9; text-transform: uppercase; letter-spacing: 2px; padding-bottom: 8px;">
                    Partner & Baby
                  </td>
                  <td align="right" style="font-family: -apple-system, sans-serif; font-size: 13px; color: rgba(232, 121, 249, 0.7); padding-bottom: 8px;">
                    Trimester ${info.trimester}
                  </td>
                </tr>
              </table>
              <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; color: #fff; margin: 0 0 4px;">
                Week ${info.weeks}, Day ${info.days}
              </p>
              ${info.weekData?.baby ? `<p style="font-family: -apple-system, sans-serif; font-size: 14px; color: rgba(255,255,255,0.65); line-height: 1.6; margin: 12px 0 0;">${info.weekData.baby}</p>` : ''}
              ${info.weekData?.mom ? `<p style="font-family: -apple-system, sans-serif; font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.6; margin: 8px 0 0;"><strong style="color: rgba(255,255,255,0.7);">Her:</strong> ${info.weekData.mom}</p>` : ''}
              ${weeklyAction ? `
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px; background: rgba(168, 85, 247, 0.15); border-radius: 10px;">
                  <tr><td style="padding: 12px 16px;">
                    <p style="font-family: -apple-system, sans-serif; font-size: 12px; color: rgba(232, 121, 249, 0.8); text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">This Week's Action</p>
                    <p style="font-family: -apple-system, sans-serif; font-size: 15px; color: #fff; margin: 0;">${weeklyAction.emoji} ${weeklyAction.text}</p>
                  </td></tr>
                </table>
              ` : ''}
            </td></tr>
          </table>
        </td></tr>`;
    }
  }

  // Build habit rows
  const habitRows = habits.map(habit => {
    const pillar = Object.values(PILLARS).find(p => p.habits.some(h => h.id === habit.id));
    const completionUrl = getCompletionUrl(baseUrl, habit.id, date, email);
    const color = pillar?.color || '#667eea';

    return `
      <tr>
        <td style="padding: 6px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;">
            <tr>
              <td style="padding: 16px 20px; font-family: -apple-system, sans-serif; font-size: 16px; color: #fff;">
                ${habit.emoji} &nbsp; ${habit.label}
              </td>
              <td align="right" style="padding: 16px 20px;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${completionUrl}" style="height:36px;v-text-anchor:middle;width:120px;" arcsize="50%" strokecolor="${color}" fillcolor="${color}">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:sans-serif;font-size:13px;font-weight:bold;">Done &#10003;</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="${completionUrl}" style="display: inline-block; padding: 8px 20px; background: ${color}; color: #fff; text-decoration: none; border-radius: 20px; font-family: -apple-system, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                  Done &#10003;
                </a>
                <!--<![endif]-->
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }).join('');

  const completionPageUrl = getCompletionPageUrl(baseUrl, date, email);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dad Ready - Day ${dayOfMonth}</title>
  <!--[if mso]>
  <noscript>
  <xml>
  <o:OfficeDocumentSettings>
  <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
  </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a1a; -webkit-text-size-adjust: none;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a1a;">
    <tr><td align="center" style="padding: 24px 16px;">

      <!-- Main container -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);">

        <!-- Header -->
        <tr><td style="padding: 32px 24px 8px;">
          <p style="font-family: -apple-system, sans-serif; font-size: 12px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 2px; margin: 0;">
            ${dayName}
          </p>
          <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 32px; font-weight: 400; color: #fff; margin: 4px 0 0;">
            ${monthName} ${dayOfMonth}
          </h1>
          <p style="font-family: -apple-system, sans-serif; font-size: 14px; color: rgba(255,255,255,0.4); margin: 4px 0 0;">
            Day ${dayOfMonth} of 28
          </p>
        </td></tr>

        <!-- Quote -->
        <tr><td style="padding: 20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(102, 126, 234, 0.1); border-left: 3px solid #667eea; border-radius: 0 12px 12px 0;">
            <tr><td style="padding: 20px;">
              <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 16px; font-style: italic; color: rgba(255,255,255,0.85); line-height: 1.6; margin: 0;">
                "${quote.text}"
              </p>
              <p style="font-family: -apple-system, sans-serif; font-size: 13px; color: rgba(255,255,255,0.45); margin: 8px 0 0;">
                &mdash; ${quote.author}
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Habits Section -->
        <tr><td style="padding: 0 24px;">
          <p style="font-family: -apple-system, sans-serif; font-size: 12px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">
            Today's Habits
          </p>
        </td></tr>
        <tr><td style="padding: 0 24px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${habitRows}
          </table>
        </td></tr>

        <!-- View All button -->
        <tr><td style="padding: 0 24px 24px;" align="center">
          <a href="${completionPageUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; text-decoration: none; border-radius: 14px; font-family: -apple-system, sans-serif; font-size: 15px; font-weight: 600;">
            Open Full Check-In
          </a>
        </td></tr>

        ${pregnancyHtml}

        <!-- Spiritual Passage -->
        <tr><td style="padding: 0 24px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 16px;">
            <tr><td style="padding: 24px;">
              <p style="font-family: -apple-system, sans-serif; font-size: 12px; color: rgba(245, 158, 11, 0.7); text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">
                Day ${passage.day} &middot; ${passage.tradition}
              </p>
              <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 17px; color: rgba(255,255,255,0.9); line-height: 1.6; margin: 0 0 8px;">
                "${passage.text}"
              </p>
              <p style="font-family: -apple-system, sans-serif; font-size: 13px; color: rgba(255,255,255,0.45); margin: 0 0 12px;">
                &mdash; ${passage.source}
              </p>
              <p style="font-family: -apple-system, sans-serif; font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.6; margin: 0; font-style: italic;">
                ${passage.reflection}
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding: 8px 24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <p style="font-family: -apple-system, sans-serif; font-size: 13px; color: rgba(255,255,255,0.3); margin: 0;">
                Dad Ready &middot; Day ${dayOfMonth} of 28
              </p>
              <p style="font-family: -apple-system, sans-serif; font-size: 12px; color: rgba(255,255,255,0.2); margin: 8px 0 0;">
                <a href="${baseUrl}" style="color: rgba(102, 126, 234, 0.6); text-decoration: none;">Open Dashboard</a>
              </p>
            </td></tr>
          </table>
        </td></tr>

      </table>

    </td></tr>
  </table>
</body>
</html>`;

  const subject = `Day ${dayOfMonth}: ${quote.text.slice(0, 50)}${quote.text.length > 50 ? '...' : ''} - Dad Ready`;

  return { html, subject };
}
