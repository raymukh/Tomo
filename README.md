# Tomo

AI accountability coach that messages you via Telegram. Talks like a real friend, not a corporate chatbot.

## Deploy to Railway

1. Fork this repo on GitHub
2. Go to [railway.app](https://railway.app), click **New Project**, select **Deploy from GitHub repo**, and pick your fork
3. Add these environment variables in the Railway dashboard:
   - `TELEGRAM_BOT_TOKEN` — get one from [@BotFather](https://t.me/BotFather) on Telegram
   - `GEMINI_API_KEY` — get one from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   - `CHECKIN_MORNING_CRON` — (optional) morning check-in schedule, default `0 8 * * *`
   - `CHECKIN_EVENING_CRON` — (optional) evening check-in schedule, default `0 20 * * *`
4. That's it. Polling mode means no webhook setup needed

## Run locally

```bash
cp .env.example .env
# Fill in your tokens in .env
npm install
node index.js
```

## How it works

- Message the bot on Telegram to start a conversation
- Tomo learns your name, age, and goals
- Full conversation history is stored in memory per chat ID
- Tomo proactively checks in at 8am and 8pm daily (configurable)
- Check-ins reference your actual goals — no generic reminders
