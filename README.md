# Dad Ready 🏀

February 2025 habit tracker with daily SMS reminders.

## Features

- ✅ Track 5 daily habits (no processed carbs, running, strength, meditation, gratitude)
- 📊 Weekly running mileage tracking (35 mi/week goal)
- 📅 Calendar view with completion status
- 📈 Stats: streak, completion rate, total miles
- 💬 Daily SMS reminder at 8 PM PT with Kobe quotes
- 📱 PWA - add to home screen

## Setup Instructions

### Step 1: Push to GitHub

1. Create a new repository on GitHub (e.g., `dad-ready`)
2. In your terminal:
```bash
cd dad-ready
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dad-ready.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your `dad-ready` repository from GitHub
4. Click "Deploy" (it will fail the first time - that's okay, we need to add env vars)

### Step 3: Set Up Twilio

1. Go to [twilio.com/console](https://twilio.com/console)
2. Copy your **Account SID** (starts with AC...)
3. Copy your **Auth Token**
4. Go to Phone Numbers → Manage → Buy a Number
5. Get any US number (free on trial)
6. **Important:** On trial, go to Phone Numbers → Verified Caller IDs and verify your personal phone number (+14084065806)

### Step 4: Configure Environment Variables in Vercel

1. In your Vercel project, go to Settings → Environment Variables
2. Add these variables:

| Name | Value |
|------|-------|
| `TWILIO_ACCOUNT_SID` | Your Account SID (AC...) |
| `TWILIO_AUTH_TOKEN` | Your Auth Token |
| `TWILIO_PHONE_NUMBER` | Your Twilio number (+1...) |
| `MY_PHONE_NUMBER` | `+14084065806` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g., `https://dad-ready.vercel.app`) |
| `TEST_SECRET` | Any random string (e.g., `mySecret123`) |

3. Click "Save"
4. Go to Deployments → click the three dots on latest → Redeploy

### Step 5: Enable Cron Jobs

Vercel Cron Jobs require a Pro plan ($20/month) OR you can use a free alternative:

**Option A: Vercel Pro**
- Upgrade to Pro, cron jobs work automatically (configured in vercel.json)

**Option B: Free Alternative with cron-job.org**
1. Go to [cron-job.org](https://cron-job.org) and create free account
2. Create new cron job:
   - URL: `https://your-app.vercel.app/api/send-reminder`
   - Schedule: `0 4 * * *` (this is 8 PM PT = 4 AM UTC)
   - Enable it

### Step 6: Test It

Send a test SMS to make sure everything works:

```bash
curl -X POST https://your-app.vercel.app/api/test-sms \
  -H "Content-Type: application/json" \
  -d '{"secret": "your_TEST_SECRET_value"}'
```

You should receive a text within seconds.

### Step 7: Add to Home Screen

On your iPhone:
1. Open Safari and go to your app URL
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Name it "Dad Ready"

Now it works like a native app.

---

## Daily Reminder Schedule

- **8:00 PM PT** every day in February
- Includes that day's quote + link to the app
- 28 unique quotes (Kobe Bryant + fatherhood/discipline themes)

## Quotes Preview

- Day 1: "The moment you give up is the moment you let someone else win." — Kobe Bryant
- Day 6: "Being a great father requires being great. Not perfect. Great." — Dad Ready
- Day 13: "Rest at the end, not in the middle." — Kobe Bryant
- Day 28: "Heroes come and go, but legends are forever." — Kobe Bryant

---

Built with love for the dad-ready journey. 💪
