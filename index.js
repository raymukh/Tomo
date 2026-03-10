require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");
const express = require("express");
const { chat, generateCheckIn, getActiveChatIds } = require("./tomo");

// --- Validate required env vars ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not set. Exiting.");
  process.exit(1);
}
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set. Exiting.");
  process.exit(1);
}

// --- Telegram bot setup (polling mode) ---
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
console.log("[tomo] bot is running in polling mode");

// Handle all incoming messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userText = msg.text;

  // Ignore non-text messages
  if (!userText) return;

  console.log(`[incoming] chat=${chatId} msg="${userText}"`);

  try {
    const reply = await chat(chatId, userText);
    await bot.sendMessage(chatId, reply);
    console.log(`[outgoing] chat=${chatId} msg="${reply}"`);
  } catch (err) {
    console.error(`[error] chat=${chatId}`, err.message);
    await bot.sendMessage(
      chatId,
      "yo something broke on my end, try again in a sec"
    );
  }
});

// --- Proactive check-in cron jobs ---
const MORNING_CRON = process.env.CHECKIN_MORNING_CRON || "0 8 * * *";
const EVENING_CRON = process.env.CHECKIN_EVENING_CRON || "0 20 * * *";

async function sendCheckIns() {
  const chatIds = getActiveChatIds();
  console.log(
    `[check-in] sending to ${chatIds.length} active user(s)`
  );

  for (const chatId of chatIds) {
    try {
      const message = await generateCheckIn(chatId);
      if (message) {
        await bot.sendMessage(chatId, message);
        console.log(`[check-in] chat=${chatId} msg="${message}"`);
      }
    } catch (err) {
      console.error(`[check-in error] chat=${chatId}`, err.message);
    }
  }
}

cron.schedule(MORNING_CRON, () => {
  console.log("[cron] morning check-in triggered");
  sendCheckIns();
});

cron.schedule(EVENING_CRON, () => {
  console.log("[cron] evening check-in triggered");
  sendCheckIns();
});

console.log(`[tomo] morning check-in: ${MORNING_CRON}`);
console.log(`[tomo] evening check-in: ${EVENING_CRON}`);

// --- Health check server for Railway ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({ status: "tomo is alive" });
});

app.listen(PORT, () => {
  console.log(`[tomo] health check server on port ${PORT}`);
});
